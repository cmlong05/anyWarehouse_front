import { error } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { StorageStandard } from '$lib';

export async function load({ params, fetch, parent }) {
    const { containers } = await parent();
    const { slug } = params;
    
    try {
        const storageRes = await fetch(`${config.API_BASE_URL}/warehouse/storage/${slug}/`);
        if (!storageRes.ok) {
            throw error(storageRes.status, 'Failed to fetch storage');
        }
        
        const storageDetail: StorageStandard = await storageRes.json();
        
        // 获取物品详情以获取 SKU
        const itemRes = await fetch(`${config.API_BASE_URL}/product/item/${storageDetail.item}/`);
        let itemSKU = storageDetail.item.toString(); // 默认使用 ID
        
        if (itemRes.ok) {
            const itemDetail = await itemRes.json();
            // 根据你的 ItemSet 结构，SKU 在 item.SKU 中
            itemSKU = itemDetail.item?.SKU || itemDetail.SKU || storageDetail.item.toString();
        }
        
        return {
            storageDetail: {
                ...storageDetail,
                itemSKU // 添加 SKU 信息
            },
            containers
        };
    } catch (err) {
        console.error('Storage load error:', err);
        throw error(500, 'Failed to load storage data');
    }
}
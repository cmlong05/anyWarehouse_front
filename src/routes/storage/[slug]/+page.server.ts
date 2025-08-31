import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { StorageStandard } from '$lib';

export async function load({ params, fetch, parent }) {
    const { containers } = await parent();
    const { slug } = params;
    
    try {
        const storageRes = await fetch(`${config.API_BASE_URL}/warehouse/api/storage/${slug}/`);
        if (!storageRes.ok) {
            throw error(storageRes.status, 'Failed to fetch storage');
        }
        
        const storageDetail: StorageStandard = await storageRes.json();
        
        // 获取物品详情以获取 SKU
        const itemRes = await fetch(`${config.API_BASE_URL}/product/api/item/${storageDetail.item}/`);
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

export const actions = {
    default: async ({ params, request, fetch }) => {
        const { slug } = params;
        const formData = await request.formData();
        
        const updatedData = {
            container: formData.get('container'),
            quantity: Number(formData.get('quantity')),
            text: formData.get('text') || '',
            sample: formData.has('sample')
        };

        try {
            const res = await fetch(`${config.API_BASE_URL}/warehouse/api/storage/${slug}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Update error:', errorData);
                throw error(res.status, `Failed to update storage: ${JSON.stringify(errorData)}`);
            }

            // 重定向回物品页面
            throw redirect(303, `/item/${formData.get('item')}`);
        } catch (err) {
            console.error('Action error:', err);
            throw err;
        }
    }
};
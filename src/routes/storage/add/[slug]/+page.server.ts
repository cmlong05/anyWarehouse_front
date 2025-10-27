import { error } from '@sveltejs/kit';
import { config } from '$lib/config';
import { logger } from '$lib/logger';

export async function load({ params, parent, fetch }) {
    const { containers } = await parent();
    
    try {
        // 获取物品信息以获取 SKU
        const itemRes = await fetch(`${config.API_BASE_URL}/product/item/${params.slug}/`);
        let itemSKU = params.slug; // 默认使用 slug
        
        if (itemRes.ok) {
            const itemDetail = await itemRes.json();
            // 根据你的 ItemSet 结构，SKU 在 item.SKU 中
            itemSKU = itemDetail.item?.SKU || itemDetail.SKU || params.slug;
        }
        
        return {
            item: params.slug,
            itemSKU,
            containers
        };
    } catch (err) {
        logger.error('Failed to load item data', err, { itemSlug: params.slug });
        return {
            item: params.slug,
            itemSKU: params.slug,
            containers
        };
    }
}
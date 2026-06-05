// 加载新增库存数据
// 被依赖：无
import { config } from '$lib/config';
import { logger } from '$lib/logger';

export async function load({ params, parent, fetch }) {
    const { containers } = await parent();
    
    try {
        // 获取物品信息以获取展示名称与 SKU
        const itemRes = await fetch(`${config.API_BASE_URL}/product/item/${params.slug}/`);
        let itemName = params.slug; // 默认使用 slug
        let itemSKU = params.slug; // 默认使用 slug
        
        if (itemRes.ok) {
            const itemDetail = await itemRes.json();
            itemName = itemDetail.item?.name || itemDetail.name || params.slug;
            itemSKU = itemDetail.item?.SKU || itemDetail.SKU || params.slug;
        }
        
        return {
            item: params.slug,
            itemName,
            itemSKU,
            containers
        };
    } catch (err) {
        logger.error('Failed to load item data', err, { itemSlug: params.slug });
        return {
            item: params.slug,
            itemName: params.slug,
            itemSKU: params.slug,
            containers
        };
    }
}
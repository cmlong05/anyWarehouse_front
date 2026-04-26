import { logger } from '$lib/logger';
import { error } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { ItemSet, QuotationBrief } from '$lib';
import type { ItemVariantInfo } from '$lib/types/variant';

interface QuotationByItemResponse {
    item_id: number;
    quotations: QuotationBrief[];
    count: number;
    best_price: { price: string; supplier: string; quotation_id: number } | null;
}

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }: { params: { slug: string }, fetch: typeof globalThis.fetch }) {
    const { slug } = params;
    // 获取当前物品信息
    const itemRes = await fetch(`${config.API_BASE_URL}/product/item/${slug}/`);
    if (!itemRes.ok) { 
        throw error(itemRes.status, 'Failed to fetch item');
    }
    const itemDetail: ItemSet = await itemRes.json();
    
    // 获取物品的报价列表
    let quotations: QuotationBrief[] = [];
    let bestPrice: QuotationByItemResponse['best_price'] = null;
    try {
        const quotationRes = await fetch(`${config.API_BASE_URL}/supplier/quotations/by_item/?item_id=${itemDetail.item.id}`);
        if (quotationRes.ok) {
            const quotationData: QuotationByItemResponse = await quotationRes.json();
            quotations = quotationData.quotations;
            bestPrice = quotationData.best_price;
        }
    } catch (e) {
        logger.error('Failed to fetch quotations:', e);
    }
    
    // 获取物品的变体信息
    let variantInfo: ItemVariantInfo | null = null;
    try {
        const variantRes = await fetch(`${config.API_BASE_URL}/product/item/${itemDetail.item.id}/variants/`);
        if (variantRes.ok) {
            variantInfo = await variantRes.json();
        }
    } catch (e) {
        logger.error('Failed to fetch variant info:', e);
    }
    
    return { itemDetail, quotations, bestPrice, variantInfo };
}

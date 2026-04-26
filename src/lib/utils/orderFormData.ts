/**
 * 订单表单初始数据辅助函数
 *
 * 销售订单和采购订单的 items 映射逻辑相同：
 * - 优先：现有订单的 items（带 dbId）
 * - 其次：已展开变体的 preload 项
 * - 最后：原始 preload 项（未展开）
 */
import type { OrderFormItem } from '$lib/composables/useOrderForm.svelte';
import type { PreloadItem } from './preloadItems';

/** 现有订单项的最小字段集合（PurchaseOrderItem / SalesOrderItem 的公共子集） */
export interface OrderItemLike {
    id: number;
    item: number | null;
    sku?: string;
    item_name?: string;
    quantity?: number;
    unit_price?: string;
    quotation?: number | null;
    expected_delivery?: string | null;
    notes?: string;
}

/**
 * 构建订单表单的初始 items 列表。
 */
export function buildInitialOrderItems(
    existingItems: OrderItemLike[] | undefined,
    expandedPreloadItems: OrderFormItem[] | undefined,
    preloadItems: PreloadItem[] | null | undefined
): OrderFormItem[] | undefined {
    if (existingItems && existingItems.length > 0) {
        return existingItems.map((item) => ({
            id: `item_${item.id}`,
            dbId: item.id,
            item: item.item || null,
            sku: item.sku || '',
            item_name: item.item_name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price ? parseFloat(item.unit_price) : 0,
            quotation: item.quotation || null,
            expected_delivery: item.expected_delivery || null,
            notes: item.notes || ''
        })) as OrderFormItem[];
    }

    if (expandedPreloadItems) return expandedPreloadItems;

    if (preloadItems && preloadItems.length > 0) {
        return preloadItems.map((item) => ({
            item: item.item || null,
            sku: item.sku || '',
            item_name: item.item_name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            quotation: item.quotation_id || null,
            expected_delivery: null,
            notes: ''
        })) as OrderFormItem[];
    }

    return undefined;
}

/**
 * 订单/报价单预加载项处理工具
 *
 * Sales 与 Purchase 的 OrderForm 都使用相同的"按变体母版分组"逻辑，
 * 这里提取为通用函数，避免在两个表单组件中重复 ~140 行。
 */
import type { OrderFormItem } from '$lib/composables/useOrderForm.svelte';
import type { ItemVariant } from '$lib/types/variant';
import { buildVariantAttributes } from '$lib/utils/variant';
import { config } from '$lib/config';
import { logger } from '$lib/logger';

/**
 * 通用的报价摘要接口（QuotationBrief 与 CustomerQuotationBrief 的公共子集）
 */
export interface PreloadQuotation {
    id: number;
    item: number | null;
    item_sku?: string;
    item_name?: string;
    is_variant_template?: boolean;
    parent_item_id?: number | null;
}

export interface PreloadItem {
    item?: number | null;
    sku?: string;
    item_name?: string;
    quantity?: number;
    unit_price?: number;
    quotation_id?: number | null;
}

async function fetchItemVariants(itemId: number): Promise<ItemVariant[]> {
    try {
        const response = await fetch(`${config.API_BASE_URL}/product/item/${itemId}/variants/`);
        if (response.ok) {
            const data = await response.json();
            return data.variants || [];
        }
    } catch (err) {
        logger.error('获取变体失败', err);
    }
    return [];
}

const newRowId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * 处理预加载数据，按变体母版分组并展开子变体行。
 */
export async function processPreloadItems<Q extends PreloadQuotation>(
    items: PreloadItem[],
    allQuotations: Q[],
    allQuotationPrices?: Record<string, { price: number; currency: string }> | null,
): Promise<OrderFormItem[]> {
    const result: OrderFormItem[] = [];

    const groups = new Map<number | string, {
        parentQuotation: Q | null;
        parentItem: PreloadItem | null;
        children: PreloadItem[];
    }>();
    const independentItems: PreloadItem[] = [];

    for (const item of items) {
        const quotation = allQuotations.find(q => q.id === item.quotation_id);

        if (quotation?.is_variant_template && item.item) {
            if (!groups.has(item.item)) {
                groups.set(item.item, {
                    parentQuotation: quotation,
                    parentItem: item,
                    children: [],
                });
            } else {
                const group = groups.get(item.item)!;
                group.parentItem = item;
            }
        } else if (quotation?.parent_item_id && item.item) {
            const parentId = quotation.parent_item_id;
            if (!groups.has(parentId)) {
                const parentQuotation = allQuotations.find(q =>
                    q.item === parentId && q.is_variant_template,
                );
                groups.set(parentId, {
                    parentQuotation: parentQuotation || null,
                    parentItem: null,
                    children: [item],
                });
            } else {
                groups.get(parentId)!.children.push(item);
            }
        } else {
            independentItems.push(item);
        }
    }

    for (const [parentId, group] of groups) {
        const parentIdStr = newRowId();
        const parentSku = group.parentQuotation?.item_sku || '-';
        const parentName = group.parentQuotation?.item_name || '母版';
        const parentQuantity = group.parentItem?.quantity || 0;

        result.push({
            id: parentIdStr,
            item: typeof parentId === 'number' ? parentId : null,
            sku: parentSku,
            item_name: parentName,
            quantity: parentQuantity,
            unit_price: group.parentItem?.unit_price || 0,
            quotation: group.parentItem?.quotation_id || null,
            expected_delivery: null,
            notes: '',
            isVariantChild: false,
        });

        const variants = await fetchItemVariants(Number(parentId));

        for (const variant of variants) {
            const variantDetail = variant.variant_item_detail as {
                id: number;
                SKU: string;
                name: string;
                b_Price?: string;
            } | null;

            const selectedChild = group.children.find(c => c.item === variant.variant_item);
            const variantSku = variantDetail?.SKU || '';
            const unitPrice = selectedChild?.unit_price
                ?? allQuotationPrices?.[variantSku]?.price
                ?? parseFloat(variantDetail?.b_Price || '0')
                ?? 0;

            const attrValues = buildVariantAttributes(variant.attribute_values_detail);

            result.push({
                id: newRowId(),
                item: variant.variant_item,
                sku: variantSku,
                item_name: variantDetail?.name || '',
                quantity: selectedChild?.quantity || 0,
                unit_price: unitPrice,
                quotation: selectedChild?.quotation_id || null,
                expected_delivery: null,
                notes: '',
                isVariantChild: true,
                parentId: parentIdStr,
                variantAttributes: attrValues,
            });
        }
    }

    for (const item of independentItems) {
        result.push({
            id: newRowId(),
            item: item.item || null,
            sku: item.sku || '',
            item_name: item.item_name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            quotation: item.quotation_id || null,
            expected_delivery: null,
            notes: '',
            isVariantChild: false,
        });
    }

    return result;
}

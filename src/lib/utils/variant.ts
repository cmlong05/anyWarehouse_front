/**
 * 变体相关工具函数
 * 
 * 提供变体属性判断、提取和显示的通用函数
 */

import type { ItemAttributeValue } from '$lib/types/variant';

/** 变体属性（简化版，用于显示） */
export interface VariantAttribute {
    attribute: string;
    value: string;
    color?: string;
}

/** 带变体信息的物品详情 */
export interface ItemWithVariantDetail {
    item_detail?: {
        is_variant?: boolean | string | number;
        parent_item_id?: number | null;
        parent_item_name?: string;
        parent_item_sku?: string;
        variant_attributes?: VariantAttribute[];
    };
}

/**
 * 判断是否为变体子项
 */
export function isVariantChild(item: ItemWithVariantDetail): boolean {
    const val = item.item_detail?.is_variant as boolean | string | number | undefined;
    if (val === true) return true;
    if (typeof val === 'string' && val.toLowerCase() === 'true') return true;
    if (val === 1 || val === '1') return true;
    return false;
}

/**
 * 获取变体父项ID
 */
export function getVariantParentId(item: ItemWithVariantDetail): number | null {
    return item.item_detail?.parent_item_id || null;
}

/**
 * 获取变体父项信息
 */
export function getVariantParentInfo(item: ItemWithVariantDetail): { sku?: string; name?: string } | null {
    if (!isVariantChild(item)) return null;
    return {
        sku: item.item_detail?.parent_item_sku,
        name: item.item_detail?.parent_item_name
    };
}

/**
 * 获取变体属性列表
 */
export function getVariantAttributes(item: ItemWithVariantDetail): VariantAttribute[] {
    return item.item_detail?.variant_attributes || [];
}

/**
 * 构建变体属性数组（从 attribute_values_detail 转换）
 * 
 * @param attrValues 属性值详情数组
 * @returns 简化后的变体属性数组
 */
export function buildVariantAttributes(
    attrValues: Array<{ value?: string; color_hex?: string }> | undefined
): Array<{ value: string; color?: string }> {
    if (!attrValues || attrValues.length === 0) return [];
    return attrValues
        .map(av => ({
            value: av.value || '',
            color: av.color_hex
        }))
        .filter(av => av.value);
}


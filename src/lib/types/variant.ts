// ========== Item Variant 物品变体相关接口 ==========
// 被依赖：
// - `lib/api/product.ts`
// - `lib/components/item/AttributeManager.svelte`
// - `lib/components/item/ItemVariantManager.svelte`
// - `lib/components/order/OrderForm.svelte`
// - `lib/components/item/VariantCreator.svelte`
// - `lib/components/item/VariantQuotationManager.svelte`
// - `lib/components/item/ItemHeaderCard.svelte`
// - `lib/composables/useQuotationLineForm.svelte.ts`
// - `lib/utils/preloadItems.ts`
// - `lib/utils/variant.ts`
// - `routes/item/[slug]/+page.server.ts`
// - `routes/item/[slug]/+page.svelte`

/** 物品属性 */
export interface ItemAttribute {
    id: number;
    name: string;
    code: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** 属性值 */
export interface ItemAttributeValue {
    id: number;
    attribute: number;
    attribute_name?: string;
    attribute_code?: string;
    value: string;
    code: string;
    display_order: number;
    color_hex: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** 属性详情（包含属性值列表） */
export interface ItemAttributeDetail extends ItemAttribute {
    values: ItemAttributeValue[];
}

/** 变体 */
export interface ItemVariant {
    id: number;
    parent_item: number;
    variant_item: number;
    variant_item_detail?: {
        id: number;
        SKU: string;
        name: string;
        image?: string;
        weight?: string;
        total_storage: number;
        b_Price?: string;
    };
    sku_suffix: string;
    attribute_values: number[];
    attribute_values_detail?: Array<{
        id: number;
        attribute_name: string;
        attribute_code: string;
        value: string;
        code: string;
        color_hex: string;
    }>;
    inherit_price: boolean;
    variant_price: string | null;
    effective_price?: string;
    is_default: boolean;
    is_active: boolean;
    variant_image: string | null;
    created_at: string;
    updated_at: string;
}

/** 变体详情 */
export interface ItemVariantDetail extends ItemVariant {
    parent_item_detail?: {
        id: number;
        SKU: string;
        name: string;
    };
    display_name?: string;
}

/** 变体汇总信息 */
export interface VariantSummary {
    total_variants: number;
    active_variants: number;
    total_stock: number;
    attributes: Record<string, {
        name: string;
        values: Array<{
            id: number;
            value: string;
            code: string;
            color_hex: string;
        }>;
    }>;
}

/** 物品变体信息响应 */
export interface ItemVariantInfo {
    is_template: boolean;
    is_variant?: boolean;
    template_item?: {
        id: number;
        sku: string;
        name: string;
    };
    variant_summary?: VariantSummary | null;
    variants?: ItemVariant[];
    variant_info?: {
        variant_id: number;
        sku_suffix: string;
        effective_price: string;
        attribute_values: Array<{
            attribute: string;
            value: string;
            color_hex: string;
        }>;
    };
    parent_item?: {
        id: number;
        sku: string;
        name: string;
    };
    sibling_variants?: ItemVariant[];
    message?: string;
}

/** 变体属性选择 */
export interface VariantSelection {
    attribute_code: string;
    selected_value_id: number | null;
}

/** 变体匹配请求 */
export interface VariantMatchRequest {
    parent_item_id: number;
    selections: VariantSelection[];
}

/** 变体匹配响应 */
export interface VariantMatchResponse {
    matched: boolean;
    variant?: ItemVariant;
    available_options?: VariantSummary;
    message?: string;
}

/** 批量创建变体请求 */
export interface BulkCreateVariantsRequest {
    parent_item_id: number;
    attribute_value_groups: number[][];
    inherit_price?: boolean;
    default_price?: number | null;
}

/** 批量创建变体响应 */
export interface BulkCreateVariantsResponse {
    created_count: number;
    errors: Array<{
        index: number;
        attr_value_ids: number[];
        error: string;
    }>;
    variants: ItemVariant[];
}

/** 创建变体请求 */
export interface CreateVariantRequest {
    parent_item: number;
    attribute_value_ids: number[];
    auto_create_item?: boolean;
    variant_name_suffix?: string;
    sku_suffix?: string;
    inherit_price?: boolean;
    variant_price?: number | null;
    is_default?: boolean;
}
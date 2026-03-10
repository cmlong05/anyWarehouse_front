/**
 * 通用类型定义
 */

/** 基础实体接口 */
export interface BaseEntity {
    id: number;
    created_at: string;
    updated_at: string;
}

/** 合作伙伴基础接口（供应商/客户） */
export interface PartnerBase {
    code: string;
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
}

/** 合作伙伴简要信息 */
export interface PartnerBrief {
    id: number;
    code: string;
    name: string;
}

/** 订单基础接口 */
export interface OrderBase {
    order_number: string;
    status: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    order_date: string;
    expected_delivery?: string;
    actual_delivery?: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    shipping_cost: string;
    discount: string;
    total_amount: string;
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    payment_terms?: string;
    payment_status: string;
    notes?: string;
    internal_notes?: string;
}

/** 订单简要信息 */
export interface OrderBrief {
    id: number;
    order_number: string;
    status: string;
    priority: string;
    order_date: string;
    expected_delivery?: string;
    total_amount: string;
    item_count: number;
    total_quantity: number;
    created_at: string;
}

/** 订单明细基础接口 */
export interface OrderItemBase {
    id: number;
    line_number: number;
    item?: number;
    sku: string;
    item_name: string;
    item_name_en?: string;
    quantity: string;
    unit_price: string;
    line_total: string;
    notes?: string;
    expected_delivery?: string;
}

/** 订单创建请求基础 */
export interface OrderCreateRequestBase {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    order_date: string;
    expected_delivery?: string | null;
    tax_rate: number;
    shipping_cost: number;
    discount: number;
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    payment_terms?: string;
    notes?: string;
    internal_notes?: string;
    items: OrderItemCreateRequestBase[];
}

/** 订单明细创建请求基础 */
export interface OrderItemCreateRequestBase {
    item?: number | null;
    sku?: string;
    item_name?: string;
    item_name_en?: string;
    quantity: number;
    unit_price: number;
    quotation?: number | null;
    expected_delivery?: string | null;
    notes?: string;
}

/** 订单更新请求基础 */
export interface OrderUpdateRequestBase {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    order_date?: string;
    expected_delivery?: string | null;
    tax_rate?: number;
    shipping_cost?: number;
    discount?: number;
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    payment_terms?: string;
    notes?: string;
    internal_notes?: string;
    status?: string;
}

/** 订单统计信息 */
export interface OrderStatistics {
    total_items: number;
    total_quantity: number;
    total_processed: number;
    total_pending: number;
    fully_processed_items: number;
    partially_processed_items: number;
    pending_items: number;
    order_amount: {
        subtotal: string;
        tax: string;
        shipping: string;
        discount: string;
        total: string;
    };
}

/** 订单汇总统计 */
export interface OrderSummary {
    order_count: number;
    status_summary: Record<string, {
        name: string;
        count: number;
    }>;
    amount_summary: Record<string, string>;
}

/** 报价基础接口 */
export interface QuotationBase {
    id: number;
    item?: number;
    sku?: string;
    price: string;
    currency: string;
    min_quantity: number;
    lead_time_days?: number;
    valid_from?: string;
    valid_until?: string;
    is_preferred: boolean;
    note?: string;
    created_at: string;
    updated_at: string;
}

/** 报价简要信息 */
export interface QuotationBrief {
    id: number;
    sku?: string;
    item_name?: string;
    price: string;
    currency: string;
    is_preferred: boolean;
}

/** 优先级选项 */
export const PRIORITY_OPTIONS = [
    { value: 'low', label: '低' },
    { value: 'normal', label: '普通' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
] as const;

/** 优先级类型 */
export type Priority = typeof PRIORITY_OPTIONS[number]['value'];

/** 分页响应 */
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/** 查询参数 */
export type QueryParams = Record<string, string | number | boolean | undefined>;

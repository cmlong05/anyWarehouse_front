// ========== Shipment 发货管理相关接口 ==========

/** 快递单号状态 */
export type TrackingNumberStatus = 'unused' | 'reserved' | 'in_use' | 'delivered' | 'returned' | 'cancelled';

/** 发货单状态 */
export type ShipmentStatus = 'draft' | 'synced' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

/** 快递单号 */
export interface TrackingNumber {
    id: number;
    tracking_no: string;
    carrier_code: string;
    carrier_name: string;
    status: TrackingNumberStatus;
    remark?: string;
    created_at: string;
    updated_at: string;
}

/** 快递单号简要信息 */
export interface TrackingNumberBrief {
    id: number;
    tracking_no: string;
    carrier_name: string;
    status: TrackingNumberStatus;
}

/** 创建快递单号请求 */
export interface TrackingNumberCreateRequest {
    tracking_no: string;
    carrier_code?: string;
    carrier_name: string;
    remark?: string;
}

/** 物品详情（包含变体信息） */
export interface ItemDetail {
    id: number;
    name: string;
    name_en?: string;
    SKU: string;
    is_variant_template?: boolean;
    is_variant?: boolean;
    parent_item_id?: number | null;
    parent_item_name?: string;
    parent_item_sku?: string;
    variant_attributes?: Array<{ attribute: string; value: string; color?: string }>;
}

/** 发货明细 */
export interface ShipmentItem {
    id: number;
    shipment: number;
    order: number;
    order_number?: string;
    sku: string;
    quantity: string;
    quantity_packed?: string;  // 已打包数量
    product_name: string;
    item?: number;
    quantity_pending?: string;
    quantity_shipped?: string;  // 已发货数量（从订单同步）
    notes?: string;
    item_detail?: ItemDetail;
    created_at: string;
    updated_at: string;
}

/** 创建发货明细请求 */
export interface ShipmentItemCreateRequest {
    order: number;
    sku: string;
    quantity: number;
    product_name: string;
    item?: number;
    notes?: string;
}

/** 发货单 */
export interface Shipment {
    id: number;
    shipment_no: string;
    status: ShipmentStatus;
    /** 关联订单ID */
    order?: number;
    /** 关联订单详情 */
    order_detail?: {
        id: number;
        order_number: string;
        customer_id?: number;
        customer_name?: string;
        contact_person?: string;
        contact_phone?: string;
        shipping_address?: string;
        total_amount?: string;
        currency?: string;
    };
    items?: ShipmentItem[];
    packages?: PackageBrief[];
    total_packages: number;
    total_items: number;
    total_weight: string;
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    confirmed_at?: string;
    packed_at?: string;
    shipped_at?: string;
    delivered_at?: string;
    confirmed_by?: string;
    packed_by?: string;
    shipped_by?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

/** 发货单简要信息 */
export interface ShipmentBrief {
    id: number;
    shipment_no: string;
    status: ShipmentStatus;
    total_packages: number;
    total_items: number;
    shipped_at?: string;
    created_at: string;
}

/** 创建发货单请求 */
export interface ShipmentCreateRequest {
    shipment_no: string;
    order_id: number;
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    items?: ShipmentItemCreateRequest[];  // 可选，计划明细
    packages?: PackageCreateRequest[];  // 包裹列表
    notes?: string;
}

/** 更新发货单请求 */
export interface ShipmentUpdateRequest {
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    notes?: string;
}

/** 发货-订单关联信息 */
export interface ShipmentOrderInfo {
    order_id: number;
    order_number: string;
    customer_name?: string;
    total_quantity: string;
    notes?: string;
}

/** 包裹明细 */
export interface PackageItem {
    id: number;
    package: number;
    shipment: number | null;  // 所属发货单
    shipment_no?: string | null;  // 发货单编号
    sku: string;
    quantity: string;
    product_name: string;
    item?: number;
    notes?: string;
    item_detail?: ItemDetail;
    created_at: string;
    updated_at: string;
}

/** 创建包裹明细请求 */
export interface PackageItemCreateRequest {
    shipment: number;  // 发货单 ID (必填)
    sku: string;  // SKU (必填)
    quantity: number;  // 数量 (必填)
    product_name?: string;
    item?: number;
    notes?: string;
}

/** 包裹-发货关联简要信息 */
export interface PackageShipmentBrief {
    id: number;
    shipment_no: string;
    status: ShipmentStatus;
}

/** 包裹 */
export interface Package {
    id: number;
    package_no: string;
    status: 'pending' | 'sealed';
    sequence_no: number;
    tracking_number?: number;
    tracking_number_detail?: TrackingNumberBrief;
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
    dimensions?: string;
    total_items: number;
    total_quantity: string;
    /** 关联的发货批次列表（N:M关系） */
    shipments?: PackageShipmentBrief[];
    items?: PackageItem[];
    notes?: string;
    created_at: string;
    updated_at: string;
}

/** 包裹-发货批次关联（N:M关系） */
export interface PackageShipment {
    id: number;
    package: number;
    shipment: number;
    shipment_no?: string;
    quantity: string;
    created_at: string;
    updated_at: string;
}

/** 包裹简要信息 */
export interface PackageBrief {
    id: number;
    package_no: string;
    status: 'pending' | 'sealed';
    sequence_no: number;
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
    total_quantity: string;
    tracking_no?: string;
    carrier_name?: string;
    tracking_number_detail?: TrackingNumberBrief;
    /** 关联的发货单列表 */
    shipments?: PackageShipmentBrief[];
    /** 包裹明细列表（在详情接口中返回） */
    items?: PackageItem[];
    created_at: string;
    updated_at: string;
}

/** 创建包裹请求 */
export interface PackageCreateRequest {
    package_no: string;
    sequence_no: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    tracking_number?: number;
    items?: PackageItemCreateRequest[];
    notes?: string;
    /** 关联的发货单ID，传入后自动建立关联 */
    shipment_id?: number;
}

/** 更新包裹请求 */
export interface PackageUpdateRequest {
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    tracking_number?: number;
    notes?: string;
}

/** 按订单查询发货响应 */
export interface OrderShipmentResponse {
    order_id: number;
    order_number: string;
    shipments: OrderShipmentInfo[];
}

/** 订单发货信息 */
export interface OrderShipmentInfo {
    shipment_id: number;
    tracking_no?: string;
    carrier_name?: string;
    shipment_status: ShipmentStatus;
    total_quantity: string;
    created_at: string;
}

/** 快递单号关联订单响应 */
export interface TrackingNumberOrdersResponse {
    id: number;
    tracking_no: string;
    carrier_name: string;
    status: TrackingNumberStatus;
    shipment_no?: string;
    orders: TrackingNumberOrderInfo[];
}

/** 快递单号关联的订单信息 */
export interface TrackingNumberOrderInfo {
    order_id: number;
    order_number: string;
    customer_name?: string;
    total_quantity: string;
}

/** 同步发货明细响应 */
export interface SyncItemsResponse {
    status: string;
    message: string;
    items: ShipmentItem[];
}

/** 确认发货单请求 */
export interface ShipmentConfirmRequest {
    confirmed_by?: string;
}

/** 打包发货单请求 */
export interface ShipmentPackRequest {
    packed_by?: string;
}

/** 发货请求 */
export interface ShipmentShipRequest {
    shipped_by?: string;
}

/** 发货列表筛选器 */
export interface ShipmentFilters {
    search?: string;
    status?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
}

/** 发货状态选项 */
export const SHIPMENT_STATUS_CHOICES: { value: ShipmentStatus; label: string }[] = [
    { value: 'draft', label: '草稿' },
    { value: 'synced', label: '已同步' },
    { value: 'confirmed', label: '已确认' },
    { value: 'packed', label: '已打包' },
    { value: 'shipped', label: '已发货' },
    { value: 'delivered', label: '已签收' },
    { value: 'cancelled', label: '已取消' },
];

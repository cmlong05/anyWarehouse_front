// ========== Shipment 发货管理相关接口 ==========
// 被依赖：
// - `lib/components/forms/PackageForm.svelte`
// - `lib/components/forms/ShipmentForm.svelte`
// - `lib/components/shipment/TrackingLegForm.svelte`
// - `lib/components/shipment/TrackingLegTimeline.svelte`
// - `lib/components/shipment-form/BasicInfo.svelte`
// - `lib/components/shipment/LinkPackageModal.svelte`
// - `lib/components/shipment/PrintPackingList.svelte`
// - `lib/components/shipment/TrackingNumberDetailModal.svelte`
// - `lib/composables/useShipmentDetail.svelte.ts`
// - `lib/composables/useShipmentForm.svelte.ts`
// - `routes/customer/package/+page.svelte`
// - `routes/customer/package/[id]/+page.svelte`
// - `routes/customer/package/[id]/edit/+page.svelte`
// - `routes/customer/package/add/+page.svelte`
// - `routes/customer/shipment/+page.svelte`
// - `routes/customer/shipment/[id]/+page.svelte`
// - `routes/customer/shipment/[id]/edit/+page.svelte`
// - `routes/customer/shipment/add/+page.svelte`
// - `routes/customer/shipment/tracking-number/+page.svelte`

/** 物流状态 */
export type LogisticsStatus = 'pending' | 'collected' | 'in_transit' | 'exception' | 'delivered' | 'returned' | 'cancelled';

/** 发货单状态 */
export type ShipmentStatus = 'draft' | 'synced' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

/** 快递单号 */
export interface TrackingNumber {
    id: number;
    tracking_no: string;
    carrier_code: string;
    carrier_name: string;
    logistics_status: LogisticsStatus;
    is_linked: boolean;
    linked_packages?: TrackingNumberLinkedPackage[];
    shippo_registered: boolean;
    remark?: string;
    /** 快递费用 */
    cost?: string;
    /** 物流段信息 */
    agent_name?: string;
    from_location?: string;
    to_location?: string;
    handover_at: string;
    last_synced_at?: string;
    tracking_events?: TrackingEvent[];
    tracking_status_raw?: TrackingStatusRaw;
    created_at: string;
    updated_at: string;
}

export interface TrackingNumberLinkedPackage {
    id: number;
    package_no: string;
    sequence_no: number;
    customer_id?: number;
    customer_name?: string;
}

/** 物流轨迹位置 */
export interface TrackingLocation {
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

/** 物流状态详情 */
export interface TrackingStatusRaw {
    status?: string;
    status_details?: string;
    status_date?: string;
    location?: TrackingLocation;
}

/** 物流轨迹事件 */
export interface TrackingEvent {
    status: string;
    status_details: string;
    status_date: string;
    location?: TrackingLocation | string;
}

/** 快递单号简要信息 */
export interface TrackingNumberBrief {
    id: number;
    tracking_no: string;
    carrier_name: string;
    carrier_code?: string;
    logistics_status: LogisticsStatus;
    is_linked: boolean;
    shippo_registered?: boolean;
    remark?: string;
    /** 快递费用 */
    cost?: string;
    /** 物流段信息 */
    agent_name?: string;
    from_location?: string;
    to_location?: string;
    handover_at: string;
    created_at?: string;
}

/** 创建快递单号请求 */
export interface TrackingNumberCreateRequest {
    tracking_no: string;
    carrier_code?: string;
    carrier_name: string;
    logistics_status?: LogisticsStatus;
    remark?: string;
    /** 快递费用 */
    cost?: string;
    /** 物流段信息 */
    agent_name?: string;
    from_location?: string;
    to_location?: string;
    handover_at: string;
}

/** 物品详情（包含变体信息） */
export interface ItemDetail {
    id: number;
    name: string;
    name_en?: string;
    SKU: string;
    total_storage?: number;
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
    quantity_processed?: string;  // 已发货数量（从订单同步）
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
    is_synced?: boolean;
    synced_at?: string;
    items?: ShipmentItem[];
    packages?: PackageBrief[];
    total_packages: number;
    total_items: number;
    total_weight: string;
    /** 实际运费（按包裹重量分摊） */
    shipping_cost?: string;
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
    order_detail?: ShipmentOrderInfo | null;
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
    item: number;
    notes?: string;
    item_detail?: ItemDetail;
    storage_locations?: string[];
    allocations?: PackageItemAllocation[];
    created_at: string;
    updated_at: string;
}

/** 包裹明细的容器分配（读） */
export interface PackageItemAllocation {
    id: number;
    container: number;
    container_code: string;
    container_mark?: string;
    container_full_path?: string;
    quantity: number;
}

/** 包裹明细的容器分配（写） */
export interface PackageItemAllocationCreateRequest {
    container: number;
    quantity: number;
}

/** 创建包裹明细请求 */
export interface PackageItemCreateRequest {
    shipment: number;  // 发货单 ID (必填)
    item: number;  // 物品 ID (必填)
    quantity: number;  // 数量 (必填)
    notes?: string;
    allocations: PackageItemAllocationCreateRequest[];  // 容器分配，总和必须等于 quantity
}

/** 包裹核查项 */
export interface PackageChecklistItem {
    id: number;
    package: number;
    package_item: number | null;
    sku: string;
    product_name: string;
    planned_quantity: number;
    checked: boolean;
    actual_quantity: number | null;
    notes: string;
    sort_order: number;
    allocations?: PackageChecklistAllocation[];
    created_at: string;
    updated_at: string;
}

/** 包裹核查分配项 */
export interface PackageChecklistAllocation {
    id: number;
    checklist_item: number;
    package_item_allocation: number | null;
    container_path: string;
    planned_quantity: number;
    checked: boolean;
    actual_quantity: number | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

/** 核查汇总 */
export interface ChecklistSummary {
    total: number;
    checked: number;
    discrepancy_count: number;
}

/** 包裹-发货关联简要信息 */
export interface PackageShipmentBrief {
    id: number;
    shipment_no: string;
    status: ShipmentStatus;
    customer_name?: string;
}

/** 包裹 */
export interface Package {
    id: number;
    package_no: string;
    status: 'pending' | 'sealed';
    sequence_no: number;
    tare_weight?: string;
    weight_adjustment?: string;
    weight?: string;  // computed, read-only
    volume?: string;
    estimated_weight?: string;
    estimated_volume?: string;
    length?: string;
    width?: string;
    height?: string;
    dimensions?: string;
    /** 预估运费（人工录入） */
    estimated_shipping_cost?: string;
    /** 运输费用（由关联物流段费用汇总，自动计算） */
    shipping_cost?: string;
    total_items: number;
    total_quantity: string;
    /** 关联的发货批次列表（N:M关系） */
    shipments?: PackageShipmentBrief[];
    items?: PackageItem[];
    checklist_items?: PackageChecklistItem[];
    notes?: string;
    /** 多段物流：聚合状态与段列表 */
    overall_status?: PackageOverallStatus;
    overall_status_display?: string;
    current_leg_no?: number;
    current_leg?: PackageTrackingLeg | null;
    final_tracking_number_detail?: TrackingNumberBrief | null;
    tracking_legs?: PackageTrackingLeg[];
    created_at: string;
    updated_at: string;
}

/** 物流段阶段 */
export type TrackingLegStage = 'first' | 'middle' | 'last';

/** 包裹聚合状态 */
export type PackageOverallStatus =
    | 'no_tracking' | 'pending' | 'collected' | 'in_transit'
    | 'exception' | 'delivered' | 'returned' | 'cancelled';

/** 包裹物流段 */
export interface PackageTrackingLeg {
    id: number;
    package: number;
    leg_no: number;
    stage: TrackingLegStage;
    stage_display?: string;
    tracking_number: number;
    tracking_number_detail?: TrackingNumberBrief;
    notes?: string;
    logistics_status?: LogisticsStatus | null;
    logistics_status_display?: string | null;
    created_at: string;
    updated_at: string;
}

/** 创建/更新物流段请求 */
export interface PackageTrackingLegRequest {
    package: number;
    tracking_number: number;
    leg_no?: number;
    stage: TrackingLegStage;
    notes?: string;
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
    tare_weight?: string;
    weight_adjustment?: string;
    weight?: string;  // computed, read-only
    volume?: string;
    estimated_weight?: string;
    estimated_volume?: string;
    length?: string;
    width?: string;
    height?: string;
    total_quantity: string;
    /** 运输费用 */
    shipping_cost?: string;
    /** 最后一段的快递单号 */
    final_tracking_no?: string | null;
    /** 最后一段的承运商 */
    final_carrier_name?: string | null;
    /** 多段物流聚合状态 */
    overall_status?: PackageOverallStatus;
    overall_status_display?: string;
    current_leg_no?: number;
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
    tare_weight?: number;
    weight_adjustment?: number;
    estimated_shipping_cost?: number;
    length?: number;
    width?: number;
    height?: number;
    items?: PackageItemCreateRequest[];    /** 创建包裹时一并提交的初始物流段（每段可省略 leg_no，按顺序自动分配） */
    tracking_legs?: Omit<PackageTrackingLegRequest, 'package'>[];    notes?: string;
    /** 关联的发货单ID，传入后自动建立关联 */
    shipment_id?: number;
}

/** 更新包裹请求 */
export interface PackageUpdateRequest {
    tare_weight?: number;
    weight_adjustment?: number;
    estimated_shipping_cost?: number;
    length?: number;
    width?: number;
    height?: number;
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
    logistics_status: LogisticsStatus;
    is_linked: boolean;
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
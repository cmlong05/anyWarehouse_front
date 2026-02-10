// place files you want to import through the `$lib` alias in this folder.

// ========== 分页响应接口 ==========

/** DRF 分页响应 */
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// 物品
export interface BaseItem {
    id: number;
    SKU: string;
    name: string;
}

// ========== Component (BOM) 组件相关接口 ==========

/** 组件关系基础接口 */
export interface Component {
    id: number;
    parent_item: number;
    child_item: number;
    quantity: number;
    order: number;
    note: string;
}

/** 组件关系详情接口（包含物品详情） */
export interface ComponentDetail {
    id: number;
    parent_item: number;
    child_item: number;
    quantity: number;
    order: number;
    note: string;
    child_item_detail: BaseItem & { weight?: string };
    parent_item_detail: BaseItem & { weight?: string };
    child_item_storage: number;
}

/** 创建/更新组件关系请求 */
export interface ComponentCreateRequest {
    parent_item: number;
    child_item: number;
    quantity: number;
    order?: number;
    note?: string;
}

/** BOM树节点 */
export interface BOMTreeNode {
    item: BaseItem & { weight?: string };
    quantity: number;
    total_storage: number;
    level: number;
    children: BOMTreeNode[];
}

/** BOM树响应 */
export interface BOMTreeResponse {
    item: BaseItem & { weight?: string };
    bom_tree: BOMTreeNode[];
}

/** 物料汇总项 */
export interface TotalComponentItem {
    item_id: number;
    sku: string;
    name: string;
    quantity: number;
}

/** 物料汇总响应 */
export interface TotalComponentsResponse {
    item: BaseItem & { weight?: string };
    total_components: TotalComponentItem[];
}

/** 逆向BOM使用位置 */
export interface WhereUsedItem {
    item_id: number;
    sku: string;
    name: string;
    total_storage: number;
}

/** 逆向BOM响应 */
export interface WhereUsedResponse {
    item: BaseItem & { weight?: string };
    used_in: WhereUsedItem[];
}

// 旧的组件接口 (兼容使用，建议迁移到新接口)
export interface ItemComponent {
    id: number;
    name: string;
    quantity: number;
    type?: string;
}

export interface Item extends BaseItem  {
    SKU_zite: string;
    SKU_A: string;
    description: string;
    image: string;
    weight: string;
    p_volume: number;
    s_volume: number;
    b_Price: string;
    currency: string;
    in_fee: number | null;
    date_added: string;
    barcode: string | null;
    category: number[];
}

export interface ItemSet{
    item: Item;
    categories: CategoryData[];
    storages: StorageContainer[];
}


// 分类
export interface Category {
    id: number;
    name: string;
    top_category: boolean;
    description: string;
    date_added: string;
    lft: number;
    rght: number;
    tree_id: number;
    level: number;
    parent: number;
}
// 分类响应类型，修改命名为 CategoryData
export interface CategoryData {
    category: Category;
    ancestors: Category[];
    descendants: Category[];
    items: Item[];
    siblings: Category[];
}

// 标准 Storage 接口
export interface StorageStandard {
    id: number;
    quantity: number;
    text: string;
    sample: boolean;
    date_added: string;
    volume: number;
    weight: number;
    container: number;
    item: number;
}
// ContainerResponse 组件
export interface StorageItem {
    item_id: number;
    item_SKU: string;
    item_name: string;
    quantity: number;
}
// ItemSet 组件
export interface StorageContainer {
    id: number,
    container_id: number;
    container_fastCode: string;
    mark: string;
    quantity: number;
}

// 容器类型
export interface Container {
    id: number;
    fastCode: string;
    mark: string;
    image: string | null;
    volume: number;
    zz_volume: number;
    a_volume: number;
    zz_weight: number;
    total_weight: number;
    date_added: string;
    lft: number;
    rght: number;
    tree_id: number;
    level: number;
    parent: number | null;
    barcode: string | null;
}
export interface ContainerBriefID  {
    id: number;
    fastCode: string;
}
export interface ContainerBriefMark  {
    fastCode: string;
    mark: string;
}
export interface ContainerVerbose  {
    fastCode: string;
    mark: string;
    available_volume: number;
    base_volume: number;
}

export interface ContainerResponse {
    container: Container;
    ancestors: ContainerBriefMark[];
    descendants: ContainerVerbose[];
    siblings: ContainerBriefMark[];
    storages: StorageItem[];
}

// ========== Supplier 供应商相关接口 ==========

/** 供应商 */
export interface Supplier {
    id: number;
    name: string;
    contact: string;
    e_mail: string;
    telephone: string;
    address: string;
    remark: string;
    is_active: boolean;
    date_added: string;
    created_at: string;
    updated_at: string;
    quotation_count?: number;
}

/** 供应商简要信息 */
export interface SupplierBrief {
    id: number;
    name: string;
    contact: string;
    telephone: string;
}

/** 创建/更新供应商请求 */
export interface SupplierCreateRequest {
    name: string;
    contact?: string;
    e_mail?: string;
    telephone?: string;
    address?: string;
    remark?: string;
    is_active?: boolean;
}

/** 报价 */
export interface Quotation {
    id: number;
    item: number | null;
    sku: string;
    supplier: number;
    supplier_detail?: SupplierBrief;
    item_detail?: BaseItem & { image?: string; weight?: string };
    price: string;
    currency: string;
    min_quantity: number;
    postage: string | null;
    lead_time_days: number | null;
    valid_from: string | null;
    valid_until: string | null;
    is_preferred: boolean;
    note: string;
    created_at: string;
    updated_at: string;
    total_cost?: string;
}

/** 报价简要信息 */
export interface QuotationBrief {
    id: number;
    supplier: number;
    supplier_name: string;
    item: number | null;
    item_sku: string;
    item_name: string;
    sku: string;
    price: string;
    currency: string;
    is_preferred: boolean;
}

/** 创建/更新报价请求 */
export interface QuotationCreateRequest {
    item?: number | null;
    supplier: number;
    price: string | number;
    currency?: string;
    min_quantity?: number;
    postage?: string | number | null;
    lead_time_days?: number | null;
    valid_from?: string | null;
    valid_until?: string | null;
    is_preferred?: boolean;
    note?: string;
}

/** 供应商及其报价 */
export interface SupplierWithQuotations {
    id: number;
    name: string;
    contact: string;
    e_mail: string;
    telephone: string;
    address: string;
    remark: string;
    quotations: QuotationBrief[];
}

/** 报价对比项 */
export interface QuotationComparisonItem {
    item_id: number;
    sku: string;
    name: string;
    quotations: QuotationBrief[];
    best_price: string | null;
    best_price_supplier: string | null;
}

// ========== Purchase Order 采购订单相关接口 ==========

/** 采购订单状态 */
export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';

/** 采购订单优先级 */
export type PurchaseOrderPriority = 'low' | 'normal' | 'high' | 'urgent';

/** 采购订单明细 */
export interface PurchaseOrderItem {
    id: number;
    line_number: number;
    item: number | null;
    item_detail?: BaseItem & { image?: string; weight?: string };
    sku: string;
    item_name: string;
    quantity: number;
    quantity_received: number;
    quantity_pending: number;
    unit_price: string;
    line_total: string;
    quotation: number | null;
    quotation_detail?: {
        id: number;
        price: string;
        currency: string;
        min_quantity: number;
        supplier_name: string;
    };
    expected_delivery: string | null;
    notes: string;
    is_fully_received: boolean;
    created_at: string;
    updated_at: string;
}

/** 采购订单 */
export interface PurchaseOrder {
    id: number;
    order_number: string;
    supplier: number;
    supplier_detail?: {
        id: number;
        name: string;
        contact: string;
        telephone: string;
        e_mail: string;
    };
    status: PurchaseOrderStatus;
    priority: PurchaseOrderPriority;
    order_date: string;
    expected_delivery: string | null;
    actual_delivery: string | null;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    shipping_cost: string;
    discount: string;
    total_amount: string;
    shipping_address: string;
    contact_person: string;
    contact_phone: string;
    payment_terms: string;
    payment_status: string;
    notes: string;
    internal_notes: string;
    items: PurchaseOrderItem[];
    item_count?: number;
    total_quantity?: number;
    total_received?: number;
    progress_percentage?: number;
    created_by: string;
    created_at: string;
    updated_at: string;
}

/** 采购订单简要信息 */
export interface PurchaseOrderBrief {
    id: number;
    order_number: string;
    supplier: number;
    supplier_name: string;
    status: PurchaseOrderStatus;
    priority: PurchaseOrderPriority;
    order_date: string;
    expected_delivery: string | null;
    total_amount: string;
    currency?: string;
    item_count: number;
    total_quantity: number;
    created_at: string;
}

/** 创建采购订单请求 */
export interface PurchaseOrderCreateRequest {
    supplier: number;
    priority?: PurchaseOrderPriority;
    order_date: string;
    expected_delivery?: string | null;
    tax_rate?: string | number;
    shipping_cost?: string | number;
    discount?: string | number;
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    payment_terms?: string;
    notes?: string;
    internal_notes?: string;
    items: PurchaseOrderItemCreateRequest[];
}

/** 采购订单明细创建请求 */
export interface PurchaseOrderItemCreateRequest {
    item?: number | null;
    sku?: string;
    item_name?: string;
    quantity: number;
    unit_price: string | number;
    quotation?: number | null;
    expected_delivery?: string | null;
    notes?: string;
}

/** 更新采购订单请求 */
export interface PurchaseOrderUpdateRequest {
    priority?: PurchaseOrderPriority;
    order_date?: string;
    expected_delivery?: string | null;
    tax_rate?: string | number;
    shipping_cost?: string | number;
    discount?: string | number;
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    payment_terms?: string;
    notes?: string;
    internal_notes?: string;
    status?: PurchaseOrderStatus;
}

/** 收货请求 */
export interface ReceiveItemRequest {
    item_id: number;
    quantity: number;
    notes?: string;
}

export interface ReceiveOrderRequest {
    items: ReceiveItemRequest[];
    notes?: string;
}

/** 采购订单统计 */
export interface PurchaseOrderStatistics {
    total_items: number;
    total_quantity: number;
    total_received: number;
    total_pending: number;
    fully_received_items: number;
    partially_received_items: number;
    pending_items: number;
    order_amount: {
        subtotal: string;
        tax: string;
        shipping: string;
        discount: string;
        total: string;
    };
}

/** 采购订单汇总 */
export interface PurchaseOrderSummary {
    order_count: number;
    status_summary: Record<PurchaseOrderStatus, {
        name: string;
        count: number;
    }>;
    amount_summary: {
        total_subtotal: string;
        total_tax: string;
        total_shipping: string;
        total_discount: string;
        total_amount: string;
    };
}


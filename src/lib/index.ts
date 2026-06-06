// place files you want to import through the `$lib` alias in this folder.
// 被依赖：
// - `lib/components/item/BulkCategoryChangeModal.svelte`
// - `lib/components/forms/CategoryForm.svelte`
// - `lib/components/forms/ContainerForm.svelte`
// - `lib/components/customer/CustomerAddressManager.svelte`
// - `lib/components/item/ItemComponentManager.svelte`
// - `lib/components/item/ItemExternalLinksTab.svelte`
// - `lib/components/forms/ItemForm.svelte`
// - `lib/components/item/ItemQuotationsTab.svelte`
// - `lib/components/order/OrderForm.svelte`
// - `lib/components/forms/StorageForm.svelte`
// - `lib/components/item/VariantQuotationManager.svelte`
// - `lib/components/bom/BOMTreeView.svelte`
// - `lib/components/bom/ComponentList.svelte`
// - `lib/components/bom/TotalComponents.svelte`
// - `lib/components/bom/WhereUsed.svelte`
// - `lib/components/customer/AddressCard.svelte`
// - `lib/components/item/ItemHeaderCard.svelte`
// - `lib/components/item/ItemInventoryTab.svelte`
// - `lib/components/item/ItemSidebar.svelte`
// - `lib/components/order/SalesOrderPaymentPanel.svelte`
// - `lib/components/order/SalesOrderShipmentsPanel.svelte`
// - `lib/components/order/ShipReceiveModal.svelte`
// - `lib/components/partner/QuotationsSection.svelte`
// - `lib/components/shipment-form/BasicInfo.svelte`
// - `lib/components/shipment-form/OrderItemsList.svelte`
// - `lib/composables/useBOMManager.svelte.ts`
// - `lib/composables/useInventoryCheck.svelte.ts`
// - `lib/composables/useOrderDetail.svelte.ts`
// - `lib/composables/useOutboundFlow.svelte.ts`
// - `lib/composables/useQuotationLineForm.svelte.ts`
// - `lib/composables/useShipmentForm.svelte.ts`
// - `lib/utils/item-price.ts`
// - `routes/+page.svelte`
// - `routes/container/[slug]/+page.server.ts`
// - `routes/container/[slug]/+page.svelte`
// - `routes/container/[slug]/edit/+page.server.ts`
// - `routes/container/[slug]/edit/+page.svelte`
// - `routes/container/add/+page.server.ts`
// - `routes/container/add/+page.svelte`
// - `routes/customer/[id]/+page.svelte`
// - `routes/customer/[id]/edit/+page.svelte`
// - `routes/customer/quotation/[id]/+page.svelte`
// - `routes/customer/quotation/[id]/edit/+page.svelte`
// - `routes/customer/quotation/add/+page.svelte`
// - `routes/customer/sales-order/+page.svelte`
// - `routes/customer/sales-order/[id]/+page.svelte`
// - `routes/customer/sales-order/[id]/edit/+page.svelte`
// - `routes/customer/sales-order/add/+page.svelte`
// - `routes/customer/shipment/[id]/+page.svelte`
// - `routes/item/+page.server.ts`
// - `routes/item/+page.svelte`
// - `routes/item/[slug]/+page.server.ts`
// - `routes/item/[slug]/+page.svelte`
// - `routes/item/[slug]/edit/+page.server.ts`
// - `routes/item/[slug]/edit/+page.svelte`
// - `routes/item/add/+page.server.ts`
// - `routes/item/add/+page.svelte`
// - `routes/item/category/+page.server.ts`
// - `routes/item/category/+page.svelte`
// - `routes/item/category/[slug]/+page.server.ts`
// - `routes/item/category/[slug]/+page.svelte`
// - `routes/item/category/[slug]/edit/+page.server.ts`
// - `routes/item/category/[slug]/edit/+page.svelte`
// - `routes/item/category/add/+page.server.ts`
// - `routes/item/category/add/+page.svelte`
// - `routes/storage/+layout.server.ts`
// - `routes/storage/+layout.svelte`
// - `routes/storage/+page.svelte`
// - `routes/storage/[slug]/+page.server.ts`
// - `routes/storage/[slug]/+page.svelte`
// - `routes/storage/add/[slug]/+page.svelte`
// - `routes/storage/movement/add/+page.server.ts`
// - `routes/storage/movement/add/+page.svelte`
// - `routes/supplier/+page.svelte`
// - `routes/supplier/[slug]/+page.svelte`
// - `routes/supplier/[slug]/edit/+page.svelte`
// - `routes/supplier/add/+page.svelte`
// - `routes/supplier/purchase-order/+page.svelte`
// - `routes/supplier/purchase-order/[id]/+page.svelte`
// - `routes/supplier/purchase-order/add/+page.svelte`
// - `routes/supplier/purchase-order/edit/+page.svelte`
// - `routes/supplier/quotation/[id]/+page.svelte`
// - `routes/supplier/quotation/[id]/edit/+page.svelte`
// - `routes/supplier/quotation/add/+page.svelte`

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
    name_en?: string;
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

export interface ItemExternalLink {
    id: number;
    platform: string;
    link_type: string;
    external_id: string;
    url: string;
    label: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface Item extends BaseItem  {
    SKU_zite: string;
    SKU_A: string;
    external_links?: ItemExternalLink[];
    description: string;
    item_status?: 'normal' | 'clearance' | 'discontinued';
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
    total_storage?: number;
    is_variant_template?: boolean;
    variant_attributes_config?: Record<string, string[]> | null;
    inventory_checked_at?: string | null;
    is_variant?: boolean;
    parent_variant_info?: {
        variant_id: number;
        parent_item_id: number;
        parent_sku: string;
        parent_name: string;
        sku_suffix: string;
        attributes: { id: number; attribute_code: string; attribute_name: string; name: string; color_hex?: string | null }[];
    } | null;
}

export interface ItemSet{
    item: Item;
    categories: CategoryData[];
    storages: StorageContainer[];
}

export interface ItemSearchResponse {
    query: string;
    count: number;
    results: Item[];
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
    item_name_en?: string;
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
    mark: string;
    level: number;
    lft: number;
    tree_id: number;
    parent: number | null;
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
    code: string;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    remark: string;
    is_active: boolean;
    currency: string;
    date_added: string;
    created_at: string;
    updated_at: string;
    quotation_count?: number;
}

/** 供应商简要信息 */
export interface SupplierBrief {
    id: number;
    code: string;
    name: string;
    contact_name: string;
    phone: string;
    currency?: string;
}

/** 创建/更新供应商请求 */
export interface SupplierCreateRequest {
    code: string;
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    remark?: string;
    is_active?: boolean;
    currency?: string;
}

/** 报价 */
export interface Quotation {
    id: number;
    item: number | null;
    supplier: number;
    supplier_detail?: SupplierBrief;
    item_detail?: BaseItem & { image?: string; weight?: string };
    price: string;
    currency: string;
    min_quantity: number;
    lead_time_days: number | null;
    valid_from: string | null;
    valid_until: string | null;
    is_preferred: boolean;
    note: string;
    partner_sku?: string;
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
    item_name_en?: string;
    item_total_storage?: number;
    quantity_on_order?: number;
    price: string;
    currency: string;
    min_quantity?: number;
    lead_time_days?: number | null;
    is_preferred: boolean;
    is_unique_supplier?: boolean;
    partner_sku?: string;
    note?: string;
    // 变体相关字段
    is_variant_template?: boolean;
    is_variant?: boolean;
    parent_item_id?: number | null;
    parent_item_name?: string | null;
    parent_item_sku?: string | null;
}

/** 创建/更新报价请求 */
export interface QuotationCreateRequest {
    item?: number | null;
    supplier: number;
    price: string | number;
    currency?: string;
    min_quantity?: number;
    lead_time_days?: number | null;
    valid_from?: string | null;
    valid_until?: string | null;
    note?: string | null;
    is_preferred?: boolean;
    partner_sku?: string;
}

/** 供应商及其报价 */
export interface SupplierWithQuotations {
    id: number;
    code: string;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
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

/** 采购订单付款状态 */
export type PurchaseOrderPaymentStatus = 'unpaid' | 'partial' | 'paid';

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
        contact_name: string;
        phone: string;
        email: string;
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
    currency?: string;
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
    payment_status: PurchaseOrderPaymentStatus;
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
    items?: PurchaseOrderItemUpdateRequest[];
}

/** 采购订单明细更新请求 */
export interface PurchaseOrderItemUpdateRequest {
    id?: number;  // 数据库 ID，有则更新，无则创建
    item?: number | null;
    sku?: string;
    item_name?: string;
    quantity: number;
    unit_price: string | number;
    quotation?: number | null;
    expected_delivery?: string | null;
    notes?: string;
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

// ========== Customer 客户相关接口 ==========

/** 客户 */
export interface Customer {
    id: number;
    code: string;
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    level: 'VIP' | 'NORMAL' | 'TEMP';
    status: 'ACTIVE' | 'INACTIVE';
    currency: string;
    remark?: string;
    addresses?: CustomerAddress[];
    address_count?: number;
    created_at: string;
    updated_at: string;
}

/** 客户简要信息 */
export interface CustomerBrief {
    id: number;
    code: string;
    name: string;
    level: 'VIP' | 'NORMAL' | 'TEMP';
    status: 'ACTIVE' | 'INACTIVE';
    currency?: string;
}

/** 客户表单数据 */
export interface CustomerFormData {
    code: string;
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    level: 'VIP' | 'NORMAL' | 'TEMP';
    status: 'ACTIVE' | 'INACTIVE';
    currency: string;
    remark?: string;
}

/** 客户地址 */
export interface CustomerAddress {
    id: number;
    customer: number;
    company?: string;
    tax_number?: string;
    contact_name?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    country?: string;
    province?: string;
    city?: string;
    district?: string;
    postal_code?: string;
    detail_address?: string;
    detail_address2?: string;
    is_default: boolean;
    status: 'ACTIVE' | 'INACTIVE';
    remark?: string;
    created_at: string;
    updated_at: string;
}

/** 客户地址表单数据 */
export interface CustomerAddressFormData {
    company?: string;
    tax_number?: string;
    contact_name?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    country?: string;
    province?: string;
    city?: string;
    district?: string;
    postal_code?: string;
    detail_address?: string;
    detail_address2?: string;
    is_default: boolean;
    status: 'ACTIVE' | 'INACTIVE';
    remark?: string;
}

/** 客户报价 */
export interface CustomerQuotation {
    id: number;
    item: number | null;
    customer: number;
    customer_detail?: CustomerBrief;
    item_detail?: BaseItem & { image?: string; weight?: string };
    price: string;
    currency: string;
    min_quantity: number;
    lead_time_days: number | null;
    valid_from: string | null;
    valid_until: string | null;
    is_preferred: boolean;
    note: string;
    partner_sku?: string;
    created_at: string;
    updated_at: string;
    total_price?: string;
}

/** 客户报价简要信息 */
export interface CustomerQuotationBrief {
    id: number;
    customer: number;
    customer_name: string;
    customer_code: string;
    item: number | null;
    item_sku: string;
    item_name: string;
    item_name_en?: string;
    item_total_storage?: number;
    quantity_on_order?: number;
    price: string;
    currency: string;
    is_preferred: boolean;
    is_unique_supplier?: boolean;
    partner_sku?: string;
    note?: string;
    min_quantity?: number;
    lead_time_days?: number | null;
    // 变体相关字段
    is_variant_template?: boolean;
    is_variant?: boolean;
    parent_item_id?: number | null;
    parent_item_name?: string | null;
    parent_item_sku?: string | null;
}

/** 创建/更新客户报价请求 */
export interface CustomerQuotationCreateRequest {
    item?: number | null;
    customer: number;
    price: string | number;
    currency?: string;
    min_quantity?: number;
    lead_time_days?: number | null;
    valid_from?: string | null;
    note?: string;
    partner_sku?: string;
}

/** 客户及其报价 */
export interface CustomerWithQuotations {
    id: number;
    code: string;
    name: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    level: 'VIP' | 'NORMAL' | 'TEMP';
    status: 'ACTIVE' | 'INACTIVE';
    remark?: string;
    quotations: CustomerQuotationBrief[];
    created_at: string;
    updated_at: string;
}

/** 客户报价对比项 */
export interface CustomerQuotationComparisonItem {
    item_id: number;
    sku: string;
    name: string;
    quotations: CustomerQuotationBrief[];
    best_price: string | null;
    best_price_customer: string | null;
}

// ========== Sales Order 销售订单相关接口 ==========

/** 销售订单状态 */
export type SalesOrderStatus = 'draft' | 'pending' | 'approved' | 'confirmed' | 'partial' | 'shipped' | 'delivered' | 'cancelled';

/** 销售订单优先级 */
export type SalesOrderPriority = 'low' | 'normal' | 'high' | 'urgent';

/** 销售订单收款状态 */
export type SalesOrderPaymentStatus = 'unpaid' | 'partial' | 'paid';

/** 销售订单明细 */
export interface SalesOrderItem {
    id: number;
    line_number: number;
    item: number | null;
    item_detail?: BaseItem & { image?: string; weight?: string; total_storage?: number };
    sku: string;
    item_name: string;
    item_name_en?: string;
    quantity: number;
    quantity_shipped: number;
    quantity_prepared?: number;  // 已预备（已添加到confirmed/packed发货单但尚未发货）
    quantity_pending?: number;   // 原待发（= 订购 - 已发）
    quantity_pending_real?: number;  // 真实待发（= 订购 - 已发 - 已预备）
    unit_price: string;
    line_total: string;
    quotation: number | null;
    quotation_detail?: {
        id: number;
        price: string;
        currency: string;
        customer: number;
    };
    expected_delivery: string | null;
    notes: string;
    is_fully_shipped?: boolean;
    created_at: string;
    updated_at: string;
}

/** 销售订单明细创建请求 */
export interface SalesOrderItemCreateRequest {
    item?: number | null;
    sku?: string;
    item_name?: string;
    quantity: number;
    unit_price: number;
    quotation?: number | null;
    expected_delivery?: string | null;
    notes?: string;
}

/** 关联发货单简要信息 */
export interface ShipmentBrief {
    id: number;
    shipment_no: string;
    status: string;
    total_packages: number;
    created_at: string;
}

/** 销售订单收款记录 */
export interface SalesOrderPaymentRecord {
    id: number;
    sales_order: number;
    received_date: string;
    amount: string;
    currency: string;
    payment_method: string;
    reference_number: string;
    attachment?: string | null;
    attachment_url?: string | null;
    attachment_name?: string;
    attachment_is_image?: boolean;
    notes: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

/** 销售订单收款记录创建请求 */
export interface SalesOrderPaymentRecordCreateRequest {
    sales_order: number;
    received_date: string;
    amount: number;
    currency?: string;
    payment_method?: string;
    reference_number?: string;
    attachment?: File | null;
    notes?: string;
}

/** 销售订单 */
export interface SalesOrder {
    id: number;
    order_number: string;
    customer: number;
    customer_detail?: {
        id: number;
        name: string;
        code: string;
        contact_name?: string;
        phone?: string;
        email?: string;
    };
    status: SalesOrderStatus;
    priority: SalesOrderPriority;
    order_date: string;
    expected_delivery: string | null;
    actual_delivery: string | null;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    shipping_cost: string;
    payment_fee: string;
    discount: string;
    adjustment: string;
    total_amount: string;
    shipping_address: string;
    contact_person: string;
    contact_phone: string;
    company_name: string;
    payment_terms: string;
    payment_status: SalesOrderPaymentStatus;
    payment_status_display?: string;
    received_amount?: string;
    balance_due?: string;
    payment_progress_percentage?: number;
    notes: string;
    internal_notes: string;
    items: SalesOrderItem[];
    shipments?: ShipmentBrief[];
    payment_records?: SalesOrderPaymentRecord[];
    item_count?: number;
    total_quantity?: number;
    estimated_weight?: string;
    total_shipped?: number;
    progress_percentage?: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    currency?: string;
}

/** 销售订单简要信息 */
export interface SalesOrderBrief {
    id: number;
    order_number: string;
    customer: number;
    customer_name: string;
    customer_code: string;
    status: SalesOrderStatus;
    priority: SalesOrderPriority;
    order_date: string;
    expected_delivery: string | null;
    total_amount: string;
    payment_status?: SalesOrderPaymentStatus;
    currency?: string;
    item_count: number;
    total_quantity?: number;
    created_at: string;
}

/** 创建销售订单请求 */
export interface SalesOrderCreateRequest {
    customer: number;
    priority?: SalesOrderPriority;
    order_date: string;
    expected_delivery?: string | null;
    tax_rate?: number;
    shipping_cost?: number;
    payment_fee?: number;
    discount?: number;
    adjustment?: number;
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    company_name?: string;
    payment_terms?: string;
    notes?: string;
    internal_notes?: string;
    items: SalesOrderItemCreateRequest[];
}

/** 更新销售订单请求 */
export interface SalesOrderUpdateRequest {
    priority?: SalesOrderPriority;
    order_date?: string;
    expected_delivery?: string | null;
    tax_rate?: number;
    shipping_cost?: number;
    payment_fee?: number;
    discount?: number;
    adjustment?: number;
    shipping_address?: string;
    contact_person?: string;
    contact_phone?: string;
    company_name?: string;
    payment_terms?: string;
    notes?: string;
    internal_notes?: string;
    status?: SalesOrderStatus;
    items?: SalesOrderItemUpdateRequest[];
}

/** 销售订单明细更新请求 */
export interface SalesOrderItemUpdateRequest {
    id?: number;  // 数据库 ID，有则更新，无则创建
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

/** 发货请求 */
export interface ShipItemRequest {
    item_id: number;
    quantity: number;
    notes?: string;
}

export interface ShipOrderRequest {
    items: ShipItemRequest[];
    notes?: string;
}

/** 销售订单统计 */
export interface SalesOrderStatistics {
    total_items: number;
    total_quantity: number;
    total_shipped: number;
    total_pending: number;
    fully_shipped_items: number;
    partially_shipped_items: number;
    pending_items: number;
    order_amount: {
        subtotal: string;
        tax: string;
        shipping: string;
        discount: string;
        total: string;
    };
}

/** 销售订单汇总 */
export interface SalesOrderSummary {
    order_count: number;
    status_summary: Record<SalesOrderStatus, {
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


// ========== 通用类型定义（新） ==========

export type {
    BaseEntity,
    PartnerBase,
    PartnerBrief as PartnerBriefBase,
    OrderBase,
    OrderBrief as OrderBriefBase,
    OrderItemBase,
    OrderCreateRequestBase,
    OrderItemCreateRequestBase,
    OrderUpdateRequestBase,
    OrderStatistics as OrderStatisticsBase,
    OrderSummary as OrderSummaryBase,
    QuotationBase,
    Priority,
    QueryParams,
} from './types/common';

export {
    PRIORITY_OPTIONS,
} from './types/common';

// ========== Composables 导出（新） ==========

export {
    useOrderForm,
    useOrderItemSelector,
    type OrderFormItem,
    type OrderFormData,
    type OrderFormErrors,
    type OrderItemErrors,
} from './composables/useOrderForm.svelte';

// ========== 工具函数导出（新） ==========

export * from './utils/index';

// ========== API 导出（新） ==========

export * from './api/index';

// ========== UI 组件导出（新） ==========

export * from './components/ui/index';

// ========== 类型导出 ==========

export type {
    ItemAttribute,
    ItemAttributeValue,
    ItemAttributeDetail,
    ItemVariant,
    ItemVariantDetail,
    VariantSummary,
    ItemVariantInfo,
    VariantSelection,
    VariantMatchRequest,
    VariantMatchResponse,
    BulkCreateVariantsRequest,
    BulkCreateVariantsResponse,
    CreateVariantRequest,
} from './types/variant';
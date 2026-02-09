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


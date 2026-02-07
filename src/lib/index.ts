// place files you want to import through the `$lib` alias in this folder.

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
    quantity: number;
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


// place files you want to import through the `$lib` alias in this folder.

// 物品
export interface BaseItem {
    id: number;
    SKU: string;
    name: string;
}

// 组件接口
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
    components: ItemComponent[];
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
    mainContainer: Container;
    ancestors: ContainerBriefMark[];
    descendants: ContainerVerbose[];
    siblings: ContainerBriefMark[];
    storageItem: StorageItem[];
}


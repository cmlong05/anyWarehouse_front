// place files you want to import through the `$lib` alias in this folder.

// 物品
export interface Item {
    id: number;
    SKU: string;
    SKU_zite: string;
    SKU_A: string;
    name: string;
    description: string;
    image: string;
    weight: string;
    p_volume: number;
    s_volume: number;
    b_Price: string;
    currency: string;
    in_fee: null;
    date_added: string;
    barcode: null;
    category: number[];
    components: any[];
}
export interface Items {
    id: number;
    SKU: string;
    name: string;
}
export interface ItemSet{
    item: Item;
    categories: CategoryData[];
    storages: storageContainer[];
}


// 分类
export interface category {
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
    category: category;
    ancestors: category[];
    descendants: category[];
    items: Item[];
    siblings: category[];
}

// 定义 storagestandard 接口
export interface storagestandard {
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
export interface storageItem {
    item_id: number;
    item_SKU: string;
    item_name: string;
    quantity: number;
}

// 定义 storageContainer 接口
export interface storageContainer {
    container_id: number;
    container_fastCode: string;
    mark: string;
    quantity: number;
}

// 容器类型
export interface container {
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
export interface containerBrief  {
    fastCode: string;
    mark: string;
}

export interface ContainerResponse {
    mainContainer: container;
    ancestors: containerBrief[];
    descendants: containerBrief[];
    siblings: containerBrief[];
    storageItem: storageItem[];
}


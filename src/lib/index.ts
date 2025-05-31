// place files you want to import through the `$lib` alias in this folder.
// 分类物品类型
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
export interface storages {
    item_id: number;
    item_SKU: string;
    item_name: string;
    quantity: number;
}
export interface Ancestors {
    fastCode: string;
    mark: string;
}
export interface Descendants {
    fastCode: string;
    mark: string;
}
export interface SiblingItem {
    fastCode: string;
    mark: string;
}
export interface ContainerResponse {
    mainContainer: container;
    ancestors: Ancestors[];
    descendants: Descendants[];
    siblings: SiblingItem[];
    storageItem: storages[];
}


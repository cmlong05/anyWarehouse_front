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

// 分类响应类型，修改命名为 CategoryData
export interface CategoryData {
    id: number;
    name: string;
    items: Item[];
}

export interface ContainerDetail {
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

export interface StorageItem {
    item_SKU: string;
    item_name: string;
    quantity: number;
}

export interface DescendantItem {
    fastCode: string;
    mark: string;
}

export interface SiblingItem {
    fastCode: string;
    mark: string;
}

export interface Ancestors {
    fastCode: string;
    mark: string;
}

export interface ContainerResponse {
    container: ContainerDetail;
    storages: StorageItem[];
    ancestors: Ancestors[];
    descendants: DescendantItem[];
    siblings: SiblingItem[];
}

export interface Items {
    id: number;
    SKU: string;
    name: string;
}

// place files you want to import through the `$lib` alias in this folder.
// 分类物品类型
export interface Item {
    id: number;
    SKU: string;
    name: string;
    description: string;
    image: string;
    weight: string;
    p_volume: number;
    s_volume: number;
    b_Price: string;
    currency: string;
}

// 分类响应类型，修改命名为 CategoryData
export interface CategoryData {
    id: number;
    name: string;
    items: Item[];
}

export interface Container {
    id: number;
    fastCode: string;
    mark: string;
    image: null | string;
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
    parent: null | number;
    barcode: null | string;
}


export interface Items {
    id: number;
    SKU: string;
    name: string;
}

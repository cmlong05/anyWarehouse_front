// place files you want to import through the `$lib` alias in this folder.
// 分类物品类型
export interface CategoryItem {
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
    in_fee: null | string;
    date_added: string;
    barcode: null | string;
    category: Array<{
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
    }>;
    components: Array<any>;
}

// 分类响应类型
export interface CategoryResponse {
    id: number;
    name: string;
    items: CategoryItem[];
}

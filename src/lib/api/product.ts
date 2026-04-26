/**
 * 产品相关 API
 */
import { BaseAPI, apiClient } from './base';
import type { 
    Item,
    Component,
    ComponentDetail,
    ComponentCreateRequest,
    BOMTreeResponse,
    TotalComponentsResponse,
    WhereUsedResponse,
} from '$lib/index';
import type { ItemAttribute, ItemAttributeValue } from '$lib/types/variant';
import type { ItemFormData } from '$lib/schemas';
import type { PaginatedResponse } from './base';

// ========== Item API ==========

export class ItemAPI extends BaseAPI<Item, ItemFormData> {
    constructor() {
        super('/product/item/');
    }

    /** 获取物品列表 */
    async list(params?: { 
        search?: string; 
        category?: number; 
        page?: number; 
        page_size?: number;
        ordering?: string;
    }): Promise<PaginatedResponse<Item>> {
        const queryParams: Record<string, string> = {};
        if (params?.search) queryParams.search = params.search;
        if (params?.category) queryParams.category = params.category.toString();
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        if (params?.ordering) queryParams.ordering = params.ordering;
        return super.list(queryParams);
    }

    /** 搜索物品 */
    async search(query: string): Promise<{ query: string; count: number; results: Item[] }> {
        return this.client.get(`${this.basePath}search/`, { q: query });
    }
}

// ========== Component (BOM) API ==========

export class ComponentAPI extends BaseAPI<Component, ComponentCreateRequest> {
    constructor() {
        super('/product/components/');
    }

    /** 获取所有组件关系列表 */
    async listAll(): Promise<ComponentDetail[]> {
        return this.client.get<ComponentDetail[]>(this.basePath);
    }

    /** 根据父物品获取所有组件 */
    async getByParent(parentId: number): Promise<ComponentDetail[]> {
        return this.client.get<ComponentDetail[]>(`${this.basePath}by_parent/`, { parent_id: parentId.toString() });
    }

    /** 根据子物品获取所有使用关系（逆向查询） */
    async getByChild(childId: number): Promise<ComponentDetail[]> {
        return this.client.get<ComponentDetail[]>(`${this.basePath}by_child/`, { child_id: childId.toString() });
    }
}

// ========== Item BOM API ==========

export class ItemBOMAPI {
    private client = apiClient;

    /** 获取BOM树结构 */
    async getBOMTree(itemId: number, maxLevel: number = 10): Promise<BOMTreeResponse> {
        return this.client.get<BOMTreeResponse>(`/product/item/${itemId}/bom_tree/`, { max_level: maxLevel.toString() });
    }

    /** 计算物料总需求 */
    async getTotalComponents(itemId: number): Promise<TotalComponentsResponse> {
        return this.client.get<TotalComponentsResponse>(`/product/item/${itemId}/total_components/`);
    }

    /** 查询物品被用在哪些地方（逆向BOM） */
    async getWhereUsed(itemId: number): Promise<WhereUsedResponse> {
        return this.client.get<WhereUsedResponse>(`/product/item/${itemId}/where_used/`);
    }
}

// ========== Item Attribute API ==========

export type AttributeCreatePayload = {
    name: string;
    code: string;
    display_order?: number;
};

export type AttributeUpdatePayload = Partial<{
    name: string;
    code: string;
    display_order: number;
    is_active: boolean;
}>;

export type AttributeValueCreatePayload = {
    attribute: number;
    value: string;
    code: string;
    color_hex?: string;
    display_order?: number;
};

export type AttributeValueUpdatePayload = Partial<{
    value: string;
    code: string;
    color_hex: string;
    display_order: number;
    is_active: boolean;
}>;

export class AttributeAPI {
    private client = apiClient;
    private readonly attrPath = '/product/attributes/';
    private readonly valuePath = '/product/attribute-values/';

    /** 获取所有属性 */
    listAttributes(): Promise<ItemAttribute[]> {
        return this.client.get<ItemAttribute[]>(this.attrPath);
    }

    /** 获取所有属性值 */
    listValues(): Promise<ItemAttributeValue[]> {
        return this.client.get<ItemAttributeValue[]>(this.valuePath);
    }

    createAttribute(data: AttributeCreatePayload): Promise<ItemAttribute> {
        return this.client.post<ItemAttribute>(this.attrPath, data);
    }

    updateAttribute(id: number, data: AttributeUpdatePayload): Promise<ItemAttribute> {
        return this.client.patch<ItemAttribute>(`${this.attrPath}${id}/`, data);
    }

    deleteAttribute(id: number): Promise<void> {
        return this.client.deleteNoContent(`${this.attrPath}${id}/`);
    }

    createValue(data: AttributeValueCreatePayload): Promise<ItemAttributeValue> {
        return this.client.post<ItemAttributeValue>(this.valuePath, data);
    }

    updateValue(id: number, data: AttributeValueUpdatePayload): Promise<ItemAttributeValue> {
        return this.client.patch<ItemAttributeValue>(`${this.valuePath}${id}/`, data);
    }

    deleteValue(id: number): Promise<void> {
        return this.client.deleteNoContent(`${this.valuePath}${id}/`);
    }
}

// ========== 导出 API 实例 ==========

export const itemAPI = new ItemAPI();
export const componentAPI = new ComponentAPI();
export const itemBOMAPI = new ItemBOMAPI();
export const attributeAPI = new AttributeAPI();

import { config } from './config';
import type { 
    Component, 
    ComponentDetail, 
    ComponentCreateRequest,
    BOMTreeResponse,
    TotalComponentsResponse,
    WhereUsedResponse,
    PaginatedResponse,
    Supplier,
    SupplierBrief,
    SupplierCreateRequest,
    SupplierWithQuotations,
    Quotation,
    QuotationBrief,
    QuotationCreateRequest,
    QuotationComparisonItem,
    Item,
} from './index';

export interface ApiError {
    message: string;
    status: number;
    code?: string;
}

export class ApiClient {
    private baseURL: string;
    private timeout: number;

    constructor(baseURL: string = config.API_BASE_URL, timeout: number = 30000) {
        this.baseURL = baseURL;
        this.timeout = timeout;
    }

    private async request<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error: ApiError = {
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    status: response.status,
                };
                
                try {
                    const errorData = await response.json();
                    error.message = errorData.message || error.message;
                    error.code = errorData.code;
                } catch {
                    // 如果无法解析错误响应，使用默认错误信息
                }

                throw error;
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw {
                        message: '请求超时',
                        status: 408,
                        code: 'TIMEOUT'
                    } as ApiError;
                }
            }
            
            throw error;
        }
    }

    async get<T>(url: string, params?: Record<string, string>): Promise<T> {
        const searchParams = params ? new URLSearchParams(params) : null;
        const fullUrl = searchParams ? `${url}?${searchParams}` : url;
        
        return this.request<T>(fullUrl, {
            method: 'GET',
        });
    }

    async post<T>(url: string, data?: any): Promise<T> {
        return this.request<T>(url, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(url: string, data?: any): Promise<T> {
        return this.request<T>(url, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(url: string, data?: any): Promise<T> {
        return this.request<T>(url, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(url: string): Promise<T> {
        return this.request<T>(url, {
            method: 'DELETE',
        });
    }

    /** 删除请求 - 不解析响应体（用于返回 204 No Content 的接口） */
    async deleteNoContent(url: string): Promise<void> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                method: 'DELETE',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error: ApiError = {
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    status: response.status,
                };
                throw error;
            }
            // 不解析响应体，直接返回
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
}

// ========== Component (BOM) API 组件管理接口 ==========

export class ComponentAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取所有组件关系列表 */
    async list(): Promise<ComponentDetail[]> {
        return this.client.get<ComponentDetail[]>('/product/components/');
    }

    /** 获取单个组件关系详情 */
    async get(id: number): Promise<ComponentDetail> {
        return this.client.get<ComponentDetail>(`/product/components/${id}/`);
    }

    /** 创建组件关系 */
    async create(data: ComponentCreateRequest): Promise<Component> {
        return this.client.post<Component>('/product/components/', data);
    }

    /** 更新组件关系 */
    async update(id: number, data: Partial<ComponentCreateRequest>): Promise<Component> {
        return this.client.put<Component>(`/product/components/${id}/`, data);
    }

    /** 部分更新组件关系 */
    async patch(id: number, data: Partial<ComponentCreateRequest>): Promise<Component> {
        return this.client.patch<Component>(`/product/components/${id}/`, data);
    }

    /** 删除组件关系 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/product/components/${id}/`);
    }

    /** 根据父物品获取所有组件 */
    async getByParent(parentId: number): Promise<ComponentDetail[]> {
        return this.client.get<ComponentDetail[]>('/product/components/by_parent/', { parent_id: parentId.toString() });
    }

    /** 根据子物品获取所有使用关系（逆向查询） */
    async getByChild(childId: number): Promise<ComponentDetail[]> {
        return this.client.get<ComponentDetail[]>('/product/components/by_child/', { child_id: childId.toString() });
    }
}

// ========== Item BOM API 物品BOM接口 ==========

export class ItemBOMAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

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

// 默认 API 客户端实例
export const apiClient = new ApiClient();

// 组件API实例
export const componentAPI = new ComponentAPI();
export const itemBOMAPI = new ItemBOMAPI();

// ========== Supplier API 供应商接口 ==========

export class SupplierAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取所有供应商列表 */
    async list(params?: { search?: string; is_active?: boolean }): Promise<PaginatedResponse<Supplier>> {
        const queryParams: Record<string, string> = {};
        if (params?.search) queryParams.search = params.search;
        if (params?.is_active !== undefined) queryParams.is_active = String(params.is_active);
        return this.client.get<PaginatedResponse<Supplier>>('/supplier/suppliers/', queryParams);
    }

    /** 获取供应商简要列表（下拉选择用） */
    async listBrief(): Promise<SupplierBrief[]> {
        return this.client.get<SupplierBrief[]>('/supplier/suppliers/brief/');
    }

    /** 获取单个供应商详情 */
    async get(id: number): Promise<Supplier> {
        return this.client.get<Supplier>(`/supplier/suppliers/${id}/`);
    }

    /** 获取供应商及其报价 */
    async getWithQuotations(id: number): Promise<SupplierWithQuotations> {
        return this.client.get<SupplierWithQuotations>(`/supplier/suppliers/${id}/?with_quotations=true`);
    }

    /** 创建供应商 */
    async create(data: SupplierCreateRequest): Promise<Supplier> {
        return this.client.post<Supplier>('/supplier/suppliers/', data);
    }

    /** 更新供应商 */
    async update(id: number, data: Partial<SupplierCreateRequest>): Promise<Supplier> {
        return this.client.put<Supplier>(`/supplier/suppliers/${id}/`, data);
    }

    /** 部分更新供应商 */
    async patch(id: number, data: Partial<SupplierCreateRequest>): Promise<Supplier> {
        return this.client.patch<Supplier>(`/supplier/suppliers/${id}/`, data);
    }

    /** 删除供应商 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/supplier/suppliers/${id}/`);
    }

    /** 获取供应商的所有报价 */
    async getQuotations(id: number, itemId?: number): Promise<{ supplier: SupplierBrief; quotations: QuotationBrief[]; count: number }> {
        const params: Record<string, string> = {};
        if (itemId) params.item_id = itemId.toString();
        return this.client.get(`/supplier/suppliers/${id}/quotations/`, params);
    }
}

// ========== Quotation API 报价接口 ==========

export class QuotationAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取所有报价列表 */
    async list(params?: {
        item_id?: number;
        supplier_id?: number;
        sku?: string;
        preferred_only?: boolean;
        min_price?: number;
        max_price?: number;
        brief?: boolean;
    }): Promise<PaginatedResponse<Quotation | QuotationBrief>> {
        const queryParams: Record<string, string> = {};
        if (params?.item_id) queryParams.item_id = params.item_id.toString();
        if (params?.supplier_id) queryParams.supplier_id = params.supplier_id.toString();
        if (params?.sku) queryParams.sku = params.sku;
        if (params?.preferred_only) queryParams.preferred_only = 'true';
        if (params?.min_price) queryParams.min_price = params.min_price.toString();
        if (params?.max_price) queryParams.max_price = params.max_price.toString();
        if (params?.brief) queryParams.brief = 'true';
        return this.client.get<PaginatedResponse<Quotation | QuotationBrief>>('/supplier/quotations/', queryParams);
    }

    /** 获取单个报价详情 */
    async get(id: number): Promise<Quotation> {
        return this.client.get<Quotation>(`/supplier/quotations/${id}/`);
    }

    /** 创建报价 */
    async create(data: QuotationCreateRequest): Promise<Quotation> {
        return this.client.post<Quotation>('/supplier/quotations/', data);
    }

    /** 更新报价 */
    async update(id: number, data: Partial<QuotationCreateRequest>): Promise<Quotation> {
        return this.client.put<Quotation>(`/supplier/quotations/${id}/`, data);
    }

    /** 部分更新报价 */
    async patch(id: number, data: Partial<QuotationCreateRequest>): Promise<Quotation> {
        return this.client.patch<Quotation>(`/supplier/quotations/${id}/`, data);
    }

    /** 删除报价 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/supplier/quotations/${id}/`);
    }

    /** 获取物品的所有报价 */
    async getByItem(itemId: number): Promise<{
        item_id: number;
        quotations: QuotationBrief[];
        count: number;
        best_price: { price: string; supplier: string; quotation_id: number } | null;
    }> {
        return this.client.get('/supplier/quotations/by_item/', { item_id: itemId.toString() });
    }

    /** 多供应商报价对比 */
    async compare(itemIds: number[]): Promise<{ comparisons: QuotationComparisonItem[]; total_items: number }> {
        return this.client.get('/supplier/quotations/compare/', { item_ids: itemIds.join(',') });
    }

    /** 设置/取消首选报价 */
    async setPreferred(id: number, isPreferred: boolean = true): Promise<Quotation> {
        return this.client.post<Quotation>(`/supplier/quotations/${id}/set_preferred/`, { is_preferred: isPreferred });
    }
}

// ========== Item API 物品接口 ==========

export class ItemAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取物品列表 */
    async list(params?: { search?: string; category?: number; page?: number; page_size?: number }): Promise<PaginatedResponse<Item>> {
        const queryParams: Record<string, string> = {};
        if (params?.search) queryParams.search = params.search;
        if (params?.category) queryParams.category = params.category.toString();
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        return this.client.get<PaginatedResponse<Item>>('/product/item/', queryParams);
    }

    /** 获取单个物品详情 */
    async get(id: number): Promise<Item> {
        return this.client.get<Item>(`/product/item/${id}/`);
    }

    /** 创建物品 */
    async create(data: Partial<Item>): Promise<Item> {
        return this.client.post<Item>('/product/item/', data);
    }

    /** 更新物品 */
    async update(id: number, data: Partial<Item>): Promise<Item> {
        return this.client.put<Item>(`/product/item/${id}/`, data);
    }

    /** 删除物品 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/product/item/${id}/`);
    }
}

// API 实例导出
export const supplierAPI = new SupplierAPI();
export const quotationAPI = new QuotationAPI();
export const itemAPI = new ItemAPI();

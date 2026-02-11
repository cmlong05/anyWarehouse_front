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
    PurchaseOrder,
    PurchaseOrderBrief,
    PurchaseOrderCreateRequest,
    PurchaseOrderUpdateRequest,
    PurchaseOrderItem,
    ReceiveOrderRequest,
    PurchaseOrderStatistics,
    PurchaseOrderSummary,
    PurchaseOrderStatus,
    PurchaseOrderPriority,
    Customer,
    CustomerBrief,
    CustomerAddress,
    CustomerFormData,
    CustomerAddressFormData,
    CustomerQuotation,
    CustomerQuotationBrief,
    CustomerQuotationCreateRequest,
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

// ========== Purchase Order API 采购订单接口 ==========

export class PurchaseOrderAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取采购订单列表 */
    async list(params?: {
        supplier_id?: number;
        status?: string;
        priority?: PurchaseOrderPriority;
        order_number?: string;
        date_from?: string;
        date_to?: string;
        delivery_from?: string;
        delivery_to?: string;
        min_amount?: number;
        max_amount?: number;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<PurchaseOrderBrief>> {
        const queryParams: Record<string, string> = {};
        if (params?.supplier_id) queryParams.supplier_id = params.supplier_id.toString();
        if (params?.status) queryParams.status = params.status;
        if (params?.priority) queryParams.priority = params.priority;
        if (params?.order_number) queryParams.order_number = params.order_number;
        if (params?.date_from) queryParams.date_from = params.date_from;
        if (params?.date_to) queryParams.date_to = params.date_to;
        if (params?.delivery_from) queryParams.delivery_from = params.delivery_from;
        if (params?.delivery_to) queryParams.delivery_to = params.delivery_to;
        if (params?.min_amount) queryParams.min_amount = params.min_amount.toString();
        if (params?.max_amount) queryParams.max_amount = params.max_amount.toString();
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        return this.client.get<PaginatedResponse<PurchaseOrderBrief>>('/supplier/purchase-orders/', queryParams);
    }

    /** 获取单个采购订单详情 */
    async get(id: number): Promise<PurchaseOrder> {
        return this.client.get<PurchaseOrder>(`/supplier/purchase-orders/${id}/`);
    }

    /** 创建采购订单 */
    async create(data: PurchaseOrderCreateRequest): Promise<PurchaseOrder> {
        return this.client.post<PurchaseOrder>('/supplier/purchase-orders/', data);
    }

    /** 更新采购订单 */
    async update(id: number, data: PurchaseOrderUpdateRequest): Promise<PurchaseOrder> {
        return this.client.put<PurchaseOrder>(`/supplier/purchase-orders/${id}/`, data);
    }

    /** 部分更新采购订单 */
    async patch(id: number, data: Partial<PurchaseOrderUpdateRequest>): Promise<PurchaseOrder> {
        return this.client.patch<PurchaseOrder>(`/supplier/purchase-orders/${id}/`, data);
    }

    /** 删除采购订单 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/supplier/purchase-orders/${id}/`);
    }

    /** 添加订单明细 */
    async addItem(orderId: number, data: {
        item?: number | null;
        sku?: string;
        item_name?: string;
        quantity: number;
        unit_price: number | string;
        quotation?: number | null;
        expected_delivery?: string | null;
        notes?: string;
    }): Promise<PurchaseOrderItem> {
        return this.client.post<PurchaseOrderItem>(`/supplier/purchase-orders/${orderId}/add_item/`, data);
    }

    /** 更新订单明细 */
    async updateItem(orderId: number, itemId: number, data: Partial<PurchaseOrderItem>): Promise<PurchaseOrderItem> {
        return this.client.patch<PurchaseOrderItem>(`/supplier/purchase-orders/${orderId}/update_item/`, {
            item_id: itemId,
            ...data
        });
    }

    /** 删除订单明细 */
    async removeItem(orderId: number, itemId: number): Promise<void> {
        return this.client.post<void>(`/supplier/purchase-orders/${orderId}/remove_item/`, { item_id: itemId });
    }

    /** 变更订单状态 */
    async changeStatus(orderId: number, status: PurchaseOrderStatus, notes?: string): Promise<PurchaseOrder> {
        return this.client.post<PurchaseOrder>(`/supplier/purchase-orders/${orderId}/change_status/`, {
            status,
            notes
        });
    }

    /** 订单收货 */
    async receive(orderId: number, data: ReceiveOrderRequest): Promise<PurchaseOrder> {
        return this.client.post<PurchaseOrder>(`/supplier/purchase-orders/${orderId}/receive/`, data);
    }

    /** 获取订单统计信息 */
    async getStatistics(orderId: number): Promise<PurchaseOrderStatistics> {
        return this.client.get<PurchaseOrderStatistics>(`/supplier/purchase-orders/${orderId}/statistics/`);
    }

    /** 获取采购订单汇总统计 */
    async getSummary(): Promise<PurchaseOrderSummary> {
        return this.client.get<PurchaseOrderSummary>('/supplier/purchase-orders/summary/');
    }

    /** 按供应商统计 */
    async getBySupplier(supplierId: number): Promise<{
        total_orders: number;
        orders_by_status: Record<string, { name: string; count: number; total_amount: string }>;
        total_amount: string;
    }> {
        return this.client.get('/supplier/purchase-orders/by_supplier/', { supplier_id: supplierId.toString() });
    }
}

// ========== Purchase Order Item API 采购订单明细接口 ==========

export class PurchaseOrderItemAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取订单明细列表 */
    async list(params?: {
        order_id?: number;
        item_id?: number;
        sku?: string;
        received_status?: 'pending' | 'partial' | 'complete';
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<PurchaseOrderItem>> {
        const queryParams: Record<string, string> = {};
        if (params?.order_id) queryParams.order_id = params.order_id.toString();
        if (params?.item_id) queryParams.item_id = params.item_id.toString();
        if (params?.sku) queryParams.sku = params.sku;
        if (params?.received_status) queryParams.received_status = params.received_status;
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        return this.client.get<PaginatedResponse<PurchaseOrderItem>>('/supplier/purchase-order-items/', queryParams);
    }

    /** 获取单个明细详情 */
    async get(id: number): Promise<PurchaseOrderItem> {
        return this.client.get<PurchaseOrderItem>(`/supplier/purchase-order-items/${id}/`);
    }

    /** 获取待收货明细 */
    async getPending(): Promise<PaginatedResponse<PurchaseOrderItem>> {
        return this.client.get<PaginatedResponse<PurchaseOrderItem>>('/supplier/purchase-order-items/pending/');
    }
}

// API 实例导出
export const purchaseOrderAPI = new PurchaseOrderAPI();
export const purchaseOrderItemAPI = new PurchaseOrderItemAPI();

// ========== Customer API 客户接口 ==========

export class CustomerAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取客户列表 */
    async list(params?: {
        search?: string;
        level?: string;
        status?: string;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<Customer>> {
        const queryParams: Record<string, string> = {};
        if (params?.search) queryParams.search = params.search;
        if (params?.level) queryParams.level = params.level;
        if (params?.status) queryParams.status = params.status;
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        return this.client.get<PaginatedResponse<Customer>>('/customer/customer/', queryParams);
    }

    /** 获取客户简要列表（下拉选择用） */
    async listBrief(): Promise<CustomerBrief[]> {
        return this.client.get<CustomerBrief[]>('/customer/customer/brief/');
    }

    /** 获取单个客户详情 */
    async get(id: number): Promise<Customer> {
        return this.client.get<Customer>(`/customer/customer/${id}/`);
    }

    /** 创建客户 */
    async create(data: CustomerFormData): Promise<Customer> {
        return this.client.post<Customer>('/customer/customer/', data);
    }

    /** 更新客户 */
    async update(id: number, data: Partial<CustomerFormData>): Promise<Customer> {
        return this.client.put<Customer>(`/customer/customer/${id}/`, data);
    }

    /** 部分更新客户 */
    async patch(id: number, data: Partial<CustomerFormData>): Promise<Customer> {
        return this.client.patch<Customer>(`/customer/customer/${id}/`, data);
    }

    /** 删除客户 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/customer/customer/${id}/`);
    }

    /** 获取客户地址列表 */
    async getAddresses(id: number, status?: string): Promise<CustomerAddress[]> {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        const result = await this.client.get<{ supplier?: unknown; quotations?: unknown; count: number } | CustomerAddress[]>(`/customer/customer/${id}/addresses/`, params);
        // 处理可能的嵌套响应格式
        if (Array.isArray(result)) {
            return result;
        }
        return [];
    }

    /** 获取客户报价列表 */
    async getQuotations(id: number, params?: {
        item_id?: number;
        is_preferred?: boolean;
        ordering?: string;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<CustomerQuotationBrief>> {
        const queryParams: Record<string, string> = {};
        if (params?.item_id) queryParams.item_id = params.item_id.toString();
        if (params?.is_preferred !== undefined) queryParams.is_preferred = String(params.is_preferred);
        if (params?.ordering) queryParams.ordering = params.ordering;
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        return this.client.get<PaginatedResponse<CustomerQuotationBrief>>(`/customer/customer/${id}/quotations/`, queryParams);
    }
}

// ========== Customer Address API 客户地址接口 ==========

export class CustomerAddressAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取地址列表 */
    async list(params?: {
        customer_id?: number;
        status?: string;
        is_default?: boolean;
    }): Promise<CustomerAddress[]> {
        const queryParams: Record<string, string> = {};
        if (params?.customer_id) queryParams.customer_id = params.customer_id.toString();
        if (params?.status) queryParams.status = params.status;
        if (params?.is_default !== undefined) queryParams.is_default = String(params.is_default);
        return this.client.get<CustomerAddress[]>('/customer/customer-address/', queryParams);
    }

    /** 获取单个地址详情 */
    async get(id: number): Promise<CustomerAddress> {
        return this.client.get<CustomerAddress>(`/customer/customer-address/${id}/`);
    }

    /** 创建地址 */
    async create(data: CustomerAddressFormData & { customer: number }): Promise<CustomerAddress> {
        return this.client.post<CustomerAddress>('/customer/customer-address/', data);
    }

    /** 更新地址 */
    async update(id: number, data: Partial<CustomerAddressFormData>): Promise<CustomerAddress> {
        return this.client.put<CustomerAddress>(`/customer/customer-address/${id}/`, data);
    }

    /** 删除地址 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/customer/customer-address/${id}/`);
    }
}

// ========== Customer Quotation API 客户报价接口 ==========

export class CustomerQuotationAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取客户报价列表 */
    async list(params?: {
        customer_id?: number;
        item_id?: number;
        sku?: string;
        is_preferred?: boolean;
        min_price?: number;
        max_price?: number;
        valid_date?: string;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<CustomerQuotation>> {
        const queryParams: Record<string, string> = {};
        if (params?.customer_id) queryParams.customer_id = params.customer_id.toString();
        if (params?.item_id) queryParams.item_id = params.item_id.toString();
        if (params?.sku) queryParams.sku = params.sku;
        if (params?.is_preferred !== undefined) queryParams.is_preferred = String(params.is_preferred);
        if (params?.min_price) queryParams.min_price = params.min_price.toString();
        if (params?.max_price) queryParams.max_price = params.max_price.toString();
        if (params?.valid_date) queryParams.valid_date = params.valid_date;
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        return this.client.get<PaginatedResponse<CustomerQuotation>>('/customer/customer-quotation/', queryParams);
    }

    /** 获取单个报价详情 */
    async get(id: number): Promise<CustomerQuotation> {
        return this.client.get<CustomerQuotation>(`/customer/customer-quotation/${id}/`);
    }

    /** 创建报价 */
    async create(data: CustomerQuotationCreateRequest): Promise<CustomerQuotation> {
        return this.client.post<CustomerQuotation>('/customer/customer-quotation/', data);
    }

    /** 更新报价 */
    async update(id: number, data: Partial<CustomerQuotationCreateRequest>): Promise<CustomerQuotation> {
        return this.client.put<CustomerQuotation>(`/customer/customer-quotation/${id}/`, data);
    }

    /** 部分更新报价 */
    async patch(id: number, data: Partial<CustomerQuotationCreateRequest>): Promise<CustomerQuotation> {
        return this.client.patch<CustomerQuotation>(`/customer/customer-quotation/${id}/`, data);
    }

    /** 删除报价 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/customer/customer-quotation/${id}/`);
    }

    /** 获取物品的所有客户报价 */
    async getByItem(itemId: number): Promise<{
        item_id: number;
        sku: string;
        name: string;
        quotations: CustomerQuotationBrief[];
        best_price: string | null;
        best_price_customer: string | null;
    }> {
        return this.client.get('/customer/customer-quotation/by_item/', { item_id: itemId.toString() });
    }

    /** 多客户报价对比 */
    async compare(itemId: number): Promise<{
        item_id: number;
        sku: string;
        name: string;
        quotations: CustomerQuotationBrief[];
        best_price: string | null;
        best_price_customer: string | null;
    }> {
        return this.client.get('/customer/customer-quotation/comparison/', { item_id: itemId.toString() });
    }
}

// API 实例导出
export const customerAPI = new CustomerAPI();
export const customerAddressAPI = new CustomerAddressAPI();
export const customerQuotationAPI = new CustomerQuotationAPI();

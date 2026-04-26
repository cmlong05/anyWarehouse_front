/**
 * 客户相关 API
 */
import { BaseAPI, BaseOrderAPI } from './base';
import { downloadPdf } from './pdf';
import type { 
    Customer,
    CustomerBrief,
    CustomerFormData,
    CustomerAddress,
    CustomerAddressFormData,
    CustomerQuotation,
    CustomerQuotationBrief,
    CustomerQuotationCreateRequest,
    SalesOrder,
    SalesOrderBrief,
    SalesOrderCreateRequest,
    SalesOrderUpdateRequest,
    SalesOrderItem,
    SalesOrderStatistics,
    SalesOrderSummary,
    SalesOrderPaymentRecord,
    SalesOrderPaymentRecordCreateRequest,
    ShipOrderRequest,
    SalesOrderPriority,
} from '$lib/index';
import type { PaginatedResponse, QueryParams } from './base';

// ========== Customer API ==========

export class CustomerAPI extends BaseAPI<Customer, CustomerFormData> {
    constructor() {
        super('/customer/customer/');
    }

    /** 获取客户简要列表 */
    async listBrief(): Promise<CustomerBrief[]> {
        return this.client.get<CustomerBrief[]>(`${this.basePath}brief/`);
    }

    /** 获取客户地址列表 */
    async getAddresses(id: number, status?: string): Promise<CustomerAddress[]> {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        const result = await this.client.get<CustomerAddress[]>(`${this.basePath}${id}/addresses/`, params);
        return Array.isArray(result) ? result : [];
    }

    /** 获取客户报价列表 */
    async getQuotations(id: number, itemId?: number): Promise<{ customer: CustomerBrief; quotations: CustomerQuotationBrief[]; count: number }> {
        const params: Record<string, string> = {};
        if (itemId) params.item_id = itemId.toString();
        return this.client.get(`${this.basePath}${id}/quotations/`, params);
    }

    /** 获取客户最近的销售订单 */
    async getRecentOrders(id: number): Promise<{ count: number; orders: SalesOrderBrief[] }> {
        return this.client.get<{ count: number; orders: SalesOrderBrief[] }>(`${this.basePath}${id}/recent_orders/`);
    }
}

// ========== Customer Address API ==========

export class CustomerAddressAPI extends BaseAPI<CustomerAddress, CustomerAddressFormData & { customer: number }> {
    constructor() {
        super('/customer/customer-address/');
    }

    /** 获取地址列表 */
    async listAddresses(params?: {
        customer_id?: number;
        status?: string;
        is_default?: boolean;
    }): Promise<CustomerAddress[]> {
        const queryParams: Record<string, string> = {};
        if (params?.customer_id) queryParams.customer_id = params.customer_id.toString();
        if (params?.status) queryParams.status = params.status;
        if (params?.is_default !== undefined) queryParams.is_default = String(params.is_default);
        const result = await this.client.get<CustomerAddress[] | PaginatedResponse<CustomerAddress>>(this.basePath, queryParams);
        return Array.isArray(result) ? result : result.results ?? [];
    }
}

// ========== Customer Quotation API ==========

export class CustomerQuotationAPI extends BaseAPI<CustomerQuotation, CustomerQuotationCreateRequest> {
    constructor() {
        super('/customer/customer-quotation/');
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
        return this.client.get(`${this.basePath}by_item/`, { item_id: itemId.toString() });
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
        return this.client.get(`${this.basePath}comparison/`, { item_id: itemId.toString() });
    }
}

// ========== Sales Order API ==========

export class SalesOrderAPI extends BaseOrderAPI<
    SalesOrder,
    SalesOrderCreateRequest,
    SalesOrderUpdateRequest,
    SalesOrderItem,
    SalesOrderStatistics,
    SalesOrderSummary
> {
    constructor() {
        super('/customer/sales-orders/');
    }

    /** 获取销售订单列表 */
    async listBrief(params?: {
        customer_id?: number;
        status?: string;
        priority?: SalesOrderPriority;
        order_number?: string;
        date_from?: string;
        date_to?: string;
        delivery_from?: string;
        delivery_to?: string;
        min_amount?: number;
        max_amount?: number;
        exclude_delivered_paid?: string;
        ordering?: string;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<SalesOrderBrief>> {
        return this.client.get<PaginatedResponse<SalesOrderBrief>>(this.basePath, this.buildQueryParams(params as QueryParams));
    }

    /** 订单发货 */
    async ship(orderId: number, data: ShipOrderRequest): Promise<SalesOrder> {
        return this.client.post<SalesOrder>(`${this.basePath}${orderId}/ship/`, data);
    }

    /**
     * 根据发货单明细同步订单行数量。
     *
     * @param orderId 订单ID
     * @param options allowDecrease: 是否允许减少（仅当发货数量低于订单数量时才生效）
     *                sku: 仅同步指定 SKU 的明细
     */
    async syncQuantities(orderId: number, options?: { allowDecrease?: boolean; sku?: string }): Promise<{
        status: string;
        message: string;
        updated_items: { sku: string; old_qty: string; new_qty: string }[];
    }> {
        const body: Record<string, any> = {};
        if (options?.allowDecrease) body.allow_decrease = true;
        if (options?.sku) body.sku = options.sku;
        return this.client.post(`${this.basePath}${orderId}/sync_quantities/`, body);
    }

    /** 按客户统计 */
    async getByCustomer(customerId: number): Promise<{
        total_orders: number;
        orders_by_status: Record<string, { name: string; count: number; total_amount: string }>;
        total_amount: string;
    }> {
        return this.client.get(`${this.basePath}by_customer/`, { customer_id: customerId.toString() });
    }

    /** 下载 Proforma Invoice PDF（服务端生成，跨浏览器一致） */
    async downloadPI(orderId: number, locale = 'en', orderNumber: string): Promise<void> {
        await this._downloadPDF(`${this.basePath}${orderId}/pi/?locale=${locale}`, `PROFORMA-INVOICE-${orderNumber}.pdf`);
    }

    /** 下载 Invoice PDF（服务端生成，跨浏览器一致） */
    async downloadInvoice(orderId: number, locale = 'en', orderNumber: string): Promise<void> {
        await this._downloadPDF(`${this.basePath}${orderId}/invoice/?locale=${locale}`, `INVOICE-${orderNumber}.pdf`);
    }

    /** 下载 SKU 对照表 PDF（服务端生成，跨浏览器一致） */
    async downloadSkuReference(orderId: number, locale = 'en', orderNumber: string): Promise<void> {
        await this._downloadPDF(`${this.basePath}${orderId}/sku_reference/?locale=${locale}`, `SKU-REFERENCE-${orderNumber}.pdf`);
    }

    private async _downloadPDF(path: string, filename: string): Promise<void> {
        await downloadPdf(path, filename);
    }
}

// ========== Sales Order Item API ==========

export class SalesOrderItemAPI extends BaseAPI<SalesOrderItem, unknown> {
    constructor() {
        super('/customer/sales-order-items/');
    }

    /** 获取待发货明细 */
    async getPending(): Promise<PaginatedResponse<SalesOrderItem>> {
        return this.client.get<PaginatedResponse<SalesOrderItem>>(`${this.basePath}pending/`);
    }
}

// ========== Sales Order Payment Record API ==========

export class SalesOrderPaymentRecordAPI extends BaseAPI<
    SalesOrderPaymentRecord,
    SalesOrderPaymentRecordCreateRequest,
    Partial<SalesOrderPaymentRecordCreateRequest>
> {
    constructor() {
        super('/customer/sales-order-payment-records/');
    }

    async listByOrder(orderId: number): Promise<PaginatedResponse<SalesOrderPaymentRecord>> {
        return this.client.get<PaginatedResponse<SalesOrderPaymentRecord>>(this.basePath, { sales_order: orderId.toString() });
    }

    async create(data: SalesOrderPaymentRecordCreateRequest): Promise<SalesOrderPaymentRecord> {
        return this.client.post<SalesOrderPaymentRecord>(this.basePath, this.toFormData(data), true);
    }

    async update(id: number, data: Partial<SalesOrderPaymentRecordCreateRequest>): Promise<SalesOrderPaymentRecord> {
        return this.client.put<SalesOrderPaymentRecord>(`${this.basePath}${id}/`, this.toFormData(data), true);
    }

    async patch(id: number, data: Partial<SalesOrderPaymentRecordCreateRequest>): Promise<SalesOrderPaymentRecord> {
        return this.client.patch<SalesOrderPaymentRecord>(`${this.basePath}${id}/`, this.toFormData(data), true);
    }

    private toFormData(data: Partial<SalesOrderPaymentRecordCreateRequest>): FormData {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            if (key === 'attachment' && value instanceof File) {
                formData.append(key, value);
                return;
            }
            formData.append(key, String(value));
        });
        return formData;
    }
}

// ========== 导出 API 实例 ==========

export const customerAPI = new CustomerAPI();
export const customerAddressAPI = new CustomerAddressAPI();
export const customerQuotationAPI = new CustomerQuotationAPI();
export const salesOrderAPI = new SalesOrderAPI();
export const salesOrderItemAPI = new SalesOrderItemAPI();
export const salesOrderPaymentRecordAPI = new SalesOrderPaymentRecordAPI();

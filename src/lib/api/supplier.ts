/**
 * 供应商相关 API
 */
import { BaseAPI, BaseOrderAPI } from './base';
import { downloadPdf } from './pdf';
import type { 
    Supplier, 
    SupplierBrief, 
    SupplierCreateRequest,
    SupplierWithQuotations,
    Quotation,
    QuotationBrief,
    QuotationCreateRequest,
    QuotationComparisonItem,
    PurchaseOrder,
    PurchaseOrderBrief,
    PurchaseOrderCreateRequest,
    PurchaseOrderUpdateRequest,
    PurchaseOrderItem,
    PurchaseOrderStatistics,
    PurchaseOrderSummary,
    ReceiveOrderRequest,
    PurchaseOrderPriority,
} from '$lib/index';
import type { PaginatedResponse, QueryParams } from './base';

// ========== Supplier API ==========

export class SupplierAPI extends BaseAPI<Supplier, SupplierCreateRequest> {
    constructor() {
        super('/supplier/suppliers/');
    }

    /** 获取供应商简要列表 */
    async listBrief(): Promise<SupplierBrief[]> {
        return this.client.get<SupplierBrief[]>(`${this.basePath}brief/`);
    }

    /** 获取供应商及其报价 */
    async getWithQuotations(id: number): Promise<SupplierWithQuotations> {
        return this.client.get<SupplierWithQuotations>(`${this.basePath}${id}/?with_quotations=true`);
    }

    /** 获取供应商的所有报价 */
    async getQuotations(id: number, itemId?: number): Promise<{ supplier: SupplierBrief; quotations: QuotationBrief[]; count: number }> {
        const params: Record<string, string> = {};
        if (itemId) params.item_id = itemId.toString();
        return this.client.get(`${this.basePath}${id}/quotations/`, params);
    }

    /** 获取供应商最近的采购订单 */
    async getRecentOrders(id: number): Promise<{ count: number; orders: PurchaseOrderBrief[] }> {
        return this.client.get<{ count: number; orders: PurchaseOrderBrief[] }>(`${this.basePath}${id}/recent_orders/`);
    }
}

// ========== Quotation API ==========

export class QuotationAPI extends BaseAPI<Quotation, QuotationCreateRequest> {
    constructor() {
        super('/supplier/quotations/');
    }

    /** 获取物品的所有报价 */
    async getByItem(itemId: number): Promise<{
        item_id: number;
        quotations: QuotationBrief[];
        count: number;
        best_price: { price: string; supplier: string; quotation_id: number } | null;
    }> {
        return this.client.get(`${this.basePath}by_item/`, { item_id: itemId.toString() });
    }

    /** 多供应商报价对比 */
    async compare(itemIds: number[]): Promise<{ comparisons: QuotationComparisonItem[]; total_items: number }> {
        return this.client.get(`${this.basePath}compare/`, { item_ids: itemIds.join(',') });
    }

    /** 设置/取消首选报价 */
    async setPreferred(id: number, isPreferred: boolean = true): Promise<Quotation> {
        return this.client.post<Quotation>(`${this.basePath}${id}/set_preferred/`, { is_preferred: isPreferred });
    }
}

// ========== Purchase Order API ==========

export class PurchaseOrderAPI extends BaseOrderAPI<
    PurchaseOrder,
    PurchaseOrderCreateRequest,
    PurchaseOrderUpdateRequest,
    PurchaseOrderItem,
    PurchaseOrderStatistics,
    PurchaseOrderSummary
> {
    constructor() {
        super('/supplier/purchase-orders/');
    }

    /** 获取采购订单列表 */
    async listBrief(params?: {
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
        return this.client.get<PaginatedResponse<PurchaseOrderBrief>>(this.basePath, this.buildQueryParams(params as QueryParams));
    }

    /** 订单收货 */
    async receive(orderId: number, data: ReceiveOrderRequest): Promise<PurchaseOrder> {
        return this.client.post<PurchaseOrder>(`${this.basePath}${orderId}/receive/`, data);
    }

    /** 按供应商统计 */
    async getBySupplier(supplierId: number): Promise<{
        total_orders: number;
        orders_by_status: Record<string, { name: string; count: number; total_amount: string }>;
        total_amount: string;
    }> {
        return this.client.get(`${this.basePath}by_supplier/`, { supplier_id: supplierId.toString() });
    }

    /** 下载采购单 PDF（服务端生成，跨浏览器一致） */
    async downloadPO(orderId: number, locale = 'zh-CN', orderNumber: string): Promise<void> {
        await this._downloadPDF(`${this.basePath}${orderId}/po/?locale=${locale}`, `PURCHASE-ORDER-${orderNumber}.pdf`);
    }

    /** 下载 SKU 对照表 PDF（服务端生成，跨浏览器一致） */
    async downloadSkuReference(orderId: number, locale = 'zh-CN', orderNumber: string): Promise<void> {
        await this._downloadPDF(`${this.basePath}${orderId}/sku_reference/?locale=${locale}`, `SKU-REFERENCE-${orderNumber}.pdf`);
    }

    private async _downloadPDF(path: string, filename: string): Promise<void> {
        await downloadPdf(path, filename);
    }
}

// ========== Purchase Order Item API ==========

export class PurchaseOrderItemAPI extends BaseAPI<PurchaseOrderItem, unknown> {
    constructor() {
        super('/supplier/purchase-order-items/');
    }

    /** 获取待收货明细 */
    async getPending(): Promise<PaginatedResponse<PurchaseOrderItem>> {
        return this.client.get<PaginatedResponse<PurchaseOrderItem>>(`${this.basePath}pending/`);
    }
}


// ========== Purchase Order Payment Record API ==========

export class PurchaseOrderPaymentRecordAPI extends BaseAPI<any, any, Partial<any>> {
    constructor() {
        super('/supplier/purchase-order-payment-records/');
    }

    async listByOrder(orderId: number): Promise<PaginatedResponse<any>> {
        return this.client.get<PaginatedResponse<any>>(this.basePath, { purchase_order: orderId.toString() });
    }

    async create(data: any): Promise<any> {
        return this.client.post<any>(this.basePath, this.toFormData(data), true);
    }

    async update(id: number, data: Partial<any>): Promise<any> {
        return this.client.put<any>(`${this.basePath}${id}/`, this.toFormData(data), true);
    }

    async patch(id: number, data: Partial<any>): Promise<any> {
        return this.client.patch<any>(`${this.basePath}${id}/`, this.toFormData(data), true);
    }

    async delete(id: number): Promise<void> {
        return this.client.delete(`${this.basePath}${id}/`);
    }

    private toFormData(data: Partial<any>): FormData {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
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

export const supplierAPI = new SupplierAPI();
export const quotationAPI = new QuotationAPI();
export const purchaseOrderAPI = new PurchaseOrderAPI();
export const purchaseOrderItemAPI = new PurchaseOrderItemAPI();
export const purchaseOrderPaymentRecordAPI = new PurchaseOrderPaymentRecordAPI();

/**
 * 发货相关 API
 */
import { BaseAPI } from './base';
import type { 
    TrackingNumber,
    TrackingNumberBrief,
    TrackingNumberCreateRequest,
    LogisticsStatus,
    Shipment,
    ShipmentBrief,
    ShipmentCreateRequest,
    ShipmentUpdateRequest,
    ShipmentConfirmRequest,
    ShipmentPackRequest,
    ShipmentShipRequest,
    SyncItemsResponse,
    ShipmentFilters,
    ShipmentItem,
    ShipmentItemCreateRequest,
    Package,
    PackageBrief,
    PackageCreateRequest,
    PackageUpdateRequest,
    PackageItem,
    PackageItemCreateRequest,
} from '$lib/shipmentTypes';
import type { PaginatedResponse } from './base';

// ========== Tracking Number API ==========

export class TrackingNumberAPI extends BaseAPI<TrackingNumber, TrackingNumberCreateRequest> {
    constructor() {
        super('/customer/tracking-numbers/');
    }

    /** 按物流状态筛选 */
    async listByLogisticsStatus(status: LogisticsStatus): Promise<PaginatedResponse<TrackingNumber>> {
        return this.list({ logistics_status: status });
    }

    /** 手动触发单个快递单号物流同步 */
    async sync(id: number): Promise<{ result: { status: string; message?: string }; tracking: TrackingNumber }> {
        return this.client.post(`${this.basePath}${id}/sync/`, {});
    }

    /** 手动触发单个快递单号向 Shippo 注册 */
    async register(id: number): Promise<{ result: { status: string; message?: string }; tracking: TrackingNumber }> {
        return this.client.post(`${this.basePath}${id}/register/`, {});
    }

    /** 批量创建 */
    async batchCreate(data: TrackingNumberCreateRequest[]): Promise<TrackingNumber[]> {
        return this.client.post<TrackingNumber[]>(`${this.basePath}batch_create/`, { items: data });
    }

    /** 获取下一个可用单号（未关联包裹的单号） */
    async getNextAvailable(carrierCode?: string): Promise<TrackingNumber | null> {
        const params: Record<string, string> = { logistics_status: 'pending' };
        if (carrierCode) params.carrier_code = carrierCode;
        const result = await this.list(params);
        return result.results[0] || null;
    }

    /** 获取可用快递单号列表（未关联包裹且未作废） */
    async listAvailable(): Promise<TrackingNumberBrief[]> {
        return this.client.get<TrackingNumberBrief[]>(`${this.basePath}available/`);
    }

    /** 验证系统中是否存在手动输入的快递单号 */
    async lookup(trackingNo: string): Promise<TrackingNumberBrief> {
        return this.client.get<TrackingNumberBrief>(`${this.basePath}lookup-by-number/`, {
            tracking_no: trackingNo,
        });
    }
}

// ========== Shipment API ==========

export class ShipmentAPI extends BaseAPI<Shipment, ShipmentCreateRequest, ShipmentUpdateRequest> {
    constructor() {
        super('/customer/shipments/');
    }

    /** 获取列表 */
    async listBrief(filters?: ShipmentFilters): Promise<PaginatedResponse<ShipmentBrief>> {
        const params: Record<string, string> = {};
        if (filters?.search) params.search = filters.search;
        if (filters?.status) params.status = filters.status;
        if (filters?.ordering) params.ordering = filters.ordering;
        if (filters?.page) params.page = filters.page.toString();
        if (filters?.page_size) params.page_size = filters.page_size.toString();
        return this.client.get<PaginatedResponse<ShipmentBrief>>(this.basePath, params);
    }

    /** 按订单查询发货 */
    async getByOrder(orderId: number): Promise<{ order_id: number; order_number: string; shipments: Array<{
        shipment_id: number;
        tracking_no?: string;
        carrier_name?: string;
        shipment_status: string;
        total_quantity: string;
        created_at: string;
    }> }> {
        return this.client.get(`${this.basePath}by_order/`, { order_id: orderId.toString() });
    }

    /** 确认发货单 */
    async confirm(id: number, data?: ShipmentConfirmRequest): Promise<Shipment> {
        return this.client.post<Shipment>(`${this.basePath}${id}/confirm/`, data || {});
    }

    /** 打包发货单 */
    async pack(id: number, data?: ShipmentPackRequest): Promise<Shipment> {
        return this.client.post<Shipment>(`${this.basePath}${id}/pack/`, data || {});
    }

    /** 发货 */
    async ship(id: number, data?: ShipmentShipRequest): Promise<Shipment> {
        return this.client.post<Shipment>(`${this.basePath}${id}/ship/`, data || {});
    }

    /** 签收 */
    async deliver(id: number): Promise<Shipment> {
        return this.client.post<Shipment>(`${this.basePath}${id}/deliver/`, {});
    }

    /** 取消发货单 */
    async cancel(id: number, reason?: string): Promise<Shipment> {
        return this.client.post<Shipment>(`${this.basePath}${id}/cancel/`, { reason });
    }

    /** 同步发货明细 */
    async syncItems(id: number): Promise<SyncItemsResponse> {
        return this.client.post<SyncItemsResponse>(`${this.basePath}${id}/sync_items/`, {});
    }
}

// ========== Package API ==========

export class PackageAPI extends BaseAPI<Package, PackageCreateRequest, PackageUpdateRequest> {
    constructor() {
        super('/customer/packages/');
    }

    /** 按发货单查询包裹 */
    async getByShipment(shipmentId: number): Promise<PackageBrief[]> {
        return this.client.get<PackageBrief[]>(`${this.basePath}by_shipment/`, { shipment_id: shipmentId.toString() });
    }

    /** 装箱 */
    async packItem(packageId: number, itemData: {
        shipment_item?: number;
        order?: number;
        sku?: string;
        quantity?: number;
        product_name?: string;
        item?: number;
        notes?: string;
    }): Promise<Package> {
        return this.client.post<Package>(`${this.basePath}${packageId}/pack_item/`, itemData);
    }

    /** 拆箱 */
    async unpackItem(packageId: number, itemId: number): Promise<Package> {
        return this.client.post<Package>(`${this.basePath}${packageId}/unpack_item/`, { item_id: itemId });
    }

    /** 标记为已发货 */
    async markShipped(packageId: number): Promise<Package> {
        return this.client.post<Package>(`${this.basePath}${packageId}/mark_shipped/`, {});
    }

    /** 获取包裹列表（兼容旧版 API） */
    async getList(params?: {
        search?: string;
        shipment_id?: number;
        page?: number;
        page_size?: number;
        ordering?: string;
    }): Promise<PaginatedResponse<Package>> {
        const queryParams: Record<string, string> = {};
        if (params?.search) queryParams.search = params.search;
        if (params?.shipment_id) queryParams.shipment_id = params.shipment_id.toString();
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        if (params?.ordering) queryParams.ordering = params.ordering;
        return this.list(queryParams);
    }

    /** 将已有包裹关联到发货单 */
    async addToShipment(packageId: number, shipmentId: number): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`${this.basePath}${packageId}/add_to_shipment/`, { shipment_id: shipmentId });
    }

    /** 封箱 */
    async seal(packageId: number): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`${this.basePath}${packageId}/seal/`, {});
    }

    /** 开箱 */
    async unseal(packageId: number): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`${this.basePath}${packageId}/unseal/`, {});
    }

    async assignTracking(packageId: number, trackingNumberId: number | null): Promise<Package> {
        return this.client.patch<Package>(`${this.basePath}${packageId}/`, { tracking_number: trackingNumberId });
    }
}

// ========== Shipment Item API ==========

export class ShipmentItemAPI extends BaseAPI<ShipmentItem, ShipmentItemCreateRequest> {
    constructor() {
        super('/customer/shipment-items/');
    }

    /** 同步单条发货明细计划数量 */
    async sync(id: number): Promise<ShipmentItem> {
        return this.client.post<ShipmentItem>(`${this.basePath}${id}/sync/`, {});
    }
}

// ========== Package Item API ==========

export class PackageItemAPI extends BaseAPI<PackageItem, PackageItemCreateRequest> {
    constructor() {
        super('/customer/package-items/');
    }
}

// ========== 导出 API 实例 ==========

export const trackingNumberAPI = new TrackingNumberAPI();
export const shipmentAPI = new ShipmentAPI();
export const packageAPI = new PackageAPI();
export const shipmentItemAPI = new ShipmentItemAPI();
export const packageItemAPI = new PackageItemAPI();

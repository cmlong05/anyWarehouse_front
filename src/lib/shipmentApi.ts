import { apiClient } from './api';
import type { PaginatedResponse } from './index';
import type {
    TrackingNumber,
    TrackingNumberBrief,
    TrackingNumberCreateRequest,
    TrackingNumberOrdersResponse,
    Shipment,
    ShipmentCreateRequest,
    ShipmentUpdateRequest,
    ShipmentConfirmRequest,
    ShipmentPackRequest,
    ShipmentShipRequest,
    ShipmentItem,
    ShipmentItemCreateRequest,
    Package,
    PackageCreateRequest,
    PackageUpdateRequest,
    PackageItem,
    PackageItemCreateRequest,
    OrderShipmentResponse,
    ShipmentFilters,
} from './shipmentTypes';

// ========== Tracking Number API 快递单号接口 ==========

export class TrackingNumberAPI {
    private client = apiClient;

    /** 获取快递单号列表 */
    async list(params?: {
        status?: string;
        carrier_code?: string;
        search?: string;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<TrackingNumber>> {
        const queryParams: Record<string, string> = {};
        if (params?.status) queryParams.status = params.status;
        if (params?.carrier_code) queryParams.carrier_code = params.carrier_code;
        if (params?.search) queryParams.search = params.search;
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        const response = await this.client.get<TrackingNumber[] | PaginatedResponse<TrackingNumber>>('/customer/tracking-numbers/', queryParams);
        if (Array.isArray(response)) {
            return { count: response.length, next: null, previous: null, results: response };
        }
        return response;
    }

    /** 获取可用快递单号列表 */
    async listAvailable(): Promise<TrackingNumberBrief[]> {
        return this.client.get<TrackingNumberBrief[]>('/customer/tracking-numbers/available/');
    }

    /** 获取单个快递单号详情 */
    async get(id: number): Promise<TrackingNumber> {
        return this.client.get<TrackingNumber>(`/customer/tracking-numbers/${id}/`);
    }

    /** 创建快递单号 */
    async create(data: TrackingNumberCreateRequest): Promise<TrackingNumber> {
        return this.client.post<TrackingNumber>('/customer/tracking-numbers/', data);
    }

    /** 更新快递单号 */
    async update(id: number, data: Partial<TrackingNumberCreateRequest>): Promise<TrackingNumber> {
        return this.client.put<TrackingNumber>(`/customer/tracking-numbers/${id}/`, data);
    }

    /** 删除快递单号 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/customer/tracking-numbers/${id}/`);
    }

    /** 预留快递单号 */
    async reserve(id: number): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`/customer/tracking-numbers/${id}/reserve/`);
    }

    /** 释放快递单号 */
    async release(id: number): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`/customer/tracking-numbers/${id}/release/`);
    }

    /** 查询快递单号关联的所有订单 */
    async getOrders(id: number): Promise<TrackingNumberOrdersResponse> {
        return this.client.get<TrackingNumberOrdersResponse>(`/customer/tracking-numbers/${id}/orders/`);
    }
}

// ========== Shipment API 发货单接口 ==========

export class ShipmentAPI {
    private client = apiClient;

    /** 获取发货单列表 */
    async list(params?: ShipmentFilters): Promise<PaginatedResponse<Shipment>> {
        const queryParams: Record<string, string> = {};
        if (params?.status) queryParams.status = params.status;
        if (params?.search) queryParams.search = params.search;
        if (params?.ordering) queryParams.ordering = params.ordering;
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        const response = await this.client.get<Shipment[] | PaginatedResponse<Shipment>>('/customer/shipments/', queryParams);
        if (Array.isArray(response)) {
            return { count: response.length, next: null, previous: null, results: response };
        }
        return response;
    }

    /** 获取单个发货单详情 */
    async get(id: number): Promise<Shipment> {
        return this.client.get<Shipment>(`/customer/shipments/${id}/`);
    }

    /** 创建发货单 */
    async create(data: ShipmentCreateRequest): Promise<Shipment> {
        return this.client.post<Shipment>('/customer/shipments/', data);
    }

    /** 更新发货单 */
    async update(id: number, data: ShipmentUpdateRequest): Promise<Shipment> {
        return this.client.put<Shipment>(`/customer/shipments/${id}/`, data);
    }

    /** 删除发货单 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/customer/shipments/${id}/`);
    }

    /** 确认发货单 */
    async confirm(id: number, data?: ShipmentConfirmRequest): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`/customer/shipments/${id}/confirm/`, data || {});
    }

    /** 标记为已打包 */
    async pack(id: number, data?: ShipmentPackRequest): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`/customer/shipments/${id}/pack/`, data || {});
    }

    /** 标记为已发货 */
    async ship(id: number, data?: ShipmentShipRequest): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`/customer/shipments/${id}/ship/`, data || {});
    }

    /** 标记为已签收 */
    async deliver(id: number): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`/customer/shipments/${id}/deliver/`);
    }

    /** 取消发货单 */
    async cancel(id: number): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`/customer/shipments/${id}/cancel/`);
    }

    /** 同步发货明细（根据实际装箱更新） */
    async syncItems(id: number): Promise<{ status: string; message: string; items: any[] }> {
        return this.client.post<{ status: string; message: string; items: any[] }>(`/customer/shipments/${id}/sync_items/`);
    }

    /** 拆单：将剩余数量拆分到新发货单 */
    async split(id: number, data?: { new_shipment_no?: string; reason?: string }): Promise<{ status: string; message: string; new_shipment: any }> {
        return this.client.post<{ status: string; message: string; new_shipment: any }>(`/customer/shipments/${id}/split/`, data || {});
    }

    /** 获取发货单下的所有包裹及明细 */
    async getPackagesDetail(id: number): Promise<Package[]> {
        return this.client.get<Package[]>(`/customer/shipments/${id}/packages_detail/`);
    }

    /** 按订单查询发货 */
    async getByOrder(orderId?: number, orderNumber?: string): Promise<OrderShipmentResponse> {
        const params: Record<string, string> = {};
        if (orderId) params.order_id = orderId.toString();
        if (orderNumber) params.order_number = orderNumber;
        return this.client.get<OrderShipmentResponse>('/customer/shipments/by_order/', params);
    }
}

// ========== Shipment Item API 发货明细接口 ==========

export class ShipmentItemAPI {
    private client = apiClient;

    /** 获取发货明细列表 */
    async list(params?: {
        shipment_id?: number;
        order_id?: number;
        sku?: string;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<ShipmentItem>> {
        const queryParams: Record<string, string> = {};
        if (params?.shipment_id) queryParams.shipment_id = params.shipment_id.toString();
        if (params?.order_id) queryParams.order_id = params.order_id.toString();
        if (params?.sku) queryParams.sku = params.sku;
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        const response = await this.client.get<ShipmentItem[] | PaginatedResponse<ShipmentItem>>('/customer/shipment-items/', queryParams);
        if (Array.isArray(response)) {
            return { count: response.length, next: null, previous: null, results: response };
        }
        return response;
    }

    /** 获取单个发货明细详情 */
    async get(id: number): Promise<ShipmentItem> {
        return this.client.get<ShipmentItem>(`/customer/shipment-items/${id}/`);
    }

    /** 创建发货明细 */
    async create(data: ShipmentItemCreateRequest & { shipment: number }): Promise<ShipmentItem> {
        return this.client.post<ShipmentItem>('/customer/shipment-items/', data);
    }

    /** 更新发货明细 */
    async update(id: number, data: Partial<ShipmentItemCreateRequest>): Promise<ShipmentItem> {
        return this.client.put<ShipmentItem>(`/customer/shipment-items/${id}/`, data);
    }

    /** 部分更新发货明细 */
    async patch(id: number, data: Partial<ShipmentItemCreateRequest>): Promise<ShipmentItem> {
        return this.client.patch<ShipmentItem>(`/customer/shipment-items/${id}/`, data);
    }

    /** 删除发货明细 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/customer/shipment-items/${id}/`);
    }
}

// ========== Package API 包裹接口 ==========

export class PackageAPI {
    private client = apiClient;

    /** 获取包裹列表 */
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
        const response = await this.client.get<Package[] | PaginatedResponse<Package>>('/customer/packages/', queryParams);
        if (Array.isArray(response)) {
            return { count: response.length, next: null, previous: null, results: response };
        }
        return response;
    }

    /** 获取单个包裹详情 */
    async get(id: number): Promise<Package> {
        return this.client.get<Package>(`/customer/packages/${id}/`);
    }

    /** 创建包裹 */
    async create(data: PackageCreateRequest): Promise<Package> {
        return this.client.post<Package>('/customer/packages/', data);
    }

    /** 更新包裹 */
    async update(id: number, data: PackageUpdateRequest): Promise<Package> {
        return this.client.put<Package>(`/customer/packages/${id}/`, data);
    }

    /** 删除包裹 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/customer/packages/${id}/`);
    }

    /** 向包裹中添加明细 */
    async addItem(id: number, data: PackageItemCreateRequest): Promise<PackageItem> {
        return this.client.post<PackageItem>(`/customer/packages/${id}/add_item/`, data);
    }

    /** 从包裹中移除明细 */
    async removeItem(id: number, itemId: number): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`/customer/packages/${id}/remove_item/`, { item_id: itemId });
    }

    /** 将已有包裹关联到发货单 */
    async addToShipment(packageId: number, shipmentId: number): Promise<{ status: string; message: string }> {
        return this.client.post<{ status: string; message: string }>(`/customer/packages/${packageId}/add_to_shipment/`, { shipment_id: shipmentId });
    }
}

// ========== Package Item API 包裹明细接口 ==========

export class PackageItemAPI {
    private client = apiClient;

    /** 获取包裹明细列表 */
    async list(params?: {
        package_id?: number;
        shipment_item_id?: number;
        page?: number;
        page_size?: number;
    }): Promise<PaginatedResponse<PackageItem>> {
        const queryParams: Record<string, string> = {};
        if (params?.package_id) queryParams.package_id = params.package_id.toString();
        if (params?.shipment_item_id) queryParams.shipment_item_id = params.shipment_item_id.toString();
        if (params?.page) queryParams.page = params.page.toString();
        if (params?.page_size) queryParams.page_size = params.page_size.toString();
        const response = await this.client.get<PackageItem[] | PaginatedResponse<PackageItem>>('/customer/package-items/', queryParams);
        if (Array.isArray(response)) {
            return { count: response.length, next: null, previous: null, results: response };
        }
        return response;
    }

    /** 获取单个包裹明细详情 */
    async get(id: number): Promise<PackageItem> {
        return this.client.get<PackageItem>(`/customer/package-items/${id}/`);
    }

    /** 创建包裹明细 */
    async create(data: PackageItemCreateRequest & { package: number }): Promise<PackageItem> {
        return this.client.post<PackageItem>('/customer/package-items/', data);
    }

    /** 更新包裹明细 */
    async update(id: number, data: Partial<PackageItemCreateRequest>): Promise<PackageItem> {
        return this.client.put<PackageItem>(`/customer/package-items/${id}/`, data);
    }

    /** 部分更新包裹明细 */
    async patch(id: number, data: Partial<PackageItemCreateRequest>): Promise<PackageItem> {
        return this.client.patch<PackageItem>(`/customer/package-items/${id}/`, data);
    }

    /** 删除包裹明细 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/customer/package-items/${id}/`);
    }
}

// API 实例导出
export const trackingNumberAPI = new TrackingNumberAPI();
export const shipmentAPI = new ShipmentAPI();
export const shipmentItemAPI = new ShipmentItemAPI();
export const packageAPI = new PackageAPI();
export const packageItemAPI = new PackageItemAPI();

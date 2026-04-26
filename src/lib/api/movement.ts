/**
 * 出入库记录 (InventoryMovement) API
 */
import { BaseAPI, type PaginatedResponse, type QueryParams } from './base';
import { apiClient } from './client';

export type MovementType = 'inbound' | 'outbound' | 'transfer';

export interface AvailableStorage {
    storage_id: number;
    container_id: number;
    container_code: string;
    container_mark: string;
    container_path: string;
    quantity: number;
}

export interface AvailableStoragesResponse {
    item_id: number;
    total_available: number;
    storages: AvailableStorage[];
}

export async function getAvailableStoragesForItem(itemId: number): Promise<AvailableStoragesResponse> {
    return apiClient.get<AvailableStoragesResponse>(
        '/warehouse/storage/available-by-item/',
        { item_id: String(itemId) }
    );
}

export interface InventoryMovement {
    id: number;
    movement_no: string;
    movement_type: MovementType;
    movement_type_display: string;
    item: number;
    item_sku: string;
    item_name: string;
    quantity: number;
    from_container: number | null;
    to_container: number | null;
    from_container_code: string | null;
    to_container_code: string | null;
    quantity_before_from: number | null;
    quantity_after_from: number | null;
    quantity_before_to: number | null;
    quantity_after_to: number | null;
    reason: string;
    notes: string;
    purchase_order: number | null;
    purchase_order_no: string | null;
    sales_order: number | null;
    sales_order_no: string | null;
    shipment: number | null;
    shipment_no: string | null;
    created_by: string;
    created_at: string;
}

export interface InventoryMovementCreateRequest {
    movement_type: MovementType;
    item: number;
    quantity: number;
    from_container?: number | null;
    to_container?: number | null;
    reason?: string;
    notes?: string;
    purchase_order?: number | null;
    sales_order?: number | null;
    shipment?: number | null;
    created_by?: string;
}

export interface MovementSummary {
    total_count: number;
    by_type: Array<{
        movement_type: MovementType;
        count: number;
        total_quantity: number;
    }>;
}

export interface MovementFilters extends QueryParams {
    item?: number;
    container?: number;
    movement_type?: MovementType;
    purchase_order?: number;
    sales_order?: number;
    shipment?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
}

export class InventoryMovementAPI extends BaseAPI<InventoryMovement, InventoryMovementCreateRequest> {
    constructor() {
        super('/warehouse/movements/');
    }

    async listFiltered(filters?: MovementFilters): Promise<PaginatedResponse<InventoryMovement>> {
        return this.list(filters);
    }

    async summary(filters?: MovementFilters): Promise<MovementSummary> {
        return this.client.get<MovementSummary>(
            `${this.basePath}summary/`,
            this.buildQueryParams(filters)
        );
    }
}

export const inventoryMovementAPI = new InventoryMovementAPI();

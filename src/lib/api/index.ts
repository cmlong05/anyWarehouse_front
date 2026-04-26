/**
 * API 导出
 * 
 * 提供统一的方式导入所有 API 相关功能
 */

// 导出基础类
export { 
    BaseAPI, 
    BaseOrderAPI, 
    type PaginatedResponse, 
    type QueryParams 
} from './base';

// 导出 HTTP 客户端
export { 
    ApiClient, 
    apiClient, 
    type ApiError 
} from './client';

// 导出供应商相关 API
export {
    SupplierAPI,
    QuotationAPI,
    PurchaseOrderAPI,
    PurchaseOrderItemAPI,
    supplierAPI,
    quotationAPI,
    purchaseOrderAPI,
    purchaseOrderItemAPI,
} from './supplier';

// 导出客户相关 API
export {
    CustomerAPI,
    CustomerAddressAPI,
    CustomerQuotationAPI,
    SalesOrderAPI,
    SalesOrderItemAPI,
    SalesOrderPaymentRecordAPI,
    customerAPI,
    customerAddressAPI,
    customerQuotationAPI,
    salesOrderAPI,
    salesOrderItemAPI,
    salesOrderPaymentRecordAPI,
} from './customer';

// 导出产品相关 API
export {
    ItemAPI,
    ComponentAPI,
    ItemBOMAPI,
    itemAPI,
    componentAPI,
    itemBOMAPI,
} from './product';

// 导出发货相关 API
export {
    TrackingNumberAPI,
    ShipmentAPI,
    PackageAPI,
    ShipmentItemAPI,
    PackageItemAPI,
    PackageTrackingLegAPI,
    trackingNumberAPI,
    shipmentAPI,
    packageAPI,
    shipmentItemAPI,
    packageItemAPI,
    packageTrackingLegAPI,
} from './shipment';

// 导出系统设置 API
export {
    SystemSettingAPI,
    systemSettingAPI,
    type SystemSettingResponse,
    type PIDefaults,
    type SystemSettingUpdateRequest,
} from './settings';

// 导出出入库记录 API
export {
    InventoryMovementAPI,
    inventoryMovementAPI,
    type InventoryMovement,
    type InventoryMovementCreateRequest,
    type MovementType,
    type MovementSummary,
    type MovementFilters,
} from './movement';

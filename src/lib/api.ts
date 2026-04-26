/**
 * API 模块
 * 
 * 此文件现在从新的模块化 API 导出所有功能。
 * 保持向后兼容，现有导入无需更改。
 */

// 导出 HTTP 客户端和基类
export { 
    ApiClient, 
    apiClient, 
    type ApiError 
} from './api/client';

export { 
    BaseAPI, 
    BaseOrderAPI,
    type PaginatedResponse,
    type QueryParams
} from './api/base';

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
} from './api/supplier';

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
} from './api/customer';

// 导出产品相关 API
export {
    ItemAPI,
    ComponentAPI,
    ItemBOMAPI,
    AttributeAPI,
    itemAPI,
    componentAPI,
    itemBOMAPI,
    attributeAPI,
} from './api/product';

// 导出发货相关 API
export {
    TrackingNumberAPI,
    ShipmentAPI,
    PackageAPI,
    ShipmentItemAPI,
    PackageTrackingLegAPI,
    trackingNumberAPI,
    shipmentAPI,
    shipmentItemAPI,
    packageAPI,
    packageTrackingLegAPI,
} from './api/shipment';

// 导出系统设置 API
export {
    SystemSettingAPI,
    systemSettingAPI,
    type SystemSettingResponse,
    type PIDefaults,
    type SystemSettingUpdateRequest,
} from './api/settings';

// 导出出入库记录 API
export {
    InventoryMovementAPI,
    inventoryMovementAPI,
    type InventoryMovement,
    type InventoryMovementCreateRequest,
    type MovementType,
    type MovementSummary,
    type MovementFilters,
} from './api/movement';

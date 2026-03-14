/**
 * Shipment 发货单国际化
 * 支持中文(zh)和英文(en)
 */
import { localeStore, getLocale, setLocale, type Locale, defaultLocale } from './common';

export { localeStore, getLocale, setLocale, type Locale, defaultLocale };

// 发货单相关翻译
export const shipmentTranslations = {
    zh: {
        // 页面标题
        'shipment.list.title': '发货单管理',
        'shipment.detail.title': '发货单详情',
        'shipment.create.title': '新建发货单',
        'shipment.edit.title': '编辑发货单',
        'shipment.tracking.title': '快递单号管理',

        // 状态
        'shipment.status.draft': '草稿',
        'shipment.status.confirmed': '已确认',
        'shipment.status.packed': '已打包',
        'shipment.status.shipped': '已发货',
        'shipment.status.delivered': '已签收',
        'shipment.status.cancelled': '已取消',
        'shipment.status.synced': '已同步',

        // 按钮
        'shipment.btn.create': '新建发货单',
        'shipment.btn.edit': '编辑',
        'shipment.btn.delete': '删除',
        'shipment.btn.confirm': '确认',
        'shipment.btn.pack': '打包',
        'shipment.btn.ship': '发货',
        'shipment.btn.deliver': '签收',
        'shipment.btn.cancel': '取消',
        'shipment.btn.split': '拆分',
        'shipment.btn.sync': '同步',
        'shipment.btn.save': '保存',
        'shipment.btn.cancelEdit': '取消',
        'shipment.btn.back': '返回',
        'shipment.btn.print': '打印',
        'shipment.btn.addItem': '添加物品',
        'shipment.btn.addPackage': '添加包裹',
        'shipment.btn.addTracking': '添加快递单号',

        // 表单字段
        'shipment.field.shipmentNumber': '发货单号',
        'shipment.field.orderNumber': '订单号',
        'shipment.field.customer': '客户',
        'shipment.field.status': '状态',
        'shipment.field.carrier': '承运商',
        'shipment.field.trackingNumber': '快递单号',
        'shipment.field.shipDate': '发货日期',
        'shipment.field.deliveryDate': '送达日期',
        'shipment.field.weight': '重量',
        'shipment.field.dimensions': '尺寸',
        'shipment.field.notes': '备注',
        'shipment.field.createdAt': '创建时间',
        'shipment.field.updatedAt': '更新时间',
        'shipment.field.packageCount': '包裹数量',
        'shipment.field.itemCount': '物品数量',
        'shipment.field.totalWeight': '总重量',
        'shipment.field.totalVolume': '总体积',

        // 包裹
        'shipment.package.title': '包裹信息',
        'shipment.package.number': '包裹编号',
        'shipment.package.weight': '重量',
        'shipment.package.length': '长',
        'shipment.package.width': '宽',
        'shipment.package.height': '高',
        'shipment.package.items': '物品清单',

        // 物品
        'shipment.item.title': '物品明细',
        'shipment.item.sku': 'SKU',
        'shipment.item.name': '物品名称',
        'shipment.item.quantity': '数量',
        'shipment.item.shippedQty': '已发数量',
        'shipment.item.pendingQty': '待发数量',

        // 快递单号
        'shipment.tracking.number': '单号',
        'shipment.tracking.carrier': '快递公司',
        'shipment.tracking.status': '状态',
        'shipment.tracking.status.available': '可用',
        'shipment.tracking.status.used': '已使用',
        'shipment.tracking.status.reserved': '已预留',

        // 提示信息
        'shipment.msg.confirmDelete': '确定要删除此发货单吗？',
        'shipment.msg.confirmCancel': '确定要取消此发货单吗？',
        'shipment.msg.confirmConfirm': '确认要确认此发货单吗？确认后不可修改明细。',
        'shipment.msg.confirmSync': '确认要根据包裹实际装箱情况同步发货明细吗？',
        'shipment.msg.confirmPack': '确认已打包完成？',
        'shipment.msg.confirmShip': '确认要发货吗？',
        'shipment.msg.confirmDeliver': '确认已签收？',
        'shipment.msg.noItems': '暂无物品',
        'shipment.msg.noPackages': '暂无包裹',
        'shipment.msg.noTracking': '暂无快递单号',
        'shipment.msg.createSuccess': '发货单创建成功',
        'shipment.msg.updateSuccess': '发货单更新成功',
        'shipment.msg.deleteSuccess': '发货单删除成功',
        'shipment.msg.statusChangeSuccess': '状态变更成功',

        // 错误信息
        'shipment.error.loadFailed': '加载发货单失败',
        'shipment.error.createFailed': '创建发货单失败',
        'shipment.error.updateFailed': '更新发货单失败',
        'shipment.error.deleteFailed': '删除发货单失败',
        'shipment.error.invalidQuantity': '数量无效',
        'shipment.error.noItems': '请至少添加一个物品',
    },
    en: {
        // Page titles
        'shipment.list.title': 'Shipment Management',
        'shipment.detail.title': 'Shipment Details',
        'shipment.create.title': 'New Shipment',
        'shipment.edit.title': 'Edit Shipment',
        'shipment.tracking.title': 'Tracking Number Management',

        // Status
        'shipment.status.draft': 'Draft',
        'shipment.status.confirmed': 'Confirmed',
        'shipment.status.packed': 'Packed',
        'shipment.status.shipped': 'Shipped',
        'shipment.status.delivered': 'Delivered',
        'shipment.status.cancelled': 'Cancelled',
        'shipment.status.synced': 'Synced',

        // Buttons
        'shipment.btn.create': 'New Shipment',
        'shipment.btn.edit': 'Edit',
        'shipment.btn.delete': 'Delete',
        'shipment.btn.confirm': 'Confirm',
        'shipment.btn.pack': 'Pack',
        'shipment.btn.ship': 'Ship',
        'shipment.btn.deliver': 'Deliver',
        'shipment.btn.cancel': 'Cancel',
        'shipment.btn.split': 'Split',
        'shipment.btn.sync': 'Sync',
        'shipment.btn.save': 'Save',
        'shipment.btn.cancelEdit': 'Cancel',
        'shipment.btn.back': 'Back',
        'shipment.btn.print': 'Print',
        'shipment.btn.addItem': 'Add Item',
        'shipment.btn.addPackage': 'Add Package',
        'shipment.btn.addTracking': 'Add Tracking Number',

        // Form fields
        'shipment.field.shipmentNumber': 'Shipment #',
        'shipment.field.orderNumber': 'Order #',
        'shipment.field.customer': 'Customer',
        'shipment.field.status': 'Status',
        'shipment.field.carrier': 'Carrier',
        'shipment.field.trackingNumber': 'Tracking #',
        'shipment.field.shipDate': 'Ship Date',
        'shipment.field.deliveryDate': 'Delivery Date',
        'shipment.field.weight': 'Weight',
        'shipment.field.dimensions': 'Dimensions',
        'shipment.field.notes': 'Notes',
        'shipment.field.createdAt': 'Created At',
        'shipment.field.updatedAt': 'Updated At',
        'shipment.field.packageCount': 'Packages',
        'shipment.field.itemCount': 'Items',
        'shipment.field.totalWeight': 'Total Weight',
        'shipment.field.totalVolume': 'Total Volume',

        // Package
        'shipment.package.title': 'Package Information',
        'shipment.package.number': 'Package #',
        'shipment.package.weight': 'Weight',
        'shipment.package.length': 'Length',
        'shipment.package.width': 'Width',
        'shipment.package.height': 'Height',
        'shipment.package.items': 'Item List',

        // Items
        'shipment.item.title': 'Items',
        'shipment.item.sku': 'SKU',
        'shipment.item.name': 'Item Name',
        'shipment.item.quantity': 'Qty',
        'shipment.item.shippedQty': 'Shipped',
        'shipment.item.pendingQty': 'Pending',

        // Tracking
        'shipment.tracking.number': 'Number',
        'shipment.tracking.carrier': 'Carrier',
        'shipment.tracking.status': 'Status',
        'shipment.tracking.status.available': 'Available',
        'shipment.tracking.status.used': 'Used',
        'shipment.tracking.status.reserved': 'Reserved',

        // Messages
        'shipment.msg.confirmDelete': 'Are you sure you want to delete this shipment?',
        'shipment.msg.confirmCancel': 'Are you sure you want to cancel this shipment?',
        'shipment.msg.confirmConfirm': 'Confirm this shipment? Items cannot be modified after confirmation.',
        'shipment.msg.confirmSync': 'Confirm to sync shipment items from actual packages?',
        'shipment.msg.confirmPack': 'Confirm packing complete?',
        'shipment.msg.confirmShip': 'Confirm shipment?',
        'shipment.msg.confirmDeliver': 'Confirm delivery received?',
        'shipment.msg.noItems': 'No items yet',
        'shipment.msg.noPackages': 'No packages yet',
        'shipment.msg.noTracking': 'No tracking numbers yet',
        'shipment.msg.createSuccess': 'Shipment created successfully',
        'shipment.msg.updateSuccess': 'Shipment updated successfully',
        'shipment.msg.deleteSuccess': 'Shipment deleted successfully',
        'shipment.msg.statusChangeSuccess': 'Status updated successfully',

        // Errors
        'shipment.error.loadFailed': 'Failed to load shipment',
        'shipment.error.createFailed': 'Failed to create shipment',
        'shipment.error.updateFailed': 'Failed to update shipment',
        'shipment.error.deleteFailed': 'Failed to delete shipment',
        'shipment.error.invalidQuantity': 'Invalid quantity',
        'shipment.error.noItems': 'Please add at least one item',
    }
} as const;

export type ShipmentTranslationKey = keyof typeof shipmentTranslations.zh;

// 翻译函数 - 使用传入的 locale 或从 store 获取
export function t(key: ShipmentTranslationKey, locale?: Locale): string {
    const l = locale || getLocale();
    return shipmentTranslations[l][key] || shipmentTranslations[defaultLocale][key] || key;
}

// 状态映射
export function getStatusText(status: string, locale?: Locale): string {
    const key = `shipment.status.${status}` as ShipmentTranslationKey;
    return t(key, locale);
}

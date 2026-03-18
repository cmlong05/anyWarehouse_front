/**
 * Sales Order 销售订单国际化
 * 支持中文(zh)和英文(en)
 */
import { localeStore, getLocale, setLocale, type Locale, defaultLocale } from './common';

export { localeStore, getLocale, setLocale, type Locale, defaultLocale };

// 销售订单相关翻译
export const salesTranslations = {
    zh: {
        // 页面标题
        'sales.list.title': '销售订单',
        'sales.detail.title': '销售订单详情',
        'sales.create.title': '新建销售订单',
        'sales.edit.title': '编辑销售订单',
        'sales.copy.title': '复制销售订单',

        // 状态
        'sales.status.draft': '草稿',
        'sales.status.pending': '待审批',
        'sales.status.approved': '已批准',
        'sales.status.confirmed': '已确认',
        'sales.status.partial': '部分发货',
        'sales.status.shipped': '已发货',
        'sales.status.delivered': '已交付',
        'sales.status.cancelled': '已取消',

        // 优先级
        'sales.priority.low': '低',
        'sales.priority.normal': '普通',
        'sales.priority.high': '高',
        'sales.priority.urgent': '紧急',

        // 按钮
        'sales.btn.create': '新建订单',
        'sales.btn.edit': '编辑',
        'sales.btn.delete': '删除',
        'sales.btn.copy': '复制订单',
        'sales.btn.backToList': '← 返回列表',
        'sales.btn.ship': '发货',
        'sales.btn.save': '保存',
        'sales.btn.cancel': '取消',
        'sales.btn.back': '返回',
        'sales.btn.retry': '重试',
        'sales.btn.generateShipment': '生成发货单',

        // 表单字段
        'sales.field.orderNumber': '订单号',
        'sales.field.customer': '客户',
        'sales.field.status': '状态',
        'sales.field.priority': '优先级',
        'sales.field.orderDate': '下单日期',
        'sales.field.expectedDelivery': '预计交货',
        'sales.field.actualDelivery': '实际交货',
        'sales.field.createdBy': '创建人',
        'sales.field.subtotal': '商品小计',
        'sales.field.taxRate': '税率',
        'sales.field.taxAmount': '税额',
        'sales.field.shippingCost': '运费',
        'sales.field.discount': '折扣',
        'sales.field.adjustment': '其他调整',
        'sales.field.totalAmount': '订单总计',
        'sales.field.shippingAddress': '收货地址',
        'sales.field.contactPerson': '收货联系人',
        'sales.field.contactPhone': '收货电话',
        'sales.field.paymentTerms': '付款条款',
        'sales.field.notes': '订单备注',
        'sales.field.internalNotes': '内部备注',

        // 基本信息
        'sales.basic.title': '基本信息',
        'sales.shipping.title': '收货信息',
        'sales.amount.title': '金额信息',
        'sales.items.title': '订单明细',
        'sales.notes.title': '备注',

        // 表格
        'sales.table.itemName': '物品名称',
        'sales.table.quantity': '数量',
        'sales.table.shipped': '已发货',
        'sales.table.pendingShip': '待发货',
        'sales.table.unitPrice': '单价',
        'sales.table.subtotal': '小计',
        'sales.table.status': '状态',
        'sales.table.completed': '已完成',
        'sales.table.partial': '部分完成',
        'sales.table.pending': '待处理',

        // 发货单
        'sales.shipment.title': '关联发货单',
        'sales.shipment.count': '个发货单',
        'sales.shipment.packageCount': '包裹',

        // 提示信息
        'sales.msg.confirmDelete': '确定要删除此订单吗？此操作不可恢复。',
        'sales.msg.confirmCancel': '确定要取消此订单吗？',
        'sales.msg.confirmShip': '确定要发货吗？',
        'sales.msg.createSuccess': '订单创建成功',
        'sales.msg.updateSuccess': '订单更新成功',
        'sales.msg.deleteSuccess': '订单删除成功',
        'sales.msg.copySuccess': '订单复制成功',
        'sales.msg.noShipments': '暂无发货单',
        'sales.msg.noItems': '暂无明细项',

        // 错误信息
        'sales.error.loadFailed': '加载订单失败',
        'sales.error.createFailed': '创建订单失败',
        'sales.error.updateFailed': '更新订单失败',
        'sales.error.deleteFailed': '删除订单失败',
        'sales.error.notFound': '订单不存在或已删除',

        // 发货弹窗
        'sales.shipModal.title': '订单发货',
        'sales.shipModal.quantity': '发货数量',
        'sales.shipModal.notes': '发货备注',
    },
    en: {
        // Page titles
        'sales.list.title': 'Sales Orders',
        'sales.detail.title': 'Sales Order Details',
        'sales.create.title': 'New Sales Order',
        'sales.edit.title': 'Edit Sales Order',
        'sales.copy.title': 'Copy Sales Order',

        // Status
        'sales.status.draft': 'Draft',
        'sales.status.pending': 'Pending',
        'sales.status.approved': 'Approved',
        'sales.status.confirmed': 'Confirmed',
        'sales.status.partial': 'Partially Shipped',
        'sales.status.shipped': 'Shipped',
        'sales.status.delivered': 'Delivered',
        'sales.status.cancelled': 'Cancelled',

        // Priority
        'sales.priority.low': 'Low',
        'sales.priority.normal': 'Normal',
        'sales.priority.high': 'High',
        'sales.priority.urgent': 'Urgent',

        // Buttons
        'sales.btn.create': 'New Order',
        'sales.btn.edit': 'Edit',
        'sales.btn.delete': 'Delete',
        'sales.btn.copy': 'Copy Order',
        'sales.btn.backToList': '← Back to List',
        'sales.btn.ship': 'Ship',
        'sales.btn.save': 'Save',
        'sales.btn.cancel': 'Cancel',
        'sales.btn.back': 'Back',
        'sales.btn.retry': 'Retry',
        'sales.btn.generateShipment': 'Generate Shipment',

        // Form fields
        'sales.field.orderNumber': 'Order #',
        'sales.field.customer': 'Customer',
        'sales.field.status': 'Status',
        'sales.field.priority': 'Priority',
        'sales.field.orderDate': 'Order Date',
        'sales.field.expectedDelivery': 'Expected Delivery',
        'sales.field.actualDelivery': 'Actual Delivery',
        'sales.field.createdBy': 'Created By',
        'sales.field.subtotal': 'Subtotal',
        'sales.field.taxRate': 'Tax Rate',
        'sales.field.taxAmount': 'Tax Amount',
        'sales.field.shippingCost': 'Shipping Cost',
        'sales.field.discount': 'Discount',
        'sales.field.adjustment': 'Adjustment',
        'sales.field.totalAmount': 'Total Amount',
        'sales.field.shippingAddress': 'Shipping Address',
        'sales.field.contactPerson': 'Contact Person',
        'sales.field.contactPhone': 'Contact Phone',
        'sales.field.paymentTerms': 'Payment Terms',
        'sales.field.notes': 'Order Notes',
        'sales.field.internalNotes': 'Internal Notes',

        // Basic info
        'sales.basic.title': 'Basic Information',
        'sales.shipping.title': 'Shipping Information',
        'sales.amount.title': 'Amount Information',
        'sales.items.title': 'Order Items',
        'sales.notes.title': 'Notes',

        // Table
        'sales.table.itemName': 'Item Name',
        'sales.table.quantity': 'Quantity',
        'sales.table.shipped': 'Shipped',
        'sales.table.pendingShip': 'Pending Ship',
        'sales.table.unitPrice': 'Unit Price',
        'sales.table.subtotal': 'Subtotal',
        'sales.table.status': 'Status',
        'sales.table.completed': 'Completed',
        'sales.table.partial': 'Partial',
        'sales.table.pending': 'Pending',

        // Shipments
        'sales.shipment.title': 'Related Shipments',
        'sales.shipment.count': 'shipments',
        'sales.shipment.packageCount': 'Packages',

        // Messages
        'sales.msg.confirmDelete': 'Are you sure you want to delete this order? This action cannot be undone.',
        'sales.msg.confirmCancel': 'Are you sure you want to cancel this order?',
        'sales.msg.confirmShip': 'Are you sure you want to ship this order?',
        'sales.msg.createSuccess': 'Order created successfully',
        'sales.msg.updateSuccess': 'Order updated successfully',
        'sales.msg.deleteSuccess': 'Order deleted successfully',
        'sales.msg.copySuccess': 'Order copied successfully',
        'sales.msg.noShipments': 'No shipments yet',
        'sales.msg.noItems': 'No items yet',

        // Errors
        'sales.error.loadFailed': 'Failed to load order',
        'sales.error.createFailed': 'Failed to create order',
        'sales.error.updateFailed': 'Failed to update order',
        'sales.error.deleteFailed': 'Failed to delete order',
        'sales.error.notFound': 'Order not found or deleted',

        // Ship modal
        'sales.shipModal.title': 'Ship Order',
        'sales.shipModal.quantity': 'Ship Quantity',
        'sales.shipModal.notes': 'Ship Notes',
    }
} as const;

export type SalesTranslationKey = keyof typeof salesTranslations.zh;

// 翻译函数 - 使用传入的 locale 或从 store 获取
export function t(key: SalesTranslationKey, locale?: Locale): string {
    const l = locale || getLocale();
    return salesTranslations[l][key] || salesTranslations[defaultLocale][key] || key;
}

// 状态映射
export function getStatusText(status: string, locale?: Locale): string {
    const key = `sales.status.${status}` as SalesTranslationKey;
    return t(key, locale);
}

// 优先级映射
export function getPriorityText(priority: string, locale?: Locale): string {
    const key = `sales.priority.${priority}` as SalesTranslationKey;
    return t(key, locale);
}

/**
 * 订单/优先级徽章工具
 * 集中管理 PurchaseOrder / SalesOrder 的状态映射，避免在多个页面重复定义。
 */

const PURCHASE_STATUS_CLASS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    ordered: 'bg-indigo-100 text-indigo-700',
    partial: 'bg-green-100 text-green-700',
    received: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
};

const PURCHASE_STATUS_LABEL: Record<string, string> = {
    draft: '草稿',
    pending: '待审批',
    approved: '已批准',
    ordered: '已下单',
    partial: '部分到货',
    received: '已完成',
    cancelled: '已取消',
};

const SALES_STATUS_CLASS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-indigo-100 text-indigo-700',
    partial: 'bg-amber-100 text-amber-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
};

const PRIORITY_LABEL: Record<string, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
};

const PRIORITY_CLASS: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    normal: '',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
};

const DEFAULT_BADGE = 'bg-gray-100 text-gray-600';

export function getPurchaseStatusClass(status: string): string {
    return PURCHASE_STATUS_CLASS[status] ?? DEFAULT_BADGE;
}

export function getPurchaseStatusLabel(status: string): string {
    return PURCHASE_STATUS_LABEL[status] ?? status;
}

export function getSalesStatusClass(status: string): string {
    return SALES_STATUS_CLASS[status] ?? DEFAULT_BADGE;
}

export function getPriorityLabel(priority: string): string {
    return PRIORITY_LABEL[priority] ?? priority;
}

export function getPriorityClass(priority: string): string {
    return PRIORITY_CLASS[priority] ?? DEFAULT_BADGE;
}

// Payment status labels — 销售订单用"收款"，采购订单用"付款"
const PAYMENT_STATUS_PAID_CLASS = 'bg-emerald-100 text-emerald-700';
const PAYMENT_STATUS_PARTIAL_CLASS = 'bg-amber-100 text-amber-700';
const PAYMENT_STATUS_UNPAID_CLASS = 'bg-red-100 text-red-700';

export function getSalesPaymentStatusLabel(status: string): string {
    const map: Record<string, string> = { unpaid: '未收款', partial: '部分收款', paid: '已收款' };
    return map[status] ?? status;
}

export function getSalesPaymentStatusClass(status: string): string {
    const map: Record<string, string> = {
        unpaid: PAYMENT_STATUS_UNPAID_CLASS,
        partial: PAYMENT_STATUS_PARTIAL_CLASS,
        paid: PAYMENT_STATUS_PAID_CLASS,
    };
    return map[status] ?? DEFAULT_BADGE;
}

export function getPurchasePaymentStatusLabel(status: string): string {
    const map: Record<string, string> = { unpaid: '未付款', partial: '部分付款', paid: '已付款' };
    return map[status] ?? status;
}

export function getPurchasePaymentStatusClass(status: string): string {
    const map: Record<string, string> = {
        unpaid: PAYMENT_STATUS_UNPAID_CLASS,
        partial: PAYMENT_STATUS_PARTIAL_CLASS,
        paid: PAYMENT_STATUS_PAID_CLASS,
    };
    return map[status] ?? DEFAULT_BADGE;
}

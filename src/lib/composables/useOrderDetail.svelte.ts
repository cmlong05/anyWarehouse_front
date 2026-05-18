/**
 * 订单详情页共享逻辑
 */
import { goto } from '$app/navigation';
import type { SalesOrder, PurchaseOrder } from '$lib';
import { getErrorMessage } from '$lib/utils/errors';

// 状态映射配置
export interface StatusConfig {
    label: string;
    class: string;
}

export interface StatusTransition {
    value: string;
    label: string;
    rollback?: boolean;
}

// 销售订单状态映射
export const SALES_STATUS_MAP: Record<string, StatusConfig> = {
    draft: { label: '草稿', class: 'status-draft' },
    pending: { label: '待审批', class: 'status-pending' },
    approved: { label: '已批准', class: 'status-approved' },
    confirmed: { label: '已确认', class: 'status-confirmed' },
    partial: { label: '部分发货', class: 'status-partial' },
    shipped: { label: '已发货', class: 'status-shipped' },
    delivered: { label: '已交付', class: 'status-delivered' },
    cancelled: { label: '已取消', class: 'status-cancelled' },
};

// 采购订单状态映射
export const PURCHASE_STATUS_MAP: Record<string, StatusConfig> = {
    draft: { label: '草稿', class: 'status-draft' },
    pending: { label: '待审批', class: 'status-pending' },
    approved: { label: '已批准', class: 'status-approved' },
    ordered: { label: '已下单', class: 'status-ordered' },
    partial: { label: '部分到货', class: 'status-partial' },
    received: { label: '已完成', class: 'status-received' },
    cancelled: { label: '已取消', class: 'status-cancelled' },
};

// 优先级映射
export const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
    low: { label: '低', class: 'priority-low' },
    normal: { label: '普通', class: 'priority-normal' },
    high: { label: '高', class: 'priority-high' },
    urgent: { label: '紧急', class: 'priority-urgent' },
};

// 销售订单状态流转
export const SALES_STATUS_TRANSITIONS: Record<string, StatusTransition[]> = {
    draft: [{ value: 'pending', label: '提交审批' }, { value: 'cancelled', label: '取消订单' }],
    pending: [{ value: 'approved', label: '批准' }, { value: 'cancelled', label: '拒绝' }, { value: 'draft', label: '草稿', rollback: true }],
    approved: [{ value: 'confirmed', label: '确认订单' }, { value: 'cancelled', label: '取消' }, { value: 'draft', label: '草稿', rollback: true }],
    confirmed: [{ value: 'shipped', label: '完成发货' }, { value: 'cancelled', label: '取消' }],
    partial: [{ value: 'shipped', label: '完成发货' }, { value: 'delivered', label: '完成交付' }, { value: 'confirmed', label: '已确认', rollback: true }],
    shipped: [{ value: 'delivered', label: '确认交付' }, { value: 'partial', label: '部分发货', rollback: true }],
    delivered: [],
    cancelled: [{ value: 'draft', label: '草稿', rollback: true }],
};

// 采购订单状态流转
export const PURCHASE_STATUS_TRANSITIONS: Record<string, StatusTransition[]> = {
    draft: [{ value: 'pending', label: '提交审批' }, { value: 'cancelled', label: '取消订单' }],
    pending: [{ value: 'approved', label: '批准' }, { value: 'cancelled', label: '拒绝' }, { value: 'draft', label: '草稿', rollback: true }],
    approved: [{ value: 'ordered', label: '确认下单' }, { value: 'cancelled', label: '取消' }, { value: 'draft', label: '草稿', rollback: true }],
    // 收货应走 receive/process 流程，自动更新明细数量并回写状态
    ordered: [{ value: 'cancelled', label: '取消' }],
    partial: [{ value: 'ordered', label: '已下单', rollback: true }],
    received: [],
    cancelled: [{ value: 'draft', label: '草稿', rollback: true }],
};

// 发货单状态映射
export const SHIPMENT_STATUS_MAP: Record<string, string> = {
    draft: '草稿',
    confirmed: '已确认',
    packed: '已打包',
    shipped: '已发货',
    delivered: '已签收',
    cancelled: '已取消',
};

export interface UseOrderDetailOptions<T, S> {
    orderId: number;
    api: {
        get: (id: number) => Promise<T>;
        delete: (id: number) => Promise<void>;
        changeStatus: (id: number, status: S) => Promise<T>;
    };
    listPath: string;
    backUrl?: string;
    statusMap: Record<string, StatusConfig>;
    statusTransitions: Record<string, StatusTransition[]>;
}

export interface UseOrderDetailReturn<T, S> {
    order: T | null;
    loading: boolean;
    error: string | null;
    updating: boolean;
    loadOrder: () => Promise<void>;
    deleteOrder: () => Promise<void>;
    changeStatus: (newStatus: S) => Promise<void>;
    goBack: () => void;
    getAvailableTransitions: () => StatusTransition[];
}

export function useOrderDetail<T extends { id: number; status: string }, S>(
    options: UseOrderDetailOptions<T, S>
): UseOrderDetailReturn<T, S> {
    let order = $state<T | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let updating = $state(false);

    async function loadOrder() {
        loading = true;
        error = null;
        try {
            order = await options.api.get(options.orderId);
        } catch (err) {
            error = getErrorMessage(err, '加载订单失败');
        } finally {
            loading = false;
        }
    }

    async function deleteOrder() {
        if (!confirm('确定要删除此订单吗？此操作不可恢复。')) return;
        try {
            await options.api.delete(options.orderId);
            goto(options.listPath);
        } catch (err) {
            error = getErrorMessage(err, '删除订单失败');
        }
    }

    async function changeStatus(newStatus: S) {
        const statusLabel = options.statusMap[String(newStatus)]?.label || String(newStatus);
        if (!confirm(`确定要将订单状态变更为"${statusLabel}"吗？`)) return;
        
        updating = true;
        try {
            order = await options.api.changeStatus(options.orderId, newStatus);
        } catch (err) {
            error = getErrorMessage(err, '状态变更失败');
        } finally {
            updating = false;
        }
    }

    function goBack() {
        goto(options.backUrl ?? options.listPath);
    }

    function getAvailableTransitions(): StatusTransition[] {
        return options.statusTransitions[order?.status || ''] || [];
    }

    return {
        get order() { return order; },
        set order(value) { order = value; },
        get loading() { return loading; },
        get error() { return error; },
        set error(value) { error = value; },
        get updating() { return updating; },
        loadOrder,
        deleteOrder,
        changeStatus,
        goBack,
        getAvailableTransitions,
    };
}

// 发货/收货弹窗共享逻辑
export interface ShipItem {
    id: number;
    quantity_pending?: number | string;
    quantity?: number | string;
    quantity_shipped?: number | string;
    quantity_received?: number | string;
}

export function useShipModal<T extends ShipItem>(options: {
    onShip: (items: { item_id: number; quantity: number; notes?: string }[], notes: string) => Promise<void>;
}) {
    let showModal = $state(false);
    let quantities = $state<Record<number, number>>({});
    
    function setQuantities(value: Record<number, number>) {
        quantities = value;
    }
    let notes = $state('');
    let updating = $state(false);
    let error = $state<string | null>(null);

    function openModal(items: T[]) {
        quantities = {};
        items.forEach(item => {
            const pending = Number(item.quantity_pending || 0);
            if (pending > 0) {
                quantities[item.id] = 0;
            }
        });
        notes = '';
        error = null;
        showModal = true;
    }

    function closeModal() {
        showModal = false;
    }

    async function confirmShip() {
        const shipItems = Object.entries(quantities)
            .filter(([, qty]) => qty > 0)
            .map(([id, quantity]) => ({ item_id: parseInt(id), quantity }));
        
        if (shipItems.length === 0) {
            error = '请至少输入一个数量';
            return;
        }
        
        updating = true;
        error = null;
        try {
            await options.onShip(shipItems, notes);
            showModal = false;
        } catch (err) {
            error = getErrorMessage(err, '操作失败');
        } finally {
            updating = false;
        }
    }

    function getTotalQuantity(): number {
        return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    }

    return {
        get showModal() { return showModal; },
        get quantities() { return quantities; },
        set quantities(value) { quantities = value; },
        get notes() { return notes; },
        set notes(value: string) { notes = value; },
        get updating() { return updating; },
        get error() { return error; },
        openModal,
        closeModal,
        confirmShip,
        getTotalQuantity,
    };
}

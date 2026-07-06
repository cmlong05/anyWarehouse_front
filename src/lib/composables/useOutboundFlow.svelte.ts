/**
 * 出库流程：弹窗确认 + 数量动画 + 删除淡出
 */
import { apiClient } from '$lib/api';
import { logger } from '$lib/logger';
import type { StorageContainer } from '$lib';

export type OutboundPending = {
    storage: StorageContainer;
    qty: number;
    newQty: number;
} | null;

export interface OutboundFlowOptions {
    /** 取得当前 storages 数组（必须返回响应式引用） */
    getStorages: () => StorageContainer[];
    /** 数据变更后的回调（如需手动触发父级响应） */
    onChange?: () => void;
}

export function useOutboundFlow({ getStorages, onChange }: OutboundFlowOptions) {
    let pending = $state<OutboundPending>(null);
    let processing = $state(false);
    let quantityValues = $state<Record<number, number>>({});
    let quantityFlash = $state<Record<number, boolean>>({});
    let quantityDelta = $state<Record<number, number>>({});
    let removingIds = $state<Set<number>>(new Set());

    function ensureQuantityValues(storages: StorageContainer[]) {
        for (const s of storages) {
            if (quantityValues[s.id] === undefined) quantityValues[s.id] = 1;
        }
    }

    function setQuantity(storageId: number, quantity: number) {
        quantityValues[storageId] = quantity;
    }

    function request(storage: StorageContainer) {
        const qty = quantityValues[storage.id] ?? 1;
        if (isNaN(qty) || qty <= 0 || qty > storage.quantity) return;
        pending = { storage, qty, newQty: storage.quantity - qty };
    }

    function cancel() {
        pending = null;
    }

    async function confirm() {
        if (!pending || processing) return;
        const { storage, qty, newQty } = pending;
        processing = true;
        try {
            let updated: Partial<StorageContainer> | null = null;

            if (newQty === 0) {
                await apiClient.deleteNoContent(`/warehouse/storage/${storage.id}/`);
            } else {
                updated = await apiClient.patch<StorageContainer>(`/warehouse/storage/${storage.id}/`, { quantity: newQty });
            }

            const storages = getStorages();
            const idx = storages.findIndex((s) => s.id === storage.id);
            if (idx === -1) {
                pending = null;
                return;
            }

            if (newQty === 0) {
                quantityDelta[storage.id] = qty;
                quantityFlash[storage.id] = true;
                removingIds = new Set([...removingIds, storage.id]);
                pending = null;
                setTimeout(() => {
                    const list = getStorages();
                    const j = list.findIndex((s) => s.id === storage.id);
                    if (j !== -1) list.splice(j, 1);
                    removingIds = new Set([...removingIds].filter((id) => id !== storage.id));
                    delete quantityFlash[storage.id];
                    delete quantityDelta[storage.id];
                    onChange?.();
                }, 3000);
            } else {
                quantityValues[storage.id] = 1;
                pending = null;
                quantityDelta[storage.id] = qty;
                quantityFlash[storage.id] = true;
                setTimeout(() => {
                    quantityFlash[storage.id] = false;
                    storages[idx] = { ...storages[idx], ...updated };
                    onChange?.();
                }, 1500);
                setTimeout(() => {
                    delete quantityDelta[storage.id];
                }, 2200);
            }
        } catch (error) {
            logger.error('出库错误:', error);
            pending = null;
            const message = error && typeof error === 'object' && 'message' in error
                ? String(error.message)
                : '出库失败，请稍后重试';
            alert(message);
        } finally {
            processing = false;
        }
    }

    return {
        get pending() { return pending; },
        get processing() { return processing; },
        get quantityValues() { return quantityValues; },
        get quantityFlash() { return quantityFlash; },
        get quantityDelta() { return quantityDelta; },
        get removingIds() { return removingIds; },
        ensureQuantityValues,
        setQuantity,
        request,
        cancel,
        confirm,
    };
}

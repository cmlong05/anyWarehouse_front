/**
 * 物品盘点动作：标记 inventory_checked_at 为当前时间
 */
import { apiClient } from '$lib/api';
import { logger } from '$lib/logger';
import type { Item } from '$lib';

export interface InventoryCheckOptions {
    getItemId: () => number;
    onSuccess: (updatedItem: Pick<Item, 'inventory_checked_at'>) => void;
}

export function useInventoryCheck({ getItemId, onSuccess }: InventoryCheckOptions) {
    let isChecking = $state(false);
    let flash = $state(false);

    async function check() {
        if (isChecking) return;
        isChecking = true;
        try {
            const updated = await apiClient.patch<Pick<Item, 'inventory_checked_at'>>(
                `/product/item/${getItemId()}/`,
                { inventory_checked_at: new Date().toISOString() },
            );

            onSuccess(updated);
            flash = true;
            setTimeout(() => { flash = false; }, 1800);
        } catch (error) {
            logger.error('盘点错误:', error);
            const message = error && typeof error === 'object' && 'message' in error
                ? String(error.message)
                : '盘点失败，请稍后重试';
            alert(message);
        } finally {
            isChecking = false;
        }
    }

    return {
        get isChecking() { return isChecking; },
        get flash() { return flash; },
        check,
    };
}

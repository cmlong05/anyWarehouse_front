/**
 * 物品盘点动作：标记 inventory_checked_at 为当前时间
 */
import { config } from '$lib/config';
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
            const response = await fetch(`${config.API_BASE_URL}/product/item/${getItemId()}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inventory_checked_at: new Date().toISOString() }),
            });

            if (!response.ok) {
                alert('盘点失败，请稍后重试');
                return;
            }

            const updated = await response.json();
            onSuccess(updated);
            flash = true;
            setTimeout(() => { flash = false; }, 1800);
        } catch (error) {
            logger.error('盘点错误:', error);
            alert('网络错误，请检查网络连接');
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

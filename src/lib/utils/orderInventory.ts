import { safeParseFloat } from './base';
import { formatNumber } from './formatters';

export interface InventoryItem {
    item_detail?: {
        total_storage?: number;
    };
}

export function getStockQuantity(item: InventoryItem): number | null {
    const stock = item.item_detail?.total_storage;
    if (stock === undefined || stock === null) return null;

    const parsed = safeParseFloat(stock, Number.NaN);
    return Number.isFinite(parsed) ? parsed : null;
}

export function getVariantStockTotal(items: InventoryItem[]): number | null {
    const knownStocks = items
        .map(getStockQuantity)
        .filter((stock): stock is number => stock !== null);

    if (knownStocks.length === 0) return null;
    return knownStocks.reduce((sum, stock) => sum + stock, 0);
}

export function formatStockLabel(stock: number | null): string {
    return `库存: ${formatNumber(stock)}`;
}

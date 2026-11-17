// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import {
    formatStockLabel,
    getStockQuantity,
    getVariantStockTotal,
} from './orderInventory';

describe('order inventory helpers', () => {
    test('reads stock from an order item detail', () => {
        expect(getStockQuantity({ item_detail: { total_storage: 12 } })).toBe(12);
    });

    test('keeps zero stock distinct from unknown stock', () => {
        expect(getStockQuantity({ item_detail: { total_storage: 0 } })).toBe(0);
        expect(getStockQuantity({ item_detail: {} })).toBeNull();
    });

    test('sums stock across variant children', () => {
        expect(getVariantStockTotal([
            { item_detail: { total_storage: 3 } },
            { item_detail: { total_storage: 5 } },
        ])).toBe(8);
    });

    test('returns unknown when no variant child has stock data', () => {
        expect(getVariantStockTotal([
            { item_detail: {} },
            { item_detail: {} },
        ])).toBeNull();
    });

    test('formats stock for SKU option labels', () => {
        expect(formatStockLabel(1200)).toBe('库存: 1,200');
        expect(formatStockLabel(null)).toBe('库存: -');
    });
});

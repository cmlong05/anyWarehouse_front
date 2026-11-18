// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import {
	getBatchAddableOrderItems,
	getMaxEditableShipmentQuantity,
} from './shipment';

describe('getMaxEditableShipmentQuantity', () => {
	test('allows an existing line to grow to the full order quantity when no other shipment reserves it', () => {
		expect(getMaxEditableShipmentQuantity({
			orderQuantity: 150,
			quantityInShipments: 69,
			currentShipmentQuantity: 69,
		})).toBe(150);
	});

	test('subtracts quantities reserved by other shipments', () => {
		expect(getMaxEditableShipmentQuantity({
			orderQuantity: 150,
			quantityInShipments: 119,
			currentShipmentQuantity: 69,
		})).toBe(100);
	});

	test('never returns a negative quantity when other shipments exceed the order quantity', () => {
		expect(getMaxEditableShipmentQuantity({
			orderQuantity: 150,
			quantityInShipments: 200,
			currentShipmentQuantity: 50,
		})).toBe(0);
	});
});

describe('getBatchAddableOrderItems', () => {
	test('excludes order items with zero pending quantity but keeps positive ones', () => {
		const items = [
			{ id: 1, quantity_pending_real: 3 },
			{ id: 2, quantity_pending_real: 0 },
			{ id: 3, quantity_pending_real: 1 },
		];

		expect(getBatchAddableOrderItems(items).map((item) => item.id)).toEqual([1, 3]);
	});

	test('returns no order items when all pending quantities are zero', () => {
		const items = [
			{ id: 1, quantity_pending_real: 0 },
			{ id: 2, quantity_pending_real: 0 },
		];

		expect(getBatchAddableOrderItems(items)).toEqual([]);
	});
});

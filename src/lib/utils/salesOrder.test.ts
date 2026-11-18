// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import { canPruneZeroOrderItem, canReverseSyncOrderItem } from './salesOrder';

describe('canReverseSyncOrderItem', () => {
	test('allows reverse sync when an active shipment has a different quantity', () => {
		expect(canReverseSyncOrderItem({
			quantity: 10,
			quantity_in_shipments: 4,
		})).toBe(true);
	});

	test('rejects reverse sync after the last shipment is deleted', () => {
		expect(canReverseSyncOrderItem({
			quantity: 10,
			quantity_in_shipments: 0,
		})).toBe(false);
	});

	test('rejects reverse sync when shipment and order quantities match', () => {
		expect(canReverseSyncOrderItem({
			quantity: 10,
			quantity_in_shipments: 10,
		})).toBe(false);
	});
});

describe('canPruneZeroOrderItem', () => {
	test('allows a zero quantity line with no fulfillment activity', () => {
		expect(canPruneZeroOrderItem({
			quantity: 0,
			quantity_processed: 0,
			quantity_in_shipments: 0,
		}, 'partial')).toBe(true);
	});

	test('rejects a line with a nonzero order quantity', () => {
		expect(canPruneZeroOrderItem({
			quantity: 1,
			quantity_processed: 0,
			quantity_in_shipments: 0,
		}, 'partial')).toBe(false);
	});

	test('rejects a line with shipment processing history', () => {
		expect(canPruneZeroOrderItem({
			quantity: 0,
			quantity_processed: 1,
			quantity_in_shipments: 0,
		}, 'partial')).toBe(false);
	});

	test('rejects a line referenced by an active shipment plan', () => {
		expect(canPruneZeroOrderItem({
			quantity: 0,
			quantity_processed: 0,
			quantity_in_shipments: 1,
		}, 'partial')).toBe(false);
	});

	test('rejects a shipped order', () => {
		expect(canPruneZeroOrderItem({
			quantity: 0,
			quantity_processed: 0,
			quantity_in_shipments: 0,
		}, 'shipped')).toBe(false);
	});
});

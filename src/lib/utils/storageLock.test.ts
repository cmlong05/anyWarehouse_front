// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import { canOutboundStorage } from './storageLock';

describe('canOutboundStorage', () => {
	test('rejects an outbound attempt for a locked storage record', () => {
		expect(canOutboundStorage({ quantity: 5, is_locked: true })).toBe(false);
	});

	test('allows an outbound attempt for an unlocked storage record', () => {
		expect(canOutboundStorage({ quantity: 5, is_locked: false })).toBe(true);
	});
});

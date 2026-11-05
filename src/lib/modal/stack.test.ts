// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import { createModalStack } from './stack';

describe('createModalStack', () => {
	test('only the top modal is active', () => {
		const stack = createModalStack();
		const first = stack.push(() => {});
		const second = stack.push(() => {});

		expect(stack.isTop(first)).toBe(false);
		expect(stack.isTop(second)).toBe(true);

		second();
		expect(stack.isTop(first)).toBe(true);
	});

	test('body remains locked until the last modal closes', () => {
		const stack = createModalStack();
		const first = stack.push(() => {});
		const second = stack.push(() => {});

		expect(stack.lockCount).toBe(2);
		second();
		expect(stack.lockCount).toBe(1);
		first();
		expect(stack.lockCount).toBe(0);
	});

	test('closing a token is idempotent and does not close another modal', () => {
		const stack = createModalStack();
		const first = stack.push(() => {});
		const second = stack.push(() => {});

		first();
		first();

		expect(stack.lockCount).toBe(1);
		expect(stack.isTop(second)).toBe(true);
	});
});

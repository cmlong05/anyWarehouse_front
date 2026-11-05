// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import { DialogManager } from './manager';

describe('DialogManager', () => {
	test('confirm resolves with the user choice', async () => {
		const manager = new DialogManager(() => {});
		const result = manager.showConfirm('Delete?');

		manager.resolve(true);

		expect(await result).toBe(true);
	});

	test('cancelled confirm resolves false', async () => {
		const manager = new DialogManager(() => {});
		const result = manager.showConfirm('Continue?');

		manager.resolve(false);

		expect(await result).toBe(false);
	});

	test('dialogs are shown one at a time in FIFO order', async () => {
		const manager = new DialogManager(() => {});
		const first = manager.showAlert('first');
		const second = manager.showConfirm('second');

		expect(manager.current?.message).toBe('first');
		manager.resolve(false);
		expect(manager.current?.message).toBe('second');
		manager.resolve(false);

		await Promise.all([first, second]);
		expect(manager.current).toBeNull();
	});

	test('ignores completion when no dialog is active', () => {
		const manager = new DialogManager(() => {});

		expect(() => manager.resolve(true)).not.toThrow();
		expect(manager.current).toBeNull();
	});
});

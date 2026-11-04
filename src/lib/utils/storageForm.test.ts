// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import { buildStorageMutationData } from './storageForm';

describe('buildStorageMutationData', () => {
	test('includes the checked lock state in the save payload', () => {
		const payload = buildStorageMutationData({
			item: '348',
			container: '179',
			quantity: '1',
			text: '',
			sample: false,
			is_locked: true,
		});

		expect(payload.is_locked).toBe(true);
	});

	test('includes the unchecked lock state in the save payload', () => {
		const payload = buildStorageMutationData({
			item: '348',
			container: '179',
			quantity: '1',
			text: '',
			sample: false,
			is_locked: false,
		});

		expect(payload.is_locked).toBe(false);
	});
});

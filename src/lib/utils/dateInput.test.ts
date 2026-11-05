// @ts-expect-error Bun supplies this module at test runtime without app type declarations.
import { describe, expect, test } from 'bun:test';
import { openNativeDatePicker } from './dateInput';

describe('openNativeDatePicker', () => {
	test('opens the browser picker when the input supports it', () => {
		let pickerCalls = 0;
		const input = {
			showPicker: () => {
				pickerCalls += 1;
			},
		};

		openNativeDatePicker(input);

		expect(pickerCalls).toBe(1);
	});

	test('falls back to the default input interaction when picker opening fails', () => {
		const input = {
			showPicker: () => {
				throw new DOMException('Picker unavailable');
			},
		};

		expect(() => openNativeDatePicker(input)).not.toThrow();
	});
});

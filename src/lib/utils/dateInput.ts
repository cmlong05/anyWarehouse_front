interface NativeDatePickerInput {
	showPicker: () => void;
}

export function openNativeDatePicker(input: NativeDatePickerInput): void {
	try {
		input.showPicker();
	} catch {
		// Some browsers do not allow programmatic picker opening.
	}
}

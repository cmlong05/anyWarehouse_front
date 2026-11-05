import {
	DialogManager,
	type ConfirmDialogOptions,
	type DialogOptions,
	type DialogRequest,
} from '$lib/dialog/manager';

let current = $state<DialogRequest | null>(null);

const manager = new DialogManager((next) => {
	current = next;
});

export const dialogState = {
	get current() {
		return current;
	},
};

export function showAlert(message: string, options?: DialogOptions): Promise<void> {
	return manager.showAlert(message, options);
}

export function showConfirm(message: string, options?: ConfirmDialogOptions): Promise<boolean> {
	return manager.showConfirm(message, options);
}

export function resolveDialog(confirmed = false): void {
	manager.resolve(confirmed);
}

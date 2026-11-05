export type DialogKind = 'alert' | 'confirm';
export type DialogVariant = 'info' | 'success' | 'warning' | 'error' | 'danger';

export interface DialogOptions {
	title?: string;
	variant?: DialogVariant;
	itemName?: string;
	confirmText?: string;
}

export interface ConfirmDialogOptions extends DialogOptions {
	cancelText?: string;
}

export interface DialogRequest {
	id: number;
	kind: DialogKind;
	title: string;
	message: string;
	itemName?: string;
	variant: DialogVariant;
	confirmText: string;
	cancelText?: string;
	resolve: (confirmed: boolean) => void;
}

type DialogChangeHandler = (current: DialogRequest | null) => void;

export class DialogManager {
	private queue: DialogRequest[] = [];
	private active: DialogRequest | null = null;
	private nextId = 1;

	constructor(private readonly onChange: DialogChangeHandler = () => {}) {}

	get current(): DialogRequest | null {
		return this.active;
	}

	showAlert(message: string, options: DialogOptions = {}): Promise<void> {
		return new Promise((resolve) => {
			this.enqueue({
				id: this.nextId++,
				kind: 'alert',
				title: options.title ?? '提示',
				message,
				itemName: options.itemName,
				variant: options.variant ?? 'info',
				confirmText: options.confirmText ?? '知道了',
				resolve: () => resolve(),
			});
		});
	}

	showConfirm(message: string, options: ConfirmDialogOptions = {}): Promise<boolean> {
		return new Promise((resolve) => {
			this.enqueue({
				id: this.nextId++,
				kind: 'confirm',
				title: options.title ?? '请确认',
				message,
				itemName: options.itemName,
				variant: options.variant ?? 'danger',
				confirmText: options.confirmText ?? '确认',
				cancelText: options.cancelText ?? '取消',
				resolve,
			});
		});
	}

	resolve(confirmed = false): void {
		const current = this.active;
		if (!current) return;

		current.resolve(confirmed);
		this.active = this.queue.shift() ?? null;
		this.onChange(this.active);
	}

	private enqueue(request: DialogRequest): void {
		if (this.active) {
			this.queue.push(request);
			return;
		}

		this.active = request;
		this.onChange(this.active);
	}
}

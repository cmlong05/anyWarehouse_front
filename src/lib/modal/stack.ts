export type ModalToken = () => void;

interface ModalEntry {
	token: ModalToken;
	onClose: () => void;
}

export function createModalStack() {
	const entries: ModalEntry[] = [];

	return {
		get lockCount() {
			return entries.length;
		},

		push(onClose: () => void): ModalToken {
			let open = true;
			const entry = { token: () => {}, onClose } satisfies ModalEntry;
			const token: ModalToken = () => {
				if (!open) return;
				open = false;

				const index = entries.indexOf(entry);
				if (index !== -1) entries.splice(index, 1);
				onClose();
			};
			entry.token = token;
			entries.push(entry);
			return token;
		},

		isTop(token: ModalToken): boolean {
			return entries.at(-1)?.token === token;
		},
	};
}

export const modalStack = createModalStack();

export function pushModal(close: () => void): ModalToken {
	return modalStack.push(close);
}

export function isTopModal(token: ModalToken): boolean {
	return modalStack.isTop(token);
}

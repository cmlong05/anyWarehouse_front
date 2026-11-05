import { tick, untrack } from 'svelte';
import {
	isTopModal,
	pushModal,
	type ModalToken,
} from '$lib/modal/stack';
import type { ModalCloseReason } from '$lib/modal/types';

interface ModalInteractionOptions {
	open: () => boolean;
	onClose: (reason: Extract<ModalCloseReason, 'escape'>) => void;
	closeOnEscape: () => boolean;
	canDismiss: () => boolean;
}

const focusableSelector = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[contenteditable="true"]',
	'[tabindex]:not([tabindex="-1"])',
].join(',');

let dialogSequence = 0;
let bodyLockCount = 0;
let previousBodyOverflow: string | null = null;

function lockBodyScroll() {
	if (typeof document === 'undefined') return;

	if (bodyLockCount === 0) {
		previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}
	bodyLockCount += 1;
}

function unlockBodyScroll() {
	if (typeof document === 'undefined') return;

	bodyLockCount = Math.max(0, bodyLockCount - 1);
	if (bodyLockCount === 0) {
		document.body.style.overflow = previousBodyOverflow ?? '';
		previousBodyOverflow = null;
	}
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
		(element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true',
	);
}

export function useModalInteraction(options: ModalInteractionOptions) {
	let modalElement = $state<HTMLElement | null>(null);
	const dialogId = `modal-dialog-${++dialogSequence}`;

	$effect(() => {
		if (!options.open() || typeof document === 'undefined') return;

		const previouslyFocused =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		let closeRequested = false;
		let token: ModalToken;

		token = pushModal(() => {});
		lockBodyScroll();

		void tick().then(() => {
			const element = untrack(() => modalElement);
			if (!element || !options.open()) return;
			const autofocus = element.querySelector<HTMLElement>('[autofocus]');
			(autofocus ?? element).focus();
		});

		function handleKeydown(event: KeyboardEvent) {
			if (!isTopModal(token) || !options.open()) return;

			if (event.key === 'Escape') {
				if (!options.closeOnEscape() || !options.canDismiss() || closeRequested) return;
				event.preventDefault();
				closeRequested = true;
				options.onClose('escape');
				return;
			}

			if (event.key !== 'Tab') return;
			const element = untrack(() => modalElement);
			if (!element) return;

			const focusable = getFocusableElements(element);
			if (focusable.length === 0) {
				event.preventDefault();
				element.focus();
				return;
			}

			const first = focusable[0];
			const last = focusable.at(-1);
			if (!first || !last) return;

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}

		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			token();
			unlockBodyScroll();
			if (previouslyFocused?.isConnected) {
				void tick().then(() => previouslyFocused.focus());
			}
		};
	});

	return {
		get modalElement() {
			return modalElement;
		},
		set modalElement(element: HTMLElement | null) {
			modalElement = element;
		},
		dialogId,
	};
}

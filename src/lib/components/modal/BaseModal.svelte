<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useModalInteraction } from '$lib/composables/useModalInteraction.svelte';
	import type { ModalCloseReason, ModalSize } from '$lib/modal/types';

	interface Props {
		open: boolean;
		title?: string;
		description?: string;
		size?: ModalSize;
		busy?: boolean;
		closeOnBackdrop?: boolean;
		closeOnEscape?: boolean;
		canDismiss?: () => boolean;
		onClose: (reason: ModalCloseReason) => void;
		header?: Snippet;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		open,
		title,
		description,
		size = 'md',
		busy = false,
		closeOnBackdrop = true,
		closeOnEscape = true,
		canDismiss,
		onClose,
		header,
		children,
		footer,
	}: Props = $props();

	const sizeClasses: Record<ModalSize, string> = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-[calc(100vw-2rem)]',
	};

	function isDismissible(): boolean {
		return !busy && (canDismiss?.() ?? true);
	}

	function requestClose(reason: ModalCloseReason) {
		if (!isDismissible()) return;
		onClose(reason);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target !== event.currentTarget) return;
		if (!closeOnBackdrop) return;
		requestClose('backdrop');
	}

	const interaction = useModalInteraction({
		open: () => open,
		onClose: (reason) => requestClose(reason),
		closeOnEscape: () => closeOnEscape,
		canDismiss: isDismissible,
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="presentation"
		onclick={handleBackdropClick}
	>
		<div
			bind:this={interaction.modalElement}
			class="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl {sizeClasses[
				size
			]}"
			role="dialog"
			aria-modal="true"
			aria-labelledby={title && !header ? interaction.dialogId : undefined}
			aria-describedby={description ? `${interaction.dialogId}-description` : undefined}
			aria-label={title ? (header ? title : undefined) : '弹窗'}
			tabindex="-1"
		>
			<header class="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
				{#if header}
					{@render header()}
				{:else}
					<div class="min-w-0">
						<h2 id={interaction.dialogId} class="text-lg font-semibold text-gray-900">
							{title ?? ''}
						</h2>
						{#if description}
							<p
								id={`${interaction.dialogId}-description`}
								class="mt-1 break-words text-sm text-gray-600"
							>
								{description}
							</p>
						{/if}
					</div>
				{/if}
				<button
					type="button"
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					onclick={() => requestClose('close-button')}
					disabled={busy}
					aria-label="关闭弹窗"
				>
					×
				</button>
			</header>

			<div class="min-h-0 flex-1 overflow-y-auto">
				{@render children()}
			</div>

			{#if footer}
				<footer class="shrink-0 border-t border-gray-200">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}

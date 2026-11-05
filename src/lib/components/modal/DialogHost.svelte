<script lang="ts">
	import { tick } from 'svelte';
	import { dialogState, resolveDialog } from '$lib/stores/dialog.svelte';
	import type { DialogVariant } from '$lib/dialog/manager';

	const variantIcons: Record<DialogVariant, string> = {
		info: 'ℹ️',
		success: '✅',
		warning: '⚠️',
		error: '❌',
		danger: '⚠️',
	};

	let dialogElement = $state<HTMLDivElement | null>(null);
	const dialog = $derived(dialogState.current);

	function variantButtonClass(variant: DialogVariant): string {
		if (variant === 'danger' || variant === 'error') {
			return 'bg-red-600 text-white hover:bg-red-700';
		}
		if (variant === 'success') {
			return 'bg-green-600 text-white hover:bg-green-700';
		}
		if (variant === 'warning') {
			return 'bg-amber-600 text-white hover:bg-amber-700';
		}
		return 'bg-blue-600 text-white hover:bg-blue-700';
	}

	function dismiss(confirmed = false) {
		if (!dialog) return;
		resolveDialog(confirmed);
	}

	$effect(() => {
		const activeDialog = dialog;
		if (!activeDialog || typeof document === 'undefined') return;

		const previouslyFocused = document.activeElement instanceof HTMLElement
			? document.activeElement
			: null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		void tick().then(() => dialogElement?.focus());

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				resolveDialog(false);
			}
		};
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = previousOverflow;
			if (previouslyFocused?.isConnected) previouslyFocused.focus();
		};
	});
</script>

{#if dialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
		onclick={(event) => {
			if (event.target === event.currentTarget) dismiss(false);
		}}
		role="presentation"
	>
		<div
			bind:this={dialogElement}
			class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby={`global-dialog-title-${dialog.id}`}
			tabindex="-1"
		>
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-5">
				<h2 id={`global-dialog-title-${dialog.id}`} class="text-lg font-semibold text-gray-900">
					{dialog.title}
				</h2>
				<button
					type="button"
					class="flex h-8 w-8 items-center justify-center rounded-md text-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
					onclick={() => dismiss(false)}
					aria-label="关闭弹窗"
				>
					×
				</button>
			</div>

			<div class="px-6 py-8 text-center">
				<div class="mb-4 text-5xl" aria-hidden="true">{variantIcons[dialog.variant]}</div>
				<p class="whitespace-pre-line break-words leading-relaxed text-gray-600">{dialog.message}</p>
				{#if dialog.itemName}
					<p class="mt-3 break-words text-lg font-semibold text-gray-900">"{dialog.itemName}"</p>
				{/if}
			</div>

			<div class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
				{#if dialog.kind === 'confirm'}
					<button
						type="button"
						class="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
						onclick={() => dismiss(false)}
					>
						{dialog.cancelText ?? '取消'}
					</button>
				{/if}
				<button
					type="button"
					class="rounded-lg px-4 py-2 font-medium transition-colors {variantButtonClass(dialog.variant)}"
					onclick={() => dismiss(true)}
				>
					{dialog.confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

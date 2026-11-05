<script lang="ts">
	import { dialogState, resolveDialog } from '$lib/stores/dialog.svelte';
	import type { DialogVariant } from '$lib/dialog/manager';
	import { BaseModal } from '$lib/components/modal';

	const variantIcons: Record<DialogVariant, string> = {
		info: 'ℹ️',
		success: '✅',
		warning: '⚠️',
		error: '❌',
		danger: '⚠️',
	};

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

</script>

<BaseModal
	open={dialog !== null}
	title={dialog?.title}
	size="sm"
	onClose={() => dismiss(false)}
>
	{#if dialog}
		<div class="px-6 py-8 text-center">
			<div class="mb-4 text-5xl" aria-hidden="true">{variantIcons[dialog.variant]}</div>
			<p class="whitespace-pre-line break-words leading-relaxed text-gray-600">{dialog.message}</p>
			{#if dialog.itemName}
				<p class="mt-3 break-words text-lg font-semibold text-gray-900">"{dialog.itemName}"</p>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		{#if dialog}
			<div class="flex justify-end gap-3 px-6 py-4">
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
		{/if}
	{/snippet}
</BaseModal>

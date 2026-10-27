<!-- 发货明细数量对齐结果弹窗 -->
<script lang="ts">
    import type { ShipmentSyncUpdatedItem } from '$lib/shipmentTypes';

    interface Props {
        isOpen?: boolean;
        title?: string;
        message?: string;
        updatedItems?: ShipmentSyncUpdatedItem[];
        error?: boolean;
        onClose?: () => void;
    }

    let {
        isOpen = false,
        title = '对齐结果',
        message = '',
        updatedItems = [],
        error = false,
        onClose
    }: Props = $props();

    function handleWindowKeydown(event: KeyboardEvent) {
        if (isOpen && event.key === 'Escape') {
            onClose?.();
        }
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            onClose?.();
        }
    }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if isOpen}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onclick={handleBackdropClick}
        role="presentation"
    >
        <div
            class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shipment-sync-result-title"
        >
            <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 id="shipment-sync-result-title" class="text-lg font-semibold text-gray-900">{title}</h3>
                <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-md text-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    onclick={onClose}
                    aria-label="关闭弹窗"
                >
                    ×
                </button>
            </div>

            <div class="overflow-y-auto px-6 py-5">
                <div
                    class="flex items-start gap-3 rounded-lg border px-4 py-3 {error
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-green-200 bg-green-50 text-green-800'}"
                >
                    <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold {error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                        {error ? '!' : '✓'}
                    </span>
                    <p class="leading-relaxed">{message}</p>
                </div>

                {#if updatedItems.length > 0}
                    <div class="mt-4 overflow-hidden rounded-lg border border-gray-200">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                                    <th class="px-4 py-2 font-medium">SKU</th>
                                    <th class="px-4 py-2 text-right font-medium">原计划</th>
                                    <th class="px-4 py-2 text-right font-medium">新计划</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each updatedItems as item (item.shipment_item_id)}
                                    <tr class="border-b border-gray-100 last:border-b-0">
                                        <td class="px-4 py-2.5 font-mono text-gray-900">{item.sku}</td>
                                        <td class="px-4 py-2.5 text-right text-gray-500">{item.old_qty}</td>
                                        <td class="px-4 py-2.5 text-right font-semibold text-gray-900">{item.new_qty}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>

            <div class="flex shrink-0 justify-end border-t border-gray-200 px-6 py-4">
                <button
                    type="button"
                    class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                    onclick={onClose}
                >
                    知道了
                </button>
            </div>
        </div>
    </div>
{/if}

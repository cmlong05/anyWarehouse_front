<!-- 全部发货明细对齐确认弹窗 -->
<script lang="ts">
    interface Props {
        isOpen?: boolean;
        onConfirm?: () => void;
        onCancel?: () => void;
    }

    let {
        isOpen = false,
        onConfirm,
        onCancel
    }: Props = $props();

    function handleWindowKeydown(event: KeyboardEvent) {
        if (isOpen && event.key === 'Escape') {
            onCancel?.();
        }
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            onCancel?.();
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
            class="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shipment-sync-options-title"
        >
            <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 id="shipment-sync-options-title" class="text-lg font-semibold text-gray-900">全部明细对齐</h3>
                <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-md text-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    onclick={onCancel}
                    aria-label="关闭弹窗"
                >
                    ×
                </button>
            </div>

            <div class="px-6 py-5">
                <p class="text-sm leading-relaxed text-gray-600">
                    将发货单全部明细的计划数量对齐到已封箱包裹的实际数量。
                </p>
                <p class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                    未出现在已封箱包裹中的明细，其计划数量会调整为 0；随后可使用“剔除未打包行”清理。
                </p>
            </div>

            <div class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button
                    type="button"
                    class="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    onclick={onCancel}
                >
                    取消
                </button>
                <button
                    type="button"
                    class="rounded-md bg-orange-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-700"
                    onclick={onConfirm}
                >
                    执行
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- 全部订单明细对齐选项弹窗 -->
<script lang="ts">
    interface Props {
        isOpen?: boolean;
        allowDecrease?: boolean;
        onAllowDecreaseChange?: (allowDecrease: boolean) => void;
        onConfirm?: () => void;
        onCancel?: () => void;
    }

    let {
        isOpen = false,
        allowDecrease = false,
        onAllowDecreaseChange,
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
            aria-labelledby="order-sync-options-title"
        >
            <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 id="order-sync-options-title" class="text-lg font-semibold text-gray-900">全部明细对齐</h3>
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
                    将订单全部明细项对齐到已建发货单的计划数量 (默认只增加)
                </p>

                <label class="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                    <input
                        type="checkbox"
                        checked={allowDecrease}
                        onchange={(event) => onAllowDecreaseChange?.((event.currentTarget as HTMLInputElement).checked)}
                        class="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                        <span class="block text-sm font-medium text-gray-900">允许减少订单数量</span>
                    </span>
                </label>
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

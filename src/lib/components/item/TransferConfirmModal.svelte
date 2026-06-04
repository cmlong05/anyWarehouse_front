<!-- 物料调拨确认弹窗 -->
<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';

    interface TransferPending {
        fromStorageId: number;
        toStorageId: number;
        fromContainerId: number;
        toContainerId: number;
        fromContainerCode: string;
        toContainerCode: string;
        fromQuantity: number;
        toQuantity: number;
    }

    interface Props {
        pending: TransferPending | null;
        processing?: boolean;
        error?: string;
        onCancel: () => void;
        onConfirm: (quantity: number) => void;
    }

    let {
        pending,
        processing = false,
        error = '',
        onCancel,
        onConfirm,
    }: Props = $props();

    let quantity = $state(1);

    $effect(() => {
        if (pending) {
            quantity = 1;
        }
    });

    function focusOnMount(node: HTMLElement) {
        node.focus();
    }

    function confirm() {
        if (!pending || processing) return;
        const maxQty = pending.fromQuantity;
        const safeQty = Math.max(1, Math.min(maxQty, Number(quantity) || 1));
        onConfirm(safeQty);
    }
</script>

{#if pending}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-labelledby="transfer-dialog-title"
        use:focusOnMount
        onkeydown={(e) => {
            if (e.key === 'Escape') {
                onCancel();
                return;
            }
            if ((e.key === 'Enter' || e.key === 'y' || e.key === 'Y') && !processing) {
                e.preventDefault();
                confirm();
            }
        }}
    >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h3 id="transfer-dialog-title" class="text-base font-semibold text-gray-900">确认移库</h3>

            <div class="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-4 space-y-4">
                <div class="w-full">
                    <svg class="w-full h-4 text-blue-400" viewBox="0 0 200 16" fill="none" stroke="currentColor" aria-hidden="true">
                        <line x1="0" y1="8" x2="188" y2="8" stroke-width="2" stroke-linecap="round"/>
                        <polyline points="181,2 195,8 181,14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>

                <div class="flex items-center justify-between gap-4">
                    <div class="min-w-0 flex-1">
                        <p class="font-medium truncate">{pending.fromContainerCode}</p>
                        <hr class="my-1 border-blue-200">
                        <p class="text-xs text-gray-600 flex items-center gap-1">
                            库存: {pending.fromQuantity}
                            <span class="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium text-red-600 bg-red-50">−{quantity}</span>
                        </p>
                    </div>

                    <div class="shrink-0 flex items-center justify-center">
                        <NumberStepper
                            value={quantity}
                            onchange={(v) => quantity = Math.max(1, Number(v) || 1)}
                            min={1}
                            max={pending.fromQuantity}
                            step={1}
                            decimalPlaces={0}
                            size="sm"
                        />
                    </div>

                    <div class="text-right min-w-0 flex-1">
                        <p class="font-medium truncate">{pending.toContainerCode}</p>
                        <hr class="my-1 border-blue-200">
                        <p class="text-xs text-gray-600 flex items-center justify-end gap-1">
                            <span class="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium text-green-600 bg-green-50">+{quantity}</span>
                            库存: {pending.toQuantity}
                        </p>
                    </div>
                </div>

            </div>

            {#if error}
                <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
            {/if}

            <div class="flex justify-end gap-3 pt-1">
                <button
                    type="button"
                    onclick={onCancel}
                    class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    取消
                </button>
                <button
                    type="button"
                    onclick={confirm}
                    disabled={processing || pending.fromQuantity <= 0}
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                    {processing ? '处理中...' : '确认移库'}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- 物料出库确认弹窗 -->
<!--
被依赖：
- `routes/item/[slug]/+page.svelte`
-->
<script lang="ts">
    interface OutboundPending {
        qty: number;
        newQty: number;
    }

    interface Props {
        pending: OutboundPending | null;
        processing?: boolean;
        onCancel: () => void;
        onConfirm: () => void;
    }

    let {
        pending,
        processing = false,
        onCancel,
        onConfirm,
    }: Props = $props();

    function focusOnMount(node: HTMLElement) {
        node.focus();
    }
</script>

{#if pending}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-labelledby="outbound-dialog-title"
        use:focusOnMount
        onkeydown={(e) => {
            if (e.key === 'Escape') {
                onCancel();
                return;
            }
            if ((e.key === 'Enter' || e.key === 'y' || e.key === 'Y') && !processing) {
                e.preventDefault();
                onConfirm();
            }
        }}
    >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 id="outbound-dialog-title" class="text-base font-semibold text-gray-900 mb-3">确认出库</h3>
            {#if pending.newQty === 0}
                <p class="text-sm text-gray-600 mb-1">出库数量：<span class="font-medium text-red-600">{pending.qty}</span></p>
                <p class="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">该位置库存将清零并删除记录。</p>
            {:else}
                <p class="text-sm text-gray-600 mb-1">出库数量：<span class="font-medium text-red-600">{pending.qty}</span></p>
                <p class="text-sm text-gray-600">出库后剩余：<span class="font-medium">{pending.newQty}</span></p>
            {/if}
            <div class="flex justify-end gap-3 mt-5">
                <button
                    type="button"
                    onclick={onCancel}
                    class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    取消
                </button>
                <button
                    type="button"
                    onclick={onConfirm}
                    disabled={processing}
                    class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                    {processing ? '处理中...' : '确认出库'}
                </button>
            </div>
        </div>
    </div>
{/if}
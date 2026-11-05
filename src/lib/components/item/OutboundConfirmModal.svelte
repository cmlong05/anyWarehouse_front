<!-- 物料出库确认弹窗 -->
<!--
被依赖：
- `routes/item/[slug]/+page.svelte`
-->
<script lang="ts">
    import { BaseModal } from '$lib/components/modal';

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

    function handleActionKeydown(event: KeyboardEvent) {
        if ((event.key === 'Enter' || event.key === 'y' || event.key === 'Y') && !processing) {
            event.preventDefault();
            onConfirm();
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="contents" onkeydown={handleActionKeydown}>
    <BaseModal
        open={pending !== null}
        title="确认出库"
        size="sm"
        busy={processing}
        onClose={onCancel}
    >
        {#if pending}
            <div class="px-6 py-5">
            {#if pending.newQty === 0}
                <p class="text-sm text-gray-600 mb-1">出库数量：<span class="font-medium text-red-600">{pending.qty}</span></p>
                <p class="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">该位置库存将清零并删除记录。</p>
            {:else}
                <p class="text-sm text-gray-600 mb-1">出库数量：<span class="font-medium text-red-600">{pending.qty}</span></p>
                <p class="text-sm text-gray-600">出库后剩余：<span class="font-medium">{pending.newQty}</span></p>
            {/if}
            </div>
        {/if}

        {#snippet footer()}
            <div class="flex justify-end gap-3 px-6 py-4">
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
        {/snippet}
    </BaseModal>
</div>

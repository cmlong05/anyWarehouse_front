<!-- 订单备注卡片 -->
<!--
被依赖：
- `lib/components/order/OrderForm.svelte`
- `lib/components/order/index.ts`
-->
<script lang="ts">
    interface Props {
        notes?: string | null;
        internal_notes?: string | null;
        title?: string;
        notesLabel?: string;
        internalNotesLabel?: string;
    }

    let {
        notes,
        internal_notes,
        title = '备注',
        notesLabel = '订单备注',
        internalNotesLabel = '内部备注',
    }: Props = $props();
</script>

{#if notes || internal_notes}
    <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        {#if notes}
            <div class="bg-gray-50 p-4 rounded-lg mb-3">
                <span class="text-sm text-gray-600 block mb-2">{notesLabel}</span>
                <p class="text-gray-900 whitespace-pre-wrap">{notes}</p>
            </div>
        {/if}
        {#if internal_notes}
            <div class="bg-yellow-50 p-4 rounded-lg">
                <span class="text-sm text-gray-600 block mb-2">{internalNotesLabel}</span>
                <p class="text-gray-900 whitespace-pre-wrap">{internal_notes}</p>
            </div>
        {/if}
    </div>
{/if}
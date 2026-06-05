<!-- 变体属性徽标 -->
<!--
被依赖：
- `lib/components/order/OrderFormItemsSection.svelte`
- `lib/components/order/OrderItemsTable.svelte`
- `routes/customer/package/[id]/+page.svelte`
- `routes/customer/shipment/[id]/+page.svelte`
-->
<script lang="ts">
    import type { VariantAttribute } from '$lib/utils/variant';

    interface Props {
        attributes: VariantAttribute[] | Array<{ value: string; color?: string }>;
        class?: string;
    }

    let { attributes = [], class: className = '' }: Props = $props();
</script>

{#if attributes.length > 0}
    <div class="flex items-center gap-1.5 {className}">
        {#each attributes as attr}
            {#if attr.color}
                <span 
                    class="inline-block w-3 h-3 rounded-full border border-gray-200"
                    title={attr.value}
                    style="background-color: {attr.color}"
                ></span>
            {:else}
                <span class="text-xs text-gray-500">{attr.value}</span>
            {/if}
        {/each}
    </div>
{/if}
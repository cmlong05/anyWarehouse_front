<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';
    import type { ShipmentPlanItem } from '$lib/composables/useShipmentForm.svelte';

    interface Props {
        items: ShipmentPlanItem[];
        totalPlanned: number;
        onRemove: (id: string) => void;
        onClear: () => void;
        onFillAll: () => void;
    }
    
    let { items, totalPlanned, onRemove, onClear, onFillAll }: Props = $props();
</script>

<div class="p-2">
    <div class="mb-4">
        <h3 class="font-bold flex items-center justify-between">
            <span>📝 发货计划明细</span>
            {#if items.length > 0}
                <span class="text-sm text-gray-500">
                    已计划: <strong>{totalPlanned.toFixed(0)}</strong>
                </span>
            {/if}
        </h3>
        {#if items.length > 0}
            <div class="flex justify-end gap-2 mt-2">
                <button type="button" class="text-blue-600 hover:text-blue-800 text-sm" onclick={onFillAll}>填充最大</button>
                <button type="button" class="text-red-600 hover:text-red-800 text-sm" onclick={onClear}>清空</button>
            </div>
        {/if}
    </div>
    
    {#if items.length === 0}
        <div class="text-center py-12 px-4 text-gray-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>请从左侧选择商品</p>
            <p class="text-sm mt-1">点击"添加"按钮将商品加入发货计划</p>
        </div>
    {:else}
        <table class="w-full">
            <tbody>
                {#each items as item}
                    <tr>
                        <td class="py-2">
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <span class="font-mono text-xs text-gray-500">{item.sku}</span>
                                    <div class="font-medium text-sm truncate">{item.itemName}</div>
                                </div>
                                <button 
                                    type="button"
                                    class="p-1 border-0 bg-transparent cursor-pointer text-red-600 hover:bg-gray-100 rounded"
                                    onclick={() => onRemove(item.id)}
                                    aria-label="移除商品"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span>订购: {item.quantityOrdered.toFixed(0)}</span>
                                <span>已发: {item.quantityShipped.toFixed(0)}</span>
                                {#if item.quantityPrepared > 0}
                                    <span class="text-amber-500">已预备: {item.quantityPrepared.toFixed(0)}</span>
                                {/if}
                                <span class="text-red-600">可发: {item.quantityPendingReal.toFixed(0)}</span>
                            </div>
                            <div class="mt-2 flex items-center gap-2">
                                <span class="text-xs text-gray-500">本次计划:</span>
                                <NumberStepper
                                    bind:value={item.quantityPlan}
                                    step={1}
                                    decimalPlaces={0}
                                    size="sm"
                                />
                                <span class="text-xs text-gray-400">/ 建议最大 {item.quantityPendingReal.toFixed(0)}</span>
                                {#if item.quantityPlan > item.quantityPendingReal}
                                    <span class="text-xs text-amber-500" title="超过可发数量">⚠️ 超发</span>
                                {/if}
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>

<script lang="ts">
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

<div class="p-4">
    <div class="flex justify-between items-center mb-3">
        <h3 class="font-bold">📝 发货计划明细</h3>
        {#if items.length > 0}
            <div class="flex gap-2">
                <span class="text-sm text-gray-500">
                    已计划: <strong>{totalPlanned.toFixed(0)}</strong>
                </span>
                <button type="button" class="btn btn-xs btn-ghost" onclick={onFillAll}>填充最大</button>
                <button type="button" class="btn btn-xs btn-ghost" onclick={onClear}>清空</button>
            </div>
        {/if}
    </div>
    
    {#if items.length === 0}
        <div class="text-center py-12 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>请从左侧选择商品</p>
            <p class="text-sm mt-1">点击"添加"按钮将商品加入发货计划</p>
        </div>
    {:else}
        <table class="w-full text-sm">
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
                                    class="btn btn-xs btn-ghost text-error"
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
                                    <span class="text-warning">已预备: {item.quantityPrepared.toFixed(0)}</span>
                                {/if}
                                <span class="text-error">可发: {item.quantityPendingReal.toFixed(0)}</span>
                            </div>
                            <div class="mt-2 flex items-center gap-2">
                                <span class="text-xs text-gray-500">本次计划:</span>
                                <input 
                                    type="number" 
                                    step="1"
                                    class="input input-xs w-24 text-center"
                                    bind:value={item.quantityPlan}
                                />
                                <span class="text-xs text-gray-400">/ 最大 {item.quantityPendingReal.toFixed(0)}</span>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>

<style>
    table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
    .font-mono { font-family: monospace; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-gray-500 { color: #6b7280; }
    .text-error { color: #dc2626; }
    .text-warning { color: #f59e0b; }
    .btn {
        padding: 0.25rem;
        border: none;
        background: transparent;
        cursor: pointer;
    }
    .btn-ghost:hover { background: #f3f4f6; }
    .input {
        padding: 0.25rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
    }
    .input:focus { outline: none; border-color: #3b82f6; }
    .w-24 { width: 6rem; }
    .text-center { text-align: center; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>

<script lang="ts">
    import type { SalesOrderItem } from '$lib/index';
    import { safeParseFloat } from '$lib/utils';

    interface Props {
        items: SalesOrderItem[];
        totalPending: number;
        totalPrepared: number;
        onAdd: (item: SalesOrderItem) => void;
    }
    
    let { items, totalPending, totalPrepared, onAdd }: Props = $props();
</script>

<div class="p-4">
    <h3 class="font-bold mb-3 flex items-center justify-between">
        <span>📋 订单明细</span>
        <span class="text-xs text-gray-500 font-normal">
            待发: {totalPending.toFixed(0)}
            {#if totalPrepared > 0}
                <span class="text-warning ml-1">(已预备: {totalPrepared.toFixed(0)})</span>
            {/if}
        </span>
    </h3>
    
    {#if items.length > 0}
        <table class="w-full text-sm">
            <thead>
                <tr>
                    <th class="px-2 py-2 text-left">SKU</th>
                    <th class="px-2 py-2 text-left">商品名称</th>
                    <th class="px-2 py-2 text-right w-16">订购</th>
                    <th class="px-2 py-2 text-right w-16">已发</th>
                    <th class="px-2 py-2 text-right w-16 text-error">待发</th>
                    <th class="px-2 py-2 text-center w-16">操作</th>
                </tr>
            </thead>
            <tbody>
                {#each items as item}
                    {@const pending = item.quantity_pending_real || 0}
                    <tr>
                        <td class="px-2 py-2 font-mono text-xs">{item.sku}</td>
                        <td class="px-2 py-2">{item.item_name}</td>
                        <td class="px-2 py-2 text-right">{safeParseFloat(item.quantity).toFixed(0)}</td>
                        <td class="px-2 py-2 text-right text-gray-500">{safeParseFloat(item.quantity_shipped).toFixed(0)}</td>
                        <td class="px-2 py-2 text-right font-bold text-error">{pending.toFixed(0)}</td>
                        <td class="px-2 py-2 text-center">
                            <button 
                                type="button"
                                class="btn btn-xs btn-primary"
                                onclick={() => onAdd(item)}
                            >
                                添加
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <div class="text-center py-8 text-gray-400">
            <p>所有品项已添加到发货计划</p>
        </div>
    {/if}
</div>

<style>
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
    th { font-weight: 600; color: #374151; }
    .font-mono { font-family: monospace; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-gray-500 { color: #6b7280; }
    .text-error { color: #dc2626; }
    .btn {
        padding: 0.25rem 0.5rem;
        border: none;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
    }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover { background: #2563eb; }
    .text-warning { color: #f59e0b; }
</style>

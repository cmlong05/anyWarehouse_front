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
    
    const subtitle = $derived(() => {
        let text = `待发: ${totalPending.toFixed(0)}`;
        if (totalPrepared > 0) {
            text += ` (已预备: ${totalPrepared.toFixed(0)})`;
        }
        return text;
    });
</script>

<div class="order-items-list">
    <div class="list-header">
        <h3 class="font-bold flex items-center justify-between">
            <span>📋 订单明细</span>
            <span class="text-xs text-gray-500 font-normal">{subtitle()}</span>
        </h3>
    </div>
    
    {#if items.length > 0}
        <table class="data-table">
            <thead>
                <tr>
                    <th class="text-left">SKU</th>
                    <th class="text-left">商品名称</th>
                    <th class="text-right w-16">订购</th>
                    <th class="text-right w-16">已发</th>
                    <th class="text-right w-16 text-error">待发</th>
                    <th class="text-center w-16">操作</th>
                </tr>
            </thead>
            <tbody>
                {#each items as item}
                    {@const pending = item.quantity_pending_real || 0}
                    <tr>
                        <td class="font-mono text-xs">{item.sku}</td>
                        <td>{item.item_name}</td>
                        <td class="text-right">{safeParseFloat(item.quantity).toFixed(0)}</td>
                        <td class="text-right text-gray-500">{safeParseFloat(item.quantity_shipped).toFixed(0)}</td>
                        <td class="text-right font-bold text-error">{pending.toFixed(0)}</td>
                        <td class="text-center">
                            <button type="button" class="btn-add" onclick={() => onAdd(item)}>添加</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <div class="empty-state">
            <p>所有品项已添加到发货计划</p>
        </div>
    {/if}
</div>

<style>
    .order-items-list { padding: 0.5rem; }
    .list-header { margin-bottom: 1rem; }
    .font-mono { font-family: monospace; }
    .text-xs { font-size: 0.75rem; }
    .text-gray-500 { color: #6b7280; }
    .text-error { color: #dc2626; }
    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #9ca3af;
        font-size: 0.875rem;
    }
</style>

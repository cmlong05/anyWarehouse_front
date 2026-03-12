<script lang="ts">
    import type { SalesOrderItem } from '$lib/index';
    import { safeParseFloat } from '$lib/utils';
    import Plus from 'lucide-svelte/icons/plus';

    interface Props {
        items: SalesOrderItem[];
        totalPending: number;
        totalPrepared: number;
        onAdd: (item: SalesOrderItem) => void;
        onAddAll?: () => void;
    }
    
    let { items, totalPending, totalPrepared, onAdd, onAddAll }: Props = $props();
    
    const subtitle = $derived(() => {
        let text = `待发: ${totalPending.toFixed(0)}`;
        if (totalPrepared > 0) {
            text += ` (已预备: ${totalPrepared.toFixed(0)})`;
        }
        return text;
    });
</script>

<div class="p-2">
    <div class="mb-4">
        <h3 class="font-bold flex items-center justify-between">
            <span>📋 订单明细</span>
            <span class="text-xs text-gray-500 font-normal">{subtitle()}</span>
        </h3>
        {#if items.length > 0 && onAddAll}
            <div class="mt-2">
                <button 
                    type="button" 
                    class="w-full px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                    onclick={() => onAddAll?.()}
                >
                    <Plus class="h-4 w-4" />
                    一键全部添加 ({items.length})
                </button>
            </div>
        {/if}
    </div>
    
    {#if items.length > 0}
        <table class="w-full">
            <thead>
                <tr>
                    <th class="text-left">SKU</th>
                    <th class="text-left">商品名称</th>
                    <th class="text-right w-16">订购</th>
                    <th class="text-right w-16">已发</th>
                    <th class="text-right w-16 text-red-600">待发</th>
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
                        <td class="text-right font-bold text-red-600">{pending.toFixed(0)}</td>
                        <td class="text-center">
                            <button type="button" class="text-blue-600 hover:text-blue-800 text-sm" onclick={() => onAdd(item)}>添加</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <div class="text-center py-12 px-4 text-gray-400 text-sm">
            <p>所有品项已添加到发货计划</p>
        </div>
    {/if}
</div>

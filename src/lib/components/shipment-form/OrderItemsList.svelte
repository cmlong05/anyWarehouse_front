<!-- 订单物品列表 -->
<script lang="ts">
    import type { SalesOrderItem } from '$lib/index';
    import { safeParseFloat } from '$lib/utils';
    import Plus from 'lucide-svelte/icons/plus';

    interface SalesOrderItemWithStock extends SalesOrderItem {
        item_detail?: SalesOrderItem['item_detail'] & {
            total_storage?: number;
        };
    }

    interface Props {
        items: SalesOrderItemWithStock[];
        onAdd: (item: SalesOrderItemWithStock) => void;
        onAddAll?: () => void;
    }
    
    let { items, onAdd, onAddAll }: Props = $props();

    function getCurrentStock(item: SalesOrderItemWithStock): number | null {
        const stock = item.item_detail?.total_storage;
        return typeof stock === 'number' ? stock : null;
    }

    function isStockInsufficient(currentStock: number | null, pending: number): boolean {
        if (currentStock === null) return false;
        return pending > 0 && currentStock < pending;
    }
</script>

<div class="p-2">
    {#if items.length > 0 && onAddAll}
        <div class="mb-4">
            <button 
                type="button" 
                class="w-full px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                onclick={() => onAddAll?.()}
            >
                <Plus class="h-4 w-4" />
                全部添加 ({items.length})
            </button>
        </div>
    {/if}
    
    {#if items.length > 0}
        <table class="w-full">
            <thead>
                <tr>
                    <th class="text-left">SKU</th>
                    <th class="text-left">名称</th>
                    <th class="text-right w-20">库存</th>
                    <th class="text-right w-24">待建发货单</th>
                    <th class="text-center w-16">操作</th>
                </tr>
            </thead>
            <tbody>
                {#each items as item}
                    {@const pending = item.quantity_pending_real || 0}
                    {@const currentStock = getCurrentStock(item)}
                    {@const stockInsufficient = isStockInsufficient(currentStock, pending)}
                    <tr>
                        <td class="font-mono text-xs">{item.sku}</td>
                        <td>{item.item_name}</td>
                        <td class="text-right {stockInsufficient ? 'text-red-600 font-semibold' : currentStock !== null && currentStock > 0 ? 'text-blue-700 font-medium' : 'text-gray-400'}">
                            {#if currentStock !== null}
                                {currentStock.toFixed(0)}
                            {:else}
                                -
                            {/if}
                        </td>
                        <td class="text-right font-bold text-gray-900">{pending.toFixed(0)}</td>
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

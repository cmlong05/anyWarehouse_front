<script lang="ts">
    import { safeParseFloat } from '$lib/utils';
    import { localeStore } from '$lib/i18n/sales';

    interface OrderItem {
        line_number: number;
        sku: string;
        item_name: string;
        item_name_en?: string;
        quantity: string | number;
        quantity_shipped?: string | number;
        quantity_received?: string | number;
        quantity_pending?: string | number;
        unit_price?: string | number;
        line_total?: string | number;
        is_fully_shipped?: boolean;
        is_fully_received?: boolean;
    }

    interface Labels {
        title?: string;
        itemName?: string;
        quantity?: string;
        shipped?: string;
        received?: string;
        pendingShip?: string;
        pendingReceive?: string;
        unitPrice?: string;
        subtotal?: string;
        status?: string;
        completed?: string;
        partial?: string;
        pending?: string;
        noItems?: string;
    }

    interface Props {
        items: OrderItem[];
        showPrices?: boolean;
        type: 'sales' | 'purchase';
        labels?: Labels;
    }
    
    let { items, showPrices = true, type, labels = {} }: Props = $props();

    const defaultLabels: Labels = {
        title: '订单明细',
        itemName: '物品名称',
        quantity: '数量',
        shipped: '已发货',
        received: '已到货',
        pendingShip: '待发货',
        pendingReceive: '待到货',
        unitPrice: '单价',
        subtotal: '小计',
        status: '状态',
        completed: '已完成',
        partial: '部分完成',
        pending: '待处理',
        noItems: '暂无明细',
    };

    const l = { ...defaultLabels, ...labels };

    function getShippedQty(item: OrderItem): number {
        return safeParseFloat(type === 'sales' ? item.quantity_shipped : item.quantity_received);
    }

    function getPendingQty(item: OrderItem): number {
        return safeParseFloat(item.quantity_pending);
    }

    function isFullyProcessed(item: OrderItem): boolean {
        return type === 'sales' ? !!item.is_fully_shipped : !!item.is_fully_received;
    }
</script>

<div class="bg-white rounded-lg p-6 shadow-sm">
    <h2 class="m-0 mb-4 text-lg text-gray-800">{l.title} ({items.length})</h2>
    {#if items.length > 0}
        <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
                <thead>
                    <tr>
                        <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">#</th>
                        <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">SKU</th>
                        <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">{l.itemName}</th>
                        <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{l.quantity}</th>
                        <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{type === 'sales' ? l.shipped : l.received}</th>
                        <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{type === 'sales' ? l.pendingShip : l.pendingReceive}</th>
                        {#if showPrices}
                            <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{l.unitPrice}</th>
                            <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{l.subtotal}</th>
                        {/if}
                        <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">{l.status}</th>
                    </tr>
                </thead>
                <tbody>
                    {#each items as item}
                        {@const shipped = getShippedQty(item)}
                        {@const pending = getPendingQty(item)}
                        <tr class="opacity-70" class:opacity-70={isFullyProcessed(item)}>
                            <td class="p-3 text-left border-b border-gray-100">{item.line_number}</td>
                            <td class="p-3 text-left border-b border-gray-100 font-mono">{item.sku}</td>
                            <td class="p-3 text-left border-b border-gray-100">
                                {$localeStore === 'en' ? (item.item_name_en ?? '') : item.item_name}
                            </td>
                            <td class="p-3 text-right border-b border-gray-100">{item.quantity}</td>
                            <td class="p-3 text-right border-b border-gray-100">{shipped}</td>
                            <td class="p-3 text-right border-b border-gray-100">{pending}</td>
                            {#if showPrices}
                                <td class="p-3 text-right border-b border-gray-100">¥{safeParseFloat(item.unit_price).toFixed(2)}</td>
                                <td class="p-3 text-right border-b border-gray-100">¥{safeParseFloat(item.line_total).toFixed(2)}</td>
                            {/if}
                            <td class="p-3 text-left border-b border-gray-100">
                                {#if isFullyProcessed(item)}
                                    <span class="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">{l.completed}</span>
                                {:else if shipped > 0}
                                    <span class="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{l.partial}</span>
                                {:else}
                                    <span class="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{l.pending}</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <p class="text-gray-500 text-center p-8">{l.noItems}</p>
    {/if}
</div>

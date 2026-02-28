<script lang="ts">
    import { safeParseFloat } from '$lib/utils';

    interface OrderItem {
        line_number: number;
        sku: string;
        item_name: string;
        quantity: string | number;
        quantity_shipped?: string | number;
        quantity_received?: string | number;
        quantity_pending?: string | number;
        unit_price?: string | number;
        line_total?: string | number;
        is_fully_shipped?: boolean;
        is_fully_received?: boolean;
    }

    interface Props {
        items: OrderItem[];
        showPrices?: boolean;
        type: 'sales' | 'purchase';
    }
    
    let { items, showPrices = true, type }: Props = $props();

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

<div class="items-main">
    <h2>订单明细 ({items.length}项)</h2>
    {#if items.length > 0}
        <div class="items-table-container">
            <table class="items-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>SKU</th>
                        <th>物品名称</th>
                        <th class="numeric">数量</th>
                        <th class="numeric">{type === 'sales' ? '已发货' : '已到货'}</th>
                        <th class="numeric">待{type === 'sales' ? '发货' : '到货'}</th>
                        {#if showPrices}
                            <th class="numeric">单价</th>
                            <th class="numeric">小计</th>
                        {/if}
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    {#each items as item}
                        {@const shipped = getShippedQty(item)}
                        {@const pending = getPendingQty(item)}
                        <tr class:completed={isFullyProcessed(item)}>
                            <td>{item.line_number}</td>
                            <td class="mono">{item.sku}</td>
                            <td>{item.item_name}</td>
                            <td class="numeric">{item.quantity}</td>
                            <td class="numeric">{shipped}</td>
                            <td class="numeric">{pending}</td>
                            {#if showPrices}
                                <td class="numeric">¥{safeParseFloat(item.unit_price).toFixed(2)}</td>
                                <td class="numeric">¥{safeParseFloat(item.line_total).toFixed(2)}</td>
                            {/if}
                            <td>
                                {#if isFullyProcessed(item)}
                                    <span class="badge badge-success">已完成</span>
                                {:else if shipped > 0}
                                    <span class="badge badge-warning">部分完成</span>
                                {:else}
                                    <span class="badge badge-pending">待处理</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <p class="empty-text">暂无明细</p>
    {/if}
</div>

<style>
    .items-main {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .items-main h2 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #333;
    }

    .items-table-container {
        overflow-x: auto;
    }

    .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    .items-table th,
    .items-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    .items-table th {
        background: #f8f9fa;
        font-weight: 600;
    }

    .items-table .numeric {
        text-align: right;
    }

    .items-table .mono {
        font-family: monospace;
    }

    .items-table tr.completed {
        opacity: 0.7;
    }

    .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .badge-success {
        background: #d4edda;
        color: #155724;
    }

    .badge-warning {
        background: #fff3cd;
        color: #856404;
    }

    .badge-pending {
        background: #e9ecef;
        color: #495057;
    }

    .empty-text {
        color: #666;
        text-align: center;
        padding: 2rem;
    }
</style>

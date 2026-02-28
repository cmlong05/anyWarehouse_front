<script lang="ts">
    import Loading from '$lib/components/Loading.svelte';

    interface Order {
        id: number;
        order_number?: string;
        order_date?: string;
        status?: string;
        total_amount?: string;
    }
    
    interface Props {
        title: string;
        orders: Order[];
        loading: boolean;
        emptyText: string;
        viewAllHref: string;
        getStatusLabel: (status: string) => string;
        getStatusClass: (status: string) => string;
        onRowClick: (id: number) => void;
    }
    
    let { title, orders, loading, emptyText, viewAllHref, getStatusLabel, getStatusClass, onRowClick }: Props = $props();
</script>

<div class="orders-section">
    <div class="section-header">
        <h2>{title}</h2>
        <a href={viewAllHref} class="btn btn-primary btn-sm">查看全部</a>
    </div>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else if orders.length === 0}
        <div class="empty-state-small">
            <p>{emptyText}</p>
        </div>
    {:else}
        <div class="orders-table">
            <table>
                <thead>
                    <tr>
                        <th>订单号</th>
                        <th>下单日期</th>
                        <th>状态</th>
                        <th>金额</th>
                    </tr>
                </thead>
                <tbody>
                    {#each orders as order}
                        <tr class="clickable" onclick={() => onRowClick(order.id)}>
                            <td class="code">{order.order_number}</td>
                            <td>{order.order_date}</td>
                            <td>
                                <span class="status-tag {getStatusClass(order.status || '')}">
                                    {getStatusLabel(order.status || '')}
                                </span>
                            </td>
                            <td class="numeric">¥{Number(order.total_amount).toFixed(2)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .orders-section {
        padding: 1.5rem 0;
        border-top: 1px solid #e5e7eb;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #1f2937;
    }
    
    .orders-table {
        overflow-x: auto;
    }
    
    .empty-state-small {
        text-align: center;
        padding: 1.5rem 0;
        color: #6b7280;
        font-size: 0.9rem;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    
    th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    th {
        font-weight: 600;
        color: #374151;
        background-color: #f9fafb;
    }
    
    td {
        color: #4b5563;
    }
    
    .numeric {
        font-family: monospace;
        text-align: right;
    }
    
    .code {
        font-family: monospace;
    }
    
    .clickable {
        cursor: pointer;
    }
    
    .clickable:hover {
        background-color: #f3f4f6;
    }
    
    .status-tag {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .btn {
        padding: 0.375rem 0.75rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        background-color: #3b82f6;
        color: white;
    }
    
    .btn:hover {
        background-color: #2563eb;
    }
</style>

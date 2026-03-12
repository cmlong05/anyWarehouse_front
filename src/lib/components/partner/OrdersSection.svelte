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

<div class="py-6 border-t border-gray-200">
    <div class="flex justify-between items-center mb-6">
        <h2 class="m-0 text-xl text-gray-800">{title}</h2>
        <a href={viewAllHref} class="px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer no-underline inline-flex items-center bg-blue-500 text-white hover:bg-blue-600">查看全部</a>
    </div>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else if orders.length === 0}
        <div class="text-center py-6 text-gray-500 text-sm">
            <p>{emptyText}</p>
        </div>
    {:else}
        <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
                <thead>
                    <tr>
                        <th class="p-3 px-4 text-left border-b border-gray-200 font-semibold text-gray-700 bg-gray-50">订单号</th>
                        <th class="p-3 px-4 text-left border-b border-gray-200 font-semibold text-gray-700 bg-gray-50">下单日期</th>
                        <th class="p-3 px-4 text-left border-b border-gray-200 font-semibold text-gray-700 bg-gray-50">状态</th>
                        <th class="p-3 px-4 text-left border-b border-gray-200 font-semibold text-gray-700 bg-gray-50">金额</th>
                    </tr>
                </thead>
                <tbody>
                    {#each orders as order}
                        <tr class="cursor-pointer hover:bg-gray-100" onclick={() => onRowClick(order.id)}>
                            <td class="p-3 px-4 text-left border-b border-gray-200 text-gray-600 font-mono">{order.order_number}</td>
                            <td class="p-3 px-4 text-left border-b border-gray-200 text-gray-600">{order.order_date}</td>
                            <td class="p-3 px-4 text-left border-b border-gray-200 text-gray-600">
                                <span class="inline-block px-2 py-0.5 rounded text-xs font-medium {getStatusClass(order.status || '')}">
                                    {getStatusLabel(order.status || '')}
                                </span>
                            </td>
                            <td class="p-3 px-4 text-right border-b border-gray-200 text-gray-600 font-mono">¥{Number(order.total_amount).toFixed(2)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

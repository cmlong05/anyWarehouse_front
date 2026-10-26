<!-- 销售订单发货面板 -->
<!--
被依赖：
- `lib/components/order/OrderForm.svelte`
- `lib/components/order/index.ts`
-->
<script lang="ts">
    import type { SalesOrder } from '$lib';

    interface Props {
        order: SalesOrder;
    }

    let { order }: Props = $props();

    function getShipmentStatusClass(status: string): string {
        const classes: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-600',
            confirmed: 'bg-blue-100 text-blue-700',
            packed: 'bg-yellow-100 text-yellow-700',
            shipped: 'bg-green-100 text-green-700',
            delivered: 'bg-indigo-100 text-indigo-700',
            synced: 'bg-purple-100 text-purple-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return classes[status] || 'bg-gray-100 text-gray-600';
    }

</script>

{#if order.shipments && order.shipments.length > 0}
    <div class="bg-white rounded-lg p-6 shadow mb-6">
        <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
                关联发货单 ({order.shipments.length})
            </h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each order.shipments as shipment}
                <a
                    href="/customer/shipment/{shipment.id}"
                    class="block border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 cursor-pointer transition-all"
                >
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium text-gray-900">
                            {shipment.shipment_no}
                        </span>
                        <div class="flex items-center gap-1">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getShipmentStatusClass(shipment.status)}">
                                {shipment.status === 'draft' ? '草稿' : shipment.status === 'confirmed' ? '已确认' : shipment.status === 'packed' ? '已打包' : shipment.status === 'shipped' ? '已发货' : shipment.status === 'delivered' ? '已签收' : shipment.status === 'cancelled' ? '已取消' : shipment.status === 'synced' ? '已同步' : shipment.status}
                            </span>
                            {#if shipment.is_synced && shipment.status !== 'synced'}
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                    已同步
                                </span>
                            {/if}
                        </div>
                    </div>
                    <div class="flex flex-col gap-1 text-sm text-gray-600">
                        <span>包裹: {shipment.total_packages}</span>
                        <span>{new Date(shipment.created_at).toLocaleString('zh-CN')}</span>
                    </div>
                </a>
            {/each}
        </div>
    </div>
{/if}

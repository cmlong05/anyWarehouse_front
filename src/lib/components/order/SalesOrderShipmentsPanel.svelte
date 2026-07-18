<!-- 销售订单发货面板 -->
<!--
被依赖：
- `lib/components/order/OrderForm.svelte`
- `lib/components/order/index.ts`
-->
<script lang="ts">
    import { salesOrderAPI } from '$lib/api';
    import type { SalesOrder } from '$lib';

    interface Props {
        order: SalesOrder;
        onOrderReload: () => Promise<void>;
    }

    let { order, onOrderReload }: Props = $props();

    function getShipmentStatusClass(status: string): string {
        const classes: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-600',
            confirmed: 'bg-blue-100 text-blue-700',
            packed: 'bg-yellow-100 text-yellow-700',
            shipped: 'bg-green-100 text-green-700',
            delivered: 'bg-indigo-100 text-indigo-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return classes[status] || 'bg-gray-100 text-gray-600';
    }

    let syncLoading = $state(false);
    let syncResult = $state<{ message: string; updated_items: { sku: string; old_qty: string; new_qty: string }[] } | null>(null);
    let syncError = $state<string | null>(null);

    async function syncQuantities() {
        if (syncLoading) return;
        syncResult = null;
        syncError = null;
        syncLoading = true;
        try {
            const result = await salesOrderAPI.syncQuantities(order.id, { allowDecrease: false });
            syncResult = result;
            if (result.updated_items.length > 0) {
                await onOrderReload();
            }
        } catch (e: unknown) {
            syncError = e instanceof Error ? e.message : '同步失败，请重试';
        } finally {
            syncLoading = false;
        }
    }
</script>

{#if order.shipments && order.shipments.length > 0}
    <div class="bg-white rounded-lg p-6 shadow mb-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
                关联发货单 ({order.shipments.length})
            </h3>
            <button
                type="button"
                class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onclick={syncQuantities}
                disabled={syncLoading}
                title="根据发货单明细汇总数量对齐订单行的订购数量"
            >
                {#if syncLoading}
                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    同步中...
                {:else}
                    <span class="inline-block" style="transform: scaleX(-1)">↩️</span> 同步全部订单数量（只增不减）
                {/if}
            </button>
        </div>

        {#if syncError}
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                ⚠️ {syncError}
            </div>
        {/if}
        {#if syncResult}
            <div class="mb-4 p-3 rounded-lg text-sm {syncResult.updated_items.length > 0 ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-gray-50 border border-gray-200 text-gray-600'}">
                ✅ {syncResult.message}
                {#if syncResult.updated_items.length > 0}
                    <ul class="mt-2 space-y-1">
                        {#each syncResult.updated_items as item}
                            <li class="ml-4">SKU: <span class="font-mono font-medium">{item.sku}</span> — {item.old_qty} → <span class="font-semibold">{item.new_qty}</span></li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/if}

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
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getShipmentStatusClass(shipment.status)}">
                            {shipment.status === 'draft' ? '草稿' : shipment.status === 'confirmed' ? '已确认' : shipment.status === 'packed' ? '已打包' : shipment.status === 'shipped' ? '已发货' : shipment.status === 'delivered' ? '已签收' : shipment.status === 'cancelled' ? '已取消' : shipment.status === 'synced' ? '已同步' : shipment.status}
                        </span>
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
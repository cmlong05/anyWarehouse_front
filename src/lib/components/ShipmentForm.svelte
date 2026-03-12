<script lang="ts">
    import { onMount } from 'svelte';
    import { useShipmentForm } from '$lib/composables/useShipmentForm.svelte';
    import type { Shipment } from '$lib/shipmentTypes';
    import DualSelectionPanel from './DualSelectionPanel.svelte';
    import Alert from './Alert.svelte';
    import Loading from './Loading.svelte';
    import { BasicInfo, OrderItemsList, PlanItemsList, ShippingInfo } from './shipment-form';

    interface Props {
        mode: 'create' | 'edit';
        shipmentId?: number;
        initialOrderId?: number;
        onSuccess?: (shipment: Shipment) => void;
        onCancel?: () => void;
    }
    
    let { mode, shipmentId, initialOrderId, onSuccess, onCancel }: Props = $props();

    // 使用 $derived 包裹 composable 调用以响应 props 变化
    const form = $derived(useShipmentForm({ mode, shipmentId, initialOrderId, onSuccess }));

    onMount(() => {
        form.init();
    });
</script>

{#if form.loading}
    <Loading />
{:else}
    <form onsubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} class="space-y-6">
        {#if form.error}
            <Alert error={{ message: form.error }} onDismiss={() => form.error = ''} />
        {/if}
        {#if form.success}
            <Alert error={{ message: form.success }} variant="info" onDismiss={() => form.success = ''} />
        {/if}

        <!-- 基本信息 -->
        <BasicInfo
            bind:shipmentNo={form.shipmentNo}
            bind:status={form.status}
            bind:selectedOrderId={form.selectedOrderId}
            availableOrders={form.availableOrders}
            mode={form.mode}
            onOrderSelect={form.onOrderSelect}
        />

        {#if form.selectedOrderId}
            <!-- 双栏布局 -->
            <DualSelectionPanel
                availableTitle="📋 订单明细"
                availableSubtitle={`待发: ${form.totalPending.toFixed(0)}${form.totalPrepared > 0 ? ` (已预备: ${form.totalPrepared.toFixed(0)})` : ''}`}
                selectedTitle="📝 发货计划明细"
                selectedSubtitle={`已计划: ${form.totalPlanned.toFixed(0)}`}
            >
                {#snippet available()}
                    <OrderItemsList
                        items={form.displayableOrderItems}
                        totalPending={form.totalPending}
                        totalPrepared={form.totalPrepared}
                        onAdd={form.addItemToPlan}
                        onAddAll={form.addAllToPlan}
                    />
                {/snippet}
                {#snippet selected()}
                    <PlanItemsList
                        items={form.planItems}
                        totalPlanned={form.totalPlanned}
                        onRemove={form.removePlanItem}
                        onClear={form.clearAllPlan}
                        onFillAll={form.fillAllPending}
                    />
                {/snippet}
            </DualSelectionPanel>
        {/if}

        <!-- 收货信息 -->
        <ShippingInfo
            bind:address={form.shippingAddress}
            bind:contactPerson={form.contactPerson}
            bind:contactPhone={form.contactPhone}
        />

        <!-- 备注 -->
        <div class="mb-2">
            <label class="block mb-1" for="notes">
                <span class="text-sm text-gray-700">备注</span>
            </label>
            <textarea 
                id="notes"
                class="w-full p-2 border border-gray-300 rounded-md resize-y"
                bind:value={form.notes}
                placeholder="输入备注信息"
                rows="3"
            ></textarea>
        </div>

        <!-- 提示 -->
        {#if form.mode === 'create'}
            <div class="flex items-center gap-3 p-4 bg-blue-100 text-blue-800 rounded-md text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>提示：创建发货单后，可以在发货单详情页添加包裹，将计划明细打包到包裹中。</span>
            </div>
        {/if}

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" class="px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-150 bg-transparent text-gray-500 hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed" onclick={() => onCancel?.()}>取消</button>
            <button 
                type="submit" 
                class="px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-150 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={form.saving}
            >
                {form.saving ? '保存中...' : (form.mode === 'create' ? '创建发货单' : '保存修改')}
            </button>
        </div>
    </form>
{/if}

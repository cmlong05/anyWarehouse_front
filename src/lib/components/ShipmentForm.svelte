<script lang="ts">
    import { onMount } from 'svelte';
    import { useShipmentForm } from '$lib/composables/useShipmentForm.svelte';
    import type { Shipment } from '$lib/shipmentTypes';
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

    const form = useShipmentForm({ mode, shipmentId, initialOrderId, onSuccess });

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
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 左侧：可选的订单明细 -->
                <OrderItemsList
                    items={form.displayableOrderItems}
                    totalPending={form.totalPending}
                    totalPrepared={form.totalPrepared}
                    onAdd={form.addItemToPlan}
                />

                <!-- 右侧：已选的发货计划明细 -->
                <PlanItemsList
                    items={form.planItems}
                    totalPlanned={form.totalPlanned}
                    onRemove={form.removePlanItem}
                    onClear={form.clearAllPlan}
                    onFillAll={form.fillAllPending}
                />
            </div>
        {/if}

        <!-- 收货信息 -->
        <ShippingInfo
            bind:address={form.shippingAddress}
            bind:contactPerson={form.contactPerson}
            bind:contactPhone={form.contactPhone}
        />

        <!-- 备注 -->
        <div class="form-control">
            <label class="label" for="notes">
                <span class="label-text">备注</span>
            </label>
            <textarea 
                id="notes"
                class="textarea textarea-bordered"
                bind:value={form.notes}
                placeholder="输入备注信息"
                rows="3"
            ></textarea>
        </div>

        <!-- 提示 -->
        {#if form.mode === 'create'}
            <div class="alert alert-info text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>提示：创建发货单后，可以在发货单详情页添加包裹，将计划明细打包到包裹中。</span>
            </div>
        {/if}

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-4 border-t">
            <button type="button" class="btn btn-ghost" onclick={() => onCancel?.()}>取消</button>
            <button 
                type="submit" 
                class="btn btn-primary relative"
                disabled={form.saving}
            >
                {form.saving ? '保存中...' : (form.mode === 'create' ? '创建发货单' : '保存修改')}
            </button>
        </div>
    </form>
{/if}

<style>
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .grid { display: grid; gap: 1.5rem; }
    @media (min-width: 1024px) {
        .lg\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    }
    
    .form-control { margin-bottom: 0.5rem; }
    .label { display: block; margin-bottom: 0.25rem; }
    .label-text { font-size: 0.875rem; color: #374151; }
    .textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        resize: vertical;
    }
    
    .alert {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: #dbeafe;
        color: #1e40af;
        border-radius: 0.375rem;
    }
    
    .flex { display: flex; }
    .justify-end { justify-content: flex-end; }
    .gap-3 { gap: 0.75rem; }
    .pt-4 { padding-top: 1rem; }
    .border-t { border-top: 1px solid #e5e7eb; }
    
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .btn-ghost {
        background: transparent;
        color: #6b7280;
    }
    
    .btn-ghost:hover:not(:disabled) {
        background: #f3f4f6;
    }
    
    .btn-primary {
        background: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
        background: #2563eb;
    }
</style>

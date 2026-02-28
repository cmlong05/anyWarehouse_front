<script lang="ts">
    import type { ShipmentStatus } from '$lib/shipmentTypes';
    import { SHIPMENT_STATUS_CHOICES } from '$lib/shipmentTypes';
    import type { SalesOrderBrief } from '$lib/index';

    interface Props {
        shipmentNo: string;
        status: ShipmentStatus;
        selectedOrderId: number | null;
        availableOrders: SalesOrderBrief[];
        mode: 'create' | 'edit';
        onOrderSelect: (orderId: number) => void;
    }
    
    let { 
        shipmentNo = $bindable(), 
        status = $bindable(), 
        selectedOrderId = $bindable(),
        availableOrders,
        mode,
        onOrderSelect
    }: Props = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="form-control">
        <label class="label" for="shipmentNo">
            <span class="label-text font-bold">📦 发货批次号 <span class="text-error">*</span></span>
        </label>
        <input 
            id="shipmentNo"
            type="text" 
            class="input input-bordered" 
            bind:value={shipmentNo}
            placeholder="输入发货批次号"
            disabled={mode === 'edit'}
        />
    </div>

    {#if mode === 'edit'}
        <div class="form-control">
            <label class="label" for="status">
                <span class="label-text font-bold">状态</span>
            </label>
            <select id="status" class="select select-bordered" bind:value={status} disabled>
                {#each SHIPMENT_STATUS_CHOICES as choice}
                    <option value={choice.value}>{choice.label}</option>
                {/each}
            </select>
            <span class="label-text-alt text-gray-500 mt-1">状态变更请使用操作按钮</span>
        </div>
    {/if}

    <div class="form-control {mode === 'edit' ? 'md:col-span-2' : ''}">
        <label class="label" for="orderSelect">
            <span class="label-text font-bold">📋 关联订单 <span class="text-error">*</span></span>
        </label>
        <select 
            id="orderSelect"
            class="select select-bordered" 
            bind:value={selectedOrderId}
            onchange={() => selectedOrderId && onOrderSelect(selectedOrderId)}
            disabled={mode === 'edit'}
        >
            <option value={null}>请选择订单</option>
            {#each availableOrders as order}
                <option value={order.id}>
                    {order.order_number} - {order.customer_name} ({order.total_quantity}件)
                </option>
            {/each}
        </select>
        {#if mode === 'edit'}
            <span class="label-text-alt text-gray-500 mt-1">编辑模式不可更改关联订单</span>
        {/if}
    </div>
</div>

<style>
    .form-control { margin-bottom: 0.5rem; }
    .label { display: block; margin-bottom: 0.25rem; }
    .label-text { font-size: 0.875rem; color: #374151; }
    .text-error { color: #dc2626; }
    .input, .select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
    }
    .input:disabled, .select:disabled {
        background-color: #f3f4f6;
        cursor: not-allowed;
    }
    .grid { display: grid; gap: 1rem; }
    @media (min-width: 768px) {
        .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .md\:col-span-2 { grid-column: span 2; }
    }
</style>

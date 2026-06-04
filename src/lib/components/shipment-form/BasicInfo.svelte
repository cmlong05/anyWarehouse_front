<!-- 发货单基本信息 -->
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
        orderLocked?: boolean;
        onOrderSelect: (orderId: number) => void;
    }
    
    let { 
        shipmentNo = $bindable(), 
        status = $bindable(), 
        selectedOrderId = $bindable(),
        availableOrders,
        mode,
        orderLocked = false,
        onOrderSelect
    }: Props = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="mb-2">
        <label class="block mb-1" for="shipmentNo">
            <span class="text-sm text-gray-700 font-bold">📦 发货批次号 <span class="text-red-600">*</span></span>
        </label>
        <input 
            id="shipmentNo"
            type="text" 
            class="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed" 
            bind:value={shipmentNo}
            placeholder="输入发货批次号"
            disabled={mode === 'edit'}
        />
    </div>

    {#if mode === 'edit'}
        <div class="mb-2">
            <label class="block mb-1" for="status">
                <span class="text-sm text-gray-700 font-bold">状态</span>
            </label>
            <select id="status" class="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed" bind:value={status} disabled>
                {#each SHIPMENT_STATUS_CHOICES as choice}
                    <option value={choice.value}>{choice.label}</option>
                {/each}
            </select>
            <span class="text-xs text-gray-500 mt-1 block">状态变更请使用操作按钮</span>
        </div>
    {/if}

    <div class="mb-2 {mode === 'edit' || orderLocked ? 'md:col-span-2' : ''}">
        <label class="block mb-1" for="orderSelect">
            <span class="text-sm text-gray-700 font-bold">📋 关联订单 <span class="text-red-600">*</span></span>
        </label>
        {#if orderLocked}
            <div class="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                {#if selectedOrderId}
                    {#each availableOrders as order}
                        {#if order.id === selectedOrderId}
                            <div class="font-medium">{order.order_number}</div>
                            <div class="text-gray-500">{order.customer_name} · {order.total_quantity}件</div>
                        {/if}
                    {/each}
                {:else}
                    <div class="text-gray-500">已锁定关联订单</div>
                {/if}
            </div>
        {:else}
            <select 
                id="orderSelect"
                class="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed" 
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
        {/if}
        {#if mode === 'edit'}
            <span class="text-xs text-gray-500 mt-1 block">编辑模式不可更改关联订单</span>
        {:else if orderLocked}
            <span class="text-xs text-gray-500 mt-1 block">来自销售订单页面创建，关联订单已锁定。</span>
        {/if}
    </div>
</div>

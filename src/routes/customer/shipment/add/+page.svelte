<!-- 新增发货单页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { ShipmentForm } from '$lib/components';
    import type { Shipment } from '$lib/shipmentTypes';

    // 获取URL参数
    const currentPage = page;
    const orderId = currentPage.url.searchParams.get('order_id');
    const initialOrderId = orderId ? parseInt(orderId) : undefined;

    function handleSuccess(shipment: Shipment) {
        setTimeout(() => {
            goto(`/customer/shipment/${shipment.id}`);
        }, 1000);
    }

    function handleCancel() {
        goto('/customer/shipment');
    }
</script>

<svelte:head>
    <title>新建发货单 - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-5xl">
    <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm" aria-label="返回" onclick={handleCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>
        <h1 class="text-2xl font-bold">新建发货单</h1>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <ShipmentForm 
            mode="create" 
            {initialOrderId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    </div>
</div>
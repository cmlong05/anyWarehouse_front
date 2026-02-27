<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import ShipmentForm from '$lib/components/ShipmentForm.svelte';
    import type { Shipment } from '$lib/shipmentTypes';

    // 获取发货单ID
    let shipmentId = $derived(parseInt($page.params.id));

    function handleSuccess(shipment: Shipment) {
        setTimeout(() => {
            goto(`/customer/shipment/${shipment.id}`);
        }, 1000);
    }

    function handleCancel() {
        goto(`/customer/shipment/${shipmentId}`);
    }
</script>

<svelte:head>
    <title>编辑发货单 - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-5xl">
    <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm" aria-label="返回" onclick={handleCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>
        <h1 class="text-2xl font-bold">编辑发货单</h1>
    </div>

    {#if shipmentId}
        <div class="bg-white rounded-lg shadow p-6">
            <ShipmentForm 
                mode="edit" 
                {shipmentId}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </div>
    {:else}
        <div class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
    {/if}
</div>

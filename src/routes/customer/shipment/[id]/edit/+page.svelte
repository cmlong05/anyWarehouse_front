<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import ShipmentForm from '$lib/components/ShipmentForm.svelte';
    import { shipmentAPI } from '$lib/api';
    import type { Shipment } from '$lib/shipmentTypes';
    import Loading from '$lib/components/Loading.svelte';

    // 获取发货单ID
    let shipmentId = $derived(parseInt(page.params.id || '0'));
    
    // 检查状态
    let checking = $state(true);
    let checkError = $state('');

    onMount(async () => {
        if (!shipmentId) {
            checking = false;
            return;
        }
        
        try {
            const shipment = await shipmentAPI.get(shipmentId);
            // 只有草稿或已同步状态可以编辑
            const editableStatuses = ['draft', 'synced'];
            if (!editableStatuses.includes(shipment.status)) {
                // 不可编辑，重定向到详情页
                goto(`/customer/shipment/${shipmentId}`, { replaceState: true });
                return;
            }
            checking = false;
        } catch (err) {
            checkError = getErrorMessage(err, '加载发货单失败');
            checking = false;
        }
    });

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

    {#if checking}
        <div class="flex justify-center py-12">
            <Loading />
        </div>
    {:else if checkError}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {checkError}
        </div>
    {:else if shipmentId}
        <div class="bg-white rounded-lg shadow p-6">
            <ShipmentForm 
                mode="edit" 
                {shipmentId}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </div>
    {:else}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            无效的发货单ID
        </div>
    {/if}
</div>

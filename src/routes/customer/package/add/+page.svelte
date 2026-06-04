<!-- 新增包裹页 -->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import PackageForm from '$lib/components/PackageForm.svelte';
    import type { Package } from '$lib/shipmentTypes';

    // 获取URL参数
    const currentPage = page;
    const shipmentId = currentPage.url.searchParams.get('shipment_id');
    const initialShipmentId = shipmentId ? parseInt(shipmentId) : undefined;

    function handleSuccess(pkg: Package) {
        setTimeout(() => {
            goto(`/customer/package/${pkg.id}`);
        }, 1000);
    }

    function handleCancel() {
        goto('/customer/package');
    }
</script>

<svelte:head>
    <title>新建包裹 - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-5xl">
    <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm" onclick={handleCancel} aria-label="返回">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>
        <h1 class="text-2xl font-bold">新建包裹</h1>
    </div>

    <PackageForm 
        mode="create" 
        {initialShipmentId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
    />
</div>
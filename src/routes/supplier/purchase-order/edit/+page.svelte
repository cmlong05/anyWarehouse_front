<!-- 编辑采购订单页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { purchaseOrderAPI, supplierAPI } from '$lib/api';
    import type { PurchaseOrder, PurchaseOrderUpdateRequest } from '$lib';
    import { Alert, Loading } from '$lib/components';
    import { Breadcrumb } from '$lib/components';
    import PurchaseOrderForm from '$lib/components/PurchaseOrderForm.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    // 从URL获取订单ID
    const orderId = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const id = urlParams.get('id');
        return id ? parseInt(id) : null;
    });
    
    let order = $state<PurchaseOrder | null>(null);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '供应商管理', href: '/supplier' },
        order ? { label: order.supplier_detail?.name || '供应商', href: `/supplier/${order.supplier}` } : null,
        { label: '采购订单详情', href: order ? `/supplier/purchase-order/${order.id}` : '' },
        { label: '编辑订单', href: '' },
    ].filter(Boolean) as { label: string; href: string }[]);

    function canEditOrder(status: string): boolean {
        return ['draft', 'pending', 'approved', 'ordered', 'partial'].includes(status);
    }
    
    async function loadOrder() {
        const id = orderId();
        if (!id) {
            error = '未指定订单ID';
            loading = false;
            return;
        }
        
        try {
            const data = await purchaseOrderAPI.get(id);
            if (!canEditOrder(data.status)) {
                error = '当前订单状态不支持编辑';
                loading = false;
                return;
            }
            order = data;
        } catch (err) {
            error = err instanceof Error ? err.message : '加载订单信息失败';
        } finally {
            loading = false;
        }
    }
    
    async function handleSubmit(data: PurchaseOrderUpdateRequest) {
        if (!order) return;
        
        submitting = true;
        error = '';
        
        try {
            await purchaseOrderAPI.update(order.id, {
                ...data,
                status: 'pending',
            });
            // 更新成功后跳转到订单详情页
            goto(`/supplier/purchase-order/${order.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '更新采购订单失败';
            submitting = false;
        }
    }
    
    function handleCancel() {
        // 取消后返回订单详情页
        const id = orderId();
        if (id) {
            goto(`/supplier/purchase-order/${id}`);
        } else {
            goto('/supplier/purchase-order');
        }
    }
    
    onMount(() => {
        loadOrder();
    });
</script>

<svelte:head>
    <title>编辑采购订单</title>
</svelte:head>

<PageContainer maxWidth="xl">
    <Breadcrumb items={breadcrumbs} />
    
    <PageHeader title="编辑采购订单" mb="md">
        {#snippet actions()}
            {#if order}
                <span class="bg-sky-100 text-sky-700 px-4 py-2 rounded-full text-sm font-medium">
                    订单: {order.order_number}
                </span>
            {/if}
        {/snippet}
    </PageHeader>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else if error}
        <Alert error={error} />
        <div class="flex gap-4 mt-4">
            <button class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors" onclick={() => goto('/supplier/purchase-order')}>
                返回订单列表
            </button>
        </div>
    {:else if order}
        <div class="bg-white p-6 rounded-lg border border-gray-200 md:p-4">
            <PurchaseOrderForm
                purchaseOrder={order}
                supplierId={order.supplier}
                supplier={order.supplier_detail}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitLabel="保存修改"
                loading={submitting}
            />
        </div>
    {/if}
</PageContainer>
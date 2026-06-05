<!-- 编辑销售订单页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { salesOrderAPI, customerAPI } from '$lib/api';
    import { getErrorMessage } from '$lib/utils/errors';
    import type { Customer, SalesOrder, SalesOrderUpdateRequest } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import SalesOrderForm from '$lib/components/SalesOrderForm.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    // 获取订单ID
    let orderId = $derived(parseInt(page.params.id || '0'));
    
    let order = $state<SalesOrder | null>(null);
    let customer = $state<Customer | null>(null);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '销售订单', href: '/customer/sales-order' },
        order ? { label: order.order_number, href: `/customer/sales-order/${orderId}` } : null,
        { label: '编辑', href: '' },
    ].filter(Boolean) as { label: string; href: string }[]);
    
    async function loadData() {
        try {
            loading = true;
            const orderData = await salesOrderAPI.get(orderId);
            order = orderData;
            
            // 加载客户信息
            if (order.customer) {
                const customerData = await customerAPI.get(order.customer);
                customer = customerData;
            }
        } catch (err) {
            error = err instanceof Error ? err.message : '加载订单失败';
        } finally {
            loading = false;
        }
    }
    
    async function handleSubmit(data: SalesOrderUpdateRequest) {
        submitting = true;
        error = '';
        
        try {
            // 编辑接口不接受 customer 字段（仅创建时需要）
            const { customer: _customer, ...updatePayload } = data as SalesOrderUpdateRequest & { customer?: number };
            await salesOrderAPI.update(orderId, updatePayload);
            // 更新成功后跳转到订单详情页
            goto(`/customer/sales-order/${orderId}`);
        } catch (err) {
            error = getErrorMessage(err, '更新销售订单失败');
            submitting = false;
        }
    }
    
    function handleCancel() {
        goto(`/customer/sales-order/${orderId}`);
    }
    
    onMount(() => {
        loadData();
    });
</script>

<svelte:head>
    <title>编辑销售订单 - AnyWarehouse</title>
</svelte:head>

<PageContainer maxWidth="xl">
    <Breadcrumb items={breadcrumbs} />
    
    <PageHeader title="编辑销售订单" mb="md" />
    
    {#if loading}
        <Loading />
    {:else if error}
        <Alert error={{ message: error }} />
        <div class="mt-4">
            <button class="btn btn-secondary" onclick={handleCancel}>返回</button>
        </div>
    {:else if order && customer}
        <SalesOrderForm
            {customer}
            customerId={customer.id}
            salesOrder={order}
            submitLabel="保存修改"
            loading={submitting}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        />
    {/if}
</PageContainer>
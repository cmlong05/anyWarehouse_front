<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { salesOrderAPI, customerAPI } from '$lib/api';
    import type { Customer, SalesOrderCreateRequest } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    
    // 从URL获取客户ID
    const customerId = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const id = urlParams.get('customer_id');
        return id ? parseInt(id) : null;
    });
    
    let customer = $state<Customer | null>(null);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let preloadItems = $state<any[] | null>(null);
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customer' },
        customer ? { label: customer.name, href: `/customer/${customer.id}` } : null,
        { label: '新建销售订单', href: '' },
    ].filter(Boolean) as { label: string; href: string }[]);
    
    async function loadCustomer() {
        const id = customerId();
        if (!id) {
            error = '未指定客户ID';
            loading = false;
            return;
        }
        
        try {
            const data = await customerAPI.get(id);
            customer = data;
        } catch (err) {
            error = err instanceof Error ? err.message : '加载客户信息失败';
        } finally {
            loading = false;
        }
    }
    
    async function handleSubmit(data: SalesOrderCreateRequest) {
        submitting = true;
        error = '';
        
        try {
            await salesOrderAPI.create(data);
            // 创建成功后跳转到客户详情页
            goto(`/customer/${customer?.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '创建销售订单失败';
            submitting = false;
        }
    }
    
    function handleCancel() {
        // 取消后返回客户详情页
        const id = customerId();
        if (id) {
            goto(`/customer/${id}`);
        } else {
            goto('/customer');
        }
    }
    
    onMount(() => {
        loadCustomer();
        
        // 检查是否有预加载的报价数据
        const preloadData = sessionStorage.getItem('sales_order_preload_items');
        if (preloadData) {
            try {
                const parsed = JSON.parse(preloadData);
                const currentCustomerId = customerId();
                if (parsed.customer_id === currentCustomerId && parsed.items?.length > 0) {
                    preloadItems = parsed.items;
                }
                // 清除 sessionStorage 中的数据
                sessionStorage.removeItem('sales_order_preload_items');
            } catch {
                // 解析失败，忽略
            }
        }
    });
</script>

<svelte:head>
    <title>新建销售订单</title>
</svelte:head>

<div class="content-container">
    <Breadcrumb items={breadcrumbs} />
    
    <div class="page-header">
        <h1>新建销售订单</h1>
        {#if customer}
            <span class="customer-badge">
                客户: {customer.name}
            </span>
        {/if}
    </div>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else if error && !customer}
        <Alert error={error} />
        <div class="actions">
            <button class="btn btn-secondary" onclick={() => goto('/customer')}>
                返回客户列表
            </button>
        </div>
    {:else if customer}
        {#if error}
            <Alert error={error} onDismiss={() => error = ''} />
        {/if}
        
        <div class="form-container">
            <!-- 使用现有的 PurchaseOrderForm，但传入不同参数 -->
            <SalesOrderForm
                customerId={customer.id}
                customer={customer}
                {preloadItems}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitLabel="创建订单"
                loading={submitting}
            />
        </div>
    {/if}
</div>

<style>
    .content-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        color: #1f2937;
    }
    
    .customer-badge {
        background: #e0f2fe;
        color: #0369a1;
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .form-container {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.95rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }
</style>

<!-- 导入 SalesOrderForm 组件 -->
<script lang="ts" context="module">
    import SalesOrderForm from '$lib/components/SalesOrderForm.svelte';
</script>

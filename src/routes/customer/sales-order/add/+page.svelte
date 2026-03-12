<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { salesOrderAPI, customerAPI } from '$lib/api';
    import type { Customer, SalesOrderCreateRequest } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import SalesOrderForm from '$lib/components/SalesOrderForm.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
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
    let preloadQuotationPrices = $state<Record<string, { price: number; currency: string }> | null>(null);
    let copyFromOrder = $state<{ order_number: string; order_data: any } | null>(null);
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customer' },
        customer ? { label: customer.name, href: `/customer/${customer.id}` } : null,
        { label: copyFromOrder ? '复制销售订单' : '新建销售订单', href: '' },
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
            const newOrder = await salesOrderAPI.create(data);
            // 清除复制的数据
            sessionStorage.removeItem('sales_order_copy_data');
            // 创建成功后跳转到新订单详情页
            goto(`/customer/sales-order/${newOrder.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '创建销售订单失败';
            submitting = false;
        }
    }
    
    function handleCancel() {
        // 清除复制的数据
        sessionStorage.removeItem('sales_order_copy_data');
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
        
        // 检查是否有复制的订单数据
        const copyDataStr = sessionStorage.getItem('sales_order_copy_data');
        if (copyDataStr) {
            try {
                const copyData = JSON.parse(copyDataStr);
                const currentCustomerId = customerId();
                
                // 验证客户ID匹配
                if (copyData.customer_id === currentCustomerId && copyData.order_data) {
                    copyFromOrder = {
                        order_number: copyData.copy_from_order_number,
                        order_data: copyData.order_data
                    };
                    // 设置预加载的明细
                    if (copyData.order_data.items?.length > 0) {
                        preloadItems = copyData.order_data.items.map((item: any) => ({
                            item: item.item,
                            sku: item.sku,
                            item_name: item.item_name,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            notes: item.notes
                        }));
                    }
                } else {
                    // 客户不匹配，清除数据
                    sessionStorage.removeItem('sales_order_copy_data');
                }
            } catch {
                // 解析失败，清除数据
                sessionStorage.removeItem('sales_order_copy_data');
            }
        }
        
        // 检查是否有从报价选择的预加载数据
        const preloadDataStr = sessionStorage.getItem('sales_order_preload_items');
        if (preloadDataStr) {
            try {
                const preloadData = JSON.parse(preloadDataStr);
                const currentCustomerId = customerId();
                
                // 验证客户ID匹配
                if (preloadData.partner_id === currentCustomerId && preloadData.items?.length > 0) {
                    preloadItems = preloadData.items.map((item: any) => ({
                        item: item.item,
                        sku: item.sku,
                        item_name: item.item_name,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        quotation_id: item.quotation_id
                    }));
                    // 保留所有报价价格信息（用于变体价格显示）
                    preloadQuotationPrices = preloadData.all_quotation_prices || {};
                }
                // 清除 sessionStorage 中的数据
                sessionStorage.removeItem('sales_order_preload_items');
            } catch {
                // 解析失败，清除数据
                sessionStorage.removeItem('sales_order_preload_items');
            }
        }
    });
</script>

<svelte:head>
    <title>{copyFromOrder ? '复制销售订单' : '新建销售订单'}</title>
</svelte:head>

<PageContainer maxWidth="xl">
    <Breadcrumb items={breadcrumbs} />
    
    <PageHeader 
        title={copyFromOrder ? '复制销售订单' : '新建销售订单'} 
        mb="md"
    >
        {#snippet left()}
            {#if copyFromOrder}
                <span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                    复制自: {copyFromOrder.order_number}
                </span>
            {/if}
        {/snippet}
        {#snippet actions()}
            {#if customer}
                <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-sky-100 text-sky-700">
                    客户: {customer.name}
                </span>
            {/if}
        {/snippet}
    </PageHeader>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else if error && !customer}
        <Alert error={error} />
        <div class="flex gap-4 mt-4">
            <button 
                class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" 
                onclick={() => goto('/customer')}
            >
                返回客户列表
            </button>
        </div>
    {:else if customer}
        {#if error}
            <Alert error={error} onDismiss={() => error = ''} />
        {/if}
        
        <div class="bg-white p-6 rounded-lg border border-gray-200">
            <SalesOrderForm
                customerId={customer.id}
                customer={customer}
                salesOrder={copyFromOrder?.order_data}
                {preloadItems}
                {preloadQuotationPrices}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitLabel={copyFromOrder ? '创建订单' : '创建订单'}
                loading={submitting}
            />
        </div>
    {/if}
</PageContainer>

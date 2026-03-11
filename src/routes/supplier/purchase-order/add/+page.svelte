<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { purchaseOrderAPI, supplierAPI } from '$lib/api';
    import type { Supplier, PurchaseOrderCreateRequest } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import PurchaseOrderForm from '$lib/components/PurchaseOrderForm.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    // 从URL获取供应商ID
    const supplierId = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const id = urlParams.get('supplier_id');
        return id ? parseInt(id) : null;
    });
    
    let supplier = $state<Supplier | null>(null);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let preloadItems = $state<any[] | null>(null);
    let preloadQuotationPrices = $state<Record<string, { price: number; currency: string }> | null>(null);
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '供应商管理', href: '/supplier' },
        supplier ? { label: supplier.name, href: `/supplier/${supplier.id}` } : null,
        { label: '新建采购订单', href: '' },
    ].filter(Boolean) as { label: string; href: string }[]);
    
    async function loadSupplier() {
        const id = supplierId();
        if (!id) {
            error = '未指定供应商ID';
            loading = false;
            return;
        }
        
        try {
            const data = await supplierAPI.get(id);
            supplier = data;
        } catch (err) {
            error = err instanceof Error ? err.message : '加载供应商信息失败';
        } finally {
            loading = false;
        }
    }
    
    async function handleSubmit(data: PurchaseOrderCreateRequest) {
        submitting = true;
        error = '';
        
        try {
            await purchaseOrderAPI.create(data);
            // 创建成功后跳转到供应商详情页
            goto(`/supplier/${supplier?.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '创建采购订单失败';
            submitting = false;
        }
    }
    
    function handleCancel() {
        // 取消后返回供应商详情页
        const id = supplierId();
        if (id) {
            goto(`/supplier/${id}`);
        } else {
            goto('/supplier');
        }
    }
    
    onMount(() => {
        loadSupplier();
        
        // 检查是否有预加载的报价数据
        const preloadData = sessionStorage.getItem('purchase_order_preload_items');
        if (preloadData) {
            try {
                const parsed = JSON.parse(preloadData);
                const currentSupplierId = supplierId();
                if (parsed.supplier_id === currentSupplierId && parsed.items?.length > 0) {
                    preloadItems = parsed.items;
                    // 保留所有报价价格信息（用于变体价格显示）
                    preloadQuotationPrices = parsed.all_quotation_prices || {};
                }
                // 清除 sessionStorage 中的数据
                sessionStorage.removeItem('purchase_order_preload_items');
            } catch {
                // 解析失败，忽略
            }
        }
    });
</script>

<svelte:head>
    <title>新建采购订单</title>
</svelte:head>

<PageContainer maxWidth="xl">
    <Breadcrumb items={breadcrumbs} />
    
    <PageHeader title="新建采购订单" mb="md">
        {#snippet actions()}
            {#if supplier}
                <span class="supplier-badge">
                    供应商: {supplier.name}
                </span>
            {/if}
        {/snippet}
    </PageHeader>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else if error && !supplier}
        <Alert error={error} />
        <div class="actions">
            <button class="btn btn-secondary" onclick={() => goto('/supplier')}>
                返回供应商列表
            </button>
        </div>
    {:else if supplier}
        {#if error}
            <Alert error={error} onDismiss={() => error = ''} />
        {/if}
        
        <div class="form-container">
            <PurchaseOrderForm
                supplierId={supplier.id}
                supplier={supplier}
                {preloadItems}
                {preloadQuotationPrices}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitLabel="创建订单"
                loading={submitting}
            />
        </div>
    {/if}
</PageContainer>

<style>
    .supplier-badge {
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
    
    @media (max-width: 768px) {
        .form-container {
            padding: 1rem;
        }
    }
</style>

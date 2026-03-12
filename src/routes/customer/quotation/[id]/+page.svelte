<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { customerQuotationAPI } from '$lib/api';
    import type { CustomerQuotation } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    let quotation = $state<CustomerQuotation | null>(null);
    let loading = $state(true);
    let error = $state('');
    
    const id = $derived(parseInt(page.params.id || '0'));
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customer' },
        { label: quotation?.customer_detail?.name ?? '客户', href: quotation ? `/customer/${quotation.customer}` : '/customer' },
        { label: '报价详情', href: `/customer/quotation/${id}` },
    ]);
    
    async function loadQuotation() {
        loading = true;
        error = '';
        
        try {
            quotation = await customerQuotationAPI.get(id);
        } catch (err) {
            error = err instanceof Error ? err.message : '加载报价信息失败';
        } finally {
            loading = false;
        }
    }
    
    async function deleteQuotation() {
        if (!quotation) return;
        
        if (!confirm(`确定要删除此报价吗？\n\n客户: ${quotation.customer_detail?.name}\n物品: ${quotation.item_detail?.SKU || quotation.sku}\n价格: ${quotation.price} ${quotation.currency}`)) {
            return;
        }
        
        try {
            await customerQuotationAPI.delete(id);
            goto(`/customer/${quotation.customer}`);
        } catch (err) {
            error = err instanceof Error ? err.message : '删除失败';
        }
    }
    
    onMount(() => {
        loadQuotation();
    });
</script>

<svelte:head>
    <title>{quotation ? `报价详情 - ${quotation.item_detail?.SKU || quotation.sku}` : '报价详情'}</title>
</svelte:head>

<PageContainer maxWidth="xl">
    <Breadcrumb items={breadcrumbs} />
    
    {#if loading}
        <Loading text="加载报价信息..." />
    {:else if error}
        <Alert error={error} onDismiss={() => error = ''} />
        <div class="flex gap-4 mt-4">
            <button class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors" onclick={() => goto('/customer')}>
                返回客户列表
            </button>
            <button class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors" onclick={loadQuotation}>
                重试
            </button>
        </div>
    {:else if quotation}
        <PageHeader title="报价详情" mb="md">
            {#snippet left()}
                {#if quotation?.is_preferred}
                    <span class="bg-green-100 text-green-800 text-sm px-3 py-1.5 rounded-full font-medium">★ 首选报价</span>
                {/if}
            {/snippet}
            {#snippet actions()}
                <a href="/customer/quotation/{id}/edit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">编辑</a>
                <button class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm" onclick={deleteQuotation}>删除</button>
            {/snippet}
        </PageHeader>
        
        <div class="grid gap-6 mb-6 md:grid-cols-1" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
            <div class="bg-white p-6 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">客户信息</h3>
                <div class="flex flex-col gap-3">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 text-sm">客户编号</span>
                        <span class="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{quotation.customer_detail?.code || '-'}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 text-sm">客户名称</span>
                        <span class="font-medium text-gray-900">
                            <a href="/customer/{quotation.customer}" class="text-blue-500 hover:underline">{quotation.customer_detail?.name || '-'}</a>
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">物品信息</h3>
                <div class="flex flex-col gap-3">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 text-sm">SKU</span>
                        <span class="font-medium">
                            {#if quotation.item}
                                <a href="/item/{quotation.item}" class="text-blue-500 hover:underline font-mono bg-gray-100 px-2 py-1 rounded text-sm">{quotation.sku || quotation.item_detail?.SKU || '-'}</a>
                            {:else}
                                <span class="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{quotation.sku || '-'}</span>
                            {/if}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 text-sm">物品名称</span>
                        <span class="font-medium text-gray-900">
                            {#if quotation.item}
                                <a href="/item/{quotation.item}" class="text-blue-500 hover:underline">{quotation.item_detail?.name || '-'}</a>
                            {:else}
                                {quotation.item_detail?.name || '-'}
                            {/if}
                        </span>
                    </div>
                    {#if quotation.item_detail?.weight}
                        <div class="flex justify-between items-center">
                            <span class="text-gray-500 text-sm">重量</span>
                            <span class="font-medium">{quotation.item_detail.weight} g</span>
                        </div>
                    {/if}
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">价格信息</h3>
                <div class="flex flex-col gap-3">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 text-sm">单价</span>
                        <span class="font-medium text-blue-500 text-lg">{quotation.price} {quotation.currency}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 text-sm">最小订购量</span>
                        <span class="font-medium">{quotation.min_quantity}</span>
                    </div>
                    {#if quotation.total_price}
                        <div class="flex justify-between items-center">
                            <span class="text-gray-500 text-sm">总价</span>
                            <span class="font-medium text-blue-500 text-lg">{quotation.total_price} {quotation.currency}</span>
                        </div>
                    {/if}
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">其他信息</h3>
                <div class="flex flex-col gap-3">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 text-sm">交货周期</span>
                        <span class="font-medium">{quotation.lead_time_days ? `${quotation.lead_time_days} 天` : '-'}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 text-sm">有效期开始</span>
                        <span class="font-medium">{quotation.valid_from || '-'}</span>
                    </div>

                </div>
            </div>
        </div>
        
        {#if quotation.note}
            <div class="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-4">备注</h3>
                <p class="text-gray-600 leading-relaxed whitespace-pre-wrap m-0">{quotation.note}</p>
            </div>
        {/if}
        
        <div class="text-gray-500 text-sm py-4 border-t border-gray-200">
            <p class="my-1">创建时间: {new Date(quotation.created_at).toLocaleString()}</p>
            <p class="my-1">更新时间: {new Date(quotation.updated_at).toLocaleString()}</p>
        </div>
    {/if}
</PageContainer>

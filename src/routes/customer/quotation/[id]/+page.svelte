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
    
    const id = $derived(parseInt(page.params.id));
    
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
        <div class="actions">
            <button class="btn btn-secondary" onclick={() => goto('/customer')}>
                返回客户列表
            </button>
            <button class="btn btn-primary" onclick={loadQuotation}>
                重试
            </button>
        </div>
    {:else if quotation}
        <PageHeader title="报价详情" mb="md">
            {#snippet left()}
                {#if quotation?.is_preferred}
                    <span class="preferred-badge">★ 首选报价</span>
                {/if}
            {/snippet}
            {#snippet actions()}
                <a href="/customer/quotation/{id}/edit" class="btn btn-primary btn-sm">编辑</a>
                <button class="btn btn-error btn-sm" onclick={deleteQuotation}>删除</button>
            {/snippet}
        </PageHeader>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>客户信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">客户编号</span>
                        <span class="value code">{quotation.customer_detail?.code || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">客户名称</span>
                        <span class="value">
                            <a href="/customer/{quotation.customer}" class="link">{quotation.customer_detail?.name || '-'}</a>
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="info-card">
                <h3>物品信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">SKU</span>
                        <span class="value code">{quotation.sku || quotation.item_detail?.SKU || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">物品名称</span>
                        <span class="value">{quotation.item_detail?.name || '-'}</span>
                    </div>
                    {#if quotation.item_detail?.weight}
                        <div class="info-item">
                            <span class="label">重量</span>
                            <span class="value">{quotation.item_detail.weight} g</span>
                        </div>
                    {/if}
                </div>
            </div>
            
            <div class="info-card">
                <h3>价格信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">单价</span>
                        <span class="value highlight">{quotation.price} {quotation.currency}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">最小订购量</span>
                        <span class="value">{quotation.min_quantity}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">邮费/运费</span>
                        <span class="value">{quotation.postage || '-'}</span>
                    </div>
                    {#if quotation.total_price}
                        <div class="info-item">
                            <span class="label">总价（含运费）</span>
                            <span class="value highlight">{quotation.total_price} {quotation.currency}</span>
                        </div>
                    {/if}
                </div>
            </div>
            
            <div class="info-card">
                <h3>其他信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">交货周期</span>
                        <span class="value">{quotation.lead_time_days ? `${quotation.lead_time_days} 天` : '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">有效期开始</span>
                        <span class="value">{quotation.valid_from || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">有效期结束</span>
                        <span class="value">{quotation.valid_until || '-'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {#if quotation.note}
            <div class="remark-card">
                <h3>备注</h3>
                <p>{quotation.note}</p>
            </div>
        {/if}
        
        <div class="meta-info">
            <p>创建时间: {new Date(quotation.created_at).toLocaleString()}</p>
            <p>更新时间: {new Date(quotation.updated_at).toLocaleString()}</p>
        </div>
    {/if}
</PageContainer>

<style>
    .preferred-badge {
        background-color: #dcfce7;
        color: #166534;
        font-size: 0.8rem;
        padding: 0.375rem 0.75rem;
        border-radius: 9999px;
        font-weight: 500;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }
    
    .info-card {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .info-card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #374151;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #f3f4f6;
    }
    
    .info-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .info-item .label {
        color: #6b7280;
        font-size: 0.9rem;
    }
    
    .info-item .value {
        color: #1f2937;
        font-weight: 500;
    }
    
    .info-item .value.code {
        font-family: monospace;
        background-color: #f3f4f6;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.9rem;
    }
    
    .info-item .value.highlight {
        color: #3b82f6;
        font-size: 1.1rem;
    }
    
    .link {
        color: #3b82f6;
        text-decoration: none;
    }
    
    .link:hover {
        text-decoration: underline;
    }
    
    .remark-card {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        margin-bottom: 1.5rem;
    }
    
    .remark-card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #374151;
    }
    
    .remark-card p {
        margin: 0;
        color: #4b5563;
        line-height: 1.6;
        white-space: pre-wrap;
    }
    
    .meta-info {
        color: #6b7280;
        font-size: 0.85rem;
        padding: 1rem 0;
        border-top: 1px solid #e5e7eb;
    }
    
    .meta-info p {
        margin: 0.25rem 0;
    }
    
    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    @media (max-width: 768px) {
        .info-grid {
            grid-template-columns: 1fr;
        }
    }
</style>

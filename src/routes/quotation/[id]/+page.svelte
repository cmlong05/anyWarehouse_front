<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { quotationAPI } from '$lib/api';
    import type { Quotation } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    
    let quotation = $state<Quotation | null>(null);
    let loading = $state(true);
    let error = $state('');
    
    const id = $derived(parseInt(page.params.id));
    
    async function loadQuotation() {
        loading = true;
        error = '';
        try {
            quotation = await quotationAPI.get(id);
        } catch (err) {
            error = err instanceof Error ? err.message : '加载失败';
        } finally {
            loading = false;
        }
    }
    
    function editQuotation() {
        goto(`/quotation/${id}/edit`);
    }
    
    async function deleteQuotation() {
        if (!confirm('确定要删除此报价吗？此操作无法撤销。')) {
            return;
        }
        try {
            await quotationAPI.delete(id);
            goto('/quotation');
        } catch (err) {
            error = err instanceof Error ? err.message : '删除失败';
        }
    }
    
    async function togglePreferred() {
        if (!quotation) return;
        try {
            const updated = await quotationAPI.setPreferred(id, !quotation.is_preferred);
            quotation = { ...quotation, is_preferred: updated.is_preferred };
        } catch (err) {
            error = err instanceof Error ? err.message : '操作失败';
        }
    }
    
    function formatDate(dateStr: string | null): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-CN');
    }
    
    function formatPrice(price: string): string {
        return parseFloat(price).toFixed(2);
    }
    
    onMount(loadQuotation);
</script>

<div class="content-container">
    {#if loading}
        <Loading text="加载中..." />
    {:else if error}
        <Alert error={error} />
        <button class="btn btn-secondary" onclick={() => goto('/quotation')}>
            返回列表
        </button>
    {:else if quotation}
        <div class="detail-header">
            <div>
                <h1>
                    报价详情
                    {#if quotation.is_preferred}
                        <span class="badge preferred">★ 首选</span>
                    {/if}
                </h1>
                <p class="subtitle">ID: {quotation.id}</p>
            </div>
            <div class="actions">
                <button class="btn btn-secondary" onclick={() => goto('/quotation')}>
                    返回
                </button>
                <button class="btn btn-primary" onclick={togglePreferred}>
                    {quotation.is_preferred ? '取消首选' : '设为首选'}
                </button>
                <button class="btn btn-secondary" onclick={editQuotation}>
                    编辑
                </button>
                <button class="btn btn-danger" onclick={deleteQuotation}>
                    删除
                </button>
            </div>
        </div>
        
        <div class="detail-content">
            <div class="info-section">
                <h2>基本信息</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">供应商</span>
                        <a href="/supplier/{quotation.supplier}">
                            {quotation.supplier_detail?.name || '-'}
                        </a>
                    </div>
                    <div class="info-item">
                        <span class="info-label">SKU</span>
                        <span>{quotation.sku || quotation.item_detail?.SKU || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">物品名称</span>
                        <a href="/item/{quotation.item}">
                            {quotation.item_detail?.name || '-'}
                        </a>
                    </div>
                    <div class="info-item">
                        <span class="info-label">单价</span>
                        <span class="price">{formatPrice(quotation.price)} {quotation.currency}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">最小订购量 (MOQ)</span>
                        <span>{quotation.min_quantity}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">总成本 (含运费)</span>
                        <span>{quotation.total_cost ? formatPrice(quotation.total_cost) : '-'} {quotation.currency}</span>
                    </div>
                </div>
            </div>
            
            <div class="info-section">
                <h2>附加信息</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">邮费/运费</span>
                        <span>{quotation.postage ? formatPrice(quotation.postage) : '-'} {quotation.currency}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">交货周期</span>
                        <span>{quotation.lead_time_days ? quotation.lead_time_days + ' 天' : '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">有效期开始</span>
                        <span>{formatDate(quotation.valid_from)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">有效期结束</span>
                        <span>{formatDate(quotation.valid_until)}</span>
                    </div>
                </div>
            </div>
            
            {#if quotation.note}
                <div class="info-section">
                    <h2>备注</h2>
                    <p class="note">{quotation.note}</p>
                </div>
            {/if}
            
            <div class="info-section">
                <h2>时间戳</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">创建时间</span>
                        <span>{formatDate(quotation.created_at)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">更新时间</span>
                        <span>{formatDate(quotation.updated_at)}</span>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .detail-header h1 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
    }
    
    .subtitle {
        color: var(--color-text-secondary, #666);
        margin: 0.25rem 0 0 0;
    }
    
    .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        color: #6b7280;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .badge.preferred {
        color: #f59e0b;
    }
    
    .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .detail-content {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
    
    .info-section {
        padding: 1.5rem 0;
        border-bottom: 1px solid var(--color-border, #e5e7eb);
    }
    
    .info-section:last-child {
        border-bottom: none;
    }
    
    .info-section h2 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: var(--color-text-secondary, #666);
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }
    
    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .info-item .info-label {
        font-size: 0.85rem;
        color: var(--color-text-secondary, #666);
    }
    
    .info-item span,
    .info-item a {
        font-weight: 500;
    }
    
    .info-item a {
        color: var(--color-primary, #3b82f6);
        text-decoration: none;
    }
    
    .info-item a:hover {
        text-decoration: underline;
    }
    
    .price {
        color: #059669;
        font-weight: 600;
    }
    
    .note {
        margin: 0;
        line-height: 1.6;
        white-space: pre-wrap;
    }
</style>

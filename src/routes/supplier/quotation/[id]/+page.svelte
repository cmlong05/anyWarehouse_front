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
    
    const id = $derived(parseInt(page.params.id || '0'));
    
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
        goto(`/supplier/quotation/${id}/edit`);
    }
    
    async function deleteQuotation() {
        if (!confirm('确定要删除此报价吗？此操作无法撤销。')) {
            return;
        }
        try {
            await quotationAPI.delete(id);
            goto(`/supplier/${quotation?.supplier}`);
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
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
    
    function formatPrice(price: string | null): string {
        if (!price) return '-';
        return parseFloat(price).toFixed(2);
    }

    function getDaysUntil(dateStr: string | null): number | null {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    
    onMount(loadQuotation);
</script>

<div class="quotation-detail">
    {#if loading}
        <Loading text="加载中..." />
    {:else if error}
        <div class="error-state">
            <Alert error={error} />
            <button class="btn btn-secondary" onclick={() => goto('/supplier')}>
                返回供应商列表
            </button>
        </div>
    {:else if quotation}
        <!-- 头部信息栏 -->
        <div class="header-bar">
            <div class="header-left">
                <span class="page-title">报价详情</span>
                <span class="doc-number">NO.{quotation.id.toString().padStart(6, '0')}</span>
                {#if quotation.is_preferred}
                    <span class="status-badge preferred">首选报价</span>
                {:else}
                    <span class="status-badge">标准报价</span>
                {/if}
            </div>
            <div class="header-actions">
                <button class="btn btn-primary" onclick={togglePreferred}>
                    {quotation.is_preferred ? '取消首选' : '设为首选'}
                </button>
                <button class="btn btn-secondary" onclick={editQuotation}>
                    编辑
                </button>
                <button class="btn btn-danger" onclick={deleteQuotation}>
                    删除
                </button>
                <button class="btn btn-secondary" onclick={() => goto(`/supplier/${quotation?.supplier}`)}>
                    返回
                </button>
            </div>
        </div>

        <!-- 供应商与物品信息 -->
        <div class="info-row">
            <div class="info-block">
                <div class="block-label">供应商</div>
                <a href="/supplier/{quotation.supplier}" class="block-value link">
                    {quotation.supplier_detail?.name || '-'}
                </a>
            </div>
            <div class="info-block">
                <div class="block-label">物品名称</div>
                <a href="/item/{quotation.item}" class="block-value link">
                    {quotation.item_detail?.name || '-'}
                </a>
            </div>
            <div class="info-block">
                <div class="block-label">SKU</div>
                {#if quotation.item}
                    <a href="/item/{quotation.item}" class="block-value link code">{quotation.sku || quotation.item_detail?.SKU || '-'}</a>
                {:else}
                    <span class="block-value code">{quotation.sku || '-'}</span>
                {/if}
            </div>
        </div>

        <!-- 核心数据区 -->
        <div class="data-section">
            <div class="metric-grid">
                <div class="metric-box price">
                    <div class="metric-label">单价</div>
                    <div class="metric-value">
                        <span class="currency">{quotation.currency}</span>
                        <span class="amount">{formatPrice(quotation.price)}</span>
                    </div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">最小订购量 (MOQ)</div>
                    <div class="metric-value">
                        <span class="amount">{quotation.min_quantity}</span>
                        <span class="unit">件</span>
                    </div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">货币</div>
                    <div class="metric-value">
                        <span class="currency">{quotation.currency}</span>
                    </div>
                </div>
                <div class="metric-box total">
                    <div class="metric-label">总成本</div>
                    <div class="metric-value">
                        {#if quotation.total_cost}
                            <span class="currency">{quotation.currency}</span>
                            <span class="amount">{formatPrice(quotation.total_cost)}</span>
                        {:else}
                            <span class="amount">-</span>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- 详细参数 -->
        <div class="detail-section">
            <div class="section-title">报价参数</div>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">交货周期</span>
                    <span class="detail-value">
                        {#if quotation.lead_time_days}
                            {quotation.lead_time_days} 天
                        {:else}
                            -
                        {/if}
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">有效期开始</span>
                    <span class="detail-value">{formatDate(quotation.valid_from)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">有效期截止</span>
                    <span class="detail-value">
                        {formatDate(quotation.valid_until)}
                        {#if quotation.valid_until}
                            {@const days = getDaysUntil(quotation.valid_until)}
                            {#if days !== null}
                                {#if days >= 0}
                                    <span class="tag valid">剩余 {days} 天</span>
                                {:else}
                                    <span class="tag expired">已过期 {Math.abs(days)} 天</span>
                                {/if}
                            {/if}
                        {/if}
                    </span>
                </div>
            </div>
        </div>

        <!-- 备注 -->
        {#if quotation.note}
            <div class="detail-section">
                <div class="section-title">备注</div>
                <div class="note-content">
                    {quotation.note}
                </div>
            </div>
        {/if}

        <!-- 元信息 -->
        <div class="meta-bar">
            <div class="meta-item">
                <span class="meta-label">创建时间</span>
                <span class="meta-value">{formatDate(quotation.created_at)}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">更新时间</span>
                <span class="meta-value">{formatDate(quotation.updated_at)}</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .quotation-detail {
        max-width: 1000px;
        margin: 0 auto;
        padding: 1.5rem;
    }

    .error-state {
        text-align: center;
        padding: 3rem;
        background: #fafafa;
        border: 1px solid #e0e0e0;
    }

    /* 头部栏 */
    .header-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: #fff;
        border: 1px solid #e0e0e0;
        margin-bottom: 1rem;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .page-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
    }

    .doc-number {
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 0.875rem;
        color: #666;
        padding: 0.25rem 0.5rem;
        background: #f5f5f5;
    }

    .status-badge {
        font-size: 0.75rem;
        font-weight: 500;
        padding: 0.25rem 0.75rem;
        background: #f0f0f0;
        color: #666;
        border: 1px solid #d9d9d9;
    }

    .status-badge.preferred {
        background: #fff7e6;
        color: #d48806;
        border-color: #ffd591;
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        border: 1px solid #d9d9d9;
        background: #fff;
        color: #333;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn:hover {
        border-color: #1890ff;
        color: #1890ff;
    }

    .btn-primary {
        background: #1890ff;
        border-color: #1890ff;
        color: #fff;
    }

    .btn-primary:hover {
        background: #40a9ff;
        border-color: #40a9ff;
        color: #fff;
    }

    .btn-danger {
        color: #ff4d4f;
        border-color: #ff4d4f;
    }

    .btn-danger:hover {
        background: #ff4d4f;
        color: #fff;
    }

    /* 信息行 */
    .info-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: #e0e0e0;
        border: 1px solid #e0e0e0;
        margin-bottom: 1rem;
    }

    .info-block {
        background: #fff;
        padding: 1rem 1.5rem;
    }

    .block-label {
        font-size: 0.75rem;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
    }

    .block-value {
        font-size: 1rem;
        color: #1a1a1a;
    }

    .block-value.link {
        color: #1890ff;
        text-decoration: none;
    }

    .block-value.link:hover {
        text-decoration: underline;
    }

    .block-value.code {
        font-family: 'SF Mono', Monaco, monospace;
        color: #666;
    }

    /* 数据区 */
    .data-section {
        background: #fff;
        border: 1px solid #e0e0e0;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }

    .metric-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2rem;
    }

    @media (max-width: 768px) {
        .metric-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .metric-box {
        text-align: center;
        padding: 1rem;
        border-right: 1px solid #f0f0f0;
    }

    .metric-box:last-child {
        border-right: none;
    }

    .metric-box.price .amount {
        color: #1890ff;
    }

    .metric-box.total .amount {
        color: #52c41a;
    }

    .metric-label {
        font-size: 0.75rem;
        color: #888;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
    }

    .metric-value {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 0.25rem;
    }

    .metric-value .currency {
        font-size: 0.875rem;
        color: #888;
    }

    .metric-value .amount {
        font-size: 1.75rem;
        font-weight: 600;
    }

    .metric-value .unit {
        font-size: 0.875rem;
        color: #888;
    }

    /* 详细参数 */
    .detail-section {
        background: #fff;
        border: 1px solid #e0e0e0;
        margin-bottom: 1rem;
    }

    .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #333;
        padding: 0.75rem 1.5rem;
        background: #fafafa;
        border-bottom: 1px solid #f0f0f0;
    }

    .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: #f5f5f5;
    }

    .detail-item {
        background: #fff;
        padding: 1rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .detail-label {
        font-size: 0.75rem;
        color: #888;
    }

    .detail-value {
        font-size: 0.9375rem;
        color: #1a1a1a;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .tag {
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
        font-weight: 500;
    }

    .tag.valid {
        background: #f6ffed;
        color: #389e0d;
        border: 1px solid #b7eb8f;
    }

    .tag.expired {
        background: #fff2f0;
        color: #cf1322;
        border: 1px solid #ffa39e;
    }

    /* 备注 */
    .note-content {
        padding: 1.5rem;
        font-size: 0.9375rem;
        line-height: 1.6;
        color: #333;
        white-space: pre-wrap;
    }

    /* 元信息 */
    .meta-bar {
        display: flex;
        justify-content: flex-end;
        gap: 2rem;
        padding: 0.75rem 1.5rem;
        background: #fafafa;
        border: 1px solid #e0e0e0;
        font-size: 0.8125rem;
    }

    .meta-item {
        display: flex;
        gap: 0.5rem;
    }

    .meta-label {
        color: #888;
    }

    .meta-value {
        color: #666;
        font-family: 'SF Mono', Monaco, monospace;
    }

    /* 响应式 */
    @media (max-width: 768px) {
        .info-row,
        .detail-grid {
            grid-template-columns: 1fr;
        }

        .header-bar {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }

        .meta-bar {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
</style>

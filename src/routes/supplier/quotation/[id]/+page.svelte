<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { quotationAPI } from '$lib/api';
    import type { Quotation } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import EditButton from '$lib/components/EditButton.svelte';
    
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

<div class="max-w-4xl mx-auto p-6">
    {#if loading}
        <Loading text="加载中..." />
    {:else if error}
        <div class="text-center p-12 bg-gray-50 border border-gray-200">
            <Alert error={error} />
            <button class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors mt-4" onclick={() => goto('/supplier')}>
                返回供应商列表
            </button>
        </div>
    {:else if quotation}
        <!-- 头部信息栏 -->
        <div class="flex justify-between items-center p-4 bg-white border border-gray-200 mb-4 md:flex-col md:gap-4 md:items-start">
            <div class="flex items-center gap-4 flex-wrap">
                <span class="text-xl font-semibold text-gray-900">报价详情</span>
                <span class="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-1">NO.{quotation.id.toString().padStart(6, '0')}</span>
                {#if quotation.is_preferred}
                    <span class="text-xs font-medium px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200">首选报价</span>
                {:else}
                    <span class="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-500 border border-gray-200">标准报价</span>
                {/if}
            </div>
            <div class="flex gap-2 flex-wrap">
                <button class="px-4 py-2 text-sm font-medium bg-blue-500 text-white border border-blue-500 hover:bg-blue-400 transition-colors" onclick={togglePreferred}>
                    {quotation.is_preferred ? '取消首选' : '设为首选'}
                </button>
                <EditButton
                    onClick={editQuotation}
                    action="edit"
                />
                <button class="px-4 py-2 text-sm font-medium bg-white text-red-500 border border-red-500 hover:bg-red-500 hover:text-white transition-colors" onclick={deleteQuotation}>
                    删除
                </button>
                <button class="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:text-blue-400 transition-colors" onclick={() => goto(`/supplier/${quotation?.supplier}`)}>
                    返回
                </button>
            </div>
        </div>

        <!-- 供应商与物品信息 -->
        <div class="grid grid-cols-3 gap-px bg-gray-200 border border-gray-200 mb-4 md:grid-cols-1">
            <div class="bg-white p-4">
                <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">供应商</div>
                <a href="/supplier/{quotation.supplier}" class="text-base text-gray-900 hover:underline text-blue-500">
                    {quotation.supplier_detail?.name || '-'}
                </a>
            </div>
            <div class="bg-white p-4">
                <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">物品名称</div>
                <a href="/item/{quotation.item}" class="text-base text-gray-900 hover:underline text-blue-500">
                    {quotation.item_detail?.name || '-'}
                </a>
            </div>
            <div class="bg-white p-4">
                <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">SKU</div>
                {#if quotation.item}
                    <a href="/item/{quotation.item}" class="text-base text-gray-600 hover:underline font-mono text-blue-500">{quotation.sku || quotation.item_detail?.SKU || '-'}</a>
                {:else}
                    <span class="text-base text-gray-600 font-mono">{quotation.sku || '-'}</span>
                {/if}
            </div>
        </div>

        <!-- 核心数据区 -->
        <div class="bg-white border border-gray-200 p-6 mb-4">
            <div class="grid grid-cols-4 gap-8 md:grid-cols-2">
                <div class="text-center p-4 border-r border-gray-100 last:border-r-0 md:border-r-0 md:border-b md:last:border-b-0">
                    <div class="text-xs text-gray-400 uppercase mb-2">单价</div>
                    <div class="flex items-baseline justify-center gap-1">
                        <span class="text-sm text-gray-400">{quotation.currency}</span>
                        <span class="text-2xl font-semibold text-blue-500">{formatPrice(quotation.price)}</span>
                    </div>
                </div>
                <div class="text-center p-4 border-r border-gray-100 last:border-r-0 md:border-r-0 md:border-b md:last:border-b-0">
                    <div class="text-xs text-gray-400 uppercase mb-2">最小订购量 (MOQ)</div>
                    <div class="flex items-baseline justify-center gap-1">
                        <span class="text-2xl font-semibold">{quotation.min_quantity}</span>
                        <span class="text-sm text-gray-400">件</span>
                    </div>
                </div>
                <div class="text-center p-4 border-r border-gray-100 last:border-r-0 md:border-r-0 md:border-b md:last:border-b-0">
                    <div class="text-xs text-gray-400 uppercase mb-2">货币</div>
                    <div class="flex items-baseline justify-center gap-1">
                        <span class="text-2xl font-semibold">{quotation.currency}</span>
                    </div>
                </div>
                <div class="text-center p-4 border-r border-gray-100 last:border-r-0 md:border-r-0">
                    <div class="text-xs text-gray-400 uppercase mb-2">总成本</div>
                    <div class="flex items-baseline justify-center gap-1">
                        {#if quotation.total_cost}
                            <span class="text-sm text-gray-400">{quotation.currency}</span>
                            <span class="text-2xl font-semibold text-green-600">{formatPrice(quotation.total_cost)}</span>
                        {:else}
                            <span class="text-2xl font-semibold">-</span>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- 详细参数 -->
        <div class="bg-white border border-gray-200 mb-4">
            <div class="text-sm font-semibold text-gray-700 px-6 py-3 bg-gray-50 border-b border-gray-100">报价参数</div>
            <div class="grid grid-cols-3 gap-px bg-gray-100 md:grid-cols-1">
                <div class="bg-white p-4 flex flex-col gap-2">
                    <span class="text-xs text-gray-400">交货周期</span>
                    <span class="text-sm text-gray-900">
                        {#if quotation.lead_time_days}
                            {quotation.lead_time_days} 天
                        {:else}
                            -
                        {/if}
                    </span>
                </div>
                <div class="bg-white p-4 flex flex-col gap-2">
                    <span class="text-xs text-gray-400">有效期开始</span>
                    <span class="text-sm text-gray-900">{formatDate(quotation.valid_from)}</span>
                </div>
                <div class="bg-white p-4 flex flex-col gap-2">
                    <span class="text-xs text-gray-400">有效期截止</span>
                    <span class="text-sm text-gray-900 flex items-center gap-2">
                        {formatDate(quotation.valid_until)}
                        {#if quotation.valid_until}
                            {@const days = getDaysUntil(quotation.valid_until)}
                            {#if days !== null}
                                {#if days >= 0}
                                    <span class="text-xs px-2 py-0.5 font-medium bg-green-50 text-green-600 border border-green-200">剩余 {days} 天</span>
                                {:else}
                                    <span class="text-xs px-2 py-0.5 font-medium bg-red-50 text-red-600 border border-red-200">已过期 {Math.abs(days)} 天</span>
                                {/if}
                            {/if}
                        {/if}
                    </span>
                </div>
            </div>
        </div>

        <!-- 备注 -->
        {#if quotation.note}
            <div class="bg-white border border-gray-200 mb-4">
                <div class="text-sm font-semibold text-gray-700 px-6 py-3 bg-gray-50 border-b border-gray-100">备注</div>
                <div class="p-6 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {quotation.note}
                </div>
            </div>
        {/if}

        <!-- 元信息 -->
        <div class="flex justify-end gap-8 p-4 bg-gray-50 border border-gray-200 text-xs text-gray-500 md:flex-col md:gap-2">
            <div class="flex gap-2">
                <span class="text-gray-400">创建时间</span>
                <span class="text-gray-600 font-mono">{formatDate(quotation.created_at)}</span>
            </div>
            <div class="flex gap-2">
                <span class="text-gray-400">更新时间</span>
                <span class="text-gray-600 font-mono">{formatDate(quotation.updated_at)}</span>
            </div>
        </div>
    {/if}
</div>

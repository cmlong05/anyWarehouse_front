<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { quotationAPI, supplierAPI } from '$lib/api';
    import type { Quotation, SupplierBrief, PaginatedResponse } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    
    let quotations = $state<Quotation[]>([]);
    let suppliers = $state<SupplierBrief[]>([]);
    let loading = $state(true);
    let error = $state('');
    let searchSku = $state('');
    let selectedSupplier = $state<number | ''>('');
    let preferredOnly = $state(false);
    
    async function loadData() {
        loading = true;
        error = '';
        try {
            // 并行加载报价列表和供应商列表
            const [quotationRes, supplierRes] = await Promise.all([
                quotationAPI.list({
                    sku: searchSku || undefined,
                    supplier_id: selectedSupplier || undefined,
                    preferred_only: preferredOnly
                }) as Promise<PaginatedResponse<Quotation>>,
                supplierAPI.listBrief()
            ]);
            quotations = quotationRes.results || [];
            suppliers = supplierRes;
        } catch (err) {
            error = err instanceof Error ? err.message : '加载失败';
        } finally {
            loading = false;
        }
    }
    
    function viewDetail(id: number) {
        goto(`/quotation/${id}`);
    }
    
    function formatDate(dateStr: string | null): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-CN');
    }
    
    function formatPrice(price: string): string {
        return parseFloat(price).toFixed(2);
    }
    
    onMount(loadData);
</script>

<div class="content-container">
    <h1>报价管理 <span class="count">({quotations.length})</span></h1>
    
    <div class="actions-bar">
        <a href="/quotation/add" class="btn btn-primary">添加报价</a>
    </div>
    
    <div class="filters">
        <input 
            type="text" 
            placeholder="搜索SKU..." 
            bind:value={searchSku}
            onchange={loadData}
        />
        <select bind:value={selectedSupplier} onchange={loadData}>
            <option value="">全部供应商</option>
            {#each suppliers as s}
                <option value={s.id}>{s.name}</option>
            {/each}
        </select>
        <label class="checkbox">
            <input type="checkbox" bind:checked={preferredOnly} onchange={loadData} />
            仅首选
        </label>
    </div>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else if error}
        <Alert error={error} />
    {:else if quotations.length === 0}
        <div class="empty">暂无报价</div>
    {:else}
        <table class="data-table">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>供应商</th>
                    <th>单价</th>
                    <th>货币</th>
                    <th>MOQ</th>
                    <th>首选</th>
                    <th>创建时间</th>
                </tr>
            </thead>
            <tbody>
                {#each quotations as q}
                    <tr onclick={() => viewDetail(q.id)} class="clickable">
                        <td>{q.sku || q.item_detail?.SKU || '-'}</td>
                        <td>{q.supplier_detail?.name || '-'}</td>
                        <td class="numeric">{formatPrice(q.price)}</td>
                        <td>{q.currency}</td>
                        <td class="numeric">{q.min_quantity}</td>
                        <td>
                            {#if q.is_preferred}
                                <span class="badge preferred">★</span>
                            {:else}
                                <span class="badge">-</span>
                            {/if}
                        </td>
                        <td>{formatDate(q.created_at)}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>

<style>
    .actions-bar {
        margin-bottom: 1rem;
    }
    
    .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        align-items: center;
        flex-wrap: wrap;
    }
    
    .filters input,
    .filters select {
        padding: 0.5rem;
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
    }
    
    .filters input {
        min-width: 150px;
    }
    
    .checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }
    
    .count {
        font-size: 0.8em;
        color: var(--color-text-secondary, #666);
    }
    
    .empty {
        text-align: center;
        padding: 2rem;
        color: var(--color-text-secondary, #666);
    }
    
    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    
    .data-table th,
    .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #eee);
    }
    
    .data-table th {
        font-weight: 600;
        color: var(--color-text-secondary, #666);
    }
    
    .data-table tbody tr {
        cursor: pointer;
    }
    
    .numeric {
        text-align: right;
        font-family: monospace;
    }
    
    .badge {
        display: inline-block;
        width: 24px;
        height: 24px;
        line-height: 24px;
        text-align: center;
        border-radius: 4px;
        color: #999;
    }
    
    .badge.preferred {
        color: #f59e0b;
        font-weight: bold;
    }
</style>

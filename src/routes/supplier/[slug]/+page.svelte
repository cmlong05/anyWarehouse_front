<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { supplierAPI } from '$lib/api';
    import type { Supplier, QuotationBrief } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    
    let supplier = $state<Supplier | null>(null);
    let quotations = $state<QuotationBrief[]>([]);
    let loading = $state(true);
    let error = $state('');
    
    const id = $derived(parseInt(page.params.slug));
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '供应商管理', href: '/supplier' },
        { label: supplier?.name ?? '加载中...', href: `/supplier/${id}` },
    ]);
    
    async function loadSupplier() {
        loading = true;
        error = '';
        
        try {
            const [supplierData, quotationsData] = await Promise.all([
                supplierAPI.get(id),
                supplierAPI.getQuotations(id),
            ]);
            supplier = supplierData;
            quotations = quotationsData.quotations;
        } catch (err) {
            error = err instanceof Error ? err.message : '加载供应商信息失败';
        } finally {
            loading = false;
        }
    }
    
    async function deleteSupplier() {
        if (!supplier) return;
        
        if (!confirm(`确定要删除供应商 "${supplier.name}" 吗？\n\n此操作不可恢复，相关的报价记录也会被删除。`)) {
            return;
        }
        
        try {
            await supplierAPI.delete(id);
            goto('/supplier');
        } catch (err) {
            error = err instanceof Error ? err.message : '删除失败';
        }
    }
    
    onMount(() => {
        loadSupplier();
    });
</script>

<svelte:head>
    <title>{supplier?.name ?? '供应商详情'}</title>
</svelte:head>

<div class="content-container">
    <Breadcrumb items={breadcrumbs} />
    
    {#if loading}
        <Loading text="加载供应商信息..." />
    {:else if error}
        <Alert error={error} onDismiss={() => error = ''} />
        <div class="actions">
            <button class="btn btn-secondary" onclick={() => goto('/supplier')}>
                返回列表
            </button>
            <button class="btn btn-primary" onclick={loadSupplier}>
                重试
            </button>
        </div>
    {:else if supplier}
        <div class="page-header">
            <div class="header-left">
                <h1>{supplier.name}</h1>
                <span class="badge" class:active={supplier.is_active} class:inactive={!supplier.is_active}>
                    {supplier.is_active ? '活跃' : '已停用'}
                </span>
            </div>
            <div class="header-actions">
                <a href="/supplier/{id}/edit" class="btn btn-primary">编辑</a>
                <button class="btn btn-danger" onclick={deleteSupplier}>删除</button>
            </div>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>基本信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">联系人</span>
                        <span class="value">{supplier.contact || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">电话</span>
                        <span class="value">{supplier.telephone || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">邮箱</span>
                        <span class="value">{supplier.e_mail || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">地址</span>
                        <span class="value">{supplier.address || '-'}</span>
                    </div>
                </div>
            </div>
            
            <div class="info-card">
                <h3>其他信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">报价数量</span>
                        <span class="value highlight">{supplier.quotation_count ?? 0}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">添加日期</span>
                        <span class="value">{supplier.date_added}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">创建时间</span>
                        <span class="value">{new Date(supplier.created_at).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">更新时间</span>
                        <span class="value">{new Date(supplier.updated_at).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {#if supplier.remark}
            <div class="remark-card">
                <h3>备注</h3>
                <p>{supplier.remark}</p>
            </div>
        {/if}
        
        <!-- 报价列表 -->
        <div class="quotations-section">
            <div class="section-header">
                <h2>报价记录</h2>
                <a href="/quotation/add?supplier_id={id}" class="btn btn-primary btn-sm">添加报价</a>
            </div>
            
            {#if quotations.length === 0}
                <div class="empty-state">
                    <p>暂无报价记录</p>
                    <a href="/quotation/add?supplier_id={id}" class="btn btn-primary">添加第一个报价</a>
                </div>
            {:else}
                <div class="quotations-table">
                    <table>
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>物品名称</th>
                                <th>单价</th>
                                <th>货币</th>
                                <th>首选</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each quotations as quotation}
                                <tr class="clickable" onclick={() => goto(`/quotation/${quotation.id}`)}>
                                    <td>{quotation.sku || '-'}</td>
                                    <td>{quotation.item_name || '-'}</td>
                                    <td class="numeric">{quotation.price}</td>
                                    <td>{quotation.currency}</td>
                                    <td>
                                        {#if quotation.is_preferred}
                                            <span class="preferred-badge">★ 首选</span>
                                        {:else}
                                            <span class="muted">-</span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
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
    }
    
    .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        color: #1f2937;
    }
    
    .badge {
        font-size: 0.8rem;
        padding: 0.375rem 0.75rem;
        border-radius: 9999px;
        font-weight: 500;
    }
    
    .badge.active {
        background-color: #dcfce7;
        color: #166534;
    }
    
    .badge.inactive {
        background-color: #f3f4f6;
        color: #6b7280;
    }
    
    .header-actions {
        display: flex;
        gap: 0.75rem;
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
    
    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #2563eb;
    }
    
    .btn-danger {
        background-color: #ef4444;
        color: white;
    }
    
    .btn-danger:hover {
        background-color: #dc2626;
    }
    
    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }
    
    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
    
    .info-item .value.highlight {
        color: #3b82f6;
        font-size: 1.1rem;
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
    
    .quotations-section {
        padding: 1.5rem 0;
        border-top: 1px solid #e5e7eb;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #1f2937;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 0;
        color: #6b7280;
    }
    
    .empty-state p {
        margin-bottom: 1rem;
    }
    
    .quotations-table {
        overflow-x: auto;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    
    th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    th {
        font-weight: 600;
        color: #374151;
    }
    
    td {
        color: #4b5563;
    }
    
    .numeric {
        font-family: monospace;
        text-align: right;
    }
    
    .preferred-badge {
        color: #166534;
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .muted {
        color: #9ca3af;
    }
    
    .clickable {
        cursor: pointer;
    }
    
    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }
        
        .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .header-left {
            flex-wrap: wrap;
        }
        
        .header-actions {
            width: 100%;
        }
        
        .header-actions .btn {
            flex: 1;
        }
        
        .info-grid {
            grid-template-columns: 1fr;
        }
        
        .quotations-table {
            font-size: 0.85rem;
        }
        
        th, td {
            padding: 0.5rem;
        }
    }
</style>

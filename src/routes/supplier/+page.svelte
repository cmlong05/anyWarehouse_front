<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { supplierAPI } from '$lib/api';
    import type { Supplier } from '$lib';
    import { DataTable, FormInput } from '$lib/components/ui';
    import Alert from '$lib/components/Alert.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    let suppliers = $state<Supplier[]>([]);
    let loading = $state(true);
    let error = $state('');
    let searchQuery = $state('');
    
    // 表格列定义
    const columns = [
        { key: 'code', title: '编号', width: '100px' },
        { key: 'name', title: '供应商名称' },
        { key: 'contact', title: '联系人' },
        { key: 'telephone', title: '电话' },
    ];
    
    async function loadSuppliers() {
        loading = true;
        error = '';
        try {
            const params: { search?: string } = {};
            if (searchQuery) params.search = searchQuery;
            
            const result = await supplierAPI.list(params);
            if (result && typeof result === 'object' && 'results' in result) {
                suppliers = (result as { results: Supplier[] }).results;
            } else if (Array.isArray(result)) {
                suppliers = result;
            } else {
                suppliers = [];
            }
        } catch (err) {
            error = err instanceof Error ? err.message : '加载供应商列表失败';
        } finally {
            loading = false;
        }
    }
    
    function viewDetail(supplier: Supplier) {
        goto(`/supplier/${supplier.id}`);
    }
    
    onMount(() => {
        loadSuppliers();
    });
</script>

<svelte:head>
    <title>供应商管理</title>
</svelte:head>

<PageContainer maxWidth="lg" padding="md" py="md">
    <PageHeader title="供应商管理">
        {#snippet actions()}
            <a href="/supplier/add" class="btn btn-primary">添加供应商</a>
        {/snippet}
    </PageHeader>
    
    {#if error}
        <Alert {error} onDismiss={() => error = ''} />
    {/if}
    
    <!-- 搜索 -->
    <div class="search-box">
        <FormInput
            label=""
            name="search"
            value={searchQuery}
            placeholder="搜索供应商..."
            onchange={(v) => { searchQuery = v; loadSuppliers(); }}
        />
        {#if searchQuery}
            <button class="clear-btn" onclick={() => { searchQuery = ''; loadSuppliers(); }}>
                ✕
            </button>
        {/if}
    </div>
    
    {#if !loading && suppliers.length === 0}
        <div class="empty-state">
            <p>{searchQuery ? '没有找到匹配的供应商' : '暂无供应商'}</p>
            {#if !searchQuery}
                <a href="/supplier/add" class="btn btn-primary">添加第一个供应商</a>
            {:else}
                <button class="btn btn-secondary" onclick={() => { searchQuery = ''; loadSuppliers(); }}>
                    清除搜索
                </button>
            {/if}
        </div>
    {:else}
        <DataTable
            data={suppliers}
            {columns}
            {loading}
            clickable={true}
            onRowClick={viewDetail}
            emptyText={searchQuery ? '没有找到匹配的供应商' : '暂无供应商'}
        >
            {#snippet cellRender({ column, value })}
                {#if column.key === 'code'}
                    <span class="code-badge">{value}</span>
                {:else}
                    {value || '-'}
                {/if}
            {/snippet}
        </DataTable>
        
        <div class="summary">
            共 {suppliers.length} 个供应商
        </div>
    {/if}
</PageContainer>

<style>
    .search-box {
        position: relative;
        margin-bottom: 1.5rem;
    }
    
    .search-box :global(.form-field) {
        margin: 0;
    }
    
    .search-box :global(label) {
        display: none;
    }
    
    .clear-btn {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 0.25rem;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 0;
        color: #6b7280;
    }
    
    .empty-state p {
        margin-bottom: 1rem;
    }
    
    .code-badge {
        font-family: monospace;
        font-size: 0.85rem;
        color: #6b7280;
        background-color: #f3f4f6;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
    }
    
    .summary {
        margin-top: 1rem;
        color: #6b7280;
        font-size: 0.9rem;
    }
</style>

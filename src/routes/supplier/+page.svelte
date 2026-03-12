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
    <div class="relative mb-6">
        <FormInput
            label=""
            name="search"
            value={searchQuery}
            placeholder="搜索供应商..."
            onchange={(v) => { searchQuery = v; loadSuppliers(); }}
        />
        {#if searchQuery}
            <button class="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-500 cursor-pointer p-1" onclick={() => { searchQuery = ''; loadSuppliers(); }}>
                ✕
            </button>
        {/if}
    </div>
    
    {#if !loading && suppliers.length === 0}
        <div class="text-center py-12 text-gray-500">
            <p class="mb-4">{searchQuery ? '没有找到匹配的供应商' : '暂无供应商'}</p>
            {#if !searchQuery}
                <a href="/supplier/add" class="btn btn-primary">添加第一个供应商</a>
            {:else}
                <button class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors" onclick={() => { searchQuery = ''; loadSuppliers(); }}>
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
                    <span class="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{value}</span>
                {:else}
                    {value || '-'}
                {/if}
            {/snippet}
        </DataTable>
        
        <div class="mt-4 text-gray-500 text-sm">
            共 {suppliers.length} 个供应商
        </div>
    {/if}
</PageContainer>

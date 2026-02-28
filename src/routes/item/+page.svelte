<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import type { BaseItem } from '$lib';
    import { DataTable, FormInput } from '$lib/components/ui';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    let { data } = $props<{ items: BaseItem[]; searchQuery: string }>();
    
    // 安全获取 items 数组
    let items = $derived(data?.items ?? []);
    let searchQuery = $state(data?.searchQuery ?? '');
    
    // 表格列定义
    const columns = [
        { key: 'SKU', title: 'SKU', width: '120px' },
        { key: 'name', title: '品项名称' },
    ];
    
    // 实时搜索（URL 参数方式，刷新保留状态）
    function handleSearch() {
        const params = new URLSearchParams(page.url.searchParams);
        if (searchQuery.trim()) {
            params.set('search', searchQuery.trim());
        } else {
            params.delete('search');
        }
        goto(`?${params.toString()}`, { keepFocus: true });
    }
    
    function clearSearch() {
        searchQuery = '';
        goto('?', { keepFocus: true });
    }
    
    function viewDetail(item: BaseItem) {
        goto(`/item/${item.id}`);
    }
</script>

<svelte:head>
    <title>所有品项</title>
</svelte:head>

<PageContainer>
    <PageHeader title="所有品项">
        {#snippet actions()}
            <a href="/item/add" class="btn btn-primary">添加品项</a>
        {/snippet}
    </PageHeader>
    
    <!-- 搜索框 -->
    <div class="search-box">
        <FormInput
            label=""
            name="search"
            value={searchQuery}
            placeholder="搜索 SKU 或品项名称..."
            onchange={(v) => { searchQuery = v; handleSearch(); }}
        />
        {#if searchQuery}
            <button class="clear-btn" onclick={clearSearch}>
                ✕
            </button>
        {/if}
    </div>
    
    <!-- 结果统计 -->
    <div class="result-stats">
        共 {items.length} 个品项
        {#if data?.searchQuery}
            <span class="search-term">（搜索: "{data.searchQuery}"）</span>
        {/if}
    </div>

    <DataTable
        data={items}
        {columns}
        clickable={true}
        onRowClick={viewDetail}
        emptyText={data?.searchQuery ? '没有找到匹配的品项' : '暂无品项'}
    >
        {#snippet cellRender({ column, value })}
            {#if column.key === 'SKU'}
                <span class="sku-badge">{value}</span>
            {:else}
                {value}
            {/if}
        {/snippet}
    </DataTable>
</PageContainer>

<style>
    .search-box {
        position: relative;
        margin-bottom: 1rem;
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
        font-size: 1rem;
        line-height: 1;
    }
    
    .clear-btn:hover {
        color: #374151;
    }
    
    .result-stats {
        margin-bottom: 1rem;
        color: #6b7280;
        font-size: 0.9rem;
    }
    
    .search-term {
        color: #3b82f6;
    }
    
    .sku-badge {
        font-family: monospace;
        font-weight: 600;
        color: #3b82f6;
        background-color: #eff6ff;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
    }
</style>

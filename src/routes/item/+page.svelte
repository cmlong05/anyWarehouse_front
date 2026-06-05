<!-- 物料列表页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import type { BaseItem } from '$lib';
    import { DataTable, FormInput } from '$lib/components/ui';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    
    let { data } = $props<{ items: BaseItem[]; searchQuery: string }>();
    
    // safely get items array
    let items = $derived(data?.items ?? []);
    let searchQuery = $state('');
    let searchDebounce = $state<ReturnType<typeof setTimeout> | null>(null);
    
    // update when data.searchQuery changes
    $effect(() => {
        searchQuery = data?.searchQuery ?? '';
    });
    
    // selected item IDs
    let selectedItems = $state<Set<number>>(new Set());
    
    // table column definitions
    const columns = [
        { key: 'checkbox', title: '', width: '40px' },
        { key: 'SKU', title: 'SKU', width: '120px' },
        { key: 'name', title: '品项名称' },
    ];
    
    // real-time search (URL parameter way, keep state on refresh)
    function handleSearch() {
        if (searchDebounce) clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            const params = new URLSearchParams(page.url.searchParams);
            if (searchQuery.trim()) {
                params.set('search', searchQuery.trim());
            } else {
                params.delete('search');
            }
            goto(`?${params.toString()}`, { keepFocus: true });
        }, 300);
    }
    
    function clearSearch() {
        searchQuery = '';
        goto('?', { keepFocus: true });
    }
    
    function viewDetail(item: BaseItem) {
        goto(`/item/${item.id}`, { noScroll: true });
    }
    
    // toggle selection for item with given ID
    function toggleSelection(itemId: number, event: Event) {
        event.stopPropagation();
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        selectedItems = newSet;
    }
    
    // toggle select all/deselect all
    function toggleSelectAll(event: Event) {
        event.stopPropagation();
        if (selectedItems.size === items.length) {
            selectedItems = new Set();
        } else {
            selectedItems = new Set(items.map((item: BaseItem) => item.id));
        }
    }
    
    // jump to customer quotation page
    function goToCustomerQuotation() {
        if (selectedItems.size === 0) {
            alert('请先选择至少一个物品');
            return;
        }
        const itemIds = Array.from(selectedItems).join(',');
        goto(`/customer/quotation/add?item_ids=${itemIds}`);
    }
    
    // jump to supplier quotation page
    function goToSupplierQuotation() {
        if (selectedItems.size === 0) {
            alert('请先选择至少一个物品');
            return;
        }
        const itemIds = Array.from(selectedItems).join(',');
        goto(`/supplier/quotation/add?item_ids=${itemIds}`);
    }
    
    // clear selection
    function clearSelection() {
        selectedItems = new Set();
    }
</script>

<svelte:head>
    <title>所有品项</title>
</svelte:head>

<PageContainer>
    <PageHeader title="所有品项">
        {#snippet actions()}
            <div class="flex gap-2">
                {#if selectedItems.size > 0}
                    <button 
                        class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        onclick={goToCustomerQuotation}
                    >
                        客户报价 ({selectedItems.size})
                    </button>
                    <button 
                        class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                        onclick={goToSupplierQuotation}
                    >
                        供应商报价 ({selectedItems.size})
                    </button>
                    <button 
                        class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                        onclick={clearSelection}
                    >
                        清空
                    </button>
                {/if}
            </div>
        {/snippet}
    </PageHeader>
    
    <!-- search box -->
    <div class="relative mb-4">
        <FormInput
            label=""
            name="search"
            value={searchQuery}
            placeholder="搜索 SKU 或品项名称..."
            oninput={(v) => { searchQuery = v; handleSearch(); }}
        />
        {#if searchQuery}
            <button 
                class="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-400 hover:text-gray-600 p-1 text-base leading-none" 
                onclick={clearSearch}
            >
                ✕
            </button>
        {/if}
    </div>
    
    <!-- result statistics box -->
    <div class="mb-4 text-gray-500 text-sm">
        共 {items.length} 个品项
        {#if selectedItems.size > 0}
            <span class="text-blue-600 font-medium">，已选择 {selectedItems.size} 个</span>
        {/if}
        {#if data?.searchQuery}
            <span class="text-blue-500">（搜索: "{data.searchQuery}"）</span>
        {/if}
    </div>

    <DataTable
        data={items}
        {columns}
        clickable={true}
        onRowClick={viewDetail}
        emptyText={data?.searchQuery ? '没有找到匹配的品项' : '暂无品项'}
    >
        {#snippet cellRender({ column, value, item })}
            {#if column.key === 'checkbox'}
                <input 
                    type="checkbox" 
                    checked={selectedItems.has(item.id)}
                    onchange={(e) => toggleSelection(item.id, e)}
                    onclick={(e) => e.stopPropagation()}
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
            {:else if column.key === 'SKU'}
                <span class="font-mono font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded">{value}</span>
            {:else}
                {value}
            {/if}
        {/snippet}
        
        {#snippet headerCellRender({ column })}
            {#if column.key === 'checkbox'}
                <input 
                    type="checkbox" 
                    checked={items.length > 0 && selectedItems.size === items.length}
                    indeterminate={selectedItems.size > 0 && selectedItems.size < items.length}
                    onchange={toggleSelectAll}
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
            {:else}
                {column.title}
            {/if}
        {/snippet}
    </DataTable>
</PageContainer>
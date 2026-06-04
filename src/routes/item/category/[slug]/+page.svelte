<!-- 物料分类详情页 -->
<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { ApiClient } from '$lib/api/client';
    import BulkEditTable from '$lib/components/BulkEditTable.svelte';
    import BulkCategoryChangeModal from '$lib/components/BulkCategoryChangeModal.svelte';
    import type { CategoryData } from '$lib';
    
    let { data } = $props<{ category_details: CategoryData }>();
    
    const apiClient = new ApiClient();
    
    // 选中的物品 IDs
    let selectedItems = $state<Set<number>>(new Set());
    let showBulkEditModal = $state(false);
    let showBulkCategoryModal = $state(false);

    const selectedItemIdList = $derived(Array.from(selectedItems));
    const selectedItemIds = $derived(selectedItemIdList.join(','));
    const customerQuotationHref = $derived(`/customer/quotation/add?item_ids=${selectedItemIds}`);
    const supplierQuotationHref = $derived(`/supplier/quotation/add?item_ids=${selectedItemIds}`);
    
    // 获取已选物品的详细信息（用于表格显示）
    const selectedItemDetails = $derived(
        data.category_details.items.filter((item: { id: number; SKU: string; name: string }) => selectedItems.has(item.id))
    );
    
    // 切换选中状态
    function toggleSelection(itemId: number, event: Event) {
        event.preventDefault();
        event.stopPropagation();
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        selectedItems = newSet;
    }
    
    // 全选/取消全选
    function toggleSelectAll(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        if (selectedItems.size === data.category_details.items.length) {
            selectedItems = new Set();
        } else {
            selectedItems = new Set(data.category_details.items.map((item: { id: number }) => item.id));
        }
    }
    
    // 打开批量编辑模态框
    function openBulkEdit() {
        showBulkEditModal = true;
    }

    function openBulkCategoryChange() {
        showBulkCategoryModal = true;
    }
    
    // 清空选择
    function clearSelection() {
        selectedItems = new Set();
    }
    
    // 处理批量编辑成功
    async function handleBulkEditSuccess() {
        showBulkEditModal = false;
        selectedItems = new Set();
        // 刷新页面数据
        await invalidateAll();
    }

    async function handleBulkCategorySuccess() {
        // 不关闭弹窗，让操作人員看完结果；后台刷新数据并清空选择
        selectedItems = new Set();
        await invalidateAll();
    }
</script>

<svelte:head>
    <title>分类 {data.category_details.category.name}</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-3">
    <!-- 面包屑导航 -->
    <nav class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        {#each data.category_details.ancestors as ancestor}
            <a href="/item/category/{ancestor.id}" class="hover:text-blue-600 transition-colors">{ancestor.name}</a>
            <span>/</span>
        {/each}
        <span class="text-gray-900 font-medium">{data.category_details.category.name}</span>
        <a 
            href="/item/category/{data.category_details.category.id}/edit" 
            class="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
            title="编辑"
            aria-label="编辑分类"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        </a>
    </nav>

    <!-- 三栏布局 -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- 左侧：物品列表 -->
        <div class="lg:col-span-2 space-y-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[70vh]">
                <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <h2 class="text-lg font-semibold text-gray-900">物品</h2>
                    </div>
                    <div class="flex items-center gap-2">
                        {#if selectedItems.size > 0}
                            <button 
                                class="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                                onclick={clearSelection}
                            >
                                清空
                            </button>
                            <button
                                class="text-sm text-emerald-600 hover:text-emerald-800 transition-colors"
                                onclick={openBulkCategoryChange}
                            >
                                转移分类
                            </button>
                            <button 
                                class="text-sm text-purple-600 hover:text-purple-800 transition-colors"
                                onclick={openBulkEdit}
                            >
                                编辑
                            </button>
                            <a 
                                href={supplierQuotationHref}
                                class="text-sm text-amber-600 hover:text-amber-800 transition-colors"
                            >
                                供应商报价
                            </a>
                            <a 
                                href={customerQuotationHref}
                                class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                向客户报价
                            </a>
                        {/if}
                        <a 
                            href="/item/add?category={data.category_details.category.id}" 
                            class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            添加
                        </a>
                    </div>
                </div>
                <div class="divide-y divide-gray-100 overflow-y-auto">
                    {#if data.category_details.items.length > 0}
                        <!-- 表头 -->
                        <div class="sticky top-0 z-10 flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100">
                            <input 
                                type="checkbox" 
                                checked={data.category_details.items.length > 0 && selectedItems.size === data.category_details.items.length}
                                indeterminate={selectedItems.size > 0 && selectedItems.size < data.category_details.items.length}
                                onchange={toggleSelectAll}
                                class="w-4 h-4 accent-gray-800 opacity-40 cursor-pointer"
                            />
                            <div class="flex-1 min-w-0">
                                {#if selectedItems.size > 0}
                                    <span class="text-sm text-blue-600 font-medium">已选 {selectedItems.size} 个</span>
                                {/if}
                            </div>
                            <span class="w-20 text-right text-xs text-gray-500 font-medium">库存数量</span>
                        </div>
                    {/if}
                    {#each data.category_details.items as { id, SKU, name, total_storage }}
                        <div class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                            <input 
                                type="checkbox" 
                                checked={selectedItems.has(id)}
                                onchange={(e) => toggleSelection(id, e)}
                                class="w-4 h-4 accent-gray-800 opacity-40 cursor-pointer"
                            />
                            <a href="/item/{id}" class="flex-1 flex items-center gap-4 group-hover:text-blue-600 min-w-0">
                                <span class="font-mono text-sm font-medium text-purple-600">{SKU}</span>
                                <span class="text-gray-700 text-sm truncate">{name}</span>
                            </a>
                            <div class="w-20 text-right text-sm text-gray-600 font-mono">{total_storage ?? 0}</div>
                        </div>
                    {:else}
                        <div class="px-4 py-8 text-center text-gray-400">
                            暂无物品
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- 中间：子分类 -->
        <div class="space-y-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[70vh]">
                <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <h2 class="text-lg font-semibold text-gray-900">子分类</h2>
                    <a 
                        href="/item/category/add?parent={data.category_details.category.id}" 
                        class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        添加
                    </a>
                </div>
                <div class="divide-y divide-gray-100 overflow-y-auto">
                    {#each data.category_details.descendants as child}
                        <a href="/item/category/{child.id}" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                            {child.name}
                        </a>
                    {:else}
                        <div class="px-4 py-6 text-center text-sm text-gray-400">
                            暂无子分类
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- 右侧：相邻分类 -->
        <div class="space-y-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[70vh]">
                <div class="px-4 py-3 border-b border-gray-200 shrink-0">
                    <h2 class="text-lg font-semibold text-gray-900">相邻分类</h2>
                </div>
                <div class="divide-y divide-gray-100 overflow-y-auto">
                    {#each data.category_details.siblings as sibling}
                        {#if sibling.id == data.category_details.category.id}
                            <div class="px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50">
                                {sibling.name}
                            </div>
                        {:else}
                            <a href="/item/category/{sibling.id}" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                                {sibling.name}
                            </a>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 批量编辑表格 -->
<BulkEditTable
    isOpen={showBulkEditModal}
    selectedItems={selectedItemDetails}
    {apiClient}
    onclose={() => showBulkEditModal = false}
    onsuccess={handleBulkEditSuccess}
/>

<BulkCategoryChangeModal
    isOpen={showBulkCategoryModal}
    currentCategoryId={data.category_details.category.id}
    currentCategoryName={data.category_details.category.name}
    selectedItems={selectedItemDetails}
    {apiClient}
    onclose={() => showBulkCategoryModal = false}
    onsuccess={handleBulkCategorySuccess}
/>
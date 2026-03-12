<script lang="ts">
    import { goto } from '$app/navigation';
    import { onDestroy } from 'svelte';
    import { apiClient } from '$lib/api';
    import type { Item, ItemSearchResponse } from '$lib/schemas';
    
    let searchQuery = $state('');
    let searchResults = $state<Item[]>([]);
    let isSearching = $state(false);
    let showResults = $state(false);
    let searchTimeout = $state<number | null>(null);
    
    // 实时搜索（防抖300ms）
    function handleInput() {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        if (!searchQuery.trim()) {
            searchResults = [];
            showResults = false;
            return;
        }
        
        searchTimeout = window.setTimeout(async () => {
            isSearching = true;
            try {
                const response = await apiClient.get<ItemSearchResponse>(
                    `/product/item/search/`,
                    { q: searchQuery.trim() }
                );
                searchResults = response.results;
                showResults = true;
            } catch (error) {
                console.error('搜索错误:', error);
            } finally {
                isSearching = false;
            }
        }, 300);
    }
    
    // 点击结果跳转
    function handleSelect(item: Item) {
        goto(`/item/${item.id}`);
    }
    
    // 点击外部关闭结果
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.search-wrapper')) {
            showResults = false;
        }
    }
    
    // 键盘导航
    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            showResults = false;
        }
    }

    // 组件销毁时清理定时器，防止内存泄漏
    onDestroy(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
    });
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeyDown} />

<div class="max-w-3xl mx-auto my-8 p-8">
    <h1 class="text-gray-800 mb-2">简易资源管理系统</h1>
    <p>欢迎使用简易企业资源管理系统</p>
    
    <div class="mt-8 mb-8">
        <div class="search-wrapper relative max-w-2xl mx-auto">
            <div class="relative flex items-center">
                <input 
                    type="text"
                    bind:value={searchQuery}
                    oninput={handleInput}
                    placeholder="搜索商品名称、SKU、编号或描述..."
                    class="w-full py-3 pr-10 pl-4 text-base border-2 border-gray-200 rounded-md outline-none transition-colors focus:border-blue-500"
                    autocomplete="off"
                />
                {#if isSearching}
                    <span class="absolute right-4 text-blue-500 animate-spin">⟳</span>
                {:else if searchQuery}
                    <button class="absolute right-3 bg-transparent border-none text-gray-400 cursor-pointer text-base p-1 hover:text-red-600" onclick={() => { searchQuery = ''; searchResults = []; showResults = false; }}>✕</button>
                {/if}
            </div>
            
            {#if showResults && searchResults.length > 0}
                <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
                    {#each searchResults as item}
                        <button class="flex flex-col w-full px-4 py-3 text-left bg-transparent border-0 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 last:border-b-0" onclick={() => handleSelect(item)}>
                            <div class="flex items-center gap-3">
                                <span class="font-mono font-semibold text-blue-500 text-sm whitespace-nowrap">{item.SKU}</span>
                                <span class="font-medium text-gray-800">{item.name}</span>
                            </div>
                            {#if item.description}
                                <span class="text-sm text-gray-400 mt-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.description}</span>
                            {/if}
                        </button>
                    {/each}
                </div>
            {:else if showResults && !isSearching && searchQuery}
                <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div class="p-4 text-center text-gray-400">未找到匹配的商品</div>
                </div>
            {/if}
        </div>
    </div>
    
    <div class="mt-12 p-8 bg-gray-50 rounded-lg">
        <h3 class="mt-0 mb-6 text-gray-600">快速操作</h3>
        <div class="flex gap-4 md:flex-col">
            <a href="/container/add" class="inline-block px-6 py-3 bg-blue-500 !text-white visited:!text-white font-bold text-center no-underline rounded transition-colors hover:bg-blue-600">
                添加根容器
            </a>
            <a href="/category/add" class="inline-block px-6 py-3 bg-blue-500 !text-white visited:!text-white font-bold text-center no-underline rounded transition-colors hover:bg-blue-600">
                添加根分类
            </a>
            <a href="/item/add" class="inline-block px-6 py-3 bg-blue-500 !text-white visited:!text-white font-bold text-center no-underline rounded transition-colors hover:bg-blue-600">
                添加商品
            </a>
        </div>
    </div>

    <div class="mt-12 p-8 bg-white rounded-lg border border-gray-200">
        <h3 class="mt-0 mb-6 text-gray-600">导航</h3>
        <div class="grid gap-4 md:grid-cols-1" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
            <a href="/item" class="block p-6 no-underline bg-gray-50 border border-gray-200 rounded-md transition-all hover:bg-gray-100 hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-md">
                <h4 class="m-0 mb-2 text-blue-500 text-lg">商品管理</h4>
                <p class="m-0 text-gray-400 text-sm leading-relaxed">查看和管理所有商品信息</p>
            </a>
            <a href="/category" class="block p-6 no-underline bg-gray-50 border border-gray-200 rounded-md transition-all hover:bg-gray-100 hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-md">
                <h4 class="m-0 mb-2 text-blue-500 text-lg">分类管理</h4>
                <p class="m-0 text-gray-400 text-sm leading-relaxed">管理商品分类体系</p>
            </a>
            <a href="/container" class="block p-6 no-underline bg-gray-50 border border-gray-200 rounded-md transition-all hover:bg-gray-100 hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-md">
                <h4 class="m-0 mb-2 text-blue-500 text-lg">容器管理</h4>
                <p class="m-0 text-gray-400 text-sm leading-relaxed">管理存储容器结构</p>
            </a>
            <a href="/storage" class="block p-6 no-underline bg-gray-50 border border-gray-200 rounded-md transition-all hover:bg-gray-100 hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-md">
                <h4 class="m-0 mb-2 text-blue-500 text-lg">库存管理</h4>
                <p class="m-0 text-gray-400 text-sm leading-relaxed">查看和管理库存信息</p>
            </a>
        </div>
    </div>
</div>

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

<div class="home-container">
    <h1>AnyWarehouse 仓库管理系统</h1>
    <p>欢迎使用简易仓库管理系统</p>
    
    <div class="search-section">
        <div class="search-wrapper">
            <div class="search-box">
                <input 
                    type="text"
                    bind:value={searchQuery}
                    oninput={handleInput}
                    placeholder="搜索商品名称、SKU、编号或描述..."
                    class="search-input"
                    autocomplete="off"
                />
                {#if isSearching}
                    <span class="search-spinner">⟳</span>
                {:else if searchQuery}
                    <button class="clear-btn" onclick={() => { searchQuery = ''; searchResults = []; showResults = false; }}>✕</button>
                {/if}
            </div>
            
            {#if showResults && searchResults.length > 0}
                <div class="search-dropdown">
                    {#each searchResults as item}
                        <button class="search-result-item" onclick={() => handleSelect(item)}>
                            <div class="result-main">
                                <span class="result-sku">{item.SKU}</span>
                                <span class="result-name">{item.name}</span>
                            </div>
                            {#if item.description}
                                <span class="result-desc">{item.description}</span>
                            {/if}
                        </button>
                    {/each}
                </div>
            {:else if showResults && !isSearching && searchQuery}
                <div class="search-dropdown">
                    <div class="no-results">未找到匹配的商品</div>
                </div>
            {/if}
        </div>
    </div>
    
    <div class="quick-actions">
        <h3>快速操作</h3>
        <div class="action-buttons">
            <a href="/container/add" class="btn btn-primary">
                添加根容器
            </a>
            <a href="/category/add" class="btn btn-primary">
                添加根分类
            </a>
            <a href="/item/add" class="btn btn-primary">
                添加商品
            </a>
        </div>
    </div>

    <div class="navigation-section">
        <h3>导航</h3>
        <div class="nav-links">
            <a href="/item" class="nav-link">
                <h4>商品管理</h4>
                <p>查看和管理所有商品信息</p>
            </a>
            <a href="/category" class="nav-link">
                <h4>分类管理</h4>
                <p>管理商品分类体系</p>
            </a>
            <a href="/container" class="nav-link">
                <h4>容器管理</h4>
                <p>管理存储容器结构</p>
            </a>
            <a href="/storage" class="nav-link">
                <h4>库存管理</h4>
                <p>查看和管理库存信息</p>
            </a>
        </div>
    </div>
</div>

<style>
    .home-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 2rem;
    }
    
    .home-container h1 {
        color: #333;
        margin-bottom: 0.5rem;
    }
    
    .search-section {
        margin-top: 2rem;
        margin-bottom: 2rem;
    }
    
    .search-wrapper {
        position: relative;
        max-width: 700px;
        margin: 0 auto;
    }
    
    .search-box {
        position: relative;
        display: flex;
        align-items: center;
    }
    
    .search-input {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 1rem;
        font-size: 1rem;
        border: 2px solid #dee2e6;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.2s;
    }
    
    .search-input:focus {
        border-color: #007bff;
    }
    
    .search-spinner {
        position: absolute;
        right: 1rem;
        color: #007bff;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .clear-btn {
        position: absolute;
        right: 0.75rem;
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        font-size: 1rem;
        padding: 0.25rem;
    }
    
    .clear-btn:hover {
        color: #dc2626;
    }
    
    .search-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 0.25rem;
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-height: 400px;
        overflow-y: auto;
        z-index: 100;
    }
    
    .search-result-item {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 0.75rem 1rem;
        text-align: left;
        background: none;
        border: none;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background-color 0.15s;
    }
    
    .search-result-item:last-child {
        border-bottom: none;
    }
    
    .search-result-item:hover {
        background-color: #f8f9fa;
    }
    
    .result-main {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .result-sku {
        font-family: monospace;
        font-weight: 600;
        color: #007bff;
        font-size: 0.9rem;
        white-space: nowrap;
    }
    
    .result-name {
        color: #333;
        font-weight: 500;
    }
    
    .result-desc {
        font-size: 0.85rem;
        color: #6c757d;
        margin-top: 0.25rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .no-results {
        padding: 1rem;
        text-align: center;
        color: #6c757d;
    }
    
    .quick-actions {
        margin-top: 3rem;
        padding: 2rem;
        background-color: #f8f9fa;
        border-radius: 8px;
    }
    
    .quick-actions h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: #495057;
    }
    
    .action-buttons {
        display: flex;
        gap: 1rem;
    }
    
    .btn {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        text-align: center;
        transition: background-color 0.2s;
    }
    
    .btn-primary {
        background-color: #007bff;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #0056b3;
    }

    .navigation-section {
        margin-top: 3rem;
        padding: 2rem;
        background-color: #fff;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }

    .navigation-section h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: #495057;
    }

    .nav-links {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .nav-link {
        display: block;
        padding: 1.5rem;
        text-decoration: none;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        transition: all 0.2s ease-in-out;
    }

    .nav-link:hover {
        background-color: #e9ecef;
        border-color: #007bff;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .nav-link h4 {
        margin: 0 0 0.5rem 0;
        color: #007bff;
        font-size: 1.1rem;
    }

    .nav-link p {
        margin: 0;
        color: #6c757d;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    @media (max-width: 768px) {
        .action-buttons {
            flex-direction: column;
        }

        .nav-links {
            grid-template-columns: 1fr;
        }
    }
</style>

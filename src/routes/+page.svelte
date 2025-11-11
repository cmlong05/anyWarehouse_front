<script lang="ts">
    import { apiClient } from '$lib/api';
    import type { Item, ItemSearchResponse } from '$lib/schemas';
    
    let searchQuery = $state('');
    let searchResults = $state<Item[]>([]);
    let isSearching = $state(false);
    let hasSearched = $state(false);
    let searchCount = $state(0);
    
    async function handleSearch() {
        if (!searchQuery.trim()) {
            return;
        }
        
        isSearching = true;
        hasSearched = false;
        searchResults = [];
        
        try {
            const response = await apiClient.get<ItemSearchResponse>(
                `/product/item/search/`,
                { q: searchQuery.trim() }
            );
            
            searchResults = response.results;
            searchCount = response.count;
            hasSearched = true;
        } catch (error: any) {
            console.error('搜索错误:', error);
        } finally {
            isSearching = false;
        }
    }
    
    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }
    
    function clearSearch() {
        searchQuery = '';
        searchResults = [];
        hasSearched = false;
        searchCount = 0;
    }
</script>

<div class="home-container">
    <h1>AnyWarehouse 仓库管理系统</h1>
    <p>欢迎使用简易仓库管理系统</p>
    
    <div class="search-section">
        <div class="search-box">
            <input 
                type="text" 
                bind:value={searchQuery}
                onkeypress={handleKeyPress}
                placeholder="搜索商品名称、SKU、编号或描述..."
                class="search-input"
                disabled={isSearching}
            />
            <button 
                onclick={handleSearch} 
                class="search-button"
                disabled={isSearching}
            >
                {#if isSearching}
                    🔄 搜索中...
                {:else}
                    🔍 搜索
                {/if}
            </button>
            {#if hasSearched || searchQuery}
                <button 
                    onclick={clearSearch} 
                    class="clear-button"
                    disabled={isSearching}
                >
                    ✕ 清除
                </button>
            {/if}
        </div>
        
        {#if hasSearched}
            <div class="search-results-info">
                找到 <strong>{searchCount}</strong> 个结果
            </div>
        {/if}
        
        {#if searchResults.length > 0}
            <div class="search-results">
                {#each searchResults as item}
                    <a href="/item/{item.id}" class="result-item">
                        <div class="result-header">
                            <h4 class="result-name">{item.name}</h4>
                            <span class="result-sku">{item.SKU}</span>
                        </div>
                        {#if item.description}
                            <p class="result-description">{item.description}</p>
                        {/if}
                        <div class="result-meta">
                            {#if item.SKU_zite}
                                <span class="meta-tag">子码: {item.SKU_zite}</span>
                            {/if}
                            {#if item.SKU_A}
                                <span class="meta-tag">A码: {item.SKU_A}</span>
                            {/if}
                            {#if item.b_Price}
                                <span class="meta-tag price">💰 {item.b_Price} {item.currency || ''}</span>
                            {/if}
                        </div>
                    </a>
                {/each}
            </div>
        {:else if hasSearched && searchResults.length === 0}
            <div class="no-results">
                <p>😕 未找到匹配的商品</p>
                <p class="no-results-hint">尝试使用不同的关键词搜索</p>
            </div>
        {/if}
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
    
    .search-box {
        display: flex;
        gap: 0.5rem;
        max-width: 700px;
        margin: 0 auto;
    }
    
    .search-input {
        flex: 1;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 2px solid #dee2e6;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.2s;
    }
    
    .search-input:focus {
        border-color: #007bff;
    }
    
    .search-input:disabled {
        background-color: #f8f9fa;
        cursor: not-allowed;
    }
    
    .search-button {
        padding: 0.75rem 1.5rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
        white-space: nowrap;
    }
    
    .search-button:hover:not(:disabled) {
        background-color: #0056b3;
    }
    
    .search-button:active:not(:disabled) {
        transform: scale(0.98);
    }
    
    .search-button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
    }
    
    .clear-button {
        padding: 0.75rem 1rem;
        background-color: #6c757d;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
        white-space: nowrap;
    }
    
    .clear-button:hover:not(:disabled) {
        background-color: #5a6268;
    }
    
    .clear-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .search-results-info {
        max-width: 700px;
        margin: 1rem auto;
        padding: 0.5rem 1rem;
        background-color: #d1ecf1;
        color: #0c5460;
        border-radius: 6px;
        text-align: center;
        font-size: 0.95rem;
    }
    
    .search-results {
        max-width: 700px;
        margin: 1.5rem auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .result-item {
        display: block;
        padding: 1.25rem;
        background-color: #fff;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        text-decoration: none;
        transition: all 0.2s ease-in-out;
    }
    
    .result-item:hover {
        border-color: #007bff;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
        transform: translateY(-2px);
    }
    
    .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
    }
    
    .result-name {
        margin: 0;
        color: #007bff;
        font-size: 1.1rem;
        font-weight: 600;
    }
    
    .result-sku {
        padding: 0.25rem 0.75rem;
        background-color: #e9ecef;
        color: #495057;
        border-radius: 4px;
        font-size: 0.9rem;
        font-family: monospace;
        font-weight: 600;
        white-space: nowrap;
    }
    
    .result-description {
        margin: 0.5rem 0;
        color: #6c757d;
        font-size: 0.9rem;
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
    }
    
    .result-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
    }
    
    .meta-tag {
        padding: 0.25rem 0.5rem;
        background-color: #f8f9fa;
        color: #495057;
        border-radius: 4px;
        font-size: 0.85rem;
    }
    
    .meta-tag.price {
        background-color: #d4edda;
        color: #155724;
        font-weight: 600;
    }
    
    .no-results {
        max-width: 700px;
        margin: 2rem auto;
        padding: 2rem;
        text-align: center;
        background-color: #f8f9fa;
        border-radius: 8px;
    }
    
    .no-results p {
        margin: 0.5rem 0;
        color: #6c757d;
    }
    
    .no-results p:first-child {
        font-size: 1.2rem;
        color: #495057;
    }
    
    .no-results-hint {
        font-size: 0.9rem;
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
        .search-box {
            flex-direction: column;
        }
        
        .search-button,
        .clear-button {
            width: 100%;
        }
        
        .result-header {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .result-sku {
            align-self: flex-start;
        }
        
        .action-buttons {
            flex-direction: column;
        }

        .nav-links {
            grid-template-columns: 1fr;
        }
    }
</style>

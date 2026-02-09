<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import type { BaseItem } from '$lib';
    
    let { data } = $props<{ items: BaseItem[]; searchQuery: string }>();
    
    // 安全获取 items 数组
    let items = $derived(data?.items ?? []);
    let searchQuery = $state(data?.searchQuery ?? '');
    
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
</script>

<svelte:head>
    <title>所有品项</title>
</svelte:head>

<div class="content-container">
    <div class="section-header">
        <h3>所有品项</h3>
        <a href="/item/add" class="edit-link">添加品项</a>
    </div>
    
    <!-- 搜索框 -->
    <div class="search-box">
        <input
            type="text"
            placeholder="搜索 SKU 或品项名称..."
            bind:value={searchQuery}
            oninput={handleSearch}
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

    <ul class="item-list">
        {#each items as { id, SKU, name }}
            <li>
                <a href={`/item/${id}`} class="item-link">
                    <span class="sku">{SKU}</span>
                    <span class="name">{name}</span>
                </a>
            </li>
        {:else}
            <li class="empty-item">
                {data?.searchQuery ? '没有找到匹配的品项' : '暂无品项'}
            </li>
        {/each}
    </ul>
</div>

<style>
    .content-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .section-header h3 {
        margin: 0;
        color: #333;
    }
    
    .edit-link {
        color: #3b82f6;
        text-decoration: none;
        font-size: 0.9rem;
    }
    
    .edit-link:hover {
        text-decoration: underline;
    }
    
    .search-box {
        position: relative;
        margin-bottom: 0.75rem;
    }
    
    .search-box input {
        width: 100%;
        padding: 0.625rem 2.5rem 0.625rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.95rem;
        box-sizing: border-box;
    }
    
    .search-box input:focus {
        outline: none;
        border-color: #3b82f6;
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

    .item-list {
        list-style: none;
        padding: 0;
        margin: 0;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    .item-list li {
        border-bottom: 1px solid #e5e7eb;
    }
    
    .item-list li:last-child {
        border-bottom: none;
    }
    
    .item-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        color: #1f2937;
        text-decoration: none;
        transition: background-color 0.15s ease;
    }
    
    .item-link:hover {
        background-color: #f3f4f6;
    }
    
    .sku {
        font-weight: 600;
        color: #3b82f6;
        min-width: 100px;
    }
    
    .name {
        color: #4b5563;
    }
    
    .empty-item {
        padding: 2rem;
        text-align: center;
        color: #6b7280;
    }

    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }

        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .item-link {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
        }
        
        .sku {
            min-width: auto;
        }
    }
</style>

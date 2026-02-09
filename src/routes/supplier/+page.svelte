<script lang="ts">
    import { onMount } from 'svelte';
    import { supplierAPI } from '$lib/api';
    import type { Supplier } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    
    let suppliers = $state<Supplier[]>([]);
    let loading = $state(true);
    let error = $state('');
    let searchQuery = $state('');
    
    async function loadSuppliers() {
        loading = true;
        error = '';
        try {
            const params: { search?: string } = {};
            if (searchQuery) params.search = searchQuery;
            
            const result = await supplierAPI.list(params);
            if (result && typeof result === 'object' && 'results' in result) {
                suppliers = (result as any).results;
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
    
    onMount(() => {
        loadSuppliers();
    });
    
    // 输入时实时搜索（供应商数据量小，无需防抖）
    function handleSearch() {
        loadSuppliers();
    }
</script>

<svelte:head>
    <title>供应商管理</title>
</svelte:head>

<div class="content-container">
    <div class="section-header">
        <h1>供应商管理</h1>
        <a href="/supplier/add" class="btn btn-primary">添加供应商</a>
    </div>
    
    <!-- 搜索 -->
    <div class="search-box">
        <input
            type="text"
            placeholder="搜索供应商..."
            bind:value={searchQuery}
            oninput={handleSearch}
        />
        {#if searchQuery}
            <button class="clear-btn" onclick={() => { searchQuery = ''; loadSuppliers(); }}>
                ✕
            </button>
        {/if}
    </div>
    
    {#if loading}
        <Loading text="加载供应商列表..." />
    {:else if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {:else if suppliers.length === 0}
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
        <ul class="supplier-list">
            {#each suppliers as supplier}
                <li>
                    <a href="/supplier/{supplier.id}" class="supplier-link">
                        {supplier.name}
                    </a>
                </li>
            {/each}
        </ul>
        
        <div class="summary">
            共 {suppliers.length} 个供应商
        </div>
    {/if}
</div>

<style>
    .content-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .section-header h1 {
        margin: 0;
        font-size: 1.5rem;
        color: #1f2937;
    }
    
    .search-box {
        position: relative;
        margin-bottom: 1.5rem;
    }
    
    .search-box input {
        width: 100%;
        padding: 0.625rem 2.5rem 0.625rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.95rem;
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
    }
    
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.9rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }
    
    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #2563eb;
    }
    
    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }
    
    .btn-secondary:hover {
        background-color: #4b5563;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 0;
        color: #6b7280;
    }
    
    .empty-state p {
        margin-bottom: 1rem;
    }
    
    .supplier-list {
        list-style: none;
        padding: 0;
        margin: 0;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    .supplier-list li {
        border-bottom: 1px solid #e5e7eb;
    }
    
    .supplier-list li:last-child {
        border-bottom: none;
    }
    
    .supplier-link {
        display: block;
        padding: 0.875rem 1rem;
        color: #1f2937;
        text-decoration: none;
        transition: background-color 0.15s ease;
    }
    
    .supplier-link:hover {
        background-color: #f3f4f6;
    }
    
    .summary {
        margin-top: 1rem;
        color: #6b7280;
        font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }
        
        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
    }
</style>

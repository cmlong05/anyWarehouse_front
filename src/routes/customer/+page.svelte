<script lang="ts">
    import { onMount } from 'svelte';
    import { customerAPI } from '$lib/api';
    import type { Customer } from '$lib/schemas';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    
    let customers = $state<Customer[]>([]);
    let loading = $state(true);
    let error = $state('');
    let searchQuery = $state('');
    let levelFilter = $state('');
    let statusFilter = $state('');
    
    const levelOptions = [
        { value: '', label: '全部等级' },
        { value: 'VIP', label: 'VIP客户' },
        { value: 'NORMAL', label: '普通客户' },
        { value: 'TEMP', label: '临时客户' }
    ];
    
    const statusOptions = [
        { value: '', label: '全部状态' },
        { value: 'ACTIVE', label: '活跃' },
        { value: 'INACTIVE', label: '停用' }
    ];
    
    async function loadCustomers() {
        loading = true;
        error = '';
        try {
            const params: { search?: string; level?: string; status?: string } = {};
            if (searchQuery) params.search = searchQuery;
            if (levelFilter) params.level = levelFilter;
            if (statusFilter) params.status = statusFilter;
            
            const result = await customerAPI.list(params);
            if (result && typeof result === 'object' && 'results' in result) {
                customers = (result as any).results;
            } else if (Array.isArray(result)) {
                customers = result;
            } else {
                customers = [];
            }
        } catch (err) {
            error = err instanceof Error ? err.message : '加载客户列表失败';
        } finally {
            loading = false;
        }
    }
    
    onMount(() => {
        loadCustomers();
    });
    
    function handleSearch() {
        loadCustomers();
    }
    
    function getLevelLabel(level: string) {
        return levelOptions.find(o => o.value === level)?.label || level;
    }
    
    function getLevelClass(level: string) {
        switch (level) {
            case 'VIP': return 'level-vip';
            case 'NORMAL': return 'level-normal';
            case 'TEMP': return 'level-temp';
            default: return '';
        }
    }
</script>

<svelte:head>
    <title>客户管理</title>
</svelte:head>

<div class="content-container">
    <div class="section-header">
        <h1>客户管理</h1>
        <a href="/customer/add" class="btn btn-primary">添加客户</a>
    </div>
    
    <!-- 搜索和过滤 -->
    <div class="filter-bar">
        <div class="search-box">
            <input
                type="text"
                placeholder="搜索客户编号、名称、联系人..."
                bind:value={searchQuery}
                oninput={handleSearch}
            />
            {#if searchQuery}
                <button class="clear-btn" onclick={() => { searchQuery = ''; loadCustomers(); }}>
                    ✕
                </button>
            {/if}
        </div>
        <select bind:value={levelFilter} onchange={handleSearch} class="filter-select">
            {#each levelOptions as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
        <select bind:value={statusFilter} onchange={handleSearch} class="filter-select">
            {#each statusOptions as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
    </div>
    
    {#if loading}
        <Loading text="加载客户列表..." />
    {:else if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {:else if customers.length === 0}
        <div class="empty-state">
            <p>{searchQuery || levelFilter || statusFilter ? '没有找到匹配的客户' : '暂无客户'}</p>
            {#if !searchQuery && !levelFilter && !statusFilter}
                <a href="/customer/add" class="btn btn-primary">添加第一个客户</a>
            {:else}
                <button class="btn btn-secondary" onclick={() => { 
                    searchQuery = ''; 
                    levelFilter = ''; 
                    statusFilter = ''; 
                    loadCustomers(); 
                }}>
                    清除筛选
                </button>
            {/if}
        </div>
    {:else}
        <div class="customer-table">
            <table>
                <thead>
                    <tr>
                        <th>客户编号</th>
                        <th>客户名称</th>
                        <th>联系人</th>
                        <th>电话</th>
                        <th>等级</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    {#each customers as customer}
                        <tr onclick={() => window.location.href = `/customer/${customer.id}`} class="clickable-row">
                            <td class="code">{customer.code}</td>
                            <td class="name">{customer.name}</td>
                            <td>{customer.contact_name || '-'}</td>
                            <td>{customer.phone || '-'}</td>
                            <td>
                                <span class="level-badge {getLevelClass(customer.level)}">
                                    {getLevelLabel(customer.level)}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge {customer.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}">
                                    {customer.status === 'ACTIVE' ? '活跃' : '停用'}
                                </span>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        
        <div class="summary">
            共 {customers.length} 个客户
        </div>
    {/if}
</div>

<style>
    .content-container {
        max-width: 1000px;
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
    
    .filter-bar {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
    
    .search-box {
        position: relative;
        flex: 1;
        min-width: 200px;
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
    
    .filter-select {
        padding: 0.625rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.95rem;
        background-color: white;
        min-width: 120px;
    }
    
    .filter-select:focus {
        outline: none;
        border-color: #3b82f6;
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
    
    .customer-table {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
    }
    
    th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    th {
        background-color: #f9fafb;
        font-weight: 600;
        color: #374151;
        font-size: 0.875rem;
    }
    
    .clickable-row {
        cursor: pointer;
        transition: background-color 0.15s ease;
    }
    
    .clickable-row:hover {
        background-color: #f3f4f6;
    }
    
    .clickable-row:last-child td {
        border-bottom: none;
    }
    
    .code {
        font-family: monospace;
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    .name {
        font-weight: 500;
        color: #1f2937;
    }
    
    .level-badge, .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .level-vip {
        background-color: #fef3c7;
        color: #92400e;
    }
    
    .level-normal {
        background-color: #dbeafe;
        color: #1e40af;
    }
    
    .level-temp {
        background-color: #f3f4f6;
        color: #4b5563;
    }
    
    .status-active {
        background-color: #d1fae5;
        color: #065f46;
    }
    
    .status-inactive {
        background-color: #fee2e2;
        color: #991b1b;
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
        
        .filter-bar {
            flex-direction: column;
        }
        
        .search-box {
            width: 100%;
        }
        
        th, td {
            padding: 0.5rem;
            font-size: 0.875rem;
        }
    }
</style>

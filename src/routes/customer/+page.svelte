<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { customerAPI } from '$lib/api';
    import type { Customer } from '$lib/schemas';
    import { DataTable, FilterPanel, FormInput, FormSelect } from '$lib/components/ui';
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
    
    // 表格列定义
    const columns = [
        { key: 'code', title: '客户编号', width: '120px' },
        { key: 'name', title: '客户名称' },
        { key: 'contact_name', title: '联系人' },
        { key: 'phone', title: '电话' },
        { key: 'level', title: '等级', width: '100px' },
        { key: 'status', title: '状态', width: '100px' },
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
                customers = (result as { results: Customer[] }).results;
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
    
    function viewDetail(customer: Customer) {
        goto(`/customer/${customer.id}`);
    }
    
    function resetFilters() {
        searchQuery = '';
        levelFilter = '';
        statusFilter = '';
        loadCustomers();
    }
    
    function getLevelBadgeClass(level: string): string {
        switch (level) {
            case 'VIP': return 'badge-warning';
            case 'NORMAL': return 'badge-info';
            case 'TEMP': return 'badge-ghost';
            default: return 'badge-ghost';
        }
    }
    
    onMount(() => {
        loadCustomers();
    });
</script>

<svelte:head>
    <title>客户管理 - AnyWarehouse</title>
</svelte:head>

<div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
        <h1>客户管理</h1>
        <a href="/customer/add" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>添加客户</span>
        </a>
    </div>
    
    {#if error}
        <Alert {error} onDismiss={() => error = ''} />
    {/if}
    
    <!-- 筛选区域 -->
    <FilterPanel onReset={resetFilters} showActions={false}>
        <div class="filter-row">
            <FormInput
                label="搜索"
                name="search"
                value={searchQuery}
                placeholder="搜索客户编号、名称、联系人..."
                onchange={(v) => { searchQuery = v; loadCustomers(); }}
            />
            
            <FormSelect
                label="等级"
                name="level"
                options={levelOptions}
                value={levelFilter}
                onchange={(v) => { levelFilter = v; loadCustomers(); }}
            />
            
            <FormSelect
                label="状态"
                name="status"
                options={statusOptions}
                value={statusFilter}
                onchange={(v) => { statusFilter = v; loadCustomers(); }}
            />
        </div>
    </FilterPanel>
    
    {#if !loading && customers.length === 0}
        <div class="empty-state">
            <p>{searchQuery || levelFilter || statusFilter ? '没有找到匹配的客户' : '暂无客户'}</p>
            {#if !searchQuery && !levelFilter && !statusFilter}
                <a href="/customer/add" class="btn btn-primary">添加第一个客户</a>
            {:else}
                <button class="btn btn-secondary" onclick={resetFilters}>
                    清除筛选
                </button>
            {/if}
        </div>
    {:else}
        <DataTable
            data={customers}
            {columns}
            {loading}
            clickable={true}
            onRowClick={viewDetail}
            emptyText={searchQuery || levelFilter || statusFilter ? '没有找到匹配的客户' : '暂无客户'}
        >
            {#snippet cellRender({ item, column, value }: { item: Customer; column: { key: string }; value: unknown })}
                {#if column.key === 'code'}
                    <span class="code-badge">{value}</span>
                {:else if column.key === 'level'}
                    <span class="badge {getLevelBadgeClass(value as string)}">
                        {levelOptions.find(o => o.value === value)?.label || value}
                    </span>
                {:else if column.key === 'status'}
                    {#if value === 'ACTIVE'}
                        <span class="badge badge-success">活跃</span>
                    {:else}
                        <span class="badge badge-error">停用</span>
                    {/if}
                {:else if column.key === 'contact_name' || column.key === 'phone'}
                    {value || '-'}
                {:else}
                    {value}
                {/if}
            {/snippet}
        </DataTable>
        
        <div class="summary">
            共 {customers.length} 个客户
        </div>
    {/if}
</div>

<style>
    .page-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
    }
    
    .filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        width: 100%;
    }
    
    .filter-row :global(.form-field) {
        flex: 1;
        min-width: 150px;
    }
    
    .filter-row :global(.form-field:first-child) {
        flex: 2;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .empty-state p {
        color: #9ca3af;
        margin-bottom: 1rem;
    }
    
    .code-badge {
        font-family: monospace;
        font-size: 0.85rem;
        color: #6b7280;
        background-color: #f3f4f6;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
    }
    
    .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .badge-ghost { background: #f3f4f6; color: #6b7280; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    
    .summary {
        margin-top: 1rem;
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.9rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s ease;
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
    
    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .filter-row {
            flex-direction: column;
        }
        
        .filter-row :global(.form-field),
        .filter-row :global(.form-field:first-child) {
            width: 100%;
            flex: none;
        }
    }
</style>

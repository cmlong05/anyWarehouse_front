<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { customerAPI } from '$lib/api';
    import type { Customer } from '$lib/schemas';
    import { DataTable, FilterPanel, FormInput, FormSelect } from '$lib/components/ui';
    import Alert from '$lib/components/Alert.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import Plus from 'lucide-svelte/icons/plus';
    
    let customers = $state<Customer[]>([]);
    let loading = $state(true);
    let error = $state('');
    let searchQuery = $state('');
    let levelFilter = $state('');
    let statusFilter = $state('');
    let sortKey = $state<keyof Customer>('code');
    let sortDirection = $state<'asc' | 'desc'>('asc');
    
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
        { key: 'code', title: '客户编号', width: '120px', sortable: true },
        { key: 'name', title: '客户名称', sortable: true },
        { key: 'contact_name', title: '联系人', sortable: true },
        { key: 'phone', title: '电话', sortable: true },
        { key: 'level', title: '等级', width: '100px', sortable: true },
        { key: 'status', title: '状态', width: '100px', sortable: true },
    ];

    const sortedCustomers = $derived.by(() => {
        const list = [...customers];
        const direction = sortDirection === 'asc' ? 1 : -1;

        return list.sort((a, b) => {
            const rawA = a[sortKey] ?? '';
            const rawB = b[sortKey] ?? '';

            if (typeof rawA === 'number' && typeof rawB === 'number') {
                return (rawA - rawB) * direction;
            }

            return String(rawA).localeCompare(String(rawB), 'zh-CN', {
                numeric: true,
                sensitivity: 'base'
            }) * direction;
        });
    });
    
    // 等级徽章样式
    function getLevelClass(level: string): string {
        const classes: Record<string, string> = {
            VIP: 'bg-yellow-100 text-yellow-700',
            NORMAL: 'bg-blue-100 text-blue-700',
            TEMP: 'bg-gray-100 text-gray-600',
        };
        return classes[level] || 'bg-gray-100 text-gray-600';
    }
    
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

    function toggleSort(key: keyof Customer) {
        if (sortKey === key) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            return;
        }

        sortKey = key;
        sortDirection = 'asc';
    }
    
    onMount(() => {
        loadCustomers();
    });
</script>

<svelte:head>
    <title>客户管理 - AnyWarehouse</title>
</svelte:head>

<PageContainer>
    <PageHeader title="客户管理">
        {#snippet actions()}
            <button
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                onclick={() => goto('/customer/add')}
            >
                <Plus class="h-5 w-5" />
                添加
            </button>
        {/snippet}
    </PageHeader>
    
    {#if error}
        <Alert {error} onDismiss={() => error = ''} />
    {/if}
    
    <!-- 筛选区域 -->
    <FilterPanel onReset={resetFilters}>
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
    </FilterPanel>
    
    {#if !loading && customers.length === 0}
        <div class="text-center py-12 bg-white rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p class="text-gray-500 mb-4">{searchQuery || levelFilter || statusFilter ? '没有找到匹配的客户' : '暂无客户'}</p>
            {#if !searchQuery && !levelFilter && !statusFilter}
                <button
                    type="button"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onclick={() => goto('/customer/add')}
                >
                    添加第一个客户
                </button>
            {:else}
                <button
                    type="button"
                    class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    onclick={resetFilters}
                >
                    清除筛选
                </button>
            {/if}
        </div>
    {:else}
        <DataTable
            data={sortedCustomers}
            {columns}
            {loading}
            clickable={true}
            onRowClick={viewDetail}
            emptyText={searchQuery || levelFilter || statusFilter ? '没有找到匹配的客户' : '暂无客户'}
        >
            {#snippet headerCellRender({ column }: { column: { key: string; title: string; sortable?: boolean } })}
                {#if column.sortable}
                    <span
                        role="button"
                        tabindex="0"
                        class="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 cursor-pointer select-none"
                        onclick={() => toggleSort(column.key as keyof Customer)}
                        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSort(column.key as keyof Customer)}
                    >
                        <span>{column.title}</span>
                        {#if sortKey === (column.key as keyof Customer)}
                            <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                        {:else}
                            <span class="text-xs text-gray-300">↕</span>
                        {/if}
                    </span>
                {:else}
                    {column.title}
                {/if}
            {/snippet}

            {#snippet cellRender({ item, column, value }: { item: Customer; column: { key: string }; value: unknown })}
                {#if column.key === 'code'}
                    <span class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{value}</span>
                {:else if column.key === 'level'}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getLevelClass(value as string)}">
                        {levelOptions.find(o => o.value === value)?.label || value}
                    </span>
                {:else if column.key === 'status'}
                    {#if value === 'ACTIVE'}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">活跃</span>
                    {:else}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">停用</span>
                    {/if}
                {:else if column.key === 'contact_name' || column.key === 'phone'}
                    <span class="text-gray-500">{value || '-'}</span>
                {:else}
                    <span class="text-gray-900">{value}</span>
                {/if}
            {/snippet}
        </DataTable>
        
        <div class="mt-4 text-sm text-gray-500">
            共 {sortedCustomers.length} 个客户
        </div>
    {/if}
</PageContainer>

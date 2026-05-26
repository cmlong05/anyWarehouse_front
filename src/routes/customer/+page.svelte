<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { customerAPI } from '$lib/api';
    import type { Customer } from '$lib/schemas';
    import { DataTable, FilterPanel, FormInput } from '$lib/components/ui';
    import FormField from '$lib/components/ui/FormField.svelte';
    import Svelecte from 'svelecte';
    import { sortByKey, toggleSortKey } from '$lib/utils/sort';
    import Alert from '$lib/components/Alert.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import Plus from 'lucide-svelte/icons/plus';
    
    let customers = $state<Customer[]>([]);
    let loading = $state(true);
    let error = $state('');
    let searchQuery = $state('');
    // 等级筛选：多选，默认不选中"临时客户"
    let levelFilter = $state<any[]>(['VIP', 'NORMAL']);
    let statusFilter = $state<any[]>(['ACTIVE']);
    let sortKey = $state<keyof Customer>('code');
    let sortDirection = $state<'asc' | 'desc'>('asc');
    let initialLoad = $state(true);
    
    const levelOptions = [
        { value: 'VIP', label: 'VIP客户' },
        { value: 'NORMAL', label: '普通客户' },
        { value: 'TEMP', label: '临时客户' }
    ];
    
    const statusOptions = [
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
        return sortByKey(customers, sortKey, sortDirection);
    });

    const levelFilterActive = $derived(
        levelFilter.length > 0 && levelFilter.length < levelOptions.length
    );
    const statusFilterActive = $derived(
        statusFilter.length > 0 && statusFilter.length < statusOptions.length
    );
    
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
            if (levelFilter.length > 0 && levelFilter.length < levelOptions.length) {
                const levels = levelFilter.map(v => typeof v === 'string' ? v : (v && v.value) ? v.value : undefined).filter(Boolean);
                if (levels.length) params.level = levels.join(',');
            }
            if (statusFilter.length > 0 && statusFilter.length < statusOptions.length) {
                const statuses = statusFilter.map(v => typeof v === 'string' ? v : (v && v.value) ? v.value : undefined).filter(Boolean);
                if (statuses.length) params.status = statuses.join(',');
            }
            
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
        levelFilter = ['VIP', 'NORMAL'];
        statusFilter = ['ACTIVE'];
        loadCustomers();
    }

    function toggleSort(key: keyof Customer) {
        const next = toggleSortKey(sortKey, sortDirection, key);
        sortKey = next.sortKey;
        sortDirection = next.sortDirection;
    }
    
    onMount(async () => {
        await loadCustomers();
        initialLoad = false;
    });

    // 监听筛选条件变化，初始加载后重新查询
    $effect(() => {
        if (initialLoad) return;
        if (levelFilter || statusFilter) {
            loadCustomers();
        }
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
        
        <FormField label="等级" for="level-filter">
            <div class="min-w-[180px]">
                <Svelecte
                    options={levelOptions}
                    bind:value={levelFilter}
                    multiple={true}
                    emitValues={true}
                    closeAfterSelect={false}
                    keepSelectionInList={false}
                    collapseSelection={null}
                    valueField="value"
                    labelField="label"
                    placeholder="选择等级"
                />
            </div>
        </FormField>
        
        <FormField label="状态" for="status-filter">
            <div class="min-w-[180px]">
                <Svelecte
                    options={statusOptions}
                    bind:value={statusFilter}
                    multiple={true}
                    emitValues={true}
                    closeAfterSelect={false}
                    keepSelectionInList={false}
                    collapseSelection={null}
                    valueField="value"
                    labelField="label"
                    placeholder="选择状态"
                />
            </div>
        </FormField>
    </FilterPanel>
    
    {#if !loading && customers.length === 0}
        <div class="text-center py-12 bg-white rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p class="text-gray-500 mb-4">{searchQuery || levelFilterActive || statusFilterActive ? '没有找到匹配的客户' : '暂无客户'}</p>
            {#if !searchQuery && !levelFilterActive && !statusFilterActive}
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
            onHeaderClick={(key) => toggleSort(key as keyof Customer)}
            sortKey={sortKey as string}
            {sortDirection}
            emptyText={searchQuery || levelFilterActive || statusFilter ? '没有找到匹配的客户' : '暂无客户'}
        >
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

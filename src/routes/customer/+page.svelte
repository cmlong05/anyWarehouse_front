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
    
    function getLevelBadgeClass(level: string) {
        switch (level) {
            case 'VIP': return 'badge-warning';
            case 'NORMAL': return 'badge-info';
            case 'TEMP': return 'badge-ghost';
            default: return 'badge-ghost';
        }
    }
</script>

<svelte:head>
    <title>客户管理 - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">客户管理</h1>
        <a href="/customer/add" class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>添加客户</span>
        </a>
    </div>
    
    <!-- 搜索和过滤 -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex gap-4 flex-wrap">
            <div class="flex-1 min-w-[200px]">
                <input
                    type="text"
                    placeholder="搜索客户编号、名称、联系人..."
                    class="input input-bordered w-full"
                    bind:value={searchQuery}
                    oninput={handleSearch}
                />
            </div>
            <select bind:value={levelFilter} onchange={handleSearch} class="select select-bordered min-w-[140px]">
                {#each levelOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
            <select bind:value={statusFilter} onchange={handleSearch} class="select select-bordered min-w-[120px]">
                {#each statusOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>
    </div>
    
    {#if loading}
        <Loading />
    {:else if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {:else if customers.length === 0}
        <div class="bg-white rounded-lg shadow p-8 text-center">
            <p class="text-gray-400">{searchQuery || levelFilter || statusFilter ? '没有找到匹配的客户' : '暂无客户'}</p>
            {#if !searchQuery && !levelFilter && !statusFilter}
                <a href="/customer/add" class="btn btn-primary mt-4">添加第一个客户</a>
            {:else}
                <button class="btn btn-ghost btn-sm mt-4" onclick={() => { 
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
        <!-- 客户列表 -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="table table-zebra w-full">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="px-4 py-3 text-left">客户编号</th>
                        <th class="px-4 py-3 text-left">客户名称</th>
                        <th class="px-4 py-3 text-left">联系人</th>
                        <th class="px-4 py-3 text-left">电话</th>
                        <th class="px-4 py-3 text-left">等级</th>
                        <th class="px-4 py-3 text-left">状态</th>
                    </tr>
                </thead>
                <tbody>
                    {#each customers as customer}
                        <tr class="hover:bg-blue-50 cursor-pointer" onclick={() => window.location.href = `/customer/${customer.id}`}>
                            <td class="px-4 py-3 font-mono text-sm text-gray-600">{customer.code}</td>
                            <td class="px-4 py-3 font-medium">{customer.name}</td>
                            <td class="px-4 py-3">{customer.contact_name || '-'}</td>
                            <td class="px-4 py-3">{customer.phone || '-'}</td>
                            <td class="px-4 py-3">
                                <span class="badge {getLevelBadgeClass(customer.level)} badge-sm">
                                    {levelOptions.find(o => o.value === customer.level)?.label || customer.level}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                {#if customer.status === 'ACTIVE'}
                                    <span class="badge badge-success badge-sm">活跃</span>
                                {:else}
                                    <span class="badge badge-error badge-sm">停用</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        
        <div class="mt-4 text-gray-500 text-sm">
            共 {customers.length} 个客户
        </div>
    {/if}
</div>

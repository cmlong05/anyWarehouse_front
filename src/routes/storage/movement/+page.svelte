<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { inventoryMovementAPI, type InventoryMovement, type MovementType } from '$lib/api';
    import { formatDate, getErrorMessage } from '$lib/utils';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import Plus from 'lucide-svelte/icons/plus';
    import Svelecte from 'svelecte';

    const typeOptions = [
        { value: 'inbound', label: '入库' },
        { value: 'outbound', label: '出库' },
        { value: 'transfer', label: '移库' },
    ];

    let movements = $state<InventoryMovement[]>([]);
    let loading = $state(true);
    let error = $state('');
    let totalCount = $state(0);
    let currentPage = $state(1);
    const pageSize = 20;

    // 筛选
    let filterType = $state<MovementType | '' | null>('');
    let filterItem = $state('');
    let filterContainer = $state('');
    let filterDateFrom = $state('');
    let filterDateTo = $state('');

    onMount(() => {
        loadMovements();
    });

    async function loadMovements() {
        try {
            loading = true;
            error = '';
            const filters: Record<string, any> = {
                page: currentPage,
                page_size: pageSize,
            };
            if (filterType) filters.movement_type = filterType;
            if (filterItem) filters.item = Number(filterItem);
            if (filterContainer) filters.container = Number(filterContainer);
            if (filterDateFrom) filters.date_from = filterDateFrom;
            if (filterDateTo) filters.date_to = filterDateTo;
            const response = await inventoryMovementAPI.listFiltered(filters);
            movements = response?.results ?? [];
            totalCount = response?.count ?? movements.length;
        } catch (err) {
            error = getErrorMessage(err, '加载出入库记录失败');
        } finally {
            loading = false;
        }
    }

    function applyFilters() {
        currentPage = 1;
        loadMovements();
    }

    function resetFilters() {
        filterType = '';
        filterItem = '';
        filterContainer = '';
        filterDateFrom = '';
        filterDateTo = '';
        currentPage = 1;
        loadMovements();
    }

    function changePage(p: number) {
        currentPage = p;
        loadMovements();
    }

    function typeBadgeClass(t: MovementType): string {
        return badgeClasses[t];
    }

    const badgeClasses: Record<MovementType, string> = {
        inbound: 'bg-emerald-100 text-emerald-800',
        outbound: 'bg-red-100 text-red-800',
        transfer: 'bg-blue-100 text-blue-800',
    };

    const totalPages = $derived(Math.max(1, Math.ceil(totalCount / pageSize)));
</script>

<svelte:head>
    <title>出入库记录</title>
</svelte:head>

<div class="p-6 max-w-[1400px] mx-auto">
    <header class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold text-gray-900">出入库记录</h1>
        <button
            class="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            onclick={() => goto('/storage/movement/add')}
        >
            <Plus size={16} /> 新建记录
        </button>
    </header>

    <section class="bg-gray-50 p-4 rounded-lg mb-4">
        <div class="flex flex-wrap gap-3 items-end">
            <label class="flex flex-col gap-1 text-sm text-gray-700">
                类型
                <div class="min-w-[160px]">
                    <Svelecte
                        inputId="filter-type"
                        options={typeOptions}
                        bind:value={filterType}
                        placeholder="全部"
                        clearable={true}
                        class="svelecte-control"
                    />
                </div>
            </label>
            <label class="flex flex-col gap-1 text-sm text-gray-700">
                物品 ID
                <input
                    type="number"
                    bind:value={filterItem}
                    placeholder="物品 ID"
                    class="px-3 py-2 border border-gray-300 rounded-md min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </label>
            <label class="flex flex-col gap-1 text-sm text-gray-700">
                容器 ID
                <input
                    type="number"
                    bind:value={filterContainer}
                    placeholder="容器 ID"
                    class="px-3 py-2 border border-gray-300 rounded-md min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </label>
            <label class="flex flex-col gap-1 text-sm text-gray-700">
                起始日期
                <input
                    type="date"
                    bind:value={filterDateFrom}
                    class="px-3 py-2 border border-gray-300 rounded-md min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </label>
            <label class="flex flex-col gap-1 text-sm text-gray-700">
                截止日期
                <input
                    type="date"
                    bind:value={filterDateTo}
                    class="px-3 py-2 border border-gray-300 rounded-md min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </label>
            <div class="flex gap-2">
                <button
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    onclick={applyFilters}
                >
                    筛选
                </button>
                <button
                    class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    onclick={resetFilters}
                >
                    重置
                </button>
            </div>
        </div>
    </section>

    {#if error}
        <Alert error={error} />
    {/if}

    {#if loading}
        <Loading />
    {:else if movements.length === 0}
        <p class="text-center py-8 text-gray-500">没有出入库记录</p>
    {:else}
        <div class="overflow-x-auto bg-white border border-gray-200 rounded-lg">
            <table class="w-full border-collapse">
                <thead>
                    <tr>
                        <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">单号</th>
                        <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">类型</th>
                        <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">物品</th>
                        <th class="px-3 py-2.5 text-right text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">数量</th>
                        <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">来源</th>
                        <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">目标</th>
                        <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">原因</th>
                        <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">关联</th>
                        <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">时间</th>
                        <th class="px-3 py-2.5 text-left text-sm font-semibold text-gray-700 bg-gray-50 border-b border-gray-100">操作人</th>
                    </tr>
                </thead>
                <tbody>
                    {#each movements as m (m.id)}
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100 font-mono text-xs">{m.movement_no}</td>
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100">
                                <span class={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClasses[m.movement_type]}`}>
                                    {m.movement_type_display}
                                </span>
                            </td>
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100">
                                <div class="flex flex-col">
                                    <a href={`/item/${m.item}`} class="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                                        {m.item_sku}
                                    </a>
                                    <span class="text-xs text-gray-500">{m.item_name}</span>
                                </div>
                            </td>
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100 text-right tabular-nums">{m.quantity}</td>
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100">
                                {#if m.from_container_code}
                                    <a href={`/container/${m.from_container_code}`} class="text-blue-600 hover:text-blue-800 transition-colors">
                                        {m.from_container_code}
                                    </a>
                                {:else}
                                    -
                                {/if}
                            </td>
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100">
                                {#if m.to_container_code}
                                    <a href={`/container/${m.to_container_code}`} class="text-blue-600 hover:text-blue-800 transition-colors">
                                        {m.to_container_code}
                                    </a>
                                {:else}
                                    -
                                {/if}
                            </td>
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100">{m.reason || '-'}</td>
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100">
                                {#if m.purchase_order_no}PO: {m.purchase_order_no}{/if}
                                {#if m.sales_order_no}SO: {m.sales_order_no}{/if}
                                {#if m.shipment_no}SH: {m.shipment_no}{/if}
                                {#if !m.purchase_order_no && !m.sales_order_no && !m.shipment_no}-{/if}
                            </td>
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100">{formatDate(m.created_at)}</td>
                            <td class="px-3 py-2.5 text-sm border-b border-gray-100">{m.created_by || '-'}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        {#if totalPages > 1}
            <div class="flex justify-center gap-4 items-center mt-4">
                <button
                    disabled={currentPage <= 1}
                    onclick={() => changePage(currentPage - 1)}
                    class="px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    上一页
                </button>
                <span class="text-sm text-gray-600">{currentPage} / {totalPages}</span>
                <button
                    disabled={currentPage >= totalPages}
                    onclick={() => changePage(currentPage + 1)}
                    class="px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    下一页
                </button>
            </div>
        {/if}
    {/if}
</div>


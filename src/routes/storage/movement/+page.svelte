<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { inventoryMovementAPI, type InventoryMovement, type MovementType } from '$lib/api';
    import { formatDate } from '$lib/utils';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import Plus from 'lucide-svelte/icons/plus';

    let movements = $state<InventoryMovement[]>([]);
    let loading = $state(true);
    let error = $state('');
    let totalCount = $state(0);
    let currentPage = $state(1);
    const pageSize = 20;

    // 筛选
    let filterType = $state<MovementType | ''>('');
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
        } catch (err: any) {
            error = err.message || '加载出入库记录失败';
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
        return {
            inbound: 'badge-inbound',
            outbound: 'badge-outbound',
            transfer: 'badge-transfer',
        }[t];
    }

    const totalPages = $derived(Math.max(1, Math.ceil(totalCount / pageSize)));
</script>

<svelte:head>
    <title>出入库记录</title>
</svelte:head>

<div class="page">
    <header class="page-header">
        <h1>出入库记录</h1>
        <button class="btn-primary" onclick={() => goto('/storage/movement/add')}>
            <Plus size={16} /> 新建记录
        </button>
    </header>

    <section class="filters">
        <div class="filter-row">
            <label>
                类型
                <select bind:value={filterType}>
                    <option value="">全部</option>
                    <option value="inbound">入库</option>
                    <option value="outbound">出库</option>
                    <option value="transfer">移库</option>
                </select>
            </label>
            <label>
                物品 ID
                <input type="number" bind:value={filterItem} placeholder="物品 ID" />
            </label>
            <label>
                容器 ID
                <input type="number" bind:value={filterContainer} placeholder="容器 ID" />
            </label>
            <label>
                起始日期
                <input type="date" bind:value={filterDateFrom} />
            </label>
            <label>
                截止日期
                <input type="date" bind:value={filterDateTo} />
            </label>
            <div class="filter-actions">
                <button class="btn-primary" onclick={applyFilters}>筛选</button>
                <button class="btn-secondary" onclick={resetFilters}>重置</button>
            </div>
        </div>
    </section>

    {#if error}
        <Alert error={error} />
    {/if}

    {#if loading}
        <Loading />
    {:else if movements.length === 0}
        <p class="empty">没有出入库记录</p>
    {:else}
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>单号</th>
                        <th>类型</th>
                        <th>物品</th>
                        <th>数量</th>
                        <th>来源</th>
                        <th>目标</th>
                        <th>原因</th>
                        <th>关联</th>
                        <th>时间</th>
                        <th>操作人</th>
                    </tr>
                </thead>
                <tbody>
                    {#each movements as m (m.id)}
                        <tr>
                            <td class="mono">{m.movement_no}</td>
                            <td>
                                <span class="badge {typeBadgeClass(m.movement_type)}">
                                    {m.movement_type_display}
                                </span>
                            </td>
                            <td>
                                <div class="item-cell">
                                    <span class="sku">{m.item_sku}</span>
                                    <span class="name">{m.item_name}</span>
                                </div>
                            </td>
                            <td class="num">{m.quantity}</td>
                            <td>{m.from_container_code ?? '-'}</td>
                            <td>{m.to_container_code ?? '-'}</td>
                            <td>{m.reason || '-'}</td>
                            <td>
                                {#if m.purchase_order_no}PO: {m.purchase_order_no}{/if}
                                {#if m.sales_order_no}SO: {m.sales_order_no}{/if}
                                {#if m.shipment_no}SH: {m.shipment_no}{/if}
                                {#if !m.purchase_order_no && !m.sales_order_no && !m.shipment_no}-{/if}
                            </td>
                            <td>{formatDate(m.created_at)}</td>
                            <td>{m.created_by || '-'}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        {#if totalPages > 1}
            <div class="pagination">
                <button disabled={currentPage <= 1} onclick={() => changePage(currentPage - 1)}>上一页</button>
                <span>{currentPage} / {totalPages}</span>
                <button disabled={currentPage >= totalPages} onclick={() => changePage(currentPage + 1)}>下一页</button>
            </div>
        {/if}
    {/if}
</div>

<style>
    .page { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .filters { background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; }
    .filter-row label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; }
    .filter-row input, .filter-row select { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; min-width: 140px; }
    .filter-actions { display: flex; gap: 0.5rem; }
    .btn-primary { background: #4f46e5; color: white; padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; }
    .btn-secondary { background: #e5e7eb; color: #1f2937; padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; }
    .table-wrap { overflow-x: auto; background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.625rem 0.75rem; text-align: left; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; }
    th { background: #f9fafb; font-weight: 600; color: #374151; }
    .mono { font-family: monospace; font-size: 0.8rem; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .item-cell { display: flex; flex-direction: column; }
    .sku { font-weight: 600; color: #4f46e5; }
    .name { font-size: 0.75rem; color: #6b7280; }
    .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .badge-inbound { background: #d1fae5; color: #065f46; }
    .badge-outbound { background: #fee2e2; color: #991b1b; }
    .badge-transfer { background: #dbeafe; color: #1e40af; }
    .pagination { display: flex; justify-content: center; gap: 1rem; align-items: center; margin-top: 1rem; }
    .pagination button { padding: 0.4rem 0.8rem; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .empty { text-align: center; padding: 2rem; color: #6b7280; }
</style>

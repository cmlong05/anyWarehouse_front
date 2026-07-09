<!-- 包裹列表页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { logger } from '$lib/logger';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { packageAPI } from '$lib/api';
    import { formatNumber, safeParseFloat, getErrorMessage } from '$lib/utils';
    import type { Package } from '$lib/shipmentTypes';
    import { Alert } from '$lib/components';
    import Plus from 'lucide-svelte/icons/plus';
    import PackageCheck from 'lucide-svelte/icons/package-check';
    import PackageOpen from 'lucide-svelte/icons/package-open';
    import { DataTable, Pagination, FilterPanel, FormInput } from '$lib/components/ui';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    let packages = $state<Package[]>([]);
    let loading = $state(true);
    let error = $state('');
    let searchQuery = $state('');
    let customerNameFilter = $state('');
    let totalCount = $state(0);
    let currentPage = $state(1);
    let pageSize = $state(20);
    
    // 删除相关状态
    let deleteId = $state<number | null>(null);
    let deletePackageNo = $state('');
    let showDeleteModal = $state(false);
    let deleting = $state(false);

    onMount(() => {
        loadPackages();
    });

    async function loadPackages() {
        try {
            loading = true;
            error = '';
            const response = await packageAPI.getList({
                search: searchQuery || undefined,
                customer_name: customerNameFilter || undefined,
                page: currentPage,
                page_size: pageSize,
                ordering: '-created_at'
            });
            packages = response.results;
            totalCount = response.count;
        } catch (err) {
            error = getErrorMessage(err, '加载包裹列表失败');
            logger.error('Load error:', err);
        } finally {
            loading = false;
        }
    }

    function goToDetail(id: number) {
        goto(`/customer/package/${id}`);
    }

    function goToAdd() {
        goto('/customer/package/add');
    }

    function handleSearch() {
        currentPage = 1;
        loadPackages();
    }

    function getShipmentInfo(pkg: Package): string {
        if (!pkg.shipments || pkg.shipments.length === 0) {
            return '未关联发货单';
        }
        return pkg.shipments.map(s => s.shipment_no).join(', ');
    }

    function getCustomerNames(pkg: Package): string {
        if (!pkg.shipments || pkg.shipments.length === 0) {
            return '-';
        }
        const names = [...new Set(pkg.shipments.map(s => s.customer_name).filter(Boolean))];
        return names.length > 0 ? names.join(', ') : '-';
    }

    function formatCompactNumber(value: string | number | undefined | null, decimals = 3): string {
        const num = safeParseFloat(value, NaN);
        if (Number.isNaN(num)) return '-';
        return formatNumber(num, decimals).replace(/\.0+$|(?<=\.\d*[1-9])0+$/, '');
    }

    function getDisplayWeight(pkg: Package): string {
        const manualWeight = safeParseFloat(pkg.weight, 0);
        return manualWeight > 0 ? manualWeight.toFixed(3) : '-';
    }

    function getDisplayVolume(pkg: Package): string {
        const volume = safeParseFloat(pkg.volume, 0);
        return volume > 0 ? formatCompactNumber(pkg.volume) : '-';
    }

    function formatMonthDay(value: string | Date | undefined | null): string {
        if (!value) return '-';
        const d = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // 四色分组：待揽收(灰) / 进行中(黄) / 已完成(绿) / 异常(红)
    function getOverallStatusGroup(status: string | undefined | null): 'pending' | 'progress' | 'done' | 'issue' | 'none' {
        if (!status || status === 'no_tracking') return 'none';
        if (status === 'pending') return 'pending';
        if (status === 'delivered') return 'done';
        if (status === 'exception' || status === 'returned' || status === 'cancelled') return 'issue';
        return 'progress';
    }

    // 删除相关函数
    function confirmDelete(pkg: Package, e: Event) {
        e.stopPropagation();
        deleteId = pkg.id;
        deletePackageNo = pkg.package_no;
        showDeleteModal = true;
    }

    function cancelDelete() {
        showDeleteModal = false;
        deleteId = null;
        deletePackageNo = '';
    }

    async function executeDelete() {
        if (deleteId === null) return;
        
        try {
            deleting = true;
            await packageAPI.delete(deleteId);
            showDeleteModal = false;
            deleteId = null;
            deletePackageNo = '';
            // 刷新列表
            await loadPackages();
        } catch (err) {
            error = getErrorMessage(err, '删除失败');
            logger.error('Delete error:', err);
        } finally {
            deleting = false;
        }
    }

    // 键盘快捷键
    $effect(() => {
        if (showDeleteModal) {
            const handler = (e: KeyboardEvent) => {
                if (e.key === 'y' || e.key === 'Y') {
                    e.preventDefault();
                    if (!deleting) executeDelete();
                } else if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    cancelDelete();
                }
            };
            window.addEventListener('keydown', handler);
            return () => window.removeEventListener('keydown', handler);
        }
    });

    const totalPages = $derived(Math.ceil(totalCount / pageSize));

    const columns = [
        { key: 'package_no', title: '包裹编号' },
        { key: 'status', title: '状态', width: '60px' },
        { key: 'sequence_no', title: '序号', width: '60px' },
        { key: 'overall_status', title: '快递', width: '60px', align: 'center' as const },
        { key: 'customer_name', title: '客户' },
        { key: 'shipments', title: '发货单' },
        { key: 'items_count', title: '商品种类', align: 'right' as const, width: '80px' },
        { key: 'total_quantity', title: '总数量', align: 'right' as const, width: '80px' },
        { key: 'weight', title: '重量 (kg)', align: 'right' as const, width: '90px' },
        { key: 'volume', title: '体积', align: 'right' as const, width: '80px' },
        { key: 'created_at', title: '创建时间', width: '80px' },
        { key: '_actions', title: '操作', align: 'center' as const, width: '60px' },
    ];
</script>

<svelte:head>
    <title>包裹管理 - AnyWarehouse</title>
</svelte:head>

<PageContainer py="sm">
    <PageHeader title="包裹管理" mb="none">
        {#snippet actions()}
            <button
                type="button"
                class="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                onclick={goToAdd}
            >
                <Plus class="h-5 w-5" />
                新建包裹
            </button>
        {/snippet}
    </PageHeader>

    {#if error}
        <Alert error={{ message: error }} />
    {/if}

    <FilterPanel onReset={() => { searchQuery = ''; customerNameFilter = ''; handleSearch(); }}>
        <FormInput
            label="搜索"
            name="search"
            value={searchQuery}
            placeholder="包裹编号、快递单号..."
            oninput={(v) => { searchQuery = v; handleSearch(); }}
        />
        <FormInput
            label="客户名称"
            name="customer_name"
            value={customerNameFilter}
            placeholder="按客户名称筛选..."
            oninput={(v) => { customerNameFilter = v; handleSearch(); }}
        />
    </FilterPanel>

    <DataTable
        data={packages}
        {columns}
        {loading}
        clickable={true}
        onRowClick={(pkg: Package) => goToDetail(pkg.id)}
        emptyText="暂无包裹数据"
    >
        {#snippet cellRender({ item, column, value }: { item: Package; column: { key: string }; value: unknown })}
            {#if column.key === 'package_no'}
                <span class="font-medium text-slate-700">{item.package_no}</span>
            {:else if column.key === 'status'}
                {#if item.status === 'sealed'}
                    <span class="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-100 text-green-600" title="已封箱" aria-label="已封箱" role="img">
                        <PackageCheck class="h-4 w-4" aria-hidden="true" />
                    </span>
                {:else}
                    <span class="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-600" title="待装箱" aria-label="待装箱" role="img">
                        <PackageOpen class="h-4 w-4" aria-hidden="true" />
                    </span>
                {/if}
            {:else if column.key === 'sequence_no'}
                <span class="text-slate-500">#{item.sequence_no}</span>
            {:else if column.key === 'overall_status'}
                {#if !item.overall_status || item.overall_status === 'no_tracking'}
                    <span class="text-gray-400">-</span>
                {:else}
                    {@const group = getOverallStatusGroup(item.overall_status)}
                    <span
                        class="inline-flex h-4 w-4 rounded-full"
                        class:bg-[radial-gradient(circle,_rgba(148,163,184,1)_5%,_rgba(148,163,184,0)_90%)]={group === 'pending'}
                        class:bg-[radial-gradient(circle,_rgba(250,204,21,1)_5%,_rgba(250,204,21,0)_90%)]={group === 'progress'}
                        class:bg-[radial-gradient(circle,_rgba(34,197,94,1)_5%,_rgba(34,197,94,0)_90%)]={group === 'done'}
                        class:bg-[radial-gradient(circle,_rgba(239,68,68,1)_5%,_rgba(239,68,68,0)_90%)]={group === 'issue'}
                        title={item.overall_status_display}
                        aria-label={item.overall_status_display}
                        role="img"
                    >
                        <span class="sr-only">{item.overall_status_display}</span>
                    </span>
                {/if}
            {:else if column.key === 'shipments'}
                <span class="text-sm {item.shipments?.length ? '' : 'text-gray-400'}">{getShipmentInfo(item)}</span>
            {:else if column.key === 'customer_name'}
                <span class="text-sm {getCustomerNames(item) !== '-' ? '' : 'text-gray-400'}">{getCustomerNames(item)}</span>
            {:else if column.key === 'items_count'}
                {item.items?.length || 0}
            {:else if column.key === 'total_quantity'}
                {formatNumber(item.total_quantity)}
            {:else if column.key === 'weight'}
                {getDisplayWeight(item)}
            {:else if column.key === 'volume'}
                {getDisplayVolume(item)}
            {:else if column.key === 'created_at'}
                <span class="text-sm text-gray-500 whitespace-nowrap">{formatMonthDay(item.created_at)}</span>
            {:else if column.key === '_actions'}
                {#if item.status !== 'sealed'}
                <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-red-600 transition-colors"
                    onclick={(e) => confirmDelete(item, e)}
                    title="删除"
                    aria-label="删除"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
                {/if}
            {:else}
                <span>{value ?? '-'}</span>
            {/if}
        {/snippet}
    </DataTable>

    <Pagination
        page={currentPage}
        {totalCount}
        {totalPages}
        onPageChange={(p) => { currentPage = p; loadPackages(); }}
    />
</PageContainer>

<!-- 删除确认弹窗 -->
{#if showDeleteModal}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
         onclick={(e) => { if(e.target === e.currentTarget) cancelDelete(); }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="font-bold text-lg mb-4">确认删除</h3>
            <p class="py-2 text-gray-600">确定要删除包裹 "{deletePackageNo}" 吗？此操作不可撤销。</p>
            <p class="text-xs text-gray-400 mt-2">按 Y 确认，ESC 或 N 取消</p>
            <div class="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    class="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onclick={cancelDelete}
                >取消 (N)</button>
                <button
                    type="button"
                    class="inline-flex h-9 items-center rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    onclick={executeDelete}
                    disabled={deleting}
                >{deleting ? '删除中...' : '确认删除 (Y)'}</button>
            </div>
        </div>
    </div>
{/if}
<script lang="ts">
	import { logger } from '$lib/logger';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { packageAPI } from '$lib/api';
    import { formatDate, formatNumber, safeParseFloat, getErrorMessage } from '$lib/utils';
    import type { Package } from '$lib/shipmentTypes';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import Plus from 'lucide-svelte/icons/plus';
    import PackageCheck from 'lucide-svelte/icons/package-check';
    import PackageOpen from 'lucide-svelte/icons/package-open';

    let packages = $state<Package[]>([]);
    let loading = $state(true);
    let error = $state('');
    let searchQuery = $state('');
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

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    function changePage(page: number) {
        currentPage = page;
        loadPackages();
    }

    function getShipmentInfo(pkg: Package): string {
        if (!pkg.shipments || pkg.shipments.length === 0) {
            return '未关联发货单';
        }
        return pkg.shipments.map(s => s.shipment_no).join(', ');
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
</script>

<svelte:head>
    <title>包裹管理 - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">包裹管理</h1>
        <button class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2" onclick={goToAdd}>
            <Plus class="h-5 w-5 flex-shrink-0" />
            <span>新建包裹</span>
        </button>
    </div>

    {#if error}
        <Alert error={{ message: error }} />
    {/if}

    <!-- 搜索栏 -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex gap-4">
            <div class="flex-1">
                <input
                    type="text"
                    placeholder="搜索包裹编号、快递单号..."
                    class="input input-bordered w-full"
                    bind:value={searchQuery}
                    onkeydown={handleKeydown}
                />
            </div>
            <button class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-1.5 px-4" onclick={handleSearch}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>搜索</span>
            </button>
        </div>
    </div>

    {#if loading}
        <Loading />
    {:else if packages.length === 0}
        <div class="bg-white rounded-lg shadow p-8 text-center">
            <p class="text-gray-400">暂无包裹数据</p>
            {#if searchQuery}
                <button class="btn btn-ghost btn-sm mt-4" onclick={() => { searchQuery = ''; handleSearch(); }}>
                    清除搜索条件
                </button>
            {/if}
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow overflow-x-auto">
            <table class="table table-zebra w-full min-w-[1100px]">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="px-4 py-3 text-left">包裹编号</th>
                        <th class="px-4 py-3 text-left">状态</th>
                        <th class="px-4 py-3 text-left">序号</th>
                        <th class="px-4 py-3 text-left">快递</th>
                        <th class="px-4 py-3 text-left">发货单</th>
                        <th class="px-4 py-3 text-right">商品种类</th>
                        <th class="px-4 py-3 text-right">总数量</th>
                        <th class="px-4 py-3 text-right">重量 (kg)</th>
                        <th class="px-4 py-3 text-right">体积</th>
                        <th class="px-4 py-3 text-left">创建时间</th>
                        <th class="px-4 py-3 text-center">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {#each packages as pkg}
                        <tr class="hover:bg-blue-50 cursor-pointer" onclick={() => goToDetail(pkg.id)}>
                            <td class="px-4 py-3 font-medium">{pkg.package_no}</td>
                            <td class="px-4 py-3">
                                {#if pkg.status === 'sealed'}
                                    <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600" title="已封箱" aria-label="已封箱" role="img">
                                        <PackageCheck class="h-5 w-5" aria-hidden="true" />
                                    </span>
                                {:else}
                                    <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-600" title="待装箱" aria-label="待装箱" role="img">
                                        <PackageOpen class="h-5 w-5" aria-hidden="true" />
                                    </span>
                                {/if}
                            </td>
                            <td class="px-4 py-3">#{pkg.sequence_no}</td>
                            <td class="px-4 py-3">
                                {#if !pkg.overall_status || pkg.overall_status === 'no_tracking'}
                                    <span class="text-gray-400">-</span>
                                {:else}
                                    {@const group = getOverallStatusGroup(pkg.overall_status)}
                                    <span
                                        class="inline-flex h-4 w-4 rounded-full"
                                        class:bg-[radial-gradient(circle,_rgba(148,163,184,1)_5%,_rgba(148,163,184,0)_90%)]={group === 'pending'}
                                        class:bg-[radial-gradient(circle,_rgba(250,204,21,1)_5%,_rgba(250,204,21,0)_90%)]={group === 'progress'}
                                        class:bg-[radial-gradient(circle,_rgba(34,197,94,1)_5%,_rgba(34,197,94,0)_90%)]={group === 'done'}
                                        class:bg-[radial-gradient(circle,_rgba(239,68,68,1)_5%,_rgba(239,68,68,0)_90%)]={group === 'issue'}
                                        title={pkg.overall_status_display}
                                        aria-label={pkg.overall_status_display}
                                        role="img"
                                    >
                                        <span class="sr-only">{pkg.overall_status_display}</span>
                                    </span>
                                {/if}
                            </td>
                            <td class="px-4 py-3">
                                <span class="text-sm {pkg.shipments?.length ? '' : 'text-gray-400'}">
                                    {getShipmentInfo(pkg)}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-right">{pkg.items?.length || 0}</td>
                            <td class="px-4 py-3 text-right">{formatNumber(pkg.total_quantity)}</td>
                            <td class="px-4 py-3 text-right">{getDisplayWeight(pkg)}</td>
                            <td class="px-4 py-3 text-right">{getDisplayVolume(pkg)}</td>
                            <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatMonthDay(pkg.created_at)}</td>
                            <td class="px-4 py-3 text-center">
                                <button 
                                    class="btn btn-ghost btn-sm p-1 text-gray-500 hover:text-gray-700" 
                                    onclick={(e) => confirmDelete(pkg, e)}
                                    title="删除"
                                    aria-label="删除"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <!-- 分页 -->
        {#if totalPages > 1}
            <div class="flex justify-center mt-6">
                <div class="join">
                    <button 
                        class="join-item btn btn-sm" 
                        onclick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        «
                    </button>
                    {#each Array(totalPages) as _, i}
                        {@const page = i + 1}
                        {#if page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)}
                            <button 
                                class="join-item btn btn-sm {page === currentPage ? 'btn-active' : ''}"
                                onclick={() => changePage(page)}
                            >
                                {page}
                            </button>
                        {:else if page === currentPage - 3 || page === currentPage + 3}
                            <button class="join-item btn btn-sm btn-disabled">...</button>
                        {/if}
                    {/each}
                    <button 
                        class="join-item btn btn-sm" 
                        onclick={() => changePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        »
                    </button>
                </div>
            </div>
        {/if}

        <div class="text-center text-sm text-gray-500 mt-4">
            共 {totalCount} 条记录
        </div>
    {/if}
</div>

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
                <button class="btn btn-ghost" onclick={cancelDelete}>取消 (N)</button>
                <button class="btn btn-error" onclick={executeDelete} disabled={deleting}>
                    {deleting ? '删除中...' : '确认删除 (Y)'}
                </button>
            </div>
        </div>
    </div>
{/if}

<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { shipmentAPI } from '$lib/shipmentApi';
    import { formatDate } from '$lib/utils';
    import type { Shipment, ShipmentFilters } from '$lib/shipmentTypes';
    import { SHIPMENT_STATUS_CHOICES } from '$lib/shipmentTypes';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';

    let shipments = $state<Shipment[]>([]);
    let loading = $state(true);
    let error = $state('');
    let deleteId = $state<number | null>(null);
    let deleteName = $state('');
    let deleting = $state(false);

    // 筛选器
    let filters = $state<ShipmentFilters>({
        search: '',
        status: '',
        ordering: '-created_at',
        page: 1,
        page_size: 20
    });

    // 分页
    let totalCount = $state(0);
    let totalPages = $state(1);
    let hasNext = $state(false);
    let hasPrev = $state(false);

    onMount(() => {
        const currentPage = get(page);
        const urlParams = new URLSearchParams(currentPage.url.search);
        
        filters.search = urlParams.get('search') || '';
        filters.status = urlParams.get('status') || '';
        
        loadShipments();
    });

    async function loadShipments() {
        try {
            loading = true;
            error = '';
            const response = await shipmentAPI.list(filters);
            shipments = response.results;
            totalCount = response.count;
            totalPages = Math.ceil(response.count / (filters.page_size || 20));
            hasNext = !!response.next;
            hasPrev = !!response.previous;
        } catch (err: any) {
            error = err.message || '加载失败';
        } finally {
            loading = false;
        }
    }

    function applyFilters() {
        filters.page = 1;
        loadShipments();
    }

    function clearFilters() {
        filters.search = '';
        filters.status = '';
        filters.page = 1;
        loadShipments();
    }

    function changePage(delta: number) {
        filters.page = (filters.page || 1) + delta;
        loadShipments();
    }

    function goToAdd() {
        goto('/customer/shipment/add');
    }

    function goToDetail(id: number) {
        goto(`/customer/shipment/${id}`);
    }

    function goToEdit(id: number) {
        goto(`/customer/shipment/${id}/edit`);
    }

    function confirmDelete(shipment: Shipment) {
        deleteId = shipment.id;
        deleteName = shipment.shipment_no;
    }

    function cancelDelete() {
        deleteId = null;
        deleteName = '';
    }

    async function executeDelete() {
        if (!deleteId) return;
        
        try {
            deleting = true;
            await shipmentAPI.delete(deleteId);
            deleteId = null;
            deleteName = '';
            await loadShipments();
        } catch (err: any) {
            error = err.message || '删除失败';
        } finally {
            deleting = false;
        }
    }

    // 全局键盘事件处理
    $effect(() => {
        if (deleteId !== null) {
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

    function getStatusText(status: string) {
        return SHIPMENT_STATUS_CHOICES.find(s => s.value === status)?.label || status;
    }

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'draft': return 'badge-ghost';
            case 'ready': return 'badge-info';
            case 'shipped': return 'badge-success';
            case 'delivered': return 'badge-primary';
            case 'cancelled': return 'badge-error';
            default: return '';
        }
    }
</script>

<svelte:head>
    <title>发货管理 - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">发货管理</h1>
        <button class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2" onclick={goToAdd}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>新建发货批次</span>
        </button>
    </div>

    {#if error}
        <Alert error={{ message: error }} onDismiss={() => error = ''} />
    {/if}

    <!-- 筛选器 -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-wrap gap-4 items-end">
            <div class="form-control">
                <label class="label" for="filter-search">
                    <span class="label-text">搜索</span>
                </label>
                <input 
                    id="filter-search"
                    type="text" 
                    class="input input-bordered input-sm w-64"
                    bind:value={filters.search}
                    placeholder="发货批次号/收货人"
                    onkeypress={(e) => e.key === 'Enter' && applyFilters()}
                />
            </div>
            <div class="form-control">
                <label class="label" for="filter-status">
                    <span class="label-text">状态</span>
                </label>
                <select id="filter-status" class="select select-bordered select-sm" bind:value={filters.status} onchange={applyFilters}>
                    <option value="">全部状态</option>
                    {#each SHIPMENT_STATUS_CHOICES as status}
                        <option value={status.value}>{status.label}</option>
                    {/each}
                </select>
            </div>
            <div class="form-control">
                <label class="label" for="filter-ordering">
                    <span class="label-text">排序</span>
                </label>
                <select id="filter-ordering" class="select select-bordered select-sm" bind:value={filters.ordering} onchange={applyFilters}>
                    <option value="-created_at">创建时间降序</option>
                    <option value="created_at">创建时间升序</option>
                    <option value="-shipment_no">批次号降序</option>
                    <option value="shipment_no">批次号升序</option>
                </select>
            </div>
            <div class="flex gap-2">
                <button class="btn btn-primary btn-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap" onclick={applyFilters}>筛选</button>
                <button class="btn btn-ghost btn-sm rounded-lg hover:bg-gray-100 transition-all duration-200 whitespace-nowrap" onclick={clearFilters}>清除</button>
            </div>
        </div>
    </div>

    {#if loading}
        <Loading />
    {:else}
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="overflow-x-auto">
                <table class="table table-zebra w-full">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="px-4 py-3 text-left">发货批次号</th>
                            <th class="px-4 py-3 text-left">状态</th>
                            <th class="px-4 py-3 text-left">关联订单</th>
                            <th class="px-4 py-3 text-left">收货人/电话</th>
                            <th class="px-4 py-3 text-center">包裹数</th>
                            <th class="px-4 py-3 text-left">创建时间</th>
                            <th class="px-4 py-3 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each shipments as shipment}
                            <tr class="hover:bg-blue-50 cursor-pointer" onclick={() => goToDetail(shipment.id)}>
                                <td class="px-4 py-3 font-medium">{shipment.shipment_no}</td>
                                <td class="px-4 py-3">
                                    <span class="badge {getStatusBadgeClass(shipment.status)}">
                                        {getStatusText(shipment.status)}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    {#if shipment.order_detail}
                                        <div>
                                            <div class="font-medium">{shipment.order_detail.order_number}</div>
                                            <div class="text-sm text-gray-500">{shipment.order_detail.customer_name}</div>
                                        </div>
                                    {:else}
                                        <span class="text-gray-400">-</span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3">
                                    {#if shipment.contact_person || shipment.contact_phone}
                                        <div>
                                            <div>{shipment.contact_person || '-'}</div>
                                            <div class="text-sm text-gray-500">{shipment.contact_phone || '-'}</div>
                                        </div>
                                    {:else}
                                        <span class="text-gray-400">-</span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="badge badge-outline">{shipment.packages?.length || 0}</span>
                                </td>
                                <td class="px-4 py-3 text-sm">
                                    {formatDate(shipment.created_at)}
                                </td>
                                <td class="px-4 py-3">
                                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                                    <div class="flex items-center justify-center gap-2" onclick={(e) => e.stopPropagation()} role="none" onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }} tabindex="-1">
                                        <button 
                                            class="btn btn-ghost btn-sm p-1" 
                                            title="编辑"
                                            aria-label="编辑"
                                            onclick={() => goToEdit(shipment.id)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button 
                                            class="btn btn-ghost btn-sm p-1 text-error" 
                                            title="删除"
                                            aria-label="删除"
                                            onclick={() => confirmDelete(shipment)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                        {#if shipments.length === 0}
                            <tr>
                                <td colspan="7" class="text-center py-8 text-gray-400">
                                    暂无发货记录
                                </td>
                            </tr>
                        {/if}
                    </tbody>
                </table>
            </div>

            <!-- 分页 -->
            {#if totalPages > 1}
                <div class="flex justify-between items-center p-4 border-t">
                    <div class="text-sm text-gray-500">
                        共 {totalCount} 条记录，第 {filters.page} / {totalPages} 页
                    </div>
                    <div class="flex gap-2">
                        <button 
                            class="btn btn-sm" 
                            disabled={!hasPrev}
                            onclick={() => changePage(-1)}
                        >
                            上一页
                        </button>
                        <button 
                            class="btn btn-sm" 
                            disabled={!hasNext}
                            onclick={() => changePage(1)}
                        >
                            下一页
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>

<!-- 删除确认模态框 -->
{#if deleteId !== null}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" 
         onclick={(e) => { if(e.target === e.currentTarget) cancelDelete(); }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="font-bold text-lg mb-4">确认删除</h3>
            <p class="py-2 text-gray-600">确定要删除发货单 "{deleteName}" 吗？此操作不可撤销。</p>
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

<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { shipmentAPI } from '$lib/api';
    import { formatDate } from '$lib/utils';
    import type { Shipment, ShipmentFilters } from '$lib/shipmentTypes';
    import { SHIPMENT_STATUS_CHOICES } from '$lib/shipmentTypes';
    import { DataTable, Pagination, FilterPanel, FormInput, FormSelect } from '$lib/components/ui';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import Alert from '$lib/components/Alert.svelte';

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

    // 表格列定义
    const columns = [
        { key: 'shipment_no', title: '发货批次号' },
        { key: 'status', title: '状态', width: '100px' },
        { key: 'order', title: '关联订单' },
        { key: 'contact', title: '收货人/电话' },
        { key: 'packages', title: '包裹数', align: 'center' as const, width: '80px' },
        { key: 'created_at', title: '创建时间', width: '150px' },
    ];

    // 状态选项
    const statusOptions = [
        { value: '', label: '全部状态' },
        ...SHIPMENT_STATUS_CHOICES
    ];

    // 排序选项
    const orderingOptions = [
        { value: '-created_at', label: '创建时间降序' },
        { value: 'created_at', label: '创建时间升序' },
        { value: '-shipment_no', label: '批次号降序' },
        { value: 'shipment_no', label: '批次号升序' },
    ];

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
            const params: Record<string, string> = {};
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;
            if (filters.ordering) params.ordering = filters.ordering;
            if (filters.page) params.page = filters.page.toString();
            if (filters.page_size) params.page_size = filters.page_size.toString();
            const response = await shipmentAPI.list(params);
            // 处理数组或分页对象两种格式
            if (Array.isArray(response)) {
                shipments = response;
                totalCount = response.length;
                totalPages = 1;
            } else {
                shipments = response.results || [];
                totalCount = response.count || 0;
                totalPages = Math.ceil(totalCount / (filters.page_size || 20));
            }
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

    function getStatusBadgeClass(status: string): string {
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

<PageContainer>
    <PageHeader title="发货管理">
        {#snippet actions()}
            <button class="btn btn-primary" onclick={goToAdd}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>新建发货批次</span>
            </button>
        {/snippet}
    </PageHeader>

    {#if error}
        <Alert error={{ message: error }} onDismiss={() => error = ''} />
    {/if}

    <!-- 筛选器 -->
    <FilterPanel onReset={clearFilters} onApply={applyFilters}>
        <div class="filter-row">
            <FormInput
                label="搜索"
                name="search"
                value={filters.search || ''}
                placeholder="发货批次号/收货人"
                onchange={(v) => filters.search = v}
            />
            <FormSelect
                label="状态"
                name="status"
                options={statusOptions}
                value={filters.status || ''}
                onchange={(v) => filters.status = v}
            />
            <FormSelect
                label="排序"
                name="ordering"
                options={orderingOptions}
                value={filters.ordering || ''}
                onchange={(v) => filters.ordering = v}
            />
        </div>
    </FilterPanel>

    <DataTable
        data={shipments}
        {columns}
        {loading}
        clickable={true}
        onRowClick={(s: Shipment) => goToDetail(s.id)}
        emptyText="暂无发货记录"
    >
        {#snippet cellRender({ item, column }: { item: Shipment; column: { key: string } })}
            {#if column.key === 'status'}
                <span class="badge {getStatusBadgeClass(item.status)}">
                    {SHIPMENT_STATUS_CHOICES.find(s => s.value === item.status)?.label || item.status}
                </span>
            {:else if column.key === 'order'}
                {#if item.order_detail}
                    <div>
                        <div class="font-medium">{item.order_detail.order_number}</div>
                        <div class="text-sm text-gray-500">{item.order_detail.customer_name}</div>
                    </div>
                {:else}
                    <span class="text-gray-400">-</span>
                {/if}
            {:else if column.key === 'contact'}
                {#if item.contact_person || item.contact_phone}
                    <div>
                        <div>{item.contact_person || '-'}</div>
                        <div class="text-sm text-gray-500">{item.contact_phone || '-'}</div>
                    </div>
                {:else}
                    <span class="text-gray-400">-</span>
                {/if}
            {:else if column.key === 'packages'}
                <span class="badge badge-outline">{item.packages?.length || 0}</span>
            {:else if column.key === 'created_at'}
                <span class="text-sm">{formatDate(item.created_at)}</span>
            {:else}
                {item[column.key as keyof Shipment]}
            {/if}
        {/snippet}
    </DataTable>

    <!-- 分页 -->
    <Pagination
        page={filters.page || 1}
        {totalCount}
        {totalPages}
        onPageChange={(p) => { filters.page = p; loadShipments(); }}
    />
</PageContainer>

<!-- 删除确认模态框 -->
{#if deleteId !== null}
    <div class="modal-backdrop" onclick={(e) => { if(e.target === e.currentTarget) cancelDelete(); }}>
        <div class="modal-content">
            <h3 class="modal-title">确认删除</h3>
            <p class="modal-text">确定要删除发货单 "{deleteName}" 吗？此操作不可撤销。</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick={cancelDelete}>取消</button>
                <button class="btn btn-error" onclick={executeDelete} disabled={deleting}>
                    {deleting ? '删除中...' : '确认删除'}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
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

    .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .badge-ghost { background: #f3f4f6; color: #6b7280; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-primary { background: #cce5ff; color: #004085; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    .badge-outline { border: 1px solid #d1d5db; color: #6b7280; }

    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-content {
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        max-width: 400px;
        width: 90%;
        padding: 1.5rem;
    }

    .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
    }

    .modal-text {
        color: #6b7280;
        margin-bottom: 1.5rem;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    @media (max-width: 768px) {
        .filter-row {
            flex-direction: column;
        }

        .filter-row :global(.form-field) {
            width: 100%;
        }
    }
</style>

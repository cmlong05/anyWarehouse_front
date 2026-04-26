<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { shipmentAPI } from '$lib/api';
    import { formatDate, getErrorMessage } from '$lib/utils';
    import type { Shipment, ShipmentFilters } from '$lib/shipmentTypes';
    import { SHIPMENT_STATUS_CHOICES } from '$lib/shipmentTypes';
    import ShipmentStatusBadge from '$lib/components/ShipmentStatusBadge.svelte';
    import { DataTable, Pagination, FilterPanel, FormInput, FormSelect } from '$lib/components/ui';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import Alert from '$lib/components/Alert.svelte';
    import Plus from 'lucide-svelte/icons/plus';

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
        { key: 'customer', title: '所属客户' },
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
        } catch (err) {
            error = getErrorMessage(err, '加载失败');
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
        } catch (err) {
            error = getErrorMessage(err, '删除失败');
        } finally {
            deleting = false;
        }
    }
</script>

<svelte:head>
    <title>发货管理 - AnyWarehouse</title>
</svelte:head>

<PageContainer>
    <PageHeader title="发货管理">
        {#snippet actions()}
            <button 
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                onclick={goToAdd}
            >
                <Plus class="h-5 w-5 flex-shrink-0" />
                <span>新建发货批次</span>
            </button>
        {/snippet}
    </PageHeader>

    {#if error}
        <Alert error={{ message: error }} onDismiss={() => error = ''} />
    {/if}

    <!-- 筛选器 -->
    <FilterPanel onReset={clearFilters} onApply={applyFilters}>
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
                <ShipmentStatusBadge status={item.status} />
            {:else if column.key === 'order'}
                {#if item.order_detail}
                    <div class="font-medium">{item.order_detail.order_number}</div>
                {:else}
                    <span class="text-gray-400">-</span>
                {/if}
            {:else if column.key === 'customer'}
                {#if item.order_detail?.customer_name}
                    <span>{item.order_detail.customer_name}</span>
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
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-gray-300 text-gray-600">
                    {item.total_packages ?? 0}
                </span>
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
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        onclick={(e) => { if(e.target === e.currentTarget) cancelDelete(); }} 
        role="button" 
        tabindex="0" 
        aria-label="关闭"
    >
        <div class="bg-white rounded-lg shadow-2xl max-w-md w-[90%] p-6">
            <h3 class="text-xl font-semibold mb-4">确认删除</h3>
            <p class="text-gray-500 mb-6">确定要删除发货单 "{deleteName}" 吗？此操作不可撤销。</p>
            <div class="flex justify-end gap-3">
                <button 
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    onclick={cancelDelete}
                >
                    取消
                </button>
                <button 
                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    onclick={executeDelete} 
                    disabled={deleting}
                >
                    {deleting ? '删除中...' : '确认删除'}
                </button>
            </div>
        </div>
    </div>
{/if}

<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page as pageStore } from '$app/state';
    import { purchaseOrderAPI, supplierAPI } from '$lib/api';
    import type { PurchaseOrderBrief, SupplierBrief } from '$lib';
    import { useOrderList, ORDER_STATUS_OPTIONS, PRIORITY_OPTIONS, PURCHASE_STATUS_MAP, PRIORITY_LABEL_MAP } from '$lib/composables/useOrderList.svelte';
    import { DataTable, Pagination, FilterPanel, FormSelect, FormInput } from '$lib/components/ui';
    import Alert from '$lib/components/Alert.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';

    // 供应商列表
    let suppliers = $state<SupplierBrief[]>([]);
    
    // 使用 useOrderList composable
    const orderList = useOrderList<PurchaseOrderBrief>({
        api: purchaseOrderAPI,
        initialFilters: {
            supplier_id: '',
            status: '',
            priority: '',
            order_number: '',
            date_from: '',
            date_to: '',
        },
        filterMapping: {
            supplier_id: 'supplier_id',
        },
    });
    
    // 供应商选项
    const supplierOptions = $derived([
        { value: '', label: '全部供应商' },
        ...suppliers.map(s => ({ value: s.id.toString(), label: s.name }))
    ]);
    
    // 表格列定义
    const columns = [
        { key: 'order_number', title: '订单编号' },
        { key: 'supplier_name', title: '供应商' },
        { key: 'status', title: '状态' },
        { key: 'priority', title: '优先级' },
        { key: 'order_date', title: '下单日期' },
        { key: 'expected_delivery', title: '预计交货' },
        { key: 'total_amount', title: '金额', align: 'right' as const },
        { key: 'item_count', title: '明细数', align: 'right' as const },
    ];

    // 加载供应商列表
    async function loadSuppliers() {
        try {
            suppliers = await supplierAPI.listBrief();
        } catch (err) {
            console.error('加载供应商失败:', err);
        }
    }

    // 查看详情
    function viewDetail(id: number) {
        goto(`/supplier/purchase-order/${id}`);
    }

    // 格式化金额
    function formatAmount(amount: string): string {
        return `¥${parseFloat(amount).toFixed(2)}`;
    }

    // 从URL获取供应商筛选
    $effect(() => {
        const supplierId = pageStore.url.searchParams.get('supplier_id');
        if (supplierId && orderList.filters.supplier_id !== supplierId) {
            orderList.filters.supplier_id = supplierId;
            orderList.page = 1;
            orderList.loadData();
        }
    });
    
    onMount(() => {
        loadSuppliers();
        if (!pageStore.url.searchParams.get('supplier_id')) {
            orderList.loadData();
        }
    });
</script>

<PageContainer maxWidth="full">
    <PageHeader title="采购订单管理">
        {#snippet actions()}
            <a href="/supplier" class="btn btn-primary">+ 从供应商创建</a>
        {/snippet}
    </PageHeader>

    {#if orderList.error}
        <Alert error={orderList.error} onDismiss={() => orderList.setError(null)} />
    {/if}

    <!-- 筛选区域 -->
    <FilterPanel onReset={orderList.resetFilters} showActions={false}>
        <div class="filter-row">
            <FormSelect
                label="供应商"
                name="supplier"
                options={supplierOptions}
                value={orderList.filters.supplier_id || ''}
                onchange={(v) => { orderList.filters.supplier_id = v; orderList.applyFilters(); }}
            />
            
            <FormSelect
                label="状态"
                name="status"
                options={ORDER_STATUS_OPTIONS.purchase}
                value={orderList.filters.status || ''}
                onchange={(v) => { orderList.filters.status = v; orderList.applyFilters(); }}
            />
            
            <FormSelect
                label="优先级"
                name="priority"
                options={PRIORITY_OPTIONS}
                value={orderList.filters.priority || ''}
                onchange={(v) => { orderList.filters.priority = v; orderList.applyFilters(); }}
            />
            
            <FormInput
                label="订单号"
                name="order_number"
                value={orderList.filters.order_number || ''}
                placeholder="搜索订单号"
                onchange={(v) => { orderList.filters.order_number = v; orderList.applyFilters(); }}
            />
        </div>
        
        <div class="filter-row">
            <FormInput
                type="date"
                label="下单日期从"
                name="date_from"
                value={orderList.filters.date_from || ''}
                onchange={(v) => { orderList.filters.date_from = v; orderList.applyFilters(); }}
            />
            
            <FormInput
                type="date"
                label="到"
                name="date_to"
                value={orderList.filters.date_to || ''}
                onchange={(v) => { orderList.filters.date_to = v; orderList.applyFilters(); }}
            />
        </div>
    </FilterPanel>

    <!-- 数据表格 -->
    {#if !orderList.loading && orderList.items.length === 0}
        <div class="empty-state">
            <p>暂无采购订单</p>
            <a href="/supplier" class="btn btn-primary">前往供应商页面创建</a>
            <p class="hint">采购订单需从具体供应商页面创建</p>
        </div>
    {:else}
        <DataTable
            data={orderList.items}
            {columns}
            loading={orderList.loading}
            clickable={true}
            onRowClick={(item: PurchaseOrderBrief) => viewDetail(item.id)}
            emptyText="暂无采购订单"
        >
            {#snippet cellRender({ item, column, value }: { item: PurchaseOrderBrief; column: { key: string }; value: unknown })}
                {#if column.key === 'order_number'}
                    <span class="order-number">{value}</span>
                {:else if column.key === 'status'}
                    <span class="badge {PURCHASE_STATUS_MAP[value as string]?.class || ''}">
                        {PURCHASE_STATUS_MAP[value as string]?.label || value}
                    </span>
                {:else if column.key === 'priority'}
                    {PRIORITY_LABEL_MAP[value as string] || value}
                {:else if column.key === 'expected_delivery'}
                    {value || '-'}
                {:else if column.key === 'total_amount'}
                    {formatAmount(value as string)}
                {:else}
                    {value}
                {/if}
            {/snippet}
        </DataTable>

        <!-- 分页 -->
        <Pagination
            page={orderList.page}
            totalCount={orderList.totalCount}
            totalPages={orderList.totalPages}
            onPageChange={orderList.goToPage}
        />
    {/if}
</PageContainer>

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

    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .empty-state p {
        color: #666;
        margin-bottom: 1rem;
    }

    .hint {
        font-size: 0.85rem;
        color: #999;
        margin-top: 0.5rem;
    }

    .order-number {
        font-family: monospace;
        font-weight: 500;
    }

    .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .badge-ghost { background: #e9ecef; color: #495057; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
    .badge-primary { background: #cce5ff; color: #004085; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-error { background: #f8d7da; color: #721c24; }

    @media (max-width: 768px) {
        .filter-row {
            flex-direction: column;
        }

        .filter-row :global(.form-field) {
            width: 100%;
        }
    }
</style>

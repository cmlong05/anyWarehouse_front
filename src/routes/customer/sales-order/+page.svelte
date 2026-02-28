<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page as pageStore } from '$app/state';
    import { salesOrderAPI, customerAPI } from '$lib/api';
    import type { SalesOrderBrief, CustomerBrief } from '$lib';
    import { useOrderList, ORDER_STATUS_OPTIONS, PRIORITY_OPTIONS, SALES_STATUS_MAP, PRIORITY_MAP } from '$lib/composables/useOrderList.svelte';
    import { DataTable, Pagination, FilterPanel, FormSelect, FormInput } from '$lib/components/ui';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import Alert from '$lib/components/Alert.svelte';

    // 客户列表
    let customers = $state<CustomerBrief[]>([]);
    let copyError = $state<string | null>(null);
    
    // 使用 useOrderList composable
    const orderList = useOrderList<SalesOrderBrief>({
        api: salesOrderAPI,
        initialFilters: {
            customer_id: '',
            status: '',
            priority: '',
            order_number: '',
            date_from: '',
            date_to: '',
        },
        filterMapping: {
            customer_id: 'customer_id',
        },
    });
    
    // 供应商选项
    const customerOptions = $derived([
        { value: '', label: '全部客户' },
        ...customers.map(c => ({ value: c.id.toString(), label: c.name }))
    ]);
    
    // 表格列定义
    const columns = [
        { key: 'order_number', title: '订单编号' },
        { key: 'customer_name', title: '客户' },
        { key: 'status', title: '状态' },
        { key: 'priority', title: '优先级' },
        { key: 'order_date', title: '下单日期' },
        { key: 'expected_delivery', title: '预计交货' },
        { key: 'total_amount', title: '金额', align: 'right' as const },
        { key: 'item_count', title: '明细数', align: 'right' as const },
    ];

    // 加载客户列表
    async function loadCustomers() {
        try {
            customers = await customerAPI.listBrief();
        } catch (err) {
            console.error('加载客户失败:', err);
        }
    }

    // 复制订单
    async function copyOrder(order: SalesOrderBrief) {
        try {
            const fullOrder = await salesOrderAPI.get(order.id);
            
            const copyData = {
                customer_id: fullOrder.customer,
                customer_name: fullOrder.customer_detail?.name,
                copy_from_order_id: fullOrder.id,
                copy_from_order_number: fullOrder.order_number,
                order_data: {
                    priority: fullOrder.priority,
                    shipping_address: fullOrder.shipping_address,
                    contact_person: fullOrder.contact_person,
                    contact_phone: fullOrder.contact_phone,
                    payment_terms: fullOrder.payment_terms,
                    tax_rate: parseFloat(fullOrder.tax_rate),
                    shipping_cost: parseFloat(fullOrder.shipping_cost),
                    discount: parseFloat(fullOrder.discount),
                    notes: `复制自订单 ${fullOrder.order_number}`,
                    internal_notes: '',
                    items: fullOrder.items?.map(item => ({
                        item: item.item,
                        sku: item.sku,
                        item_name: item.item_name,
                        quantity: item.quantity,
                        unit_price: parseFloat(item.unit_price),
                        notes: item.notes
                    })) || []
                }
            };
            
            sessionStorage.setItem('sales_order_copy_data', JSON.stringify(copyData));
            goto(`/customer/sales-order/add?customer_id=${fullOrder.customer}`);
        } catch (err: any) {
            copyError = err.message || '复制订单失败';
            console.error('Copy error:', err);
        }
    }

    // 查看详情
    function viewDetail(id: number) {
        goto(`/customer/sales-order/${id}`);
    }

    // 格式化金额
    function formatAmount(amount: string): string {
        return `¥${parseFloat(amount).toFixed(2)}`;
    }

    // 从URL获取客户筛选
    $effect(() => {
        const customerId = pageStore.url.searchParams.get('customer_id');
        if (customerId && orderList.filters.customer_id !== customerId) {
            orderList.filters.customer_id = customerId;
            orderList.page = 1;
            orderList.loadData();
        }
    });
    
    onMount(() => {
        loadCustomers();
        if (!pageStore.url.searchParams.get('customer_id')) {
            orderList.loadData();
        }
    });
</script>

<PageContainer>
    <PageHeader title="销售订单管理">
        {#snippet actions()}
            <a href="/customer" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>从客户创建</span>
            </a>
        {/snippet}
    </PageHeader>

    {#if orderList.error}
        <Alert error={orderList.error} onDismiss={() => orderList.setError(null)} />
    {/if}
    
    {#if copyError}
        <Alert error={copyError} onDismiss={() => copyError = null} />
    {/if}

    <!-- 筛选区域 -->
    <FilterPanel onReset={orderList.resetFilters} showActions={false}>
        <div class="filter-row">
            <FormSelect
                label="客户"
                name="customer"
                options={customerOptions}
                value={orderList.filters.customer_id || ''}
                onchange={(v) => { orderList.filters.customer_id = v; orderList.applyFilters(); }}
            />
            
            <FormSelect
                label="状态"
                name="status"
                options={ORDER_STATUS_OPTIONS.sales}
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
            <p>暂无销售订单</p>
            <a href="/customer" class="btn btn-primary">前往客户页面创建</a>
            <p class="hint">销售订单需从具体客户页面创建</p>
        </div>
    {:else}
        <DataTable
            data={orderList.items}
            {columns}
            loading={orderList.loading}
            clickable={true}
            onRowClick={(item: SalesOrderBrief) => viewDetail(item.id)}
            emptyText="暂无销售订单"
        >
            {#snippet cellRender({ item, column, value }: { item: SalesOrderBrief; column: { key: string }; value: unknown })}
                {#if column.key === 'order_number'}
                    <span class="order-number">{value}</span>
                {:else if column.key === 'status'}
                    <span class="badge {SALES_STATUS_MAP[value as string]?.class || ''}">
                        {SALES_STATUS_MAP[value as string]?.label || value}
                    </span>
                {:else if column.key === 'priority'}
                    <span class="badge {PRIORITY_MAP[value as string]?.class || ''}">
                        {PRIORITY_MAP[value as string]?.label || value}
                    </span>
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

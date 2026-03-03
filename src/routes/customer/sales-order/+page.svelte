<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page as pageStore } from '$app/state';
    import { salesOrderAPI, customerAPI } from '$lib/api';
    import type { SalesOrderBrief, CustomerBrief } from '$lib';
    import { useOrderList, ORDER_STATUS_OPTIONS, PRIORITY_OPTIONS } from '$lib/composables/useOrderList.svelte';
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
    
    // 客户选项
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

    // 状态徽章样式
    function getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-600',
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-blue-100 text-blue-700',
            confirmed: 'bg-indigo-100 text-indigo-700',
            partial: 'bg-green-100 text-green-700',
            shipped: 'bg-emerald-100 text-emerald-700',
            delivered: 'bg-purple-100 text-purple-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return classes[status] || 'bg-gray-100 text-gray-600';
    }

    // 优先级徽章样式
    function getPriorityClass(priority: string): string {
        const classes: Record<string, string> = {
            low: 'bg-gray-100 text-gray-600',
            normal: 'bg-blue-100 text-blue-700',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-100 text-red-700',
        };
        return classes[priority] || 'bg-gray-100 text-gray-600';
    }

    // 状态标签
    function getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            draft: '草稿',
            pending: '待审批',
            approved: '已批准',
            confirmed: '已确认',
            partial: '部分发货',
            shipped: '已发货',
            delivered: '已完成',
            cancelled: '已取消',
        };
        return labels[status] || status;
    }

    // 优先级标签
    function getPriorityLabel(priority: string): string {
        const labels: Record<string, string> = {
            low: '低',
            normal: '普通',
            high: '高',
            urgent: '紧急',
        };
        return labels[priority] || priority;
    }

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
            <button 
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                onclick={() => goto('/customer')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                从客户创建
            </button>
        {/snippet}
    </PageHeader>

    {#if orderList.error}
        <Alert error={orderList.error} onDismiss={() => orderList.setError(null)} />
    {/if}
    
    {#if copyError}
        <Alert error={copyError} onDismiss={() => copyError = null} />
    {/if}

    <!-- 筛选区域 -->
    <FilterPanel onReset={orderList.resetFilters}>
        <div class="flex flex-wrap items-end gap-4">
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
        <div class="text-center py-16 bg-white rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-gray-500 mb-4">暂无销售订单</p>
            <a 
                href="/customer" 
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                前往客户页面创建
            </a>
            <p class="text-sm text-gray-400 mt-3">销售订单需从具体客户页面创建</p>
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
                    <span class="font-mono font-medium text-gray-900">{value}</span>
                {:else if column.key === 'status'}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusClass(value as string)}">
                        {getStatusLabel(value as string)}
                    </span>
                {:else if column.key === 'priority'}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getPriorityClass(value as string)}">
                        {getPriorityLabel(value as string)}
                    </span>
                {:else if column.key === 'expected_delivery'}
                    <span class="text-gray-500">{value || '-'}</span>
                {:else if column.key === 'total_amount'}
                    <span class="font-medium text-gray-900">{formatAmount(value as string)}</span>
                {:else}
                    <span class="text-gray-700">{value}</span>
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

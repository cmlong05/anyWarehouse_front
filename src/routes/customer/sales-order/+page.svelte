<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page as pageStore } from '$app/state';
    import { salesOrderAPI, customerAPI } from '$lib/api';
    import type { SalesOrderBrief, CustomerBrief } from '$lib';
    import { useOrderList, ORDER_STATUS_OPTIONS, PRIORITY_OPTIONS } from '$lib/composables/useOrderList.svelte';
    import { sortByKey, toggleSortKey } from '$lib/utils/sort';
    import { DataTable, Pagination, FilterPanel, FormSelect, FormInput } from '$lib/components/ui';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import { LocaleSwitcher } from '$lib/components/shipment';
    import Alert from '$lib/components/Alert.svelte';
    import { localeStore, t, getStatusText, getPriorityText } from '$lib/i18n/sales';
    import Plus from 'lucide-svelte/icons/plus';

    // 客户列表
    let customers = $state<CustomerBrief[]>([]);
    let copyError = $state<string | null>(null);
    let showDeliveredPaid = $state(false);
    
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
            exclude_delivered_paid: '1',
        },
        filterMapping: {
            customer_id: 'customer_id',
        },
    });

    function handleStatusChange(value: string) {
        orderList.filters.status = value;
        orderList.applyFilters();
    }

    function handleShowDeliveredPaidToggle(value: boolean) {
        showDeliveredPaid = value;
        const nextFilters = { ...orderList.filters };

        if (showDeliveredPaid) {
            delete nextFilters.exclude_delivered_paid;
        } else {
            nextFilters.exclude_delivered_paid = '1';
        }

        orderList.filters = nextFilters;
        orderList.applyFilters();
    }

    function resetAllFilters() {
        orderList.resetFilters();
        showDeliveredPaid = false;
    }
    
    // 客户选项
    const customerOptions = $derived([
        { value: '', label: $localeStore === 'zh' ? '全部客户' : 'All Customers' },
        ...customers.map(c => ({ value: c.id.toString(), label: c.name }))
    ]);
    
    let sortKey = $state<keyof SalesOrderBrief>('order_date');
    let sortDirection = $state<'asc' | 'desc'>('desc');

    // 表格列定义
    const columns = $derived([
        { key: 'order_number', title: t('sales.field.orderNumber', $localeStore), sortable: true },
        { key: 'customer_name', title: t('sales.field.customer', $localeStore), sortable: true },
        { key: 'status', title: t('sales.field.status', $localeStore), sortable: true },
        { key: 'payment_status', title: $localeStore === 'zh' ? '收款' : 'Payment Status', sortable: true },
        { key: 'priority', title: t('sales.field.priority', $localeStore), sortable: true },
        { key: 'order_date', title: t('sales.field.orderDate', $localeStore), sortable: true },
        { key: 'expected_delivery', title: t('sales.field.expectedDelivery', $localeStore), sortable: true },
        { key: 'total_amount', title: $localeStore === 'zh' ? '金额' : t('sales.field.totalAmount', $localeStore), align: 'right' as const, sortable: true },
        { key: 'item_count', title: t('sales.items.title', $localeStore), align: 'right' as const, sortable: true },
    ]);

    const sortedItems = $derived.by(() => sortByKey(orderList.items, sortKey, sortDirection));

    function toggleSort(columnKey: string) {
        const next = toggleSortKey(sortKey, sortDirection, columnKey as keyof SalesOrderBrief);
        sortKey = next.sortKey;
        sortDirection = next.sortDirection;
    }

    // 状态徽章样式
    function getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-600',
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-blue-100 text-blue-700',
            confirmed: 'bg-indigo-100 text-indigo-700',
            partial: 'bg-amber-100 text-amber-700',
            shipped: 'bg-purple-100 text-purple-700',
            delivered: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return classes[status] || 'bg-gray-100 text-gray-600';
    }

    // 优先级徽章样式
    function getPriorityClass(priority: string): string {
        const classes: Record<string, string> = {
            low: 'bg-gray-100 text-gray-600',
            normal: '',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-100 text-red-700',
        };
        return classes[priority] ?? 'bg-gray-100 text-gray-600';
    }

    // 状态标签
    function getStatusLabel(status: string): string {
        return getStatusText(status, $localeStore);
    }

    // 优先级标签
    function getPriorityLabel(priority: string): string {
        return getPriorityText(priority, $localeStore);
    }

    // 付款状态标签
    function getPaymentStatusLabel(status: string | undefined): string {
        if ($localeStore === 'en') {
            if (status === 'paid') return 'Paid';
            if (status === 'partial') return 'Partially Paid';
            return 'Unpaid';
        }

        if (status === 'paid') return '已收款';
        if (status === 'partial') return '部分收款';
        return '未收款';
    }

    // 付款状态徽章样式
    function getPaymentStatusClass(status: string | undefined): string {
        if (status === 'paid') return 'bg-green-100 text-green-700';
        if (status === 'partial') return 'bg-amber-100 text-amber-700';
        return 'bg-gray-100 text-gray-700';
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
                    notes: `${$localeStore === 'zh' ? '复制自订单' : 'Copied from order'} ${fullOrder.order_number}`,
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
            copyError = err.message || ($localeStore === 'zh' ? '复制订单失败' : 'Failed to copy order');
            console.error('Copy error:', err);
        }
    }

    // 查看详情
    function viewDetail(id: number) {
        goto(`/customer/sales-order/${id}`);
    }

    // 获取货币符号
    function getCurrencySymbol(currency: string): string {
        const symbols: Record<string, string> = {
            'CNY': '¥',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
        };
        return symbols[currency] || currency + ' ';
    }
    
    // 格式化金额
    function formatAmount(amount: string, currency: string = 'CNY'): string {
        return `${getCurrencySymbol(currency)}${parseFloat(amount).toFixed(2)}`;
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
    <PageHeader title={t('sales.list.title', $localeStore)}>
        {#snippet actions()}
            <LocaleSwitcher variant="button" />
            <button 
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                onclick={() => goto('/customer')}
            >
                <Plus class="h-5 w-5" />
                {$localeStore === 'zh' ? '从客户创建' : 'Create from Customer'}
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
    <FilterPanel onReset={resetAllFilters}>
        <FormSelect
            label={t('sales.field.priority', $localeStore)}
            name="priority"
            options={PRIORITY_OPTIONS}
            value={orderList.filters.priority || ''}
            onchange={(v) => { orderList.filters.priority = v; orderList.applyFilters(); }}
        />

        <FormSelect
            label={t('sales.field.customer', $localeStore)}
            name="customer"
            options={customerOptions}
            value={orderList.filters.customer_id || ''}
            onchange={(v) => { orderList.filters.customer_id = v; orderList.applyFilters(); }}
        />
        
        <FormSelect
            label={t('sales.field.status', $localeStore)}
            name="status"
            options={ORDER_STATUS_OPTIONS.sales}
            value={orderList.filters.status || ''}
            onchange={(v) => handleStatusChange(v)}
        />

        <div class="flex items-center gap-3 text-base text-gray-700">
            <label class="inline-flex items-center gap-3 cursor-pointer px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                    type="checkbox"
                    checked={showDeliveredPaid}
                    onchange={(event) => handleShowDeliveredPaidToggle((event.target as HTMLInputElement).checked)}
                    class="h-5 w-5 text-blue-600 border-gray-300 rounded"
                />
                <span>{$localeStore === 'zh' ? '已交付收款' : 'Show Delivered + Paid'}</span>
            </label>
        </div>
        
        <FormInput
            label={t('sales.field.orderNumber', $localeStore)}
            name="order_number"
            value={orderList.filters.order_number || ''}
            placeholder={$localeStore === 'zh' ? '搜索订单号' : 'Search order number'}
            onchange={(v) => { orderList.filters.order_number = v; orderList.applyFilters(); }}
        />
        
        <FormInput
            type="date"
            label={t('sales.field.orderDate', $localeStore)}
            name="date_from"
            value={orderList.filters.date_from || ''}
            onchange={(v) => { orderList.filters.date_from = v; orderList.applyFilters(); }}
        />
        
        <FormInput
            type="date"
            label={$localeStore === 'zh' ? '到' : 'To'}
            name="date_to"
            value={orderList.filters.date_to || ''}
            onchange={(v) => { orderList.filters.date_to = v; orderList.applyFilters(); }}
        />
    </FilterPanel>

    <!-- 数据表格 -->
    {#if !orderList.loading && orderList.items.length === 0}
        <div class="text-center py-16 bg-white rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-gray-500 mb-4">{t('sales.msg.noItems', $localeStore)}</p>
            <a 
                href="/customer" 
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                {$localeStore === 'zh' ? '前往客户页面创建' : 'Go to Customer Page'}
            </a>
            <p class="text-sm text-gray-400 mt-3">{$localeStore === 'zh' ? '销售订单需从具体客户页面创建' : 'Sales orders must be created from customer page'}</p>
        </div>
    {:else}
        <DataTable
            data={sortedItems}
            {columns}
            loading={orderList.loading}
            clickable={true}
            onRowClick={(item: SalesOrderBrief) => viewDetail(item.id)}
            onHeaderClick={toggleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            emptyText={t('sales.msg.noItems', $localeStore)}
        >
            {#snippet cellRender({ item, column, value }: { item: SalesOrderBrief; column: { key: string }; value: unknown })}
                {#if column.key === 'order_number'}
                    <span class="font-mono font-medium text-gray-900">{value}</span>
                {:else if column.key === 'status'}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusClass(value as string)}">
                        {getStatusLabel(value as string)}
                    </span>
                {:else if column.key === 'payment_status'}
                    <span
                        class="inline-flex h-4 w-4 rounded-full"
                        class:bg-[radial-gradient(circle,_rgba(34,197,94,1)_5%,_rgba(34,197,94,0)_90%)]={value === 'paid'}
                        class:bg-[radial-gradient(circle,_rgba(250,204,21,1)_5%,_rgba(250,204,21,0)_90%)]={value === 'partial'}
                        class:bg-[radial-gradient(circle,_rgba(148,163,184,1)_5%,_rgba(148,163,184,0)_90%)]={value !== 'paid' && value !== 'partial'}
                        title={value === 'paid' ? ($localeStore === 'zh' ? '已收款' : 'Paid') : value === 'partial' ? ($localeStore === 'zh' ? '部分收款' : 'Partially Paid') : ($localeStore === 'zh' ? '未收款' : 'Unpaid')}
                    ></span>
                {:else if column.key === 'priority'}
                    {#if getPriorityClass(value as string)}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getPriorityClass(value as string)}">
                            {getPriorityLabel(value as string)}
                        </span>
                    {:else}
                        <span class="text-xs text-gray-600">{getPriorityLabel(value as string)}</span>
                    {/if}
                {:else if column.key === 'expected_delivery'}
                    <span class="text-gray-500">{value || '-'}</span>
                {:else if column.key === 'total_amount'}
                    <span class="font-medium text-gray-900">{formatAmount(value as string, item.currency)}</span>
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

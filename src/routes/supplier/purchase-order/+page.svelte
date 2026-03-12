<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page as pageStore } from '$app/state';
    import { purchaseOrderAPI, supplierAPI } from '$lib/api';
    import type { PurchaseOrderBrief, SupplierBrief } from '$lib';
    import { useOrderList, ORDER_STATUS_OPTIONS, PRIORITY_OPTIONS } from '$lib/composables/useOrderList.svelte';
    import { DataTable, Pagination, FilterPanel, FormSelect, FormInput } from '$lib/components/ui';
    import Alert from '$lib/components/Alert.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import Plus from 'lucide-svelte/icons/plus';

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

    // 状态徽章样式
    function getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-600',
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-blue-100 text-blue-700',
            ordered: 'bg-indigo-100 text-indigo-700',
            partial: 'bg-green-100 text-green-700',
            received: 'bg-purple-100 text-purple-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return classes[status] || 'bg-gray-100 text-gray-600';
    }

    // 状态标签
    function getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            draft: '草稿',
            pending: '待审批',
            approved: '已批准',
            ordered: '已下单',
            partial: '部分到货',
            received: '已完成',
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
            <button
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                onclick={() => goto('/supplier')}
            >
                <Plus class="h-5 w-5" />
                从供应商创建
            </button>
        {/snippet}
    </PageHeader>

    {#if orderList.error}
        <Alert error={orderList.error} onDismiss={() => orderList.setError(null)} />
    {/if}

    <!-- 筛选区域 -->
    <FilterPanel onReset={orderList.resetFilters}>
        <div class="flex flex-wrap items-end gap-4">
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
            <p class="text-gray-500 mb-4">暂无采购订单</p>
            <button
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onclick={() => goto('/supplier')}
            >
                前往供应商页面创建
            </button>
            <p class="text-sm text-gray-400 mt-3">采购订单需从具体供应商页面创建</p>
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
                    <span class="font-mono font-medium text-gray-900">{value}</span>
                {:else if column.key === 'status'}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusClass(value as string)}">
                        {getStatusLabel(value as string)}
                    </span>
                {:else if column.key === 'priority'}
                    <span class="text-gray-700">{getPriorityLabel(value as string)}</span>
                {:else if column.key === 'expected_delivery'}
                    <span class="text-gray-500">{value || '-'}</span>
                {:else if column.key === 'total_amount'}
                    <span class="font-medium text-gray-900">{formatAmount(value as string, (item as PurchaseOrderBrief).currency)}</span>
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

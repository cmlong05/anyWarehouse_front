<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page as pageStore } from '$app/state';
    import { salesOrderAPI, customerAPI } from '$lib/api';
    import type { SalesOrderBrief, CustomerBrief, SalesOrderPriority } from '$lib';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';

    // 状态选项
    const statusOptions = [
        { value: '', label: '全部状态' },
        { value: 'draft', label: '草稿' },
        { value: 'pending', label: '待审批' },
        { value: 'approved', label: '已批准' },
        { value: 'confirmed', label: '已确认' },
        { value: 'partial', label: '部分发货' },
        { value: 'shipped', label: '已发货' },
        { value: 'delivered', label: '已完成' },
        { value: 'cancelled', label: '已取消' },
    ];

    const priorityOptions = [
        { value: '', label: '全部优先级' },
        { value: 'low', label: '低' },
        { value: 'normal', label: '普通' },
        { value: 'high', label: '高' },
        { value: 'urgent', label: '紧急' },
    ];

    // 状态映射
    const statusMap: Record<string, { label: string; class: string }> = {
        draft: { label: '草稿', class: 'badge-ghost' },
        pending: { label: '待审批', class: 'badge-warning' },
        approved: { label: '已批准', class: 'badge-info' },
        confirmed: { label: '已确认', class: 'badge-primary' },
        partial: { label: '部分发货', class: 'badge-success' },
        shipped: { label: '已发货', class: 'badge-success' },
        delivered: { label: '已完成', class: 'badge-primary' },
        cancelled: { label: '已取消', class: 'badge-error' },
    };

    const priorityMap: Record<string, { label: string; class: string }> = {
        low: { label: '低', class: 'badge-ghost' },
        normal: { label: '普通', class: 'badge-info' },
        high: { label: '高', class: 'badge-warning' },
        urgent: { label: '紧急', class: 'badge-error' },
    };

    // 数据
    let orders: SalesOrderBrief[] = $state([]);
    let customers: CustomerBrief[] = $state([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // 筛选条件
    let filters = $state({
        customer_id: '',
        status: '',
        priority: '',
        order_number: '',
        date_from: '',
        date_to: '',
    });

    // 分页
    let page = $state(1);
    let pageSize = $state(20);
    let totalCount = $state(0);
    let totalPages = $derived(Math.ceil(totalCount / pageSize));

    // 加载数据
    async function loadData() {
        loading = true;
        error = null;
        
        try {
            const [ordersRes, customersRes] = await Promise.all([
                salesOrderAPI.list({
                    customer_id: filters.customer_id ? parseInt(filters.customer_id) : undefined,
                    status: filters.status || undefined,
                    priority: (filters.priority as SalesOrderPriority) || undefined,
                    order_number: filters.order_number || undefined,
                    date_from: filters.date_from || undefined,
                    date_to: filters.date_to || undefined,
                    page,
                    page_size: pageSize,
                }),
                customerAPI.listBrief(),
            ]);
            
            orders = ordersRes.results;
            totalCount = ordersRes.count;
            customers = customersRes;
        } catch (err: any) {
            error = err.message || '加载数据失败';
            console.error('Load error:', err);
        } finally {
            loading = false;
        }
    }

    // 删除订单
    async function handleDelete(id: number) {
        if (!confirm('确定要删除此销售订单吗？')) return;
        
        try {
            await salesOrderAPI.delete(id);
            await loadData();
        } catch (err: any) {
            error = err.message || '删除订单失败';
            console.error('Delete error:', err);
        }
    }

    // 复制订单
    async function copyOrder(order: SalesOrderBrief) {
        try {
            // 获取完整订单详情
            const fullOrder = await salesOrderAPI.get(order.id);
            
            // 存储到 sessionStorage
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
            
            // 跳转到新建订单页面
            goto(`/customer/sales-order/add?customer_id=${fullOrder.customer}`);
        } catch (err: any) {
            error = err.message || '复制订单失败';
            console.error('Copy error:', err);
        }
    }

    // 查看详情
    function viewDetail(id: number) {
        goto(`/customer/sales-order/${id}`);
    }

    // 应用筛选
    function applyFilters() {
        page = 1;
        loadData();
    }

    // 重置筛选
    function resetFilters() {
        filters = {
            customer_id: '',
            status: '',
            priority: '',
            order_number: '',
            date_from: '',
            date_to: '',
        };
        page = 1;
        loadData();
    }

    // 分页导航
    function goToPage(p: number) {
        if (p < 1 || p > totalPages) return;
        page = p;
        loadData();
    }

    // 从URL获取客户筛选
    $effect(() => {
        const customerId = pageStore.url.searchParams.get('customer_id');
        if (customerId && filters.customer_id !== customerId) {
            filters.customer_id = customerId;
            page = 1;
            loadData();
        }
    });
    
    onMount(() => {
        if (!pageStore.url.searchParams.get('customer_id')) {
            loadData();
        }
    });
</script>

<div class="sales-order-page">
    <div class="page-header">
        <h1>销售订单管理</h1>
        <a href="/customer" class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>从客户创建</span>
        </a>
    </div>

    {#if error}
        <Alert error={error} onDismiss={() => error = null} />
    {/if}

    <!-- 筛选区域 -->
    <div class="filters">
        <div class="filter-row">
            <div class="filter-group">
                <label for="filter-customer">客户</label>
                <select id="filter-customer" bind:value={filters.customer_id} onchange={applyFilters}>
                    <option value="">全部客户</option>
                    {#each customers as customer}
                        <option value={customer.id}>{customer.name}</option>
                    {/each}
                </select>
            </div>
            
            <div class="filter-group">
                <label for="filter-status">状态</label>
                <select id="filter-status" bind:value={filters.status} onchange={applyFilters}>
                    {#each statusOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
            
            <div class="filter-group">
                <label for="filter-priority">优先级</label>
                <select id="filter-priority" bind:value={filters.priority} onchange={applyFilters}>
                    {#each priorityOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
            
            <div class="filter-group">
                <label for="filter-order-number">订单号</label>
                <input
                    type="text"
                    id="filter-order-number"
                    bind:value={filters.order_number}
                    placeholder="搜索订单号"
                    onchange={applyFilters}
                />
            </div>
        </div>
        
        <div class="filter-row">
            <div class="filter-group">
                <label for="filter-date-from">下单日期从</label>
                <input type="date" id="filter-date-from" bind:value={filters.date_from} onchange={applyFilters} />
            </div>
            
            <div class="filter-group">
                <label for="filter-date-to">到</label>
                <input type="date" id="filter-date-to" bind:value={filters.date_to} onchange={applyFilters} />
            </div>
            
            <div class="filter-group actions">
                <button class="btn btn-secondary rounded-lg shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap" onclick={resetFilters}>
                    重置筛选
                </button>
            </div>
        </div>
    </div>

    <!-- 数据表格 -->
    {#if loading}
        <Loading />
    {:else if orders.length === 0}
        <div class="empty-state">
            <p>暂无销售订单</p>
            <a href="/customer" class="btn btn-primary">
                前往客户页面创建
            </a>
            <p class="hint">销售订单需从具体客户页面创建</p>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="table table-zebra w-full">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="px-4 py-3 text-left">订单编号</th>
                        <th class="px-4 py-3 text-left">客户</th>
                        <th class="px-4 py-3 text-left">状态</th>
                        <th class="px-4 py-3 text-left">优先级</th>
                        <th class="px-4 py-3 text-left">下单日期</th>
                        <th class="px-4 py-3 text-left">预计交货</th>
                        <th class="px-4 py-3 text-right">金额</th>
                        <th class="px-4 py-3 text-right">明细数</th>
                        <th class="px-4 py-3 text-center">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {#each orders as order}
                        <tr class="hover:bg-blue-50 cursor-pointer" onclick={() => viewDetail(order.id)}>
                            <td class="px-4 py-3 font-medium">{order.order_number}</td>
                            <td class="px-4 py-3">{order.customer_name}</td>
                            <td class="px-4 py-3">
                                <span class="badge {statusMap[order.status]?.class || ''} badge-sm">
                                    {statusMap[order.status]?.label || order.status}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="badge {priorityMap[order.priority]?.class || ''} badge-sm">
                                    {priorityMap[order.priority]?.label || order.priority}
                                </span>
                            </td>
                            <td class="px-4 py-3">{order.order_date}</td>
                            <td class="px-4 py-3">{order.expected_delivery || '-'}</td>
                            <td class="px-4 py-3 text-right">¥{parseFloat(order.total_amount).toFixed(2)}</td>
                            <td class="px-4 py-3 text-right">{order.item_count}</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center justify-center gap-1">
                                    <button
                                        class="btn btn-ghost btn-sm p-1"
                                        onclick={(e) => { e.stopPropagation(); copyOrder(order); }}
                                        title="复制订单"
                                        aria-label="复制订单"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                    <button
                                        class="btn btn-ghost btn-sm p-1 text-error"
                                        onclick={(e) => { e.stopPropagation(); handleDelete(order.id); }}
                                        title="删除"
                                        aria-label="删除"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <!-- 分页 -->
        {#if totalPages > 1}
            <div class="pagination">
                <button
                    class="btn btn-sm rounded-lg"
                    onclick={() => goToPage(page - 1)}
                    disabled={page === 1}
                >
                    上一页
                </button>
                <span class="page-info">第 {page} / {totalPages} 页 (共 {totalCount} 条)</span>
                <button
                    class="btn btn-sm rounded-lg"
                    onclick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                >
                    下一页
                </button>
            </div>
        {/if}
    {/if}
</div>

<style>
    .sales-order-page {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
    }

    /* 筛选区域 */
    .filters {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
    }

    .filter-row {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
    }

    .filter-row:last-child {
        margin-bottom: 0;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .filter-group label {
        font-size: 0.8rem;
        color: #666;
    }

    .filter-group input,
    .filter-group select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        min-width: 120px;
    }

    .filter-group.actions {
        margin-left: auto;
        justify-content: flex-end;
    }

    /* 空状态 */
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

    /* 分页 */
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .page-info {
        color: #666;
        font-size: 0.9rem;
    }

    /* 空状态提示 */
    .hint {
        font-size: 0.85rem;
        color: #999;
        margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .filter-row {
            flex-direction: column;
        }

        .filter-group input,
        .filter-group select {
            width: 100%;
        }
    }
</style>

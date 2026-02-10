<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page as pageStore } from '$app/state';
    import { purchaseOrderAPI, supplierAPI } from '$lib/api';
    import type { PurchaseOrderBrief, SupplierBrief, PurchaseOrderPriority } from '$lib';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';

    // 状态选项
    const statusOptions = [
        { value: '', label: '全部状态' },
        { value: 'draft', label: '草稿' },
        { value: 'pending', label: '待审批' },
        { value: 'approved', label: '已批准' },
        { value: 'ordered', label: '已下单' },
        { value: 'partial', label: '部分到货' },
        { value: 'received', label: '已完成' },
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
        draft: { label: '草稿', class: 'status-draft' },
        pending: { label: '待审批', class: 'status-pending' },
        approved: { label: '已批准', class: 'status-approved' },
        ordered: { label: '已下单', class: 'status-ordered' },
        partial: { label: '部分到货', class: 'status-partial' },
        received: { label: '已完成', class: 'status-received' },
        cancelled: { label: '已取消', class: 'status-cancelled' },
    };

    const priorityMap: Record<string, string> = {
        low: '低',
        normal: '普通',
        high: '高',
        urgent: '紧急',
    };

    // 数据
    let orders: PurchaseOrderBrief[] = $state([]);
    let suppliers: SupplierBrief[] = $state([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // 筛选条件
    let filters = $state({
        supplier_id: '',
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
            const [ordersRes, suppliersRes] = await Promise.all([
                purchaseOrderAPI.list({
                    supplier_id: filters.supplier_id ? parseInt(filters.supplier_id) : undefined,
                    status: filters.status || undefined,
                    priority: (filters.priority as PurchaseOrderPriority) || undefined,
                    order_number: filters.order_number || undefined,
                    date_from: filters.date_from || undefined,
                    date_to: filters.date_to || undefined,
                    page,
                    page_size: pageSize,
                }),
                supplierAPI.listBrief(),
            ]);
            
            orders = ordersRes.results;
            totalCount = ordersRes.count;
            suppliers = suppliersRes;
        } catch (err: any) {
            error = err.message || '加载数据失败';
            console.error('Load error:', err);
        } finally {
            loading = false;
        }
    }

    // 删除订单
    async function handleDelete(id: number) {
        if (!confirm('确定要删除此采购订单吗？')) return;
        
        try {
            await purchaseOrderAPI.delete(id);
            await loadData();
        } catch (err: any) {
            error = err.message || '删除订单失败';
            console.error('Delete error:', err);
        }
    }

    // 查看详情
    function viewDetail(id: number) {
        goto(`/supplier/purchase-order/${id}`);
    }

    // 应用筛选
    function applyFilters() {
        page = 1;
        loadData();
    }

    // 重置筛选
    function resetFilters() {
        filters = {
            supplier_id: '',
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

    // 从URL获取供应商筛选
    $effect(() => {
        const supplierId = pageStore.url.searchParams.get('supplier_id');
        if (supplierId && filters.supplier_id !== supplierId) {
            filters.supplier_id = supplierId;
            page = 1;
            loadData();
        }
    });
    
    onMount(() => {
        if (!pageStore.url.searchParams.get('supplier_id')) {
            loadData();
        }
    });
</script>

<div class="purchase-order-page">
    <div class="page-header">
        <h1>采购订单管理</h1>
        <a href="/supplier" class="btn btn-primary">
            + 从供应商创建
        </a>
    </div>

    {#if error}
        <Alert error={error} onDismiss={() => error = null} />
    {/if}

    <!-- 筛选区域 -->
    <div class="filters">
        <div class="filter-row">
            <div class="filter-group">
                <label for="filter-supplier">供应商</label>
                <select id="filter-supplier" bind:value={filters.supplier_id} onchange={applyFilters}>
                    <option value="">全部供应商</option>
                    {#each suppliers as supplier}
                        <option value={supplier.id}>{supplier.name}</option>
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
                <button class="btn btn-secondary" onclick={resetFilters}>
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
            <p>暂无采购订单</p>
            <a href="/supplier" class="btn btn-primary">
                前往供应商页面创建
            </a>
            <p class="hint">采购订单需从具体供应商页面创建</p>
        </div>
    {:else}
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>订单编号</th>
                        <th>供应商</th>
                        <th>状态</th>
                        <th>优先级</th>
                        <th>下单日期</th>
                        <th>预计交货</th>
                        <th class="numeric">金额</th>
                        <th class="numeric">明细数</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {#each orders as order}
                        <tr class="clickable" onclick={() => viewDetail(order.id)}>
                            <td class="order-number">{order.order_number}</td>
                            <td>{order.supplier_name}</td>
                            <td>
                                <span class="status-badge {statusMap[order.status]?.class || ''}">
                                    {statusMap[order.status]?.label || order.status}
                                </span>
                            </td>
                            <td>{priorityMap[order.priority] || order.priority}</td>
                            <td>{order.order_date}</td>
                            <td>{order.expected_delivery || '-'}</td>
                            <td class="numeric">¥{parseFloat(order.total_amount).toFixed(2)}</td>
                            <td class="numeric">{order.item_count}</td>
                            <td>
                                <button
                                    class="btn-icon"
                                    onclick={(e) => { e.stopPropagation(); handleDelete(order.id); }}
                                    title="删除"
                                >
                                    🗑️
                                </button>
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
                    class="btn btn-small"
                    onclick={() => goToPage(page - 1)}
                    disabled={page === 1}
                >
                    上一页
                </button>
                <span class="page-info">第 {page} / {totalPages} 页 (共 {totalCount} 条)</span>
                <button
                    class="btn btn-small"
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
    .purchase-order-page {
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

    /* 表格 */
    .table-container {
        overflow-x: auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    .data-table th,
    .data-table td {
        padding: 0.875rem 1rem;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    .data-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #333;
    }

    .data-table tbody tr {
        cursor: pointer;
        transition: background 0.15s;
    }

    .data-table tbody tr:hover {
        background: #f5f5f5;
    }

    .data-table .numeric {
        text-align: right;
    }

    .order-number {
        font-family: monospace;
        font-weight: 500;
    }

    /* 状态标签 */
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .status-draft {
        background: #e9ecef;
        color: #495057;
    }

    .status-pending {
        background: #fff3cd;
        color: #856404;
    }

    .status-approved {
        background: #d1ecf1;
        color: #0c5460;
    }

    .status-ordered {
        background: #cce5ff;
        color: #004085;
    }

    .status-partial {
        background: #d4edda;
        color: #155724;
    }

    .status-received {
        background: #28a745;
        color: white;
    }

    .status-cancelled {
        background: #f8d7da;
        color: #721c24;
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

    /* 按钮 */
    .btn {
        padding: 0.625rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #0056b3;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: #545b62;
    }

    .btn-small {
        padding: 0.375rem 0.75rem;
        font-size: 0.85rem;
    }

    .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        opacity: 0.6;
        transition: opacity 0.15s;
    }

    .btn-icon:hover {
        opacity: 1;
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

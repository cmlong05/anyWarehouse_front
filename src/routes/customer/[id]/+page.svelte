<script lang="ts">
    import { goto } from '$app/navigation';
    import { customerAPI, customerQuotationAPI, salesOrderAPI } from '$lib/api';
    import type { Customer, CustomerFormData, CustomerQuotationBrief, SalesOrderBrief } from '$lib';
    import CustomerForm from '$lib/components/CustomerForm.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import Loading from '$lib/components/Loading.svelte';
    
    interface Props {
        data: { customer: Customer };
    }
    
    let { data }: Props = $props();
    
    let customer = $state<Customer>(data.customer);
    let quotations = $state<CustomerQuotationBrief[]>([]);
    let recentOrders = $state<SalesOrderBrief[]>([]);
    let isEditing = $state(false);
    let loading = $state(false);
    let quotationsLoading = $state(true);
    let ordersLoading = $state(true);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleteLoading = $state(false);
    
    // 存储每个报价的数量（key: quotationId, value: quantity）
    let quotationQuantities = $state<Record<number, number | null>>({});
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customer' },
        { label: customer.name, href: `/customer/${customer.id}` },
    ]);
    
    const levelLabels: Record<string, string> = {
        'VIP': 'VIP客户',
        'NORMAL': '普通客户',
        'TEMP': '临时客户'
    };
    
    const statusLabels: Record<string, string> = {
        'draft': '草稿',
        'pending': '待审批',
        'approved': '已批准',
        'confirmed': '已确认',
        'partial': '部分发货',
        'shipped': '已发货',
        'delivered': '已交付',
        'cancelled': '已取消'
    };
    
    function getStatusLabel(status: string): string {
        return statusLabels[status] || status;
    }
    
    async function loadQuotations() {
        quotationsLoading = true;
        try {
            const result = await customerAPI.getQuotations(customer.id);
            quotations = result.results || result || [];
        } catch (err) {
            console.error('加载报价失败:', err);
        } finally {
            quotationsLoading = false;
        }
    }
    
    async function loadRecentOrders() {
        ordersLoading = true;
        try {
            const result = await customerAPI.getRecentOrders(customer.id);
            recentOrders = result.orders || [];
        } catch (err) {
            console.error('加载最近订单失败:', err);
        } finally {
            ordersLoading = false;
        }
    }
    
    async function handleUpdate(data: CustomerFormData) {
        loading = true;
        error = '';
        
        try {
            const updated = await customerAPI.update(customer.id, data);
            customer = updated;
            isEditing = false;
        } catch (err) {
            error = err instanceof Error ? err.message : '更新客户失败';
        } finally {
            loading = false;
        }
    }
    
    async function handleDelete() {
        deleteLoading = true;
        error = '';
        
        try {
            await customerAPI.delete(customer.id);
            goto('/customer');
        } catch (err) {
            error = err instanceof Error ? err.message : '删除客户失败';
            deleteLoading = false;
            showDeleteModal = false;
        }
    }
    
    function handleCancel() {
        isEditing = false;
        error = '';
    }
    
    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString('zh-CN');
    }
    
    // 跳转到销售订单创建页面，携带选中的报价数据
    function goToCreateSalesOrder() {
        // 筛选出有数量的报价
        const selectedItems = quotations
            .filter(q => {
                const qty = quotationQuantities[q.id];
                return qty !== undefined && qty !== null && qty > 0;
            })
            .map(q => ({
                quotation_id: q.id,
                item: q.item,
                sku: q.sku,
                item_name: q.item_name,
                quantity: quotationQuantities[q.id],
                unit_price: parseFloat(q.price)
            }));
        
        if (selectedItems.length === 0) {
            // 没有输入数量，直接跳转
            goto(`/customer/sales-order/add?customer_id=${customer.id}`);
            return;
        }
        
        // 将选中的项目数据存储到 sessionStorage，供销售订单页面读取
        sessionStorage.setItem('sales_order_preload_items', JSON.stringify({
            customer_id: customer.id,
            items: selectedItems
        }));
        
        goto(`/customer/sales-order/add?customer_id=${customer.id}`);
    }
    
    // 组件挂载时加载报价和最近订单
    $effect(() => {
        loadQuotations();
        loadRecentOrders();
    })
</script>

<svelte:head>
    <title>{customer.name} - 客户详情</title>
</svelte:head>

<div class="content-container">
    <Breadcrumb items={breadcrumbs} />
    
    {#if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {/if}
    
    {#if isEditing}
        <div class="page-header">
            <h1>编辑客户</h1>
            <button class="btn btn-secondary" onclick={() => isEditing = false}>
                取消编辑
            </button>
        </div>
        
        <div class="form-container">
            <CustomerForm
                onSubmit={handleUpdate}
                onCancel={handleCancel}
                initialData={customer}
                submitLabel="保存修改"
                {loading}
            />
        </div>
    {:else}
        <div class="page-header">
            <div class="header-left">
                <h1>{customer.name}</h1>
                <span class="level-badge {customer.level.toLowerCase()}">
                    {levelLabels[customer.level]}
                </span>
                <span class="status-badge {customer.status.toLowerCase()}">
                    {customer.status === 'ACTIVE' ? '活跃' : '停用'}
                </span>
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" onclick={() => isEditing = true}>
                    编辑
                </button>
                <button class="btn btn-danger" onclick={() => showDeleteModal = true}>
                    删除
                </button>
            </div>
        </div>
        
        <div class="detail-grid">
            <div class="info-card">
                <h3>基本信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">客户编号</span>
                        <span class="value code">{customer.code}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">客户名称</span>
                        <span class="value">{customer.name}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">联系人</span>
                        <span class="value">{customer.contact_name || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">联系电话</span>
                        <span class="value">{customer.phone || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">电子邮箱</span>
                        <span class="value">{customer.email || '-'}</span>
                    </div>
                </div>
            </div>
            
            <div class="info-card">
                <h3>地址信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">主地址</span>
                        <span class="value">{customer.address || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">地址数量</span>
                        <span class="value">{customer.address_count || 0} 个</span>
                    </div>
                </div>
            </div>
            
            <div class="info-card full-width">
                <h3>其他信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">备注</span>
                        <span class="value">{customer.remark || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">创建时间</span>
                        <span class="value">{formatDate(customer.created_at)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">更新时间</span>
                        <span class="value">{formatDate(customer.updated_at)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 最近销售订单 -->
        <div class="orders-section">
            <div class="section-header">
                <h2>最近销售订单</h2>
                <a href="/customer/sales-order?customer_id={customer.id}" class="btn btn-primary btn-sm">查看全部</a>
            </div>
            
            {#if ordersLoading}
                <Loading text="加载订单..." />
            {:else if recentOrders.length === 0}
                <div class="empty-state-small">
                    <p>暂无销售订单</p>
                </div>
            {:else}
                <div class="orders-table">
                    <table>
                        <thead>
                            <tr>
                                <th>订单号</th>
                                <th>下单日期</th>
                                <th>状态</th>
                                <th>金额</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each recentOrders as order}
                                <tr class="clickable" onclick={() => goto(`/customer/sales-order/${order.id}`)}>
                                    <td class="code">{order.order_number}</td>
                                    <td>{order.order_date}</td>
                                    <td>
                                        <span class="status-tag {order.status}">
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td class="numeric">¥{Number(order.total_amount).toFixed(2)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
        
        <!-- 销售订单和报价列表 -->
        <div class="quotations-section">
            <div class="section-header">
                <h2>销售报价记录</h2>
                <div class="section-actions">
                    <button class="btn btn-success btn-sm" onclick={goToCreateSalesOrder}>新建销售订单</button>
                    <a href="/customer/quotation/add?customer_id={customer.id}" class="btn btn-primary btn-sm">添加报价</a>
                </div>
            </div>
            
            {#if quotationsLoading}
                <Loading text="加载报价..." />
            {:else if quotations.length === 0}
                <div class="empty-state">
                    <p>暂无报价记录</p>
                    <a href="/customer/quotation/add?customer_id={customer.id}" class="btn btn-primary">添加第一个报价</a>
                </div>
            {:else}
                <div class="quotations-table">
                    <table>
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>物品名称</th>
                                <th>单价</th>
                                <th>货币</th>
                                <th class="numeric">数量</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each quotations as quotation}
                                <tr>
                                    <td class="clickable" onclick={() => goto(`/customer/quotation/${quotation.id}`)}>{quotation.sku || '-'}</td>
                                    <td class="clickable" onclick={() => goto(`/customer/quotation/${quotation.id}`)}>{quotation.item_name || '-'}</td>
                                    <td class="numeric clickable" onclick={() => goto(`/customer/quotation/${quotation.id}`)}>{quotation.price}</td>
                                    <td class="clickable" onclick={() => goto(`/customer/quotation/${quotation.id}`)}>{quotation.currency}</td>
                                    <td class="numeric">
                                        <input
                                            type="number"
                                            class="quantity-input"
                                            bind:value={quotationQuantities[quotation.id]}
                                            min="0.001"
                                            step="0.001"
                                            placeholder="-"
                                            onclick={(e: Event) => e.stopPropagation()}
                                        />
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <div class="section-footer">
                    <button class="btn btn-success btn-sm" onclick={goToCreateSalesOrder}>新建销售订单</button>
                </div>
            {/if}
        </div>
    {/if}
</div>

<ConfirmModal
    isOpen={showDeleteModal}
    title="删除客户"
    message="确定要删除以下客户吗？此操作不可撤销。"
    itemName={customer.name}
    confirmText="删除"
    cancelText="取消"
    loading={deleteLoading}
    onConfirm={handleDelete}
    onCancel={() => showDeleteModal = false}
/>

<style>
    .content-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }
    
    .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        color: #1f2937;
    }
    
    .header-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .level-badge, .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .level-badge.vip {
        background-color: #fef3c7;
        color: #92400e;
    }
    
    .level-badge.normal {
        background-color: #dbeafe;
        color: #1e40af;
    }
    
    .level-badge.temp {
        background-color: #f3f4f6;
        color: #4b5563;
    }
    
    .status-badge.active {
        background-color: #d1fae5;
        color: #065f46;
    }
    
    .status-badge.inactive {
        background-color: #fee2e2;
        color: #991b1b;
    }
    
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    
    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #2563eb;
    }
    
    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }
    
    .btn-secondary:hover {
        background-color: #4b5563;
    }
    
    .btn-danger {
        background-color: #dc2626;
        color: white;
    }
    
    .btn-danger:hover {
        background-color: #b91c1c;
    }

    .btn-success {
        background-color: #10b981;
        color: white;
    }

    .btn-success:hover {
        background-color: #059669;
    }
    
    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
    }
    
    .form-container {
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .info-card {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .info-card.full-width {
        grid-column: 1 / -1;
    }
    
    .info-card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #374151;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .info-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .info-item .label {
        color: #6b7280;
        font-size: 0.875rem;
        flex-shrink: 0;
    }
    
    .info-item .value {
        color: #1f2937;
        text-align: right;
        word-break: break-word;
    }
    
    .info-item .value.code {
        font-family: monospace;
        color: #6b7280;
    }
    
    /* 订单列表样式 */
    .orders-section {
        padding: 1.5rem 0;
        border-top: 1px solid #e5e7eb;
    }
    
    .orders-table {
        overflow-x: auto;
    }
    
    .empty-state-small {
        text-align: center;
        padding: 1.5rem 0;
        color: #6b7280;
        font-size: 0.9rem;
    }
    
    .status-tag {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .status-tag.draft {
        background-color: #f3f4f6;
        color: #4b5563;
    }
    
    .status-tag.pending {
        background-color: #fef3c7;
        color: #92400e;
    }
    
    .status-tag.approved {
        background-color: #dbeafe;
        color: #1e40af;
    }
    
    .status-tag.confirmed {
        background-color: #d1fae5;
        color: #065f46;
    }
    
    .status-tag.partial {
        background-color: #fef3c7;
        color: #b45309;
    }
    
    .status-tag.shipped {
        background-color: #e0e7ff;
        color: #3730a3;
    }
    
    .status-tag.delivered {
        background-color: #d1fae5;
        color: #065f46;
    }
    
    .status-tag.cancelled {
        background-color: #fee2e2;
        color: #991b1b;
    }
    
    /* 报价列表样式 */
    .quotations-section {
        padding: 1.5rem 0;
        border-top: 1px solid #e5e7eb;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #1f2937;
    }

    .section-actions {
        display: flex;
        gap: 0.5rem;
    }

    .section-footer {
        margin-top: 1.5rem;
        display: flex;
        justify-content: flex-end;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 0;
        color: #6b7280;
    }
    
    .empty-state p {
        margin-bottom: 1rem;
    }
    
    .quotations-table {
        overflow-x: auto;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    
    th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    th {
        font-weight: 600;
        color: #374151;
        background-color: #f9fafb;
    }
    
    td {
        color: #4b5563;
    }
    
    .numeric {
        font-family: monospace;
        text-align: right;
    }
    
    
    .clickable {
        cursor: pointer;
    }

    .clickable:hover {
        background-color: #f3f4f6;
    }

    .quantity-input {
        width: 80px;
        padding: 0.35rem 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.85rem;
        text-align: right;
        background: white;
    }

    .quantity-input:focus {
        outline: none;
        border-color: #10b981;
    }

    /* 隐藏数字输入框的上下调整按钮 */
    .quantity-input::-webkit-outer-spin-button,
    .quantity-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .quantity-input {
        -moz-appearance: textfield;
        appearance: textfield;
    }
    
    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }
        
        .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .header-actions {
            width: 100%;
        }
        
        .header-actions .btn {
            flex: 1;
        }
        
        .detail-grid {
            grid-template-columns: 1fr;
        }
        
        .form-container {
            padding: 1.5rem 1rem;
        }
        
        .quotations-table {
            font-size: 0.85rem;
        }
        
        th, td {
            padding: 0.5rem;
        }
    }
</style>

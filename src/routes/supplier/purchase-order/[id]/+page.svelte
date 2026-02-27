<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { purchaseOrderAPI } from '$lib/api';
    import type { PurchaseOrder, PurchaseOrderStatus } from '$lib';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';

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

    // 状态流转配置
    const statusTransitions: Record<string, { value: PurchaseOrderStatus; label: string }[]> = {
        draft: [
            { value: 'pending', label: '提交审批' },
            { value: 'cancelled', label: '取消订单' },
        ],
        pending: [
            { value: 'approved', label: '批准' },
            { value: 'draft', label: '退回草稿' },
            { value: 'cancelled', label: '拒绝' },
        ],
        approved: [
            { value: 'ordered', label: '确认下单' },
            { value: 'draft', label: '退回草稿' },
            { value: 'cancelled', label: '取消' },
        ],
        ordered: [
            { value: 'partial', label: '部分收货' },
            { value: 'received', label: '完成收货' },
            { value: 'cancelled', label: '取消' },
        ],
        partial: [
            { value: 'received', label: '完成收货' },
            { value: 'ordered', label: '继续采购' },
        ],
        received: [],
        cancelled: [
            { value: 'draft', label: '重新激活' },
        ],
    };

    // 数据
    let order: PurchaseOrder | null = $state(null);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let updating = $state(false);

    // 收货相关
    let showReceiveModal = $state(false);
    let receiveQuantities: Record<number, number> = $state({});
    let receiveNotes = $state('');

    // 获取订单ID
    let orderId = $derived(parseInt($page.params.id));

    onMount(() => {
        loadOrder();
    });

    async function loadOrder() {
        loading = true;
        error = null;
        
        try {
            order = await purchaseOrderAPI.get(orderId);
            // 初始化收货数量
            if (order?.items) {
                receiveQuantities = {};
                order.items.forEach(item => {
                    if (item.quantity_pending > 0) {
                        receiveQuantities[item.id] = 0;
                    }
                });
            }
        } catch (err: any) {
            error = err.message || '加载订单失败';
            console.error('Load error:', err);
        } finally {
            loading = false;
        }
    }

    // 变更状态
    async function changeStatus(newStatus: PurchaseOrderStatus) {
        if (!confirm(`确定要将订单状态变更为"${statusMap[newStatus]?.label || newStatus}"吗？`)) {
            return;
        }
        
        updating = true;
        try {
            order = await purchaseOrderAPI.changeStatus(orderId, newStatus);
        } catch (err: any) {
            error = err.message || '状态变更失败';
            console.error('Status change error:', err);
        } finally {
            updating = false;
        }
    }

    // 打开收货弹窗
    function openReceiveModal() {
        if (!order) return;
        
        // 初始化收货数量
        receiveQuantities = {};
        order.items.forEach(item => {
            if (item.quantity_pending > 0) {
                receiveQuantities[item.id] = 0;
            }
        });
        receiveNotes = '';
        showReceiveModal = true;
    }

    // 执行收货
    async function doReceive() {
        if (!order) return;
        
        // 过滤出收货数量大于0的项
        const items = Object.entries(receiveQuantities)
            .filter(([, qty]) => qty > 0)
            .map(([id, quantity]) => ({
                item_id: parseInt(id),
                quantity,
                notes: receiveNotes,
            }));
        
        if (items.length === 0) {
            error = '请至少输入一个收货数量';
            return;
        }
        
        updating = true;
        try {
            order = await purchaseOrderAPI.receive(orderId, { items, notes: receiveNotes });
            showReceiveModal = false;
        } catch (err: any) {
            error = err.message || '收货失败';
            console.error('Receive error:', err);
        } finally {
            updating = false;
        }
    }

    // 计算收货总量
    function getTotalReceiveQty() {
        return Object.values(receiveQuantities).reduce((sum, qty) => sum + qty, 0);
    }

    // 返回列表
    function goBack() {
        goto('/supplier/purchase-order');
    }

    // 编辑订单（跳转到编辑页面，可后续实现）
    function editOrder() {
        alert('编辑功能待实现');
    }

    // 删除订单
    async function deleteOrder() {
        if (!confirm('确定要删除此采购订单吗？此操作不可恢复。')) return;
        
        try {
            await purchaseOrderAPI.delete(orderId);
            goto('/supplier/purchase-order');
        } catch (err: any) {
            error = err.message || '删除订单失败';
            console.error('Delete error:', err);
        }
    }
</script>

<div class="purchase-order-detail">
    {#if loading}
        <Loading />
    {:else if error}
        <Alert error={error} onDismiss={() => error = null} />
        <div class="error-actions">
            <button class="btn btn-secondary" onclick={goBack}>返回列表</button>
            <button class="btn btn-primary" onclick={loadOrder}>重试</button>
        </div>
    {:else if order}
        <div class="page-header">
            <div class="header-left">
                <button class="btn btn-text" onclick={goBack}>← 返回列表</button>
                <h1>采购订单详情</h1>
            </div>
            <div class="header-actions">
                {#if order.status === 'draft'}
                    <button class="btn btn-secondary" onclick={editOrder}>编辑</button>
                {/if}
                {#if ['draft', 'pending', 'approved'].includes(order.status)}
                    <button class="btn btn-danger" onclick={deleteOrder}>删除</button>
                {/if}
            </div>
        </div>

        <!-- 订单概要卡片 -->
        <div class="summary-card">
            <div class="summary-header">
                <div class="order-info">
                    <span class="order-number">{order.order_number}</span>
                    <span class="status-badge {statusMap[order.status]?.class || ''}">
                        {statusMap[order.status]?.label || order.status}
                    </span>
                </div>
                <div class="summary-actions">
                    {#if statusTransitions[order.status]?.length > 0}
                        {#each statusTransitions[order.status] as transition}
                            <button
                                class="btn btn-small {transition.value === 'cancelled' ? 'btn-danger' : 'btn-primary'}"
                                onclick={() => changeStatus(transition.value)}
                                disabled={updating}
                            >
                                {transition.label}
                            </button>
                        {/each}
                    {/if}
                    {#if ['ordered', 'partial'].includes(order.status)}
                        <button
                            class="btn btn-small btn-success"
                            onclick={openReceiveModal}
                            disabled={updating}
                        >
                            收货
                        </button>
                    {/if}
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-item">
                    <span class="label">供应商</span>
                    <span class="value">{order.supplier_detail?.name}</span>
                </div>
                <div class="summary-item">
                    <span class="label">优先级</span>
                    <span class="value">{priorityMap[order.priority] || order.priority}</span>
                </div>
                <div class="summary-item">
                    <span class="label">下单日期</span>
                    <span class="value">{order.order_date}</span>
                </div>
                <div class="summary-item">
                    <span class="label">预计交货</span>
                    <span class="value">{order.expected_delivery || '-'}</span>
                </div>
                {#if order.actual_delivery}
                    <div class="summary-item">
                        <span class="label">实际到货</span>
                        <span class="value">{order.actual_delivery}</span>
                    </div>
                {/if}
                <div class="summary-item">
                    <span class="label">创建人</span>
                    <span class="value">{order.created_by || '-'}</span>
                </div>
            </div>
        </div>

        <!-- 金额信息 -->
        <div class="info-section">
            <h2>金额信息</h2>
            <div class="amount-grid">
                <div class="amount-item">
                    <span class="label">商品小计</span>
                    <span class="value">¥{parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div class="amount-item">
                    <span class="label">税率</span>
                    <span class="value">{order.tax_rate}%</span>
                </div>
                <div class="amount-item">
                    <span class="label">税额</span>
                    <span class="value">¥{parseFloat(order.tax_amount).toFixed(2)}</span>
                </div>
                <div class="amount-item">
                    <span class="label">运费</span>
                    <span class="value">¥{parseFloat(order.shipping_cost).toFixed(2)}</span>
                </div>
                <div class="amount-item">
                    <span class="label">折扣</span>
                    <span class="value">-¥{parseFloat(order.discount).toFixed(2)}</span>
                </div>
                <div class="amount-item total">
                    <span class="label">订单总计</span>
                    <span class="value">¥{parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
            </div>
        </div>

        <!-- 收货信息 -->
        <div class="info-section">
            <h2>收货信息</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">收货地址</span>
                    <span class="value">{order.shipping_address || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="label">收货联系人</span>
                    <span class="value">{order.contact_person || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="label">收货电话</span>
                    <span class="value">{order.contact_phone || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="label">付款条款</span>
                    <span class="value">{order.payment_terms || '-'}</span>
                </div>
            </div>
        </div>

        <!-- 订单明细 -->
        <div class="info-section">
            <h2>订单明细 ({order.items?.length || 0}项)</h2>
            {#if order.items && order.items.length > 0}
                <div class="items-table-container">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>SKU</th>
                                <th>物品名称</th>
                                <th class="numeric">订购数量</th>
                                <th class="numeric">已收货</th>
                                <th class="numeric">待收货</th>
                                <th class="numeric">单价</th>
                                <th class="numeric">小计</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each order.items as item}
                                <tr class={item.is_fully_received ? 'completed' : ''}>
                                    <td>{item.line_number}</td>
                                    <td class="mono">{item.sku}</td>
                                    <td>{item.item_name}</td>
                                    <td class="numeric">{item.quantity}</td>
                                    <td class="numeric">{item.quantity_received}</td>
                                    <td class="numeric">{item.quantity_pending}</td>
                                    <td class="numeric">¥{parseFloat(item.unit_price).toFixed(2)}</td>
                                    <td class="numeric">¥{parseFloat(item.line_total).toFixed(2)}</td>
                                    <td>
                                        {#if item.is_fully_received}
                                            <span class="badge badge-success">已完成</span>
                                        {:else if item.quantity_received > 0}
                                            <span class="badge badge-warning">部分收货</span>
                                        {:else}
                                            <span class="badge badge-pending">待收货</span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- 收货进度 -->
                {#if order.progress_percentage !== undefined}
                    <div class="progress-section">
                        <div class="progress-header">
                            <span>收货进度</span>
                            <span>{order.progress_percentage}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: {order.progress_percentage}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span>已收: {order.total_received} / {order.total_quantity}</span>
                        </div>
                    </div>
                {/if}
            {:else}
                <p class="empty-text">暂无明细</p>
            {/if}
        </div>

        <!-- 备注 -->
        {#if order.notes || order.internal_notes}
            <div class="info-section">
                <h2>备注</h2>
                {#if order.notes}
                    <div class="note-box">
                        <span class="label">订单备注</span>
                        <p>{order.notes}</p>
                    </div>
                {/if}
                {#if order.internal_notes}
                    <div class="note-box internal">
                        <span class="label">内部备注</span>
                        <p>{order.internal_notes}</p>
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<!-- 收货弹窗 -->
{#if showReceiveModal && order}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="modal-overlay" onclick={(e) => { if(e.target === e.currentTarget) showReceiveModal = false; }} onkeydown={(e) => { if (e.key === 'Escape') showReceiveModal = false; }} role="presentation" tabindex="-1">
        <div class="modal">
            <div class="modal-header">
                <h2>订单收货</h2>
                <button class="close-btn" onclick={() => showReceiveModal = false}>×</button>
            </div>
            <div class="modal-body">
                <div class="receive-form">
                    <table class="receive-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>物品名称</th>
                                <th class="numeric">订购数量</th>
                                <th class="numeric">已收货</th>
                                <th class="numeric">本次收货</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each order.items.filter(i => i.quantity_pending > 0) as item}
                                <tr>
                                    <td class="mono">{item.sku}</td>
                                    <td>{item.item_name}</td>
                                    <td class="numeric">{item.quantity}</td>
                                    <td class="numeric">{item.quantity_received}</td>
                                    <td class="numeric">
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.quantity_pending}
                                            step="0.001"
                                            bind:value={receiveQuantities[item.id]}
                                            class="qty-input"
                                        />
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>

                    <div class="receive-summary">
                        <span>本次收货总量: <strong>{getTotalReceiveQty()}</strong></span>
                    </div>

                    <div class="form-group">
                        <label for="receive-notes">收货备注</label>
                        <textarea
                            id="receive-notes"
                            bind:value={receiveNotes}
                            placeholder="输入收货备注（可选）"
                            rows="2"
                        ></textarea>
                    </div>

                    <div class="modal-actions">
                        <button
                            class="btn btn-secondary"
                            onclick={() => showReceiveModal = false}
                            disabled={updating}
                        >
                            取消
                        </button>
                        <button
                            class="btn btn-primary"
                            onclick={doReceive}
                            disabled={updating || getTotalReceiveQty() === 0}
                        >
                            {updating ? '处理中...' : '确认收货'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .purchase-order-detail {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .header-left h1 {
        margin: 0;
        font-size: 1.5rem;
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

    /* 概要卡片 */
    .summary-card {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
    }

    .order-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .order-number {
        font-family: monospace;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .summary-actions {
        display: flex;
        gap: 0.5rem;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }

    .summary-item {
        display: flex;
        flex-direction: column;
    }

    .summary-item .label {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.25rem;
    }

    .summary-item .value {
        font-weight: 500;
    }

    /* 信息区域 */
    .info-section {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .info-section h2 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #333;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
    }

    .info-item .label {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.25rem;
    }

    .info-item .value {
        color: #333;
    }

    /* 金额网格 */
    .amount-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
    }

    .amount-item {
        display: flex;
        flex-direction: column;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 4px;
    }

    .amount-item .label {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.25rem;
    }

    .amount-item .value {
        font-weight: 500;
        font-size: 1rem;
    }

    .amount-item.total {
        background: #e7f3ff;
    }

    .amount-item.total .value {
        color: #007bff;
        font-size: 1.25rem;
    }

    /* 表格 */
    .items-table-container {
        overflow-x: auto;
    }

    .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    .items-table th,
    .items-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    .items-table th {
        background: #f8f9fa;
        font-weight: 600;
    }

    .items-table .numeric {
        text-align: right;
    }

    .items-table .mono {
        font-family: monospace;
    }

    .items-table tr.completed {
        opacity: 0.7;
    }

    .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .badge-success {
        background: #d4edda;
        color: #155724;
    }

    .badge-warning {
        background: #fff3cd;
        color: #856404;
    }

    .badge-pending {
        background: #e9ecef;
        color: #495057;
    }

    /* 进度条 */
    .progress-section {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #eee;
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }

    .progress-bar {
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #28a745;
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .progress-stats {
        margin-top: 0.5rem;
        font-size: 0.85rem;
        color: #666;
    }

    /* 备注 */
    .note-box {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 0.75rem;
    }

    .note-box.internal {
        background: #fff3cd;
    }

    .note-box .label {
        font-size: 0.8rem;
        color: #666;
        display: block;
        margin-bottom: 0.5rem;
    }

    .note-box p {
        margin: 0;
        color: #333;
    }

    .empty-text {
        color: #666;
        text-align: center;
        padding: 2rem;
    }

    /* 状态标签 */
    .status-badge {
        display: inline-block;
        padding: 0.375rem 0.75rem;
        border-radius: 4px;
        font-size: 0.85rem;
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

    /* 按钮 */
    .btn {
        padding: 0.5rem 1rem;
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

    .btn-text {
        background: none;
        color: #007bff;
        padding: 0.25rem 0.5rem;
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

    .btn-success {
        background-color: #28a745;
        color: white;
    }

    .btn-success:hover:not(:disabled) {
        background-color: #218838;
    }

    .btn-danger {
        background-color: #dc3545;
        color: white;
    }

    .btn-danger:hover:not(:disabled) {
        background-color: #c82333;
    }

    .btn-small {
        padding: 0.375rem 0.75rem;
        font-size: 0.85rem;
    }

    /* 弹窗 */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
    }

    .modal {
        background: white;
        border-radius: 8px;
        width: 100%;
        max-width: 800px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0.25rem;
        line-height: 1;
    }

    .close-btn:hover {
        color: #333;
    }

    .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        max-height: calc(90vh - 70px);
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #eee;
    }

    /* 收货表单 */
    .receive-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    .receive-table th,
    .receive-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    .receive-table th {
        background: #f8f9fa;
        font-weight: 600;
    }

    .receive-table .numeric {
        text-align: right;
    }

    .qty-input {
        width: 80px;
        padding: 0.375rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        text-align: right;
    }

    .receive-summary {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #e7f3ff;
        border-radius: 4px;
        text-align: right;
    }

    .form-group {
        margin-top: 1rem;
    }

    .form-group label {
        display: block;
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.375rem;
    }

    .form-group textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        resize: vertical;
    }

    /* 错误处理 */
    .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .summary-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }

        .summary-actions {
            flex-wrap: wrap;
        }

        .amount-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .modal-overlay {
            padding: 0.5rem;
        }
    }
</style>

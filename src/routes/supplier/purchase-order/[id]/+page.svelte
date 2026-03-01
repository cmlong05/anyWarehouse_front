<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { purchaseOrderAPI } from '$lib/api';
    import type { PurchaseOrder, PurchaseOrderItem } from '$lib';
    import { safeParseFloat } from '$lib/utils';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { 
        OrderDetailHeader, 
        OrderInfoGrid, 
        OrderAmountGrid, 
        OrderItemsTable,
        ShipReceiveModal 
    } from '$lib/components/order';
    import { 
        useOrderDetail, 
        useShipModal, 
        PURCHASE_STATUS_MAP, 
        PURCHASE_STATUS_TRANSITIONS
    } from '$lib/composables/useOrderDetail.svelte';

    // 获取订单ID
    let orderId = $derived(parseInt($page.params.id));

    // 使用共享逻辑
    const orderDetail = useOrderDetail<PurchaseOrder, string>({
        get orderId() { return orderId; },
        api: purchaseOrderAPI,
        listPath: '/supplier/purchase-order',
        statusMap: PURCHASE_STATUS_MAP,
        statusTransitions: PURCHASE_STATUS_TRANSITIONS,
    });

    // 收货弹窗
    const receiveModal = useShipModal<PurchaseOrderItem>({
        onShip: async (items, notes) => {
            const order = await purchaseOrderAPI.receive(orderId, { items, notes });
            orderDetail.order = order;
        }
    });

    onMount(() => {
        orderDetail.loadOrder();
    });

    // 编辑订单
    function editOrder() {
        alert('编辑功能待实现');
    }

    // 打开收货弹窗
    function openReceiveModal() {
        if (!orderDetail.order?.items) return;
        receiveModal.openModal(orderDetail.order.items);
    }

    // 获取可用操作（包含收货按钮）
    function getExtraActions(): Array<{ value: string; label: string; variant: 'primary' | 'success' | 'danger' }> {
        const actions: Array<{ value: string; label: string; variant: 'primary' | 'success' | 'danger' }> = [];
        if (['ordered', 'partial'].includes(orderDetail.order?.status || '')) {
            actions.push({ value: 'receive', label: '收货', variant: 'success' });
        }
        return actions;
    }

    // 处理操作点击
    function handleAction(action: string) {
        if (action === 'receive') {
            openReceiveModal();
        } else {
            orderDetail.changeStatus(action);
        }
    }
</script>

<div class="purchase-order-detail">
    {#if orderDetail.loading}
        <Loading />
    {:else if orderDetail.error}
        <Alert error={orderDetail.error} onDismiss={() => orderDetail.error = null} />
        <div class="error-actions">
            <button class="btn btn-secondary" onclick={orderDetail.goBack}>返回列表</button>
            <button class="btn btn-primary" onclick={orderDetail.loadOrder}>重试</button>
        </div>
    {:else if orderDetail.order}
        {@const order = orderDetail.order}
        
        <!-- 头部 -->
        <OrderDetailHeader
            title="采购订单详情"
            orderNumber={order.order_number}
            status={order.status}
            statusMap={PURCHASE_STATUS_MAP}
            transitions={orderDetail.order ? orderDetail.getAvailableTransitions() : []}
            updating={orderDetail.updating}
            canEdit={order.status === 'draft'}
            canDelete={['draft', 'pending', 'approved'].includes(order.status)}
            onBack={orderDetail.goBack}
            onEdit={editOrder}
            onDelete={orderDetail.deleteOrder}
            onStatusChange={handleAction}
        />

        <!-- 收货按钮（额外操作） -->
        {#if ['ordered', 'partial'].includes(order.status)}
            <div class="extra-actions">
                <button class="btn btn-success" onclick={openReceiveModal} disabled={orderDetail.updating}>
                    收货
                </button>
            </div>
        {/if}

        <!-- 基本信息 -->
        <OrderInfoGrid
            title="基本信息"
            items={[
                { label: '供应商', value: order.supplier_detail?.name },
                { label: '优先级', value: order.priority, format: 'priority' },
                { label: '下单日期', value: order.order_date },
                { label: '预计交货', value: order.expected_delivery },
                { label: '实际到货', value: order.actual_delivery },
                { label: '创建人', value: order.created_by },
            ]}
        />

        <!-- 金额信息 -->
        <OrderAmountGrid
            items={[
                { label: '商品小计', value: order.subtotal },
                { label: '税率', value: `${order.tax_rate}%`, prefix: '' },
                { label: '税额', value: order.tax_amount },
                { label: '运费', value: order.shipping_cost },
                { label: '折扣', value: order.discount, isNegative: true },
                { label: '订单总计', value: order.total_amount, isTotal: true },
            ]}
        />

        <!-- 收货信息 -->
        <OrderInfoGrid
            title="收货信息"
            items={[
                { label: '收货地址', value: order.shipping_address },
                { label: '收货联系人', value: order.contact_person },
                { label: '收货电话', value: order.contact_phone },
                { label: '付款条款', value: order.payment_terms },
            ]}
        />

        <!-- 订单明细 -->
        <OrderItemsTable items={order.items || []} type="purchase" />

        <!-- 收货进度 -->
        {#if order.progress_percentage !== undefined}
            <div class="info-section">
                <h2>收货进度</h2>
                <div class="progress-section">
                    <div class="progress-header">
                        <span>进度</span>
                        <span>{order.progress_percentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {order.progress_percentage}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>已收: {order.total_received} / {order.total_quantity}</span>
                    </div>
                </div>
            </div>
        {/if}

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
<ShipReceiveModal
    show={receiveModal.showModal}
    title="订单收货"
    items={orderDetail.order?.items || []}
    quantities={receiveModal.quantities}
    notes={receiveModal.notes}
    updating={receiveModal.updating}
    error={receiveModal.error}
    type="receive"
    onClose={receiveModal.closeModal}
    onConfirm={receiveModal.confirmShip}
    onNotesChange={(v) => receiveModal.notes = v}
/>

<style>
    .purchase-order-detail {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .error-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }

    .extra-actions {
        margin-bottom: 1rem;
        display: flex;
        justify-content: flex-end;
    }

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

    .progress-section {
        margin-top: 1rem;
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

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-success {
        background-color: #28a745;
        color: white;
    }

    .btn-success:hover:not(:disabled) {
        background-color: #218838;
    }

    @media (max-width: 768px) {
        .purchase-order-detail {
            padding: 1rem;
        }
    }
</style>

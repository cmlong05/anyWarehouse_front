<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { salesOrderAPI } from '$lib/api';
    import type { SalesOrder, SalesOrderItem } from '$lib';
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
        SALES_STATUS_MAP, 
        SALES_STATUS_TRANSITIONS,
        SHIPMENT_STATUS_MAP
    } from '$lib/composables/useOrderDetail.svelte';

    // 获取订单ID
    let orderId = $derived(parseInt($page.params.id));

    // 使用共享逻辑
    const orderDetail = useOrderDetail<SalesOrder, string>({
        get orderId() { return orderId; },
        api: salesOrderAPI,
        listPath: '/customer/sales-order',
        statusMap: SALES_STATUS_MAP,
        statusTransitions: SALES_STATUS_TRANSITIONS,
    });

    // 发货弹窗
    const shipModal = useShipModal<SalesOrderItem>({
        onShip: async (items, notes) => {
            const order = await salesOrderAPI.ship(orderId, { items, notes });
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

    // 复制订单
    function copyOrder() {
        if (!orderDetail.order) return;
        const order = orderDetail.order;
        
        const copyData = {
            customer_id: order.customer,
            customer_name: order.customer_detail?.name,
            copy_from_order_id: order.id,
            copy_from_order_number: order.order_number,
            order_data: {
                priority: order.priority,
                shipping_address: order.shipping_address,
                contact_person: order.contact_person,
                contact_phone: order.contact_phone,
                payment_terms: order.payment_terms,
                tax_rate: safeParseFloat(order.tax_rate),
                shipping_cost: safeParseFloat(order.shipping_cost),
                discount: safeParseFloat(order.discount),
                notes: `复制自订单 ${order.order_number}`,
                internal_notes: '',
                items: order.items?.map(item => ({
                    item: item.item,
                    sku: item.sku,
                    item_name: item.item_name,
                    quantity: item.quantity,
                    unit_price: safeParseFloat(item.unit_price),
                    notes: item.notes
                })) || []
            }
        };
        
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('sales_order_copy_data', JSON.stringify(copyData));
        }
        goto(`/customer/sales-order/add?customer_id=${order.customer}`);
    }

    // 打开发货弹窗
    function openShipModal() {
        if (!orderDetail.order?.items) return;
        shipModal.openModal(orderDetail.order.items);
    }

    // 初始化发货数量
    $effect(() => {
        const items = orderDetail.order?.items;
        if (items) {
            const newQuantities: Record<number, number> = {};
            items.forEach(item => {
                if ((item.quantity_pending || 0) > 0) {
                    newQuantities[item.id] = 0;
                }
            });
            shipModal.quantities = newQuantities;
        }
    });
</script>

<div class="sales-order-detail">
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
            title="销售订单详情"
            orderNumber={order.order_number}
            status={order.status}
            statusMap={SALES_STATUS_MAP}
            transitions={orderDetail.order ? orderDetail.getAvailableTransitions() : []}
            updating={orderDetail.updating}
            canEdit={order.status === 'draft'}
            canDelete={['draft', 'pending', 'approved'].includes(order.status)}
            onBack={orderDetail.goBack}
            onEdit={editOrder}
            onDelete={orderDetail.deleteOrder}
            onCopy={copyOrder}
            onStatusChange={(status) => orderDetail.changeStatus(status as string)}
        />

        <!-- 基本信息 -->
        <OrderInfoGrid
            title="基本信息"
            items={[
                { label: '客户', value: order.customer_detail?.name },
                { label: '优先级', value: order.priority, format: 'priority' },
                { label: '下单日期', value: order.order_date },
                { label: '预计交货', value: order.expected_delivery },
                { label: '实际交货', value: order.actual_delivery },
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

        <!-- 订单明细 + 关联发货单 -->
        <div class="items-section">
            <OrderItemsTable items={order.items || []} type="sales" />

            <div class="sidebar">
                {#if ['confirmed', 'partial'].includes(order.status)}
                    <div class="sidebar-section">
                        <a href="/customer/shipment/add?order_id={order.id}" class="btn btn-success btn-generate">
                            +生成发货单
                        </a>
                    </div>
                {/if}
                
                {#if order.shipments && order.shipments.length > 0}
                    <div class="sidebar-section">
                        <h3>关联发货单 ({order.shipments.length})</h3>
                        <div class="shipments-list">
                            {#each order.shipments as shipment}
                                <div class="shipment-card">
                                    <div class="shipment-header">
                                        <a href="/customer/shipment/{shipment.id}" class="shipment-link">
                                            {shipment.shipment_no}
                                        </a>
                                        <span class="status-badge-mini {shipment.status}">
                                            {SHIPMENT_STATUS_MAP[shipment.status] || shipment.status}
                                        </span>
                                    </div>
                                    <div class="shipment-info">
                                        <span>包裹: {shipment.total_packages}</span>
                                        <span>{new Date(shipment.created_at).toLocaleString('zh-CN')}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
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

<!-- 发货弹窗 -->
<ShipReceiveModal
    show={shipModal.showModal}
    title="订单发货"
    items={orderDetail.order?.items || []}
    quantities={shipModal.quantities}
    notes={shipModal.notes}
    updating={shipModal.updating}
    error={shipModal.error}
    type="ship"
    onClose={shipModal.closeModal}
    onConfirm={shipModal.confirmShip}
    onNotesChange={(v) => shipModal.notes = v}
/>

<style>
    .sales-order-detail {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .error-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }

    .items-section {
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .sidebar-section {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .sidebar-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #333;
    }

    .btn-generate {
        display: block;
        width: 100%;
        text-align: center;
        padding: 0.75rem;
        font-size: 1rem;
        font-weight: 600;
        background: #28a745;
        color: white;
        border-radius: 4px;
        text-decoration: none;
    }

    .btn-generate:hover {
        background: #218838;
    }

    .shipments-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .shipment-card {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 1rem;
        background: #fafafa;
    }

    .shipment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .shipment-link {
        font-weight: 600;
        color: #2563eb;
        text-decoration: none;
    }

    .shipment-link:hover {
        text-decoration: underline;
    }

    .shipment-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.85rem;
        color: #666;
    }

    .status-badge-mini {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .status-badge-mini.draft { background: #f3f4f6; color: #6b7280; }
    .status-badge-mini.confirmed { background: #dbeafe; color: #1e40af; }
    .status-badge-mini.packed { background: #fef3c7; color: #92400e; }
    .status-badge-mini.shipped { background: #d1fae5; color: #065f46; }
    .status-badge-mini.delivered { background: #c7d2fe; color: #3730a3; }
    .status-badge-mini.cancelled { background: #fee2e2; color: #991b1b; }

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

    @media (max-width: 1024px) {
        .items-section {
            grid-template-columns: 1fr;
        }
        
        .sidebar {
            order: -1;
        }
    }

    @media (max-width: 768px) {
        .sales-order-detail {
            padding: 1rem;
        }
    }
</style>

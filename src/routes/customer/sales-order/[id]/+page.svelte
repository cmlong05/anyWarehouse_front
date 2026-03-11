<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { salesOrderAPI } from '$lib/api';
    import type { SalesOrder, SalesOrderItem } from '$lib';
    import { safeParseFloat } from '$lib/utils';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { LocaleSwitcher } from '$lib/components/shipment';
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
    import { localeStore, t, getStatusText as getSalesStatusText } from '$lib/i18n/sales';
    import { getStatusText as getShipmentStatusText } from '$lib/i18n/shipment';

    // 获取订单ID
    let orderId = $derived(parseInt(page.params.id || '0'));

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
        goto(`/customer/sales-order/${orderId}/edit`);
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

    // 发货单状态样式
    function getShipmentStatusClass(status: string): string {
        const classes: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-600',
            confirmed: 'bg-blue-100 text-blue-700',
            packed: 'bg-yellow-100 text-yellow-700',
            shipped: 'bg-green-100 text-green-700',
            delivered: 'bg-indigo-100 text-indigo-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return classes[status] || 'bg-gray-100 text-gray-600';
    }
</script>

<div class="p-6 max-w-6xl mx-auto">
    {#if orderDetail.loading}
        <Loading />
    {:else if orderDetail.error}
        <Alert error={orderDetail.error} onDismiss={() => orderDetail.error = null} />
        <div class="flex gap-4 mt-4">
            <button 
                class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                onclick={orderDetail.goBack}
            >
                {t('sales.btn.back', $localeStore)}
            </button>
            <button 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onclick={orderDetail.loadOrder}
            >
                {t('sales.btn.retry', $localeStore)}
            </button>
        </div>
    {:else if orderDetail.order}
        {@const order = orderDetail.order}
        
        <!-- 头部 -->
        <div class="flex justify-between items-center mb-4">
            {#key $localeStore}
            <OrderDetailHeader
                title={t('sales.detail.title', $localeStore)}
                orderNumber={order.order_number}
                status={order.status}
                statusMap={SALES_STATUS_MAP}
                transitions={orderDetail.order ? orderDetail.getAvailableTransitions() : []}
                updating={orderDetail.updating}
                canEdit={['draft', 'confirmed', 'approved'].includes(order.status)}
                canDelete={['draft', 'pending', 'approved', 'cancelled'].includes(order.status)}
                labels={{
                    backToList: t('sales.btn.backToList', $localeStore),
                    copyOrder: t('sales.btn.copy', $localeStore),
                    edit: t('sales.btn.edit', $localeStore),
                    delete: t('sales.btn.delete', $localeStore),
                }}
                onBack={orderDetail.goBack}
                onEdit={editOrder}
                onDelete={orderDetail.deleteOrder}
                onCopy={copyOrder}
                onStatusChange={(status) => orderDetail.changeStatus(status as string)}
            />
            {/key}
            <LocaleSwitcher variant="button" />
        </div>

        <!-- 基本信息 -->
        {#key $localeStore}
        <OrderInfoGrid
            title={t('sales.basic.title', $localeStore)}
            priorityMap={{
                low: { label: t('sales.priority.low', $localeStore), class: 'priority-low' },
                normal: { label: t('sales.priority.normal', $localeStore), class: 'priority-normal' },
                high: { label: t('sales.priority.high', $localeStore), class: 'priority-high' },
                urgent: { label: t('sales.priority.urgent', $localeStore), class: 'priority-urgent' },
            }}
            items={[
                { label: t('sales.field.customer', $localeStore), value: order.customer_detail?.name, href: `/customer/${order.customer}` },
                { label: t('sales.field.priority', $localeStore), value: order.priority, format: 'priority' },
                { label: t('sales.field.orderDate', $localeStore), value: order.order_date },
                { label: t('sales.field.expectedDelivery', $localeStore), value: order.expected_delivery },
                { label: t('sales.field.actualDelivery', $localeStore), value: order.actual_delivery },
                { label: t('sales.field.createdBy', $localeStore), value: order.created_by },
            ]}
        />

        <!-- 金额信息 -->
        <OrderAmountGrid
            title={t('sales.amount.title', $localeStore)}
            items={[
                { label: t('sales.field.subtotal', $localeStore), value: order.subtotal },
                { label: t('sales.field.taxRate', $localeStore), value: `${order.tax_rate}%`, prefix: '' },
                { label: t('sales.field.taxAmount', $localeStore), value: order.tax_amount },
                { label: t('sales.field.shippingCost', $localeStore), value: order.shipping_cost },
                { label: t('sales.field.discount', $localeStore), value: order.discount, isNegative: true },
                { label: t('sales.field.totalAmount', $localeStore), value: order.total_amount, isTotal: true },
            ]}
        />

        <!-- 收货信息 -->
        <OrderInfoGrid
            title={t('sales.shipping.title', $localeStore)}
            items={[
                { label: t('sales.field.shippingAddress', $localeStore), value: order.shipping_address },
                { label: t('sales.field.contactPerson', $localeStore), value: order.contact_person },
                { label: t('sales.field.contactPhone', $localeStore), value: order.contact_phone },
                { label: t('sales.field.paymentTerms', $localeStore), value: order.payment_terms },
            ]}
        />
        {/key}

        <!-- 订单明细 + 关联发货单 -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 mb-6">
            {#key $localeStore}
            <OrderItemsTable 
                items={order.items || []} 
                type="sales" 
                labels={{
                    title: t('sales.items.title', $localeStore),
                    itemName: t('sales.table.itemName', $localeStore),
                    quantity: t('sales.table.quantity', $localeStore),
                    shipped: t('sales.table.shipped', $localeStore),
                    pendingShip: t('sales.table.pendingShip', $localeStore),
                    unitPrice: t('sales.table.unitPrice', $localeStore),
                    subtotal: t('sales.table.subtotal', $localeStore),
                    status: t('sales.table.status', $localeStore),
                    completed: t('sales.table.completed', $localeStore),
                    partial: t('sales.table.partial', $localeStore),
                    pending: t('sales.table.pending', $localeStore),
                    noItems: t('sales.msg.noItems', $localeStore),
                }}
            />
            {/key}

            <div class="flex flex-col gap-4 lg:order-none order-first">
                <!-- 打印 PI 按钮 -->
                <div class="bg-white rounded-lg p-6 shadow">
                    <button
                        type="button"
                        class="w-full py-3 px-4 text-base font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        onclick={() => goto(`/customer/sales-order/${order.id}/pi`)}
                    >
                        📄 打印 PI
                    </button>
                </div>

                {#if ['confirmed', 'partial'].includes(order.status)}
                    <div class="bg-white rounded-lg p-6 shadow">
                        {#key $localeStore}
                        <button
                            type="button"
                            class="w-full py-3 px-4 text-base font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            onclick={() => goto(`/customer/shipment/add?order_id=${order.id}`)}
                        >
                            +{t('sales.btn.generateShipment', $localeStore)}
                        </button>
                        {/key}
                    </div>
                {/if}
                
                {#if order.shipments && order.shipments.length > 0}
                    <div class="bg-white rounded-lg p-6 shadow">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">
                            {t('sales.shipment.title', $localeStore)} ({order.shipments.length})
                        </h3>
                        <div class="flex flex-col gap-3">
                            {#each order.shipments as shipment}
                                <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div class="flex justify-between items-center mb-2">
                                        <a 
                                            href="/customer/shipment/{shipment.id}" 
                                            class="font-semibold text-blue-600 hover:underline"
                                        >
                                            {shipment.shipment_no}
                                        </a>
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getShipmentStatusClass(shipment.status)}">
                                            {getShipmentStatusText(shipment.status, $localeStore)}
                                        </span>
                                    </div>
                                    <div class="flex flex-col gap-1 text-sm text-gray-600">
                                        <span>{t('sales.shipment.packageCount', $localeStore)}: {shipment.total_packages}</span>
                                        <span>{new Date(shipment.created_at).toLocaleString($localeStore === 'zh' ? 'zh-CN' : 'en-US')}</span>
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
            <div class="bg-white rounded-lg p-6 shadow mb-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">{t('sales.notes.title', $localeStore)}</h2>
                {#if order.notes}
                    <div class="bg-gray-50 p-4 rounded-lg mb-3">
                        <span class="text-sm text-gray-600 block mb-2">{t('sales.field.notes', $localeStore)}</span>
                        <p class="text-gray-900">{order.notes}</p>
                    </div>
                {/if}
                {#if order.internal_notes}
                    <div class="bg-yellow-50 p-4 rounded-lg">
                        <span class="text-sm text-gray-600 block mb-2">{t('sales.field.internalNotes', $localeStore)}</span>
                        <p class="text-gray-900">{order.internal_notes}</p>
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<!-- 发货弹窗 -->
<ShipReceiveModal
    show={shipModal.showModal}
    title={t('sales.shipModal.title', $localeStore)}
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

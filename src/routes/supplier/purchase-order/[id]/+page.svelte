<script lang="ts">
	import { logger } from '$lib/logger';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { purchaseOrderAPI } from '$lib/api';
    import type { PurchaseOrder, PurchaseOrderItem } from '$lib';
    import { safeParseFloat, formatNumber } from '$lib/utils';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { 
        OrderDetailHeader, 
        OrderInfoGrid, 
        OrderAmountGrid, 
        OrderItemsTable,
        ShipReceiveModal,
        OrderNotesCard
    } from '$lib/components/order';
    import { 
        useOrderDetail, 
        useShipModal, 
        PURCHASE_STATUS_MAP, 
        PURCHASE_STATUS_TRANSITIONS
    } from '$lib/composables/useOrderDetail.svelte';

    // 获取订单ID
    let orderId = $derived(parseInt($page.params.id || '0'));

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
        goto(`/supplier/purchase-order/edit?id=${orderId}`);
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

    let poDownloading = $state(false);
    let skuReferenceDownloading = $state(false);

    async function downloadPO() {
        if (poDownloading || !orderDetail.order) return;
        poDownloading = true;
        try {
            await purchaseOrderAPI.downloadPO(orderDetail.order.id, 'zh-CN', orderDetail.order.order_number);
        } catch (e) {
            logger.error('采购单生成失败', e);
            alert('采购单生成失败，请稍后重试。');
        } finally {
            poDownloading = false;
        }
    }

    async function downloadSkuReference() {
        if (skuReferenceDownloading || !orderDetail.order) return;
        skuReferenceDownloading = true;
        try {
            await purchaseOrderAPI.downloadSkuReference(orderDetail.order.id, 'zh-CN', orderDetail.order.order_number);
        } catch (e) {
            logger.error('SKU 对照表生成失败', e);
            alert('SKU 对照表生成失败，请稍后重试。');
        } finally {
            skuReferenceDownloading = false;
        }
    }

    function canEditOrder(status: string): boolean {
        return ['draft', 'pending', 'approved', 'ordered', 'partial'].includes(status);
    }
</script>

<div class="p-6 max-w-6xl mx-auto">
    {#if orderDetail.loading}
        <Loading />
    {:else if orderDetail.error}
        <Alert error={orderDetail.error} onDismiss={() => orderDetail.error = null} />
        <div class="flex gap-4 mt-4">
            <button class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors" onclick={orderDetail.goBack}>返回列表</button>
            <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" onclick={orderDetail.loadOrder}>重试</button>
        </div>
    {:else if orderDetail.order}
        {@const order = orderDetail.order}

        <div class="flex justify-between items-center mb-4 gap-4 flex-wrap">
            <OrderDetailHeader
                title="采购订单详情"
                orderNumber={order.order_number}
                status={order.status}
                statusMap={PURCHASE_STATUS_MAP}
                transitions={orderDetail.order ? orderDetail.getAvailableTransitions() : []}
                updating={orderDetail.updating}
                canEdit={canEditOrder(order.status)}
                canDelete={['draft', 'pending', 'approved'].includes(order.status)}
                onBack={orderDetail.goBack}
                onEdit={editOrder}
                onDelete={orderDetail.deleteOrder}
                onStatusChange={handleAction}
            />

            <div class="flex items-center gap-3">
                <button
                    type="button"
                    class="py-2 px-4 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onclick={downloadPO}
                    disabled={poDownloading || skuReferenceDownloading}
                >
                    {#if poDownloading}
                        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        生成中...
                    {:else}
                        📄 采购单
                    {/if}
                </button>

                <button
                    type="button"
                    class="py-2 px-4 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onclick={downloadSkuReference}
                    disabled={poDownloading || skuReferenceDownloading}
                >
                    {#if skuReferenceDownloading}
                        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        生成中...
                    {:else}
                        🗂️ SKU表
                    {/if}
                </button>
            </div>
        </div>

        <!-- 收货按钮（额外操作） -->
        {#if ['ordered', 'partial'].includes(order.status)}
            <div class="flex justify-end mb-4">
                <button class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 transition-colors" onclick={openReceiveModal} disabled={orderDetail.updating}>
                    收货
                </button>
            </div>
        {/if}

        <!-- 基本信息 -->
        <OrderInfoGrid
            title="基本信息"
            items={[
                { label: '订单号', value: order.order_number },
                { label: '供应商', value: order.supplier_detail?.name, href: `/supplier/${order.supplier}` },
                { label: '优先级', value: order.priority, format: 'priority' },
                { label: '下单日期', value: order.order_date },
                { label: '预计交货', value: order.expected_delivery },
                { label: '实际到货', value: order.actual_delivery },
                { label: '创建人', value: order.created_by },
            ]}
        />

        <!-- 金额信息 -->
        <OrderAmountGrid
            currency={order.currency || 'CNY'}
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
        <OrderItemsTable items={order.items || []} type="purchase" showCurrentStock currency={order.currency || 'CNY'} />

        <!-- 收货进度 -->
        {#if order.progress_percentage !== undefined}
            <div class="bg-white rounded-lg p-6 mb-6 shadow-sm">
                <h2 class="text-lg font-semibold mb-4">收货进度</h2>
                <div class="mt-4">
                    <div class="flex justify-between mb-2">
                        <span>进度</span>
                        <span>{order.progress_percentage}%</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded overflow-hidden">
                        <div class="h-full bg-green-600 rounded transition-all duration-300" style="width: {order.progress_percentage}%"></div>
                    </div>
                    <div class="mt-2 text-sm text-gray-600">
                        <span>已收: {formatNumber(order.total_received)} / {formatNumber(order.total_quantity)}</span>
                    </div>
                </div>
            </div>
        {/if}

        <!-- 备注 -->
        <OrderNotesCard notes={order.notes} internal_notes={order.internal_notes} />
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

<!-- 采购订单详情页 -->
<!--
被依赖：无
-->
<script lang="ts">
	import { logger } from '$lib/logger';
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { purchaseOrderAPI } from '$lib/api';
    import type { PurchaseOrder, PurchaseOrderItem } from '$lib';
    import { formatNumber } from '$lib/utils';
import { Alert, Loading } from '$lib/components';
    import { 
        OrderDetailHeader, 
        OrderInfoGrid, 
        OrderAmountGrid, 
        OrderItemsTable,
        ShipReceiveModal,
        OrderNotesCard
    } from '$lib/components/order';
    import OrderPaymentRecords from '$lib/components/OrderPaymentRecords.svelte';
    import { 
        useOrderDetail, 
        useShipModal, 
        PURCHASE_STATUS_MAP, 
        PURCHASE_STATUS_TRANSITIONS
    } from '$lib/composables/useOrderDetail.svelte';

    // 获取订单ID
    const orderId = parseInt(page.params.id || '0');

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
        receiveModal.openModal(orderDetail.order.items, 'receive');
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

        <!-- 头部 -->
        <div class="mb-2">
            <OrderDetailHeader
                title="采购订单详情"
                orderNumber={order.order_number}
                status={order.status}
                statusMap={PURCHASE_STATUS_MAP}
                transitions={orderDetail.order ? orderDetail.getAvailableTransitions() : []}
                showMeta={false}
                updating={orderDetail.updating}
                canEdit={canEditOrder(order.status)}
                canDelete={['draft', 'pending', 'approved', 'cancelled'].includes(order.status)}
                onBack={orderDetail.goBack}
                onEdit={editOrder}
                onDelete={orderDetail.deleteOrder}
                onStatusChange={handleAction}
            />
        </div>

        <!-- 基本信息 -->
        <OrderInfoGrid
            title="基本信息"
            items={[
                { label: '订单号', value: order.order_number },
                { label: '订单状态', value: PURCHASE_STATUS_MAP[order.status]?.label || order.status },
                { label: '供应商', value: order.supplier_detail?.name, href: `/supplier/${order.supplier}` },
                { label: '优先级', value: order.priority, format: 'priority' },
                { label: '下单日期', value: order.order_date },
                { label: '预计交货', value: order.expected_delivery },
                { label: '实际到货', value: order.actual_delivery },
                { label: '创建人', value: order.created_by },
            ]}
        >
            {#snippet actions()}
                <button
                    type="button"
                    class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 2h7l5 5v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 2v5h5" />
                        </svg>
                        采购单
                    {/if}
                </button>

                <button
                    type="button"
                    class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 8h6M9 12h6M9 16h4" />
                        </svg>
                        SKU表
                    {/if}
                </button>

                {#if ['ordered', 'partial'].includes(order.status)}
                    <button
                        class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        onclick={openReceiveModal}
                        disabled={orderDetail.updating}
                    >
                        收货
                    </button>
                {/if}
            {/snippet}
        </OrderInfoGrid>

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

        <!-- 付款记录 -->
        <OrderPaymentRecords orderId={order.id} currency={order.currency || 'CNY'} />

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
    containers={receiveModal.containers}
    availableStorages={receiveModal.availableStorages}
    allContainers={receiveModal.allContainers}
    onContainerChange={(id, v) => receiveModal.containers = { ...receiveModal.containers, [id]: v }}
    notes={receiveModal.notes}
    updating={receiveModal.updating}
    error={receiveModal.error}
    type="receive"
    onClose={receiveModal.closeModal}
    onConfirm={receiveModal.confirmShip}
    onNotesChange={(v) => receiveModal.notes = v}
/>
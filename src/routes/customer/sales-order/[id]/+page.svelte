<script lang="ts">
	import { logger } from '$lib/logger';
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { customerAPI, salesOrderAPI } from '$lib/api';
    import type { CustomerAddress, SalesOrder, SalesOrderItem } from '$lib';
    import { safeParseFloat, normalizeAddressValue, addressMatches } from '$lib/utils';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { 
        OrderDetailHeader, 
        OrderInfoGrid, 
        OrderAmountGrid, 
        OrderItemsTable,
        ShipReceiveModal,
        SalesOrderPaymentPanel,
        SalesOrderShipmentsPanel,
    } from '$lib/components/order';
    import { 
        useOrderDetail, 
        useShipModal, 
        SALES_STATUS_MAP, 
        SALES_STATUS_TRANSITIONS
    } from '$lib/composables/useOrderDetail.svelte';

    // 获取订单ID
    let orderId = $derived(parseInt(page.params.id || '0'));

    // 使用共享逻辑
    const backUrl = $derived(page.url.searchParams.get('from') ?? undefined);

    const orderDetail = useOrderDetail<SalesOrder, string>({
        get orderId() { return orderId; },
        api: salesOrderAPI,
        listPath: '/customer/sales-order',
        get backUrl() { return backUrl; },
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

    let customerAddresses = $state<CustomerAddress[]>([]);
    let shippingAddressesLoading = $state(false);

    function findMatchingShippingAddress(order: SalesOrder | null, addresses: CustomerAddress[]): CustomerAddress | null {
        if (!order || addresses.length === 0) return null;

        const normalizedOrderAddress = normalizeAddressValue(order.shipping_address);
        const normalizedContactPerson = normalizeAddressValue(order.contact_person);
        const normalizedContactPhone = normalizeAddressValue(order.contact_phone);

        return (
            addresses.find((address) =>
                addressMatches(address, normalizedOrderAddress) &&
                normalizeAddressValue(address.contact_name) === normalizedContactPerson &&
                normalizeAddressValue(address.phone) === normalizedContactPhone
            ) ||
            addresses.find((address) =>
                addressMatches(address, normalizedOrderAddress) &&
                normalizeAddressValue(address.contact_name) === normalizedContactPerson
            ) ||
            addresses.find((address) => addressMatches(address, normalizedOrderAddress)) ||
            null
        );
    }

    function getAddressStatusText(status: CustomerAddress['status'] | undefined): string {
        if (!status) return '-';
        return status === 'ACTIVE' ? '启用' : '停用';
    }

    const matchedShippingAddress = $derived(findMatchingShippingAddress(orderDetail.order, customerAddresses));

    const orderItems = $derived.by(() => {
        const order = orderDetail.order;
        if (!order?.items) return [];

        return order.items.map((item) => {
            const shipped = safeParseFloat(item.quantity_shipped);
            const prepared = safeParseFloat(item.quantity_prepared);
            const pendingReal = safeParseFloat(item.quantity_pending_real);

            return {
                ...item,
                quantity_shipped: shipped + prepared,
                quantity_pending: pendingReal,
            };
        });
    });

    const shippingInfoItems = $derived.by(() => {
        const order = orderDetail.order;
        const matchedAddress = matchedShippingAddress;

        if (!order) return [];

        return [
            { label: '联系人', value: order.contact_person },
            { label: '电话', value: order.contact_phone },
            { label: '手机', value: matchedAddress?.mobile },
            { label: '邮箱', value: matchedAddress?.email },
            { label: '公司名称', value: matchedAddress?.company },
            { label: '税号', value: matchedAddress?.tax_number },
            { label: '国家', value: matchedAddress?.country },
            { label: '州/省', value: matchedAddress?.province },
            { label: '城市', value: matchedAddress?.city },
            { label: '区/县', value: matchedAddress?.district },
            { label: '地址1', value: matchedAddress?.detail_address },
            { label: '地址2', value: matchedAddress?.detail_address2 },
            { label: '邮编', value: matchedAddress?.postal_code },
            { label: '地址备注', value: matchedAddress?.remark },
            { label: '付款条款', value: order.payment_terms },
        ];
    });

    const addressMetaItems = $derived.by(() => {
        const matchedAddress = matchedShippingAddress;
        if (!matchedAddress) return [];
        return [
            { label: '默认地址', value: matchedAddress.is_default ? '是' : '否' },
            { label: '地址状态', value: getAddressStatusText(matchedAddress.status) },
        ];
    });

    onMount(() => {
        orderDetail.loadOrder();
    });

    $effect(() => {
        const order = orderDetail.order;

        if (!order?.customer) {
            customerAddresses = [];
            return;
        }

        shippingAddressesLoading = true;

        void customerAPI.getAddresses(order.customer)
            .then((addresses) => {
                if (orderDetail.order?.id !== order.id) return;
                customerAddresses = addresses;
            })
            .catch(() => {
                if (orderDetail.order?.id !== order.id) return;
                customerAddresses = [];
            })
            .finally(() => {
                if (orderDetail.order?.id !== order.id) return;
                shippingAddressesLoading = false;
            });
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
                payment_fee: safeParseFloat(order.payment_fee),
                discount: safeParseFloat(order.discount),
                adjustment: safeParseFloat(order.adjustment),
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

    // 反向同步：按行由发货单推进订单数量
    let reverseSyncLoading = $state<Record<string, boolean>>({});
    let reverseSyncResult = $state<{ message: string; updated_items: { sku: string; old_qty: string; new_qty: string }[] } | null>(null);
    let reverseSyncError = $state<string | null>(null);

    async function reverseSyncItem(item: { sku: string }) {
        if (!orderId || reverseSyncLoading[item.sku]) return;
        reverseSyncResult = null;
        reverseSyncError = null;
        reverseSyncLoading = { ...reverseSyncLoading, [item.sku]: true };
        try {
            const result = await salesOrderAPI.syncQuantities(orderId, { sku: item.sku, allowDecrease: true });
            reverseSyncResult = result;
            if (result.updated_items.length > 0) {
                await orderDetail.loadOrder();
            }
        } catch (e: unknown) {
            reverseSyncError = e instanceof Error ? e.message : '同步失败，请重试';
        } finally {
            reverseSyncLoading = { ...reverseSyncLoading, [item.sku]: false };
        }
    }

    // ── PDF 下载 ────────────────────────────────────────
    let piDownloading = $state(false);
    let invoiceDownloading = $state(false);
    let skuReferenceDownloading = $state(false);
    let showRollback = $state(false);

    async function downloadPI() {
        if (piDownloading || !orderDetail.order) return;
        piDownloading = true;
        try {
            await salesOrderAPI.downloadPI(orderDetail.order.id, 'en', orderDetail.order.order_number);
        } catch (e) {
            logger.error('PDF 生成失败', e);
            alert('PDF 生成失败，请稍后重试。');
        } finally {
            piDownloading = false;
        }
    }

    async function downloadInvoice() {
        if (invoiceDownloading || !orderDetail.order) return;
        invoiceDownloading = true;
        try {
            await salesOrderAPI.downloadInvoice(orderDetail.order.id, 'en', orderDetail.order.order_number);
        } catch (e) {
            logger.error('PDF 生成失败', e);
            alert('PDF 生成失败，请稍后重试。');
        } finally {
            invoiceDownloading = false;
        }
    }

    async function downloadSkuReference() {
        if (skuReferenceDownloading || !orderDetail.order) return;
        skuReferenceDownloading = true;
        try {
            await salesOrderAPI.downloadSkuReference(orderDetail.order.id, 'en', orderDetail.order.order_number);
        } catch (e) {
            logger.error('SKU 对照表生成失败', e);
            alert('SKU 对照表生成失败，请稍后重试。');
        } finally {
            skuReferenceDownloading = false;
        }
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
                返回
            </button>
            <button 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onclick={orderDetail.loadOrder}
            >
                重试
            </button>
        </div>
    {:else if orderDetail.order}
        {@const order = orderDetail.order}
        
        <!-- 头部 -->
        <div class="mb-2">
            <OrderDetailHeader
                title="销售订单详情"
                orderNumber={order.order_number}
                status={order.status}
                statusMap={SALES_STATUS_MAP}
                transitions={orderDetail.order ? orderDetail.getAvailableTransitions() : []}
                                showMeta={false}
                updating={orderDetail.updating}
                canEdit={['draft', 'pending', 'confirmed', 'approved', 'partial'].includes(order.status)}
                canDelete={['draft', 'pending', 'approved', 'cancelled'].includes(order.status)}
                labels={{
                    backToList: '← 返回',
                    copyOrder: '复制订单',
                    edit: '编辑',
                    delete: '删除',
                }}
                onBack={orderDetail.goBack}
                onEdit={editOrder}
                onDelete={orderDetail.deleteOrder}
                onCopy={copyOrder}
                onStatusChange={(status) => orderDetail.changeStatus(status as string)}
            />
        {#if orderDetail.order}
            {@const rollbackTransitions = orderDetail.getAvailableTransitions().filter(t => t.rollback)}
            <div class="flex flex-wrap items-center justify-between gap-2">
                <!-- 状态调整（回退操作） -->
                {#if rollbackTransitions.length > 0}
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                            onclick={() => showRollback = !showRollback}
                        >
                            <svg class="h-3.5 w-3.5 transition-transform {showRollback ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            状态回退
                        </button>
                        {#if showRollback}
                            <div class="flex flex-wrap items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1">
                                <span class="text-xs text-amber-500 mr-1">回退到：</span>
                                {#each rollbackTransitions as transition}
                                    <button
                                        class="inline-flex h-7 items-center rounded border border-amber-300 bg-white px-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        onclick={() => orderDetail.changeStatus(transition.value as string)}
                                        disabled={orderDetail.updating}
                                    >
                                        {transition.label}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div></div>
                {/if}
            </div>
        {/if}
        </div>

        <!-- 基本信息 -->
        <OrderInfoGrid
            title="基本信息"
            priorityMap={{
                low: { label: '低', class: 'priority-low' },
                normal: { label: '普通', class: 'priority-normal' },
                high: { label: '高', class: 'priority-high' },
                urgent: { label: '紧急', class: 'priority-urgent' },
            }}
            items={[
                { label: '客户', value: order.customer_detail?.name, href: `/customer/${order.customer}` },
                { label: '订单号', value: order.order_number },
                { label: '状态', value: order.status === 'draft' ? '草稿' : order.status === 'pending' ? '待审批' : order.status === 'approved' ? '已批准' : order.status === 'confirmed' ? '已确认' : order.status === 'partial' ? '部分发货' : order.status === 'shipped' ? '已发货' : order.status === 'delivered' ? '已交付' : order.status === 'cancelled' ? '已取消' : order.status },
                { label: '优先级', value: order.priority, format: 'priority' },
                { label: '下单日期', value: order.order_date },
                { label: '预计交货', value: order.expected_delivery },
                { label: '实际交货', value: order.actual_delivery },
                { label: '创建人', value: order.created_by },
            ]}
        >
            {#snippet actions()}
                <button
                    type="button"
                    class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onclick={downloadPI}
                    disabled={piDownloading || invoiceDownloading || skuReferenceDownloading}
                >
                    {#if piDownloading}
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
                        PI
                    {/if}
                </button>
                <button
                    type="button"
                    class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onclick={downloadInvoice}
                    disabled={piDownloading || invoiceDownloading || skuReferenceDownloading}
                >
                    {#if invoiceDownloading}
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
                        Invoice
                    {/if}
                </button>
                <button
                    type="button"
                    class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onclick={downloadSkuReference}
                    disabled={piDownloading || invoiceDownloading || skuReferenceDownloading}
                >
                    {#if skuReferenceDownloading}
                        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        生成中...
                    {:else}
                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18v13H3z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7l2-4h14l2 4" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h8M8 16h5" />
                        </svg>
                        SKU表
                    {/if}
                </button>
            {/snippet}
        </OrderInfoGrid>

        <!-- 金额信息 -->
        <OrderAmountGrid
            title="金额信息"
            currency={order.currency || 'CNY'}
            items={[
                { label: '商品小计', value: order.subtotal },
                { label: '税率', value: `${order.tax_rate}%`, prefix: '' },
                { label: '税额', value: order.tax_amount },
                { label: '运费', value: order.shipping_cost },
                { label: '付款费用', value: order.payment_fee },
                { label: '折扣', value: order.discount, isNegative: true },
                { label: '其他调整', value: order.adjustment, isNegative: safeParseFloat(order.adjustment) < 0 },
                { label: '订单总计', value: order.total_amount, isTotal: true },
            ]}
        />

        <!-- 订单明细 - 占据整行 -->
        <OrderItemsTable 
            items={orderItems} 
            type="sales"
            currency={order.currency || 'CNY'}
            labels={{
                title: '订单明细',
                itemName: '物品名称',
                currentStock: '现有库存',
                quantity: '数量',
                shipped: '已建发货单',
                pendingShip: '待建发货单',
                unitPrice: '单价',
                subtotal: '小计',
                status: '状态',
                completed: '已完成',
                partial: '部分完成',
                pending: '待处理',
                noItems: '暂无明细项',
            }}
            onReverseSync={reverseSyncItem}
            reverseSyncLoading={reverseSyncLoading}
        />

        {#if reverseSyncError}
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                ⚠️ {reverseSyncError}
            </div>
        {/if}
        {#if reverseSyncResult}
            <div class="mb-4 p-3 rounded-lg text-sm {reverseSyncResult.updated_items.length > 0 ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-gray-50 border border-gray-200 text-gray-600'}">
                ✅ {reverseSyncResult.message}
                {#if reverseSyncResult.updated_items.length > 0}
                    <ul class="mt-2 space-y-1">
                        {#each reverseSyncResult.updated_items as item}
                            <li class="ml-4">SKU: <span class="font-mono font-medium">{item.sku}</span> — {item.old_qty} → <span class="font-semibold">{item.new_qty}</span></li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/if}

        <!-- 生成发货单按钮 -->
        {#if ['confirmed', 'partial'].includes(order.status)}
            <div class="my-6">
                <button
                    type="button"
                    class="w-full py-3 px-4 text-base font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    onclick={() => goto(`/customer/shipment/add?order_id=${order.id}`)}
                >
                    +生成发货单
                </button>
            </div>
        {/if}

        <SalesOrderShipmentsPanel {order} onOrderReload={orderDetail.loadOrder} />

        <SalesOrderPaymentPanel {order} onOrderReload={orderDetail.loadOrder} />

        <!-- 收货信息 -->
        <OrderInfoGrid
            title="收货信息"
            items={shippingInfoItems}
        />
        {#if addressMetaItems.length > 0}
            <div class="bg-gray-50 rounded-lg px-6 py-4 mb-6 border border-gray-200 flex flex-wrap gap-6 text-sm">
                {#each addressMetaItems as meta}
                    <div class="flex flex-col">
                        <span class="text-gray-400">{meta.label}</span>
                        <span class="text-gray-600 font-medium">{meta.value}</span>
                    </div>
                {/each}
            </div>
        {/if}
        {#if !shippingAddressesLoading && customerAddresses.length > 0 && !matchedShippingAddress}
            <p class="mb-6 -mt-2 text-sm text-amber-700">
                该订单保存的是收货快照，部分结构化地址字段未能从客户地址簿中匹配。
            </p>
        {/if}
        <!-- 订单明细 - 占据整行 -->
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

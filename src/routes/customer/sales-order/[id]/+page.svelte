<script lang="ts">
	import { logger } from '$lib/logger';
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { customerAPI, salesOrderAPI, salesOrderPaymentRecordAPI } from '$lib/api';
    import type { CustomerAddress, SalesOrder, SalesOrderItem, SalesOrderPaymentRecordCreateRequest } from '$lib';
    import { safeParseFloat, normalizeAddressValue, addressMatches } from '$lib/utils';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { LocaleSwitcher } from '$lib/components/shipment';
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
        SALES_STATUS_MAP, 
        SALES_STATUS_TRANSITIONS
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

    let customerAddresses = $state<CustomerAddress[]>([]);
    let shippingAddressesLoading = $state(false);
    let paymentSaving = $state(false);
    let paymentError = $state<string | null>(null);
    let paymentSuccess = $state<string | null>(null);
    let deletingPaymentId = $state<number | null>(null);

    function getTodayLocalDate(): string {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }

    let paymentForm = $state({
        received_date: getTodayLocalDate(),
        amount: '',
        payment_method: '',
        reference_number: '',
        notes: '',
        attachment: null as File | null,
    });

    function resetPaymentForm() {
        paymentForm = {
            received_date: getTodayLocalDate(),
            amount: '',
            payment_method: '',
            reference_number: '',
            notes: '',
            attachment: null,
        };
    }

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
        if ($localeStore === 'en') {
            return status === 'ACTIVE' ? 'Active' : 'Inactive';
        }
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
            { label: t('sales.field.contactPerson', $localeStore), value: order.contact_person },
            { label: t('sales.field.contactPhone', $localeStore), value: order.contact_phone },
            { label: t('sales.field.mobile', $localeStore), value: matchedAddress?.mobile },
            { label: t('sales.field.addressEmail', $localeStore), value: matchedAddress?.email },
            { label: t('sales.field.company', $localeStore), value: matchedAddress?.company },
            { label: t('sales.field.taxNumber', $localeStore), value: matchedAddress?.tax_number },
            { label: t('sales.field.country', $localeStore), value: matchedAddress?.country },
            { label: t('sales.field.province', $localeStore), value: matchedAddress?.province },
            { label: t('sales.field.city', $localeStore), value: matchedAddress?.city },
            { label: t('sales.field.district', $localeStore), value: matchedAddress?.district },
            { label: t('sales.field.addressLine1', $localeStore), value: matchedAddress?.detail_address },
            { label: t('sales.field.addressLine2', $localeStore), value: matchedAddress?.detail_address2 },
            { label: t('sales.field.postalCode', $localeStore), value: matchedAddress?.postal_code },
            { label: t('sales.field.addressRemark', $localeStore), value: matchedAddress?.remark },
            { label: t('sales.field.paymentTerms', $localeStore), value: order.payment_terms },
        ];
    });

    const addressMetaItems = $derived.by(() => {
        const matchedAddress = matchedShippingAddress;
        if (!matchedAddress) return [];
        return [
            { label: t('sales.field.defaultAddress', $localeStore), value: matchedAddress.is_default ? t('sales.field.yes', $localeStore) : t('sales.field.no', $localeStore) },
            { label: t('sales.field.addressStatus', $localeStore), value: getAddressStatusText(matchedAddress.status) },
        ];
    });

    function getPaymentStatusText(status: string | undefined): string {
        if ($localeStore === 'en') {
            if (status === 'paid') return 'Paid';
            if (status === 'partial') return 'Partially Paid';
            return 'Unpaid';
        }

        if (status === 'paid') return '已收款';
        if (status === 'partial') return '部分收款';
        return '未收款';
    }

    function getPaymentStatusClass(status: string | undefined): string {
        if (status === 'paid') return 'bg-green-100 text-green-700';
        if (status === 'partial') return 'bg-amber-100 text-amber-700';
        return 'bg-gray-100 text-gray-700';
    }

    function handlePaymentAttachmentChange(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        paymentForm.attachment = target.files?.[0] ?? null;
    }

    async function createPaymentRecord() {
        if (!orderDetail.order || paymentSaving) return;

        paymentError = null;
        paymentSuccess = null;

        const amount = Number(paymentForm.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            paymentError = $localeStore === 'en' ? 'Please enter a valid received amount.' : '请输入有效的收款金额。';
            return;
        }

        paymentSaving = true;
        try {
            const payload: SalesOrderPaymentRecordCreateRequest = {
                sales_order: orderDetail.order.id,
                received_date: paymentForm.received_date,
                amount,
                currency: orderDetail.order.currency,
                payment_method: paymentForm.payment_method || undefined,
                reference_number: paymentForm.reference_number || undefined,
                attachment: paymentForm.attachment,
                notes: paymentForm.notes || undefined,
            };
            await salesOrderPaymentRecordAPI.create(payload);
            paymentSuccess = $localeStore === 'en' ? 'Payment record added.' : '收款记录已添加。';
            resetPaymentForm();
            await orderDetail.loadOrder();
        } catch (e: unknown) {
            paymentError = e instanceof Error ? e.message : ($localeStore === 'en' ? 'Failed to add payment record.' : '添加收款记录失败。');
        } finally {
            paymentSaving = false;
        }
    }

    async function deletePaymentRecord(recordId: number) {
        if (deletingPaymentId) return;

        deletingPaymentId = recordId;
        paymentError = null;
        paymentSuccess = null;
        try {
            await salesOrderPaymentRecordAPI.delete(recordId);
            paymentSuccess = $localeStore === 'en' ? 'Payment record deleted.' : '收款记录已删除。';
            await orderDetail.loadOrder();
        } catch (e: unknown) {
            paymentError = e instanceof Error ? e.message : ($localeStore === 'en' ? 'Failed to delete payment record.' : '删除收款记录失败。');
        } finally {
            deletingPaymentId = null;
        }
    }

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

    // 同步数量（只增不减）
    let syncLoading = $state(false);
    let syncResult = $state<{ message: string; updated_items: { sku: string; old_qty: string; new_qty: string }[] } | null>(null);
    let syncError = $state<string | null>(null);

    async function syncQuantities() {
        if (!orderId || syncLoading) return;
        syncResult = null;
        syncError = null;
        syncLoading = true;
        try {
            const result = await salesOrderAPI.syncQuantities(orderId);
            syncResult = result;
            if (result.updated_items.length > 0) {
                await orderDetail.loadOrder();
            }
        } catch (e: unknown) {
            syncError = e instanceof Error ? e.message : '同步失败，请重试';
        } finally {
            syncLoading = false;
        }
    }

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
            const result = await salesOrderAPI.syncQuantities(orderId, { sku: item.sku });
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

    async function downloadPI() {
        if (piDownloading || !orderDetail.order) return;
        piDownloading = true;
        try {
            await salesOrderAPI.downloadPI(orderDetail.order.id, $localeStore, orderDetail.order.order_number);
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
            await salesOrderAPI.downloadInvoice(orderDetail.order.id, $localeStore, orderDetail.order.order_number);
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
            await salesOrderAPI.downloadSkuReference(orderDetail.order.id, $localeStore, orderDetail.order.order_number);
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
        <div class="mb-4">
            {#key $localeStore}
            <OrderDetailHeader
                title={t('sales.detail.title', $localeStore)}
                orderNumber={order.order_number}
                status={order.status}
                statusMap={SALES_STATUS_MAP}
                transitions={orderDetail.order ? orderDetail.getAvailableTransitions() : []}
                                showMeta={false}
                updating={orderDetail.updating}
                canEdit={['draft', 'pending', 'confirmed', 'approved', 'partial'].includes(order.status)}
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
            <div class="flex flex-wrap items-center justify-end gap-2">
                <!-- 下载 PI 按钮 -->
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
                <!-- 下载 Invoice 按钮 -->
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
                <!-- 下载 SKU 对照表按钮 -->
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
                <LocaleSwitcher variant="button" />
            </div>
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
                { label: t('sales.field.orderNumber', $localeStore), value: order.order_number },
                { label: $localeStore === 'en' ? 'Status' : '状态', value: getSalesStatusText(order.status, $localeStore) },
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
            currency={order.currency || 'CNY'}
            items={[
                { label: t('sales.field.subtotal', $localeStore), value: order.subtotal },
                { label: t('sales.field.taxRate', $localeStore), value: `${order.tax_rate}%`, prefix: '' },
                { label: t('sales.field.taxAmount', $localeStore), value: order.tax_amount },
                { label: t('sales.field.shippingCost', $localeStore), value: order.shipping_cost },
                { label: t('sales.field.paymentFee', $localeStore), value: order.payment_fee },
                { label: t('sales.field.discount', $localeStore), value: order.discount, isNegative: true },
                { label: t('sales.field.adjustment', $localeStore), value: order.adjustment, isNegative: safeParseFloat(order.adjustment) < 0 },
                { label: t('sales.field.totalAmount', $localeStore), value: order.total_amount, isTotal: true },
            ]}
        />

        <!-- 订单明细 - 占据整行 -->
        {#key $localeStore}
        <OrderItemsTable 
            items={orderItems} 
            type="sales"
            currency={order.currency || 'CNY'}
            labels={{
                title: t('sales.items.title', $localeStore),
                itemName: t('sales.table.itemName', $localeStore),
                currentStock: $localeStore === 'en' ? 'Current Stock' : '现有库存',
                quantity: t('sales.table.quantity', $localeStore),
                shipped: $localeStore === 'en' ? 'In Shipment Sheet' : '已建发货单',
                pendingShip: $localeStore === 'en' ? 'Pending Shipment Sheet' : '待建发货单',
                unitPrice: t('sales.table.unitPrice', $localeStore),
                subtotal: t('sales.table.subtotal', $localeStore),
                status: t('sales.table.status', $localeStore),
                completed: t('sales.table.completed', $localeStore),
                partial: t('sales.table.partial', $localeStore),
                pending: t('sales.table.pending', $localeStore),
                noItems: t('sales.msg.noItems', $localeStore),
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
        {/key}

        <!-- 生成发货单按钮 -->
        {#if ['confirmed', 'partial'].includes(order.status)}
            <div class="my-6">
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

        <!-- 关联发货单 - 单独一行 -->
        {#if order.shipments && order.shipments.length > 0}
            <div class="bg-white rounded-lg p-6 shadow mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">
                        {t('sales.shipment.title', $localeStore)} ({order.shipments.length})
                    </h3>
                    <button
                        type="button"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onclick={syncQuantities}
                        disabled={syncLoading}
                        title="根据发货单明细汇总数量，向上对齐订单行的订购数量（只增不减）"
                    >
                        {#if syncLoading}
                            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            同步中...
                        {:else}
                            🔄 同步订单数量
                        {/if}
                    </button>
                </div>

                <!-- 同步结果反馈 -->
                {#if syncError}
                    <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        ⚠️ {syncError}
                    </div>
                {/if}
                {#if syncResult}
                    <div class="mb-4 p-3 rounded-lg text-sm {syncResult.updated_items.length > 0 ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-gray-50 border border-gray-200 text-gray-600'}">
                        ✅ {syncResult.message}
                        {#if syncResult.updated_items.length > 0}
                            <ul class="mt-2 space-y-1">
                                {#each syncResult.updated_items as item}
                                    <li class="ml-4">SKU: <span class="font-mono font-medium">{item.sku}</span> — {item.old_qty} → <span class="font-semibold">{item.new_qty}</span></li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                {/if}

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each order.shipments as shipment}
                        <a 
                            href="/customer/shipment/{shipment.id}" 
                            class="block border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 cursor-pointer transition-all"
                        >
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium text-gray-900">
                                    {shipment.shipment_no}
                                </span>
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getShipmentStatusClass(shipment.status)}">
                                    {getShipmentStatusText(shipment.status, $localeStore)}
                                </span>
                            </div>
                            <div class="flex flex-col gap-1 text-sm text-gray-600">
                                <span>{t('sales.shipment.packageCount', $localeStore)}: {shipment.total_packages}</span>
                                <span>{new Date(shipment.created_at).toLocaleString($localeStore === 'zh' ? 'zh-CN' : 'en-US')}</span>
                            </div>
                        </a>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- 收款信息 -->
        <div class="bg-white rounded-lg p-6 shadow mb-6">
            <div class="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">{$localeStore === 'en' ? 'Payment Receipts' : '收款信息'}</h3>
                    <p class="text-sm text-gray-500">{$localeStore === 'en' ? 'Track receipt status and upload evidence for each payment.' : '记录每笔收款，并上传文档或图片作为佐证。'}</p>
                </div>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getPaymentStatusClass(order.payment_status)}">
                    {getPaymentStatusText(order.payment_status)}
                </span>
            </div>

            {#if paymentError}
                <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {paymentError}</div>
            {/if}
            {#if paymentSuccess}
                <div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✅ {paymentSuccess}</div>
            {/if}

            <div class="grid grid-cols-1 gap-4 mb-4 md:grid-cols-4">
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div class="text-xs text-gray-500 mb-1">{$localeStore === 'en' ? 'Receipt Status' : '收款状态'}</div>
                    <div class="text-base font-semibold text-gray-900">{getPaymentStatusText(order.payment_status)}</div>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div class="text-xs text-gray-500 mb-1">{$localeStore === 'en' ? 'Received Amount' : '已收金额'}</div>
                    <div class="text-base font-semibold text-gray-900">{order.currency || 'CNY'} {safeParseFloat(order.received_amount || '0').toFixed(2)}</div>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div class="text-xs text-gray-500 mb-1">{$localeStore === 'en' ? 'Balance Due' : '未收金额'}</div>
                    <div class="text-base font-semibold text-gray-900">{order.currency || 'CNY'} {safeParseFloat(order.balance_due || order.total_amount || '0').toFixed(2)}</div>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div class="text-xs text-gray-500 mb-1">{$localeStore === 'en' ? 'Progress' : '收款进度'}</div>
                    <div class="text-base font-semibold text-gray-900">{Math.round(order.payment_progress_percentage || 0)}%</div>
                </div>
            </div>

            <div class="mb-6">
                <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                        class="h-full rounded-full bg-green-500 transition-all"
                        style={`width: ${Math.min(order.payment_progress_percentage || 0, 100)}%`}
                    ></div>
                </div>
            </div>

            <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-date">{$localeStore === 'en' ? 'Receipt Date' : '收款日期'}</label>
                        <input id="payment-date" type="date" bind:value={paymentForm.received_date} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-amount">{$localeStore === 'en' ? 'Amount' : '收款金额'}</label>
                        <input id="payment-amount" type="number" min="0" step="0.01" bind:value={paymentForm.amount} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="0.00" />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-method">{$localeStore === 'en' ? 'Method' : '收款方式'}</label>
                        <input id="payment-method" type="text" bind:value={paymentForm.payment_method} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder={$localeStore === 'en' ? 'Bank / Cash / PayPal' : '银行 / 现金 / PayPal'} />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-reference">{$localeStore === 'en' ? 'Reference No.' : '流水号/凭证号'}</label>
                        <input id="payment-reference" type="text" bind:value={paymentForm.reference_number} class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="REF-001" />
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-[2fr_1fr]">
                    <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-notes">{$localeStore === 'en' ? 'Notes' : '备注'}</label>
                        <textarea id="payment-notes" bind:value={paymentForm.notes} rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder={$localeStore === 'en' ? 'Optional notes for this payment record' : '可填写本次收款的补充说明'}></textarea>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700" for="payment-attachment">{$localeStore === 'en' ? 'Evidence File' : '佐证文件'}</label>
                        <input id="payment-attachment" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700 hover:file:bg-blue-100" onchange={handlePaymentAttachmentChange} />
                        <p class="mt-2 text-xs text-gray-500">{$localeStore === 'en' ? 'One file per record. Images and common office documents are supported.' : '每条记录支持上传一个文件，图片和常见办公文档均可。'}</p>
                        {#if paymentForm.attachment}
                            <p class="mt-2 text-xs text-gray-700">📎 {paymentForm.attachment.name}</p>
                        {/if}
                    </div>
                </div>

                <div class="mt-4 flex justify-end">
                    <button
                        type="button"
                        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onclick={createPaymentRecord}
                        disabled={paymentSaving}
                    >
                        {#if paymentSaving}
                            {$localeStore === 'en' ? 'Saving...' : '保存中...'}
                        {:else}
                            {$localeStore === 'en' ? 'Add Payment Record' : '添加收款记录'}
                        {/if}
                    </button>
                </div>
            </div>

            <div class="space-y-4">
                {#if order.payment_records && order.payment_records.length > 0}
                    {#each order.payment_records as record}
                        <div class="rounded-xl border border-gray-200 p-4">
                            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div class="space-y-2">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="text-sm font-semibold text-gray-900">{record.received_date}</span>
                                        <span class="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">{record.currency} {safeParseFloat(record.amount).toFixed(2)}</span>
                                        {#if record.payment_method}
                                            <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">{record.payment_method}</span>
                                        {/if}
                                        {#if record.reference_number}
                                            <span class="text-xs text-gray-500">{$localeStore === 'en' ? 'Ref:' : '凭证号：'} {record.reference_number}</span>
                                        {/if}
                                    </div>
                                    {#if record.notes}
                                        <p class="text-sm text-gray-600 whitespace-pre-wrap">{record.notes}</p>
                                    {/if}
                                    {#if record.attachment_url}
                                        <div class="space-y-2">
                                            <a href={record.attachment_url} target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                                📎 {record.attachment_name || ($localeStore === 'en' ? 'Open attachment' : '查看附件')}
                                            </a>
                                            {#if record.attachment_is_image}
                                                <img src={record.attachment_url} alt={record.attachment_name || 'attachment'} class="max-h-40 rounded-lg border border-gray-200 object-contain" />
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                <button
                                    type="button"
                                    class="self-start rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    onclick={() => deletePaymentRecord(record.id)}
                                    disabled={deletingPaymentId === record.id}
                                >
                                    {#if deletingPaymentId === record.id}
                                        {$localeStore === 'en' ? 'Deleting...' : '删除中...'}
                                    {:else}
                                        {$localeStore === 'en' ? 'Delete' : '删除'}
                                    {/if}
                                </button>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                        {$localeStore === 'en' ? 'No payment records yet.' : '暂未添加收款记录。'}
                    </div>
                {/if}
            </div>
        </div>

        <!-- 收货信息 -->
        <OrderInfoGrid
            title={t('sales.shipping.title', $localeStore)}
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
                {$localeStore === 'en' ? 'This order keeps a shipping snapshot, so some structured address fields could not be matched from the customer address book.' : '该订单保存的是收货快照，部分结构化地址字段未能从客户地址簿中匹配。'}
            </p>
        {/if}
        {/key}

        <!-- 订单明细 - 占据整行 -->
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

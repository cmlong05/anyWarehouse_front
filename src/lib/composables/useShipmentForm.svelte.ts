/**
 * 发货单表单共享逻辑
 */
import { shipmentAPI, salesOrderAPI, customerAPI } from '$lib/api';
import type { CustomerAddress, SalesOrderBrief, SalesOrderItem } from '$lib/index';
import type { Shipment, ShipmentStatus, ShipmentCreateRequest } from '$lib/shipmentTypes';
import { safeParseFloat } from '$lib/utils';
import { getErrorMessage } from '$lib/utils/errors';

export interface ShipmentPlanItem {
    id: string;
    orderItemId: number;
    sku: string;
    itemName: string;
    quantityOrdered: number;
    quantityShipped: number;
    quantityPrepared: number;
    quantityPendingReal: number;
    quantityPlan: number;
    currentStock?: number | null;
}

export interface UseShipmentFormOptions {
    mode: 'create' | 'edit';
    shipmentId?: number;
    initialOrderId?: number;
    onSuccess?: (shipment: Shipment) => void;
}

export function useShipmentForm(options: UseShipmentFormOptions) {
    // 表单数据
    let shipmentNo = $state('');
    let status = $state<ShipmentStatus>('draft');
    let shippingAddress = $state('');
    let contactPerson = $state('');
    let contactPhone = $state('');
    let notes = $state('');
    let companyName = $state('');
    let paymentTerms = $state('');
    let email = $state('');
    let mobile = $state('');
    let taxNumber = $state('');
    let country = $state('');
    let province = $state('');
    let city = $state('');
    let district = $state('');
    let postalCode = $state('');
    let detailAddress2 = $state('');
    let remark = $state('');
    let customerAddresses = $state<CustomerAddress[]>([]);
    let shippingAddressesLoading = $state(false);
    let selectedOrderId = $state<number | null>(null);
    let orderLocked = $state(false);

    // 计划明细
    let planItems = $state<ShipmentPlanItem[]>([]);

    // 可选数据
    let availableOrderItems = $state<SalesOrderItem[]>([]);
    let availableOrders = $state<SalesOrderBrief[]>([]);

    // 状态
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    let success = $state('');

    // 计算属性
    const totalPlanned = $derived(planItems.reduce((sum, item) => sum + item.quantityPlan, 0));
    const totalPending = $derived(availableOrderItems.reduce((sum, item) => sum + (item.quantity_pending_real || 0), 0));
    const totalPrepared = $derived(availableOrderItems.reduce((sum, item) => sum + (item.quantity_prepared || 0), 0));
    const displayableOrderItems = $derived(availableOrderItems.filter(item => !planItems.some(p => p.orderItemId === item.id)));

    async function init() {
        try {
            await loadOrders();

            orderLocked = options.mode === 'create' && options.initialOrderId != null;
            if (options.mode === 'edit' && options.shipmentId) {
                await loadShipment(options.shipmentId);
            } else {
                shipmentNo = generateShipmentNo();
                status = 'draft';
                if (options.initialOrderId) {
                    selectedOrderId = options.initialOrderId;
                    await onOrderSelect(options.initialOrderId);
                }
            }
        } catch (err) {
            error = getErrorMessage(err, '加载数据失败');
        } finally {
            loading = false;
        }
    }

    async function loadOrders() {
        try {
            const [confirmedRes, partialRes] = await Promise.all([
                salesOrderAPI.listBrief({ status: 'confirmed', ordering: 'priority' }),
                salesOrderAPI.listBrief({ status: 'partial', ordering: 'priority' }),
            ]);
            availableOrders = [...confirmedRes.results, ...partialRes.results];
        } catch (err) {
            error = getErrorMessage(err, '加载订单失败');
        }
    }

    async function loadShipment(id: number) {
        const shipment = await shipmentAPI.get(id);
        
        shipmentNo = shipment.shipment_no;
        status = shipment.status;
        shippingAddress = shipment.shipping_address || '';
        contactPerson = shipment.contact_person || '';
        contactPhone = shipment.contact_phone || '';
        notes = shipment.notes || '';
        selectedOrderId = shipment.order || null;
        
        if (selectedOrderId) {
            await loadOrderItems(selectedOrderId);
            
            if (shipment.items?.length) {
                planItems = shipment.items.map(item => {
                    const orderItem = availableOrderItems.find(oi => oi.sku === item.sku);
                    const qty = safeParseFloat(item.quantity);
                    const qtyShipped = safeParseFloat(item.quantity_shipped);
                    const editableQty = qty - qtyShipped;  // 不再需要 quantity_packed
                    
                    return {
                        id: `plan_${item.id}_${Date.now()}`,
                        orderItemId: orderItem?.id || 0,
                        sku: item.sku,
                        itemName: item.product_name,
                        quantityOrdered: Math.round(safeParseFloat(orderItem?.quantity, qty)),
                        quantityShipped: Math.round(qtyShipped),
                        quantityPrepared: Math.round(safeParseFloat(orderItem?.quantity_prepared)),
                        quantityPendingReal: Math.round(editableQty > 0 ? editableQty : 0),
                        quantityPlan: Math.round(editableQty > 0 ? editableQty : 0),
                        currentStock: orderItem?.item_detail?.total_storage ?? null,
                    };
                });

            }
        }
    }

    function getDefaultPlanQuantity(pendingReal: number, currentStock: number | null | undefined): number {
        if (currentStock == null) {
            return pendingReal;
        }
        return Math.min(pendingReal, Math.max(0, Math.round(currentStock)));
    }

    function normalizeAddressValue(value: string | null | undefined): string {
        return (value || '').trim().replace(/\s+/g, ' ');
    }

    function formatShippingAddress(address: string | null | undefined): string;
    function formatShippingAddress(address: CustomerAddress): string;
    function formatShippingAddress(address: string | CustomerAddress | null | undefined): string {
        if (!address) return '';
        if (typeof address === 'string') {
            return normalizeAddressValue(address);
        }

        return normalizeAddressValue([
            address.country,
            address.province,
            address.city,
            address.district,
            address.detail_address,
            address.detail_address2,
        ].filter(Boolean).join(' '));
    }

    function findMatchingShippingAddress(order: { shipping_address?: string; contact_person?: string; contact_phone?: string } | null, addresses: CustomerAddress[]): CustomerAddress | null {
        if (!order || addresses.length === 0) return null;

        const normalizedOrderAddress = normalizeAddressValue(order.shipping_address);
        const normalizedContactPerson = normalizeAddressValue(order.contact_person);
        const normalizedContactPhone = normalizeAddressValue(order.contact_phone);

        return (
            addresses.find((address) =>
                formatShippingAddress(address) === normalizedOrderAddress &&
                normalizeAddressValue(address.contact_name) === normalizedContactPerson &&
                normalizeAddressValue(address.phone) === normalizedContactPhone
            ) ||
            addresses.find((address) =>
                formatShippingAddress(address) === normalizedOrderAddress &&
                normalizeAddressValue(address.contact_name) === normalizedContactPerson
            ) ||
            addresses.find((address) => formatShippingAddress(address) === normalizedOrderAddress) ||
            null
        );
    }

    async function loadCustomerAddresses(customerId: number) {
        shippingAddressesLoading = true;
        try {
            customerAddresses = await customerAPI.getAddresses(customerId);
        } catch (err) {
            customerAddresses = [];
        } finally {
            shippingAddressesLoading = false;
        }
    }

    async function loadOrderItems(orderId: number) {
        const orderDetail = await salesOrderAPI.get(orderId);

        if (!shippingAddress) shippingAddress = orderDetail.shipping_address || '';
        if (!contactPerson) contactPerson = orderDetail.contact_person || '';
        if (!contactPhone) contactPhone = orderDetail.contact_phone || '';
        companyName = orderDetail.company_name || companyName;
        paymentTerms = orderDetail.payment_terms || paymentTerms;

        if (orderDetail.customer) {
            await loadCustomerAddresses(orderDetail.customer);
        } else {
            customerAddresses = [];
        }

        const matchedAddress = findMatchingShippingAddress(orderDetail, customerAddresses);
        if (matchedAddress) {
            email = matchedAddress.email || '';
            mobile = matchedAddress.mobile || '';
            taxNumber = matchedAddress.tax_number || '';
            country = matchedAddress.country || '';
            province = matchedAddress.province || '';
            city = matchedAddress.city || '';
            district = matchedAddress.district || '';
            postalCode = matchedAddress.postal_code || '';
            detailAddress2 = matchedAddress.detail_address2 || '';
            remark = matchedAddress.remark || '';
            companyName = matchedAddress.company || companyName;
        } else {
            email = '';
            mobile = '';
            taxNumber = '';
            country = '';
            province = '';
            city = '';
            district = '';
            postalCode = '';
            detailAddress2 = '';
            remark = '';
        }

        availableOrderItems = orderDetail.items.map(item => ({
            ...item,
            quantity_pending_real: safeParseFloat(item.quantity_pending_real),
            quantity_prepared: safeParseFloat(item.quantity_prepared),
        }));
    }

    async function onOrderSelect(orderId: number) {
        const order = availableOrders.find(o => o.id === orderId);
        if (!order) return;

        planItems = [];
        await loadOrderItems(orderId);
    }

    function generateShipmentNo(): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `SH${dateStr}${randomStr}`;
    }

    function addItemToPlan(orderItem: SalesOrderItem) {
        const alreadyAdded = planItems.some(p => p.orderItemId === orderItem.id);
        if (alreadyAdded) return;

        const pendingReal = orderItem.quantity_pending_real || 0;
        const currentStock = orderItem.item_detail?.total_storage ?? null;
        const defaultPlanQty = getDefaultPlanQuantity(Math.round(pendingReal), currentStock);
        
        const planItem: ShipmentPlanItem = {
            id: `plan_${orderItem.id}_${Date.now()}`,
            orderItemId: orderItem.id,
            sku: orderItem.sku,
            itemName: orderItem.item_name,
            quantityOrdered: Math.round(safeParseFloat(orderItem.quantity)),
            quantityShipped: Math.round(safeParseFloat(orderItem.quantity_shipped)),
            quantityPrepared: Math.round(orderItem.quantity_prepared || 0),
            quantityPendingReal: Math.round(pendingReal),
            quantityPlan: defaultPlanQty,
            currentStock,
        };

        planItems = [...planItems, planItem];
    }

    function addAllToPlan() {
        const newItems = displayableOrderItems
            .filter(orderItem => !planItems.some(p => p.orderItemId === orderItem.id))
            .map(orderItem => {
                const pendingReal = orderItem.quantity_pending_real || 0;
                const currentStock = orderItem.item_detail?.total_storage ?? null;
                const defaultPlanQty = getDefaultPlanQuantity(Math.round(pendingReal), currentStock);

                return {
                    id: `plan_${orderItem.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    orderItemId: orderItem.id,
                    sku: orderItem.sku,
                    itemName: orderItem.item_name,
                    quantityOrdered: Math.round(safeParseFloat(orderItem.quantity)),
                    quantityShipped: Math.round(safeParseFloat(orderItem.quantity_shipped)),
                    quantityPrepared: Math.round(orderItem.quantity_prepared || 0),
                    quantityPendingReal: Math.round(pendingReal),
                    quantityPlan: defaultPlanQty,
                    currentStock,
                };
            });
        
        planItems = [...planItems, ...newItems];
    }

    function removePlanItem(id: string) {
        planItems = planItems.filter(item => item.id !== id);
    }

    function clearAllPlan() {
        planItems = [];
    }

    function fillAllPending() {
        planItems = planItems.map(item => ({
            ...item,
            quantityPlan: getDefaultPlanQuantity(item.quantityPendingReal, item.currentStock ?? null)
        }));
    }

    async function handleSubmit() {
        if (!shipmentNo.trim()) {
            error = '请输入发货批次号';
            return;
        }
        if (!selectedOrderId) {
            error = options.mode === 'create' ? '请选择一个订单' : '缺少关联订单';
            return;
        }

        saving = true;
        error = '';

        try {
            const items = planItems
                .filter(item => item.quantityPlan > 0)
                .map(item => ({
                    order: selectedOrderId!,
                    sku: item.sku,
                    quantity: item.quantityPlan,
                    product_name: item.itemName
                }));

            if (options.mode === 'create') {
                const shipment = await shipmentAPI.create({
                    shipment_no: shipmentNo,
                    order_id: selectedOrderId,
                    shipping_address: shippingAddress,
                    contact_person: contactPerson,
                    contact_phone: contactPhone,
                    notes: notes,
                    items: items,
                    packages: []
                } as ShipmentCreateRequest);
                success = '发货单创建成功';
                options.onSuccess?.(shipment);
            } else {
                const data: Partial<ShipmentCreateRequest> = {
                    shipping_address: shippingAddress,
                    contact_person: contactPerson,
                    contact_phone: contactPhone,
                    notes: notes,
                };
                if (items.length > 0) {
                    data.items = items;
                }
                
                const shipment = await shipmentAPI.patch(options.shipmentId!, data);
                success = '发货单更新成功';
                options.onSuccess?.(shipment);
            }
        } catch (err) {
            error = getErrorMessage(err, options.mode === 'create' ? '创建失败' : '更新失败');
        } finally {
            saving = false;
        }
    }

    return {
        // 状态
        get shipmentNo() { return shipmentNo; },
        set shipmentNo(value) { shipmentNo = value; },
        get status() { return status; },
        set status(value) { status = value; },
        get shippingAddress() { return shippingAddress; },
        set shippingAddress(value) { shippingAddress = value; },
        get contactPerson() { return contactPerson; },
        set contactPerson(value) { contactPerson = value; },
        get contactPhone() { return contactPhone; },
        set contactPhone(value) { contactPhone = value; },
        get companyName() { return companyName; },
        set companyName(value) { companyName = value; },
        get paymentTerms() { return paymentTerms; },
        set paymentTerms(value) { paymentTerms = value; },
        get email() { return email; },
        set email(value) { email = value; },
        get mobile() { return mobile; },
        set mobile(value) { mobile = value; },
        get taxNumber() { return taxNumber; },
        set taxNumber(value) { taxNumber = value; },
        get country() { return country; },
        set country(value) { country = value; },
        get province() { return province; },
        set province(value) { province = value; },
        get city() { return city; },
        set city(value) { city = value; },
        get district() { return district; },
        set district(value) { district = value; },
        get postalCode() { return postalCode; },
        set postalCode(value) { postalCode = value; },
        get detailAddress2() { return detailAddress2; },
        set detailAddress2(value) { detailAddress2 = value; },
        get remark() { return remark; },
        set remark(value) { remark = value; },
        get customerAddresses() { return customerAddresses; },
        get shippingAddressesLoading() { return shippingAddressesLoading; },
        get notes() { return notes; },
        set notes(value) { notes = value; },
        get selectedOrderId() { return selectedOrderId; },
        set selectedOrderId(value) { selectedOrderId = value; },
        get orderLocked() { return orderLocked; },
        get planItems() { return planItems; },
        get availableOrderItems() { return availableOrderItems; },
        get availableOrders() { return availableOrders; },
        get loading() { return loading; },
        get saving() { return saving; },
        get error() { return error; },
        set error(value) { error = value; },
        get success() { return success; },
        set success(value) { success = value; },
        get totalPlanned() { return totalPlanned; },
        get totalPending() { return totalPending; },
        get totalPrepared() { return totalPrepared; },
        get displayableOrderItems() { return displayableOrderItems; },
        get mode() { return options.mode; },
        
        // 方法
        init,
        onOrderSelect,
        addItemToPlan,
        addAllToPlan,
        removePlanItem,
        clearAllPlan,
        fillAllPending,
        handleSubmit,
    };
}

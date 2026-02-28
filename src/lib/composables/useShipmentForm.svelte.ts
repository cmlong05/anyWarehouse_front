/**
 * 发货单表单共享逻辑
 */
import { shipmentAPI } from '$lib/api';
import { salesOrderAPI } from '$lib/api';
import type { SalesOrderBrief, SalesOrderItem } from '$lib/index';
import type { Shipment, ShipmentStatus, ShipmentCreateRequest } from '$lib/shipmentTypes';
import { safeParseFloat } from '$lib/utils';

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
    let selectedOrderId = $state<number | null>(null);

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
        } catch (err: any) {
            error = err.message || '加载数据失败';
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
        } catch (err: any) {
            error = err.message || '加载订单失败';
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
                    const qtyPacked = safeParseFloat(item.quantity_packed);
                    const editableQty = qty - qtyShipped - qtyPacked;
                    
                    return {
                        id: `plan_${item.id}_${Date.now()}`,
                        orderItemId: orderItem?.id || 0,
                        sku: item.sku,
                        itemName: item.product_name,
                        quantityOrdered: Math.round(safeParseFloat(orderItem?.quantity, qty)),
                        quantityShipped: Math.round(qtyShipped),
                        quantityPrepared: Math.round(safeParseFloat(orderItem?.quantity_prepared)),
                        quantityPendingReal: Math.round(editableQty > 0 ? editableQty : 0),
                        quantityPlan: Math.round(editableQty > 0 ? editableQty : 0)
                    };
                });

            }
        }
    }

    async function loadOrderItems(orderId: number) {
        const orderDetail = await salesOrderAPI.get(orderId);
        
        if (!shippingAddress) shippingAddress = orderDetail.shipping_address || '';
        if (!contactPerson) contactPerson = orderDetail.contact_person || '';
        if (!contactPhone) contactPhone = orderDetail.contact_phone || '';

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
        
        const planItem: ShipmentPlanItem = {
            id: `plan_${orderItem.id}_${Date.now()}`,
            orderItemId: orderItem.id,
            sku: orderItem.sku,
            itemName: orderItem.item_name,
            quantityOrdered: Math.round(safeParseFloat(orderItem.quantity)),
            quantityShipped: Math.round(safeParseFloat(orderItem.quantity_shipped)),
            quantityPrepared: Math.round(orderItem.quantity_prepared || 0),
            quantityPendingReal: Math.round(pendingReal),
            quantityPlan: Math.round(pendingReal)
        };

        planItems = [...planItems, planItem];
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
            quantityPlan: item.quantityPendingReal
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
                const data: any = {
                    shipment_no: shipmentNo,
                    shipping_address: shippingAddress,
                    contact_person: contactPerson,
                    contact_phone: contactPhone,
                    notes: notes,
                };
                if (items.length > 0) {
                    data.items = items;
                }
                
                const shipment = await shipmentAPI.update(options.shipmentId!, data);
                success = '发货单更新成功';
                options.onSuccess?.(shipment);
            }
        } catch (err: any) {
            error = err.message || (options.mode === 'create' ? '创建失败' : '更新失败');
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
        get notes() { return notes; },
        set notes(value) { notes = value; },
        get selectedOrderId() { return selectedOrderId; },
        set selectedOrderId(value) { selectedOrderId = value; },
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
        removePlanItem,
        clearAllPlan,
        fillAllPending,
        handleSubmit,
    };
}

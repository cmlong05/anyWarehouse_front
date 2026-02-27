<script lang="ts">
    import { onMount } from 'svelte';
    import { shipmentAPI } from '$lib/shipmentApi';
    import { salesOrderAPI } from '$lib/api';
    import type { SalesOrderBrief, SalesOrderItem } from '$lib/index';
    import type { Shipment, ShipmentStatus } from '$lib/shipmentTypes';
    import { SHIPMENT_STATUS_CHOICES } from '$lib/shipmentTypes';
    import { safeParseFloat } from '$lib/utils';
    import Alert from './Alert.svelte';
    import Loading from './Loading.svelte';

    // Props
    interface Props {
        mode: 'create' | 'edit';
        shipmentId?: number;
        initialOrderId?: number;
        onSuccess?: (shipment: Shipment) => void;
        onCancel?: () => void;
    }
    let { mode, shipmentId, initialOrderId, onSuccess, onCancel }: Props = $props();

    // 表单数据
    let shipmentNo = $state('');
    let status = $state<ShipmentStatus>('draft');
    let shippingAddress = $state('');
    let contactPerson = $state('');
    let contactPhone = $state('');
    let notes = $state('');
    let selectedOrderId = $state<number | null>(null);

    // 已选择的计划明细（右侧预览列表）
    interface ShipmentPlanItem {
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
    let planItems = $state<ShipmentPlanItem[]>([]);
    
    // 编辑模式：保存原始明细ID用于对比
    let originalItemIds = $state<Set<number>>(new Set());

    // 可选的订单明细（左侧列表）
    let availableOrderItems = $state<SalesOrderItem[]>([]);

    // 选项数据
    let availableOrders = $state<SalesOrderBrief[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    let success = $state('');

    onMount(async () => {
        try {
            await loadOrders();
            
            if (mode === 'edit' && shipmentId) {
                await loadShipment(shipmentId);
            } else {
                // 新建模式
                shipmentNo = generateShipmentNo();
                status = 'draft';
                if (initialOrderId) {
                    selectedOrderId = initialOrderId;
                    await onOrderSelect(initialOrderId);
                }
            }
        } catch (err: any) {
            error = err.message || '加载数据失败';
            console.error('Load error:', err);
        } finally {
            loading = false;
        }
    });

    async function loadOrders() {
        try {
            const [confirmedRes, partialRes] = await Promise.all([
                salesOrderAPI.list({ status: 'confirmed', ordering: 'priority' }),
                salesOrderAPI.list({ status: 'partial', ordering: 'priority' }),
            ]);
            availableOrders = [...confirmedRes.results, ...partialRes.results];
        } catch (err: any) {
            error = err.message || '加载订单失败';
            console.error('Load orders error:', err);
        }
    }

    async function loadShipment(id: number) {
        try {
            const shipment = await shipmentAPI.get(id);
            
            // 填充表单数据
            shipmentNo = shipment.shipment_no;
            status = shipment.status;
            shippingAddress = shipment.shipping_address || '';
            contactPerson = shipment.contact_person || '';
            contactPhone = shipment.contact_phone || '';
            notes = shipment.notes || '';
            selectedOrderId = shipment.order || null;
            
            // 加载订单明细
            if (selectedOrderId) {
                await loadOrderItems(selectedOrderId);
                
                // 加载现有明细到计划列表
                if (shipment.items && shipment.items.length > 0) {
                    planItems = shipment.items.map(item => {
                        const orderItem = availableOrderItems.find(oi => oi.sku === item.sku);
                        const qty = safeParseFloat(item.quantity);
                        const qtyShipped = safeParseFloat(item.quantity_shipped);
                        const qtyPacked = safeParseFloat(item.quantity_packed);
                        // 可编辑数量 = 总计划数 - 已发货 - 已打包
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
                    
                    originalItemIds = new Set(shipment.items.map(item => item.id));
                }
            }
        } catch (err: any) {
            error = err.message || '加载发货单失败';
            console.error('Load shipment error:', err);
        }
    }

    async function loadOrderItems(orderId: number) {
        try {
            const orderDetail = await salesOrderAPI.get(orderId);
            
            // 自动填充收货信息（如果为空）
            if (!shippingAddress) shippingAddress = orderDetail.shipping_address || '';
            if (!contactPerson) contactPerson = orderDetail.contact_person || '';
            if (!contactPhone) contactPhone = orderDetail.contact_phone || '';

            // 处理订单明细数据
            availableOrderItems = orderDetail.items.map(item => ({
                ...item,
                quantity_pending_real: safeParseFloat(item.quantity_pending_real),
                quantity_prepared: safeParseFloat(item.quantity_prepared),
            }));
        } catch (err: any) {
            error = '加载订单详情失败';
            console.error(err);
        }
    }

    async function onOrderSelect(orderId: number) {
        const order = availableOrders.find(o => o.id === orderId);
        if (!order) return;

        // 清空已选择的计划明细
        planItems = [];
        await loadOrderItems(orderId);
    }

    function generateShipmentNo(): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `SH${dateStr}${randomStr}`;
    }

    // 添加商品到计划列表
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

    // 从计划列表移除商品
    function removePlanItem(id: string) {
        planItems = planItems.filter(item => item.id !== id);
    }

    // 清空所有计划
    function clearAllPlan() {
        planItems = [];
    }

    // 一键填充所有待发数量
    function fillAllPending() {
        planItems = planItems.map(item => ({
            ...item,
            quantityPlan: item.quantityPendingReal
        }));
    }

    // 计算统计
    const totalPlanned = $derived(
        planItems.reduce((sum, item) => sum + item.quantityPlan, 0)
    );
    const totalPending = $derived(
        availableOrderItems.reduce((sum, item) => sum + (item.quantity_pending_real || 0), 0)
    );
    const totalPrepared = $derived(
        availableOrderItems.reduce((sum, item) => sum + (item.quantity_prepared || 0), 0)
    );

    // 获取可显示的订单明细（过滤掉已添加的）
    const displayableOrderItems = $derived(
        availableOrderItems.filter(item => !planItems.some(p => p.orderItemId === item.id))
    );

    async function handleSubmit() {
        // 前置验证
        if (!shipmentNo.trim()) {
            error = '请输入发货批次号';
            return;
        }
        if (!selectedOrderId) {
            error = mode === 'create' ? '请选择一个订单' : '缺少关联订单';
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

            if (mode === 'create') {
                const shipment = await shipmentAPI.create({
                    shipment_no: shipmentNo,
                    order_id: selectedOrderId,
                    shipping_address: shippingAddress,
                    contact_person: contactPerson,
                    contact_phone: contactPhone,
                    notes: notes,
                    items: items,
                    packages: []
                });
                success = '发货单创建成功';
                onSuccess?.(shipment);
            } else {
                // 编辑模式
                const data: any = {
                    shipment_no: shipmentNo,
                    shipping_address: shippingAddress,
                    contact_person: contactPerson,
                    contact_phone: contactPhone,
                    notes: notes,
                };
                // 如果有明细变更，添加到更新数据
                if (items.length > 0) {
                    data.items = items;
                }
                
                const shipment = await shipmentAPI.update(shipmentId!, data);
                success = '发货单更新成功';
                onSuccess?.(shipment);
            }
        } catch (err: any) {
            error = err.message || (mode === 'create' ? '创建失败' : '更新失败');
            console.error('Submit error:', err);
        } finally {
            saving = false;
        }
    }
</script>

{#if loading}
    <Loading />
{:else}
    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
        {#if error}
            <Alert error={{ message: error }} onDismiss={() => error = ''} />
        {/if}
        {#if success}
            <Alert error={{ message: success }} variant="info" onDismiss={() => success = ''} />
        {/if}

        <!-- 基本信息 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label" for="shipmentNo">
                    <span class="label-text font-bold">📦 发货批次号 <span class="text-error">*</span></span>
                </label>
                <input 
                    id="shipmentNo"
                    type="text" 
                    class="input input-bordered" 
                    bind:value={shipmentNo}
                    placeholder="输入发货批次号"
                    disabled={mode === 'edit'}
                />
            </div>

            {#if mode === 'edit'}
                <div class="form-control">
                    <label class="label" for="status">
                        <span class="label-text font-bold">状态</span>
                    </label>
                    <select id="status" class="select select-bordered" bind:value={status} disabled>
                        {#each SHIPMENT_STATUS_CHOICES as choice}
                            <option value={choice.value}>{choice.label}</option>
                        {/each}
                    </select>
                    <span class="label-text-alt text-gray-500 mt-1">状态变更请使用操作按钮</span>
                </div>
            {/if}

            <div class="form-control {mode === 'edit' ? 'md:col-span-2' : ''}">
                <label class="label" for="orderSelect">
                    <span class="label-text font-bold">📋 关联订单 <span class="text-error">*</span></span>
                </label>
                <select 
                    id="orderSelect"
                    class="select select-bordered" 
                    bind:value={selectedOrderId}
                    onchange={() => selectedOrderId && onOrderSelect(selectedOrderId)}
                    disabled={mode === 'edit'}
                >
                    <option value={null}>请选择订单</option>
                    {#each availableOrders as order}
                        <option value={order.id}>
                            {order.order_number} - {order.customer_name} ({order.total_quantity}件)
                        </option>
                    {/each}
                </select>
                {#if mode === 'edit'}
                    <span class="label-text-alt text-gray-500 mt-1">编辑模式不可更改关联订单</span>
                {/if}
            </div>
        </div>

        {#if selectedOrderId}
            <!-- 双栏布局 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 左侧：可选的订单明细 -->
                <div class="p-4">
                    <h3 class="font-bold mb-3 flex items-center justify-between">
                        <span>📋 订单明细</span>
                        <span class="text-xs text-gray-500 font-normal">
                            待发: {totalPending.toFixed(0)}
                            {#if totalPrepared > 0}
                                <span class="text-warning ml-1">(已预备: {totalPrepared.toFixed(0)})</span>
                            {/if}
                        </span>
                    </h3>
                    
                    {#if displayableOrderItems.length > 0}
                        <table class="w-full text-sm" style="border: none; border-collapse: collapse;">
                            <thead>
                                <tr style="border: none;">
                                    <th style="border: none;" class="px-2 py-2 text-left">SKU</th>
                                    <th style="border: none;" class="px-2 py-2 text-left">商品名称</th>
                                    <th style="border: none;" class="px-2 py-2 text-right w-16">订购</th>
                                    <th style="border: none;" class="px-2 py-2 text-right w-16">已发</th>
                                    <th style="border: none;" class="px-2 py-2 text-right w-16 text-error">待发</th>
                                    <th style="border: none;" class="px-2 py-2 text-center w-16">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each displayableOrderItems as item}
                                    {@const pending = item.quantity_pending_real || 0}
                                    <tr style="border: none;">
                                        <td style="border: none;" class="px-2 py-2 font-mono text-xs">{item.sku}</td>
                                        <td style="border: none;" class="px-2 py-2">{item.item_name}</td>
                                        <td style="border: none;" class="px-2 py-2 text-right">{safeParseFloat(item.quantity).toFixed(0)}</td>
                                        <td style="border: none;" class="px-2 py-2 text-right text-gray-500">{safeParseFloat(item.quantity_shipped).toFixed(0)}</td>
                                        <td style="border: none;" class="px-2 py-2 text-right font-bold text-error">{pending.toFixed(0)}</td>
                                        <td style="border: none;" class="px-2 py-2 text-center">
                                            <button 
                                                type="button"
                                                style="border: none;"
                                                class="btn btn-xs btn-primary"
                                                onclick={() => addItemToPlan(item)}
                                            >
                                                添加
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <div class="text-center py-8 text-gray-400">
                            {#if availableOrderItems.length === 0}
                                <p>该订单没有可发货的品项</p>
                            {:else}
                                <p>所有品项已添加到发货计划</p>
                            {/if}
                        </div>
                    {/if}
                </div>

                <!-- 右侧：已选的发货计划明细 -->
                <div class="p-4" style="border: none; box-shadow: none;">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="font-bold">📝 发货计划明细</h3>
                        {#if planItems.length > 0}
                            <div class="flex gap-2">
                                <span class="text-sm text-gray-500">
                                    已计划: <strong>{totalPlanned.toFixed(0)}</strong>
                                </span>
                                <button type="button" class="btn btn-xs btn-ghost !border-0" onclick={fillAllPending}>
                                    填充最大
                                </button>
                                <button type="button" class="btn btn-xs btn-ghost !border-0" onclick={clearAllPlan}>
                                    清空
                                </button>
                            </div>
                        {/if}
                    </div>
                    
                    {#if planItems.length === 0}
                        <div class="text-center py-12 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p>请从左侧选择商品</p>
                            <p class="text-sm mt-1">点击"添加"按钮将商品加入发货计划</p>
                        </div>
                    {:else}
                        <table class="w-full text-sm" style="border-collapse: separate; border-spacing: 0 8px;">
                            <tbody>
                                {#each planItems as item}
                                    <tr style="border: none;">
                                        <td class="py-2" style="border: none;">
                                            <div class="flex items-start justify-between">
                                                <div class="flex-1 min-w-0">
                                                    <span class="font-mono text-xs text-gray-500">{item.sku}</span>
                                                    <div class="font-medium text-sm truncate">{item.itemName}</div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    class="btn btn-xs btn-ghost text-error"
                                                    style="border: none;"
                                                    onclick={() => removePlanItem(item.id)}
                                                    aria-label="移除商品"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                                <span>订购: {item.quantityOrdered.toFixed(0)}</span>
                                                <span>已发: {item.quantityShipped.toFixed(0)}</span>
                                                {#if item.quantityPrepared > 0}
                                                    <span class="text-warning">已预备: {item.quantityPrepared.toFixed(0)}</span>
                                                {/if}
                                                <span class="text-error">可发: {item.quantityPendingReal.toFixed(0)}</span>
                                            </div>
                                            <div class="mt-2 flex items-center gap-2">
                                                <span class="text-xs text-gray-500">本次计划:</span>
                                                <input 
                                                    type="number" 
                                                    step="1"
                                                    style="border: none; background: transparent;"
                                                    class="input input-xs w-24 text-center"
                                                    bind:value={item.quantityPlan}
                                                />
                                                <span class="text-xs text-gray-400">/ 最大 {item.quantityPendingReal.toFixed(0)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- 收货信息 -->
        <div class="bg-gray-50 rounded-lg p-4">
            <span class="label label-text font-bold mb-2 block">📤 收货信息</span>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="form-control">
                    <label class="label" for="shippingAddress">
                        <span class="label-text text-xs">收货地址</span>
                    </label>
                    <input 
                        id="shippingAddress"
                        type="text" 
                        class="input input-bordered input-sm" 
                        bind:value={shippingAddress}
                        placeholder="输入收货地址"
                    />
                </div>
                <div class="form-control">
                    <label class="label" for="contactPerson">
                        <span class="label-text text-xs">联系人</span>
                    </label>
                    <input 
                        id="contactPerson"
                        type="text" 
                        class="input input-bordered input-sm" 
                        bind:value={contactPerson}
                        placeholder="输入联系人"
                    />
                </div>
                <div class="form-control">
                    <label class="label" for="contactPhone">
                        <span class="label-text text-xs">联系电话</span>
                    </label>
                    <input 
                        id="contactPhone"
                        type="text" 
                        class="input input-bordered input-sm" 
                        bind:value={contactPhone}
                        placeholder="输入联系电话"
                    />
                </div>
            </div>
        </div>

        <!-- 备注 -->
        <div class="form-control">
            <label class="label" for="notes">
                <span class="label-text">备注</span>
            </label>
            <textarea 
                id="notes"
                class="textarea textarea-bordered"
                bind:value={notes}
                placeholder="输入备注信息"
                rows="3"
            ></textarea>
        </div>

        <!-- 提示 -->
        {#if mode === 'create'}
            <div class="alert alert-info text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>提示：创建发货单后，可以在发货单详情页添加包裹，将计划明细打包到包裹中。</span>
            </div>
        {/if}

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-4 border-t">
            <button type="button" class="btn btn-ghost" onclick={() => onCancel?.()}>取消</button>
            <button 
                type="submit" 
                class="btn btn-primary relative active:scale-95 active:bg-blue-700 transition-all" 
                disabled={saving}
                class:opacity-70={saving}
                class:cursor-not-allowed={saving}
            >
                {#if saving}
                    <span class="loading loading-spinner loading-xs absolute left-4"></span>
                {/if}
                {saving ? '保存中...' : (mode === 'create' ? '创建发货单' : '保存修改')}
            </button>
        </div>
    </form>
{/if}

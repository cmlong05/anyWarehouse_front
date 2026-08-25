<!-- 描述：包裹创建/编辑表单组件，包含发货单选择、物品预览和容器分配逻辑。 -->
<!--
被依赖：
- `routes/customer/package/[id]/edit/+page.svelte`
- `routes/customer/package/add/+page.svelte`
-->
<script lang="ts">
    import { packageAPI, shipmentAPI, getAvailableStoragesForItem } from '$lib/api';
    import type { ShipmentBrief, Shipment, ShipmentItem, Package, PackageItem, PackageCreateRequest, PackageItemCreateRequest, PackageItemAllocationCreateRequest } from '$lib/shipmentTypes';
    import type { AvailableStorage } from '$lib/api/movement';
    import { safeParseFloat, formatNumber, getErrorMessage } from '$lib/utils';
    import { FormInput, NumberStepper } from '$lib/components/ui';
    import DualSelectionPanel from '../ui/DualSelectionPanel.svelte';
    import { Alert, Loading } from '$lib/components';
    import Plus from 'lucide-svelte/icons/plus';

    interface Props {
        mode: 'create' | 'edit';
        packageId?: number;
        initialShipmentId?: number;
        onSuccess?: (pkg: Package) => void;
        onCancel?: () => void;
    }
    let { mode, packageId, initialShipmentId, onSuccess, onCancel }: Props = $props();

    // 表单数据
    let packageNo = $state('');
    let tare_weight = $state<number | null>(null);
    let weight_adjustment = $state<number | null>(null);
    let estimated_shipping_cost = $state<number | null>(null);
    let length = $state<number | null>(null);
    let width = $state<number | null>(null);
    let height = $state<number | null>(null);
    let notes = $state('');

    // 发货单选择状态
    let selectedShipmentIds = $state<number[]>([]);
    let selectedShipmentsDetail = $state<Map<number, Shipment>>(new Map());
    
    interface PackagePreviewItem {
        id: string;
        shipmentId: number | null;
        shipmentNo: string;
        itemId: number | null;
        sku: string;
        productName: string;
        quantity: number;
        pendingQuantity: number;
        allocations: PackageItemAllocationCreateRequest[];
    }
    let packagePreviewItems = $state<PackagePreviewItem[]>([]);
    let existingItems = $state<PackageItem[]>([]);
    let linkedShipments = $state<{id: number, shipment_no: string, status: string}[]>([]);

    // 容器分配 UI 状态：哪些行展开了、每个 itemFkId 对应的可用库存
    // 包裹明细默认展开容器分配子表；collapsed[id]=true 表示收起
    let allocationCollapsed = $state<Record<string, boolean>>({});
    let availableStoragesByItem = $state<Record<number, AvailableStorage[]>>({});
    let loadingStoragesByItem = $state<Record<number, boolean>>({});

    // 选项数据
    let availableShipments = $state<ShipmentBrief[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    let success = $state('');
    let allocErrorModal = $state<string[] | null>(null);

    function getShipmentItemId(item: ShipmentItem): number | null {
        return item.item ?? item.item_detail?.id ?? null;
    }

    // 所有可选的商品（来自已选发货单）
    const availableItems = $derived(() => {
        const items: Array<{shipmentId: number; shipmentNo: string; item: ShipmentItem}> = [];
        for (const [shipmentId, shipment] of selectedShipmentsDetail) {
            if (!shipment.items) continue;
            for (const item of shipment.items) {
                const itemId = getShipmentItemId(item);
                // 过滤掉已添加的商品
                const isAdded = itemId != null && packagePreviewItems.some(p => p.itemId === itemId && p.shipmentId === shipmentId);
                if (!isAdded) {
                    items.push({ shipmentId, shipmentNo: shipment.shipment_no, item });
                }
            }
        }
        return items;
    });
    
    // 统计
    const totalPending = $derived(() => {
        return availableItems().length;
    });
    
    const totalAdded = $derived(() => {
        return packagePreviewItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    $effect(() => { init(); });

    async function init() {
        try {
            await loadShipments();
            if (mode === 'edit' && packageId) {
                await loadPackage(packageId);
            } else {
                if (initialShipmentId) { selectedShipmentIds = [initialShipmentId]; await loadShipmentDetail(initialShipmentId); }
                packageNo = generatePackageNo();
            }
        } catch (err) { error = getErrorMessage(err, '加载数据失败'); } 
        finally { loading = false; }
    }

    async function loadShipments() { 
        try { 
            const response = await shipmentAPI.list({ status: 'confirmed', page_size: 100 });
            const shipments = Array.isArray(response) ? response : (response.results || []);
            availableShipments = shipments.filter((shipment) => shipment.order_detail?.customer_id);
        } catch {} 
    }

    async function loadPackage(id: number) {
        try {
            const pkg = await packageAPI.get(id);
            packageNo = pkg.package_no;
            tare_weight = pkg.tare_weight ? safeParseFloat(pkg.tare_weight) : null;
            weight_adjustment = pkg.weight_adjustment ? safeParseFloat(pkg.weight_adjustment) : null;
            estimated_shipping_cost = pkg.estimated_shipping_cost ? safeParseFloat(pkg.estimated_shipping_cost) : null;
            length = pkg.length ? safeParseFloat(pkg.length) : null; width = pkg.width ? safeParseFloat(pkg.width) : null;
            height = pkg.height ? safeParseFloat(pkg.height) : null;
            notes = pkg.notes || ''; existingItems = pkg.items || []; linkedShipments = pkg.shipments || [];
            
            // 将现有明细转换为编辑模式下的预览格式
            if (pkg.items) {
                packagePreviewItems = pkg.items.map(item => {
                    const linkedShipment = linkedShipments.find(s => s.id === item.shipment);
                    return {
                        id: `existing-${item.id}`,
                        shipmentId: item.shipment,
                        shipmentNo: linkedShipment?.shipment_no || '-',
                        itemId: item.item,
                        sku: item.sku,
                        productName: item.product_name,
                        quantity: safeParseFloat(item.quantity),
                        pendingQuantity: safeParseFloat(item.quantity),
                        allocations: (item.allocations || [])
                            .filter(a => a.quantity > 0)
                            .map(a => ({
                                container: a.container,
                                quantity: a.quantity,
                            })),
                    };
                });
            }
            
            if (pkg.shipments) { for (const s of pkg.shipments) { selectedShipmentIds.push(s.id); await loadShipmentDetail(s.id); } }

            // 预加载所有明细行涉及物品的可用库存（默认展开需要）
            const itemFkIds = Array.from(new Set(packagePreviewItems.map(p => p.itemId).filter((x): x is number => x != null)));
            await Promise.all(itemFkIds.map(id => loadStoragesFor(id)));
        } catch (err) { error = getErrorMessage(err, '加载包裹失败'); }
    }

    async function loadShipmentDetail(shipmentId: number) { 
        try { 
            selectedShipmentsDetail.set(shipmentId, await shipmentAPI.get(shipmentId)); 
            selectedShipmentsDetail = new Map(selectedShipmentsDetail); 
        } catch {} 
    }
    
    function removeShipmentDetail(shipmentId: number) { 
        selectedShipmentsDetail.delete(shipmentId); 
        selectedShipmentsDetail = new Map(selectedShipmentsDetail); 
        // 只删除关联该发货单的明细
        packagePreviewItems = packagePreviewItems.filter(item => item.shipmentId !== shipmentId); 
    }

    async function onShipmentToggle(shipmentId: number, checked: boolean) {
        if (checked) { selectedShipmentIds = [...selectedShipmentIds, shipmentId]; await loadShipmentDetail(shipmentId); }
        else { selectedShipmentIds = selectedShipmentIds.filter(id => id !== shipmentId); removeShipmentDetail(shipmentId); }
    }

    async function addItemToPreview(shipmentId: number, item: ShipmentItem) {
        const shipment = selectedShipmentsDetail.get(shipmentId);
        if (!shipment) return;
        const itemId = getShipmentItemId(item);
        if (!itemId) {
            error = `发货单明细 ${item.sku} 未关联物品，无法加入包裹`;
            setTimeout(() => error = '', 2500);
            return;
        }
        if (packagePreviewItems.find(p => p.itemId === itemId && p.shipmentId === shipmentId)) {
            error = '该商品已在包裹明细中';
            setTimeout(() => error = '', 2000);
            return;
        }
        const pending = Math.max(0, safeParseFloat(item.quantity) - safeParseFloat(item.quantity_packed));
        const newRow: PackagePreviewItem = {
            id: `${shipmentId}-${item.id}-${Date.now()}`,
            shipmentId,
            shipmentNo: shipment.shipment_no,
            itemId,
            sku: item.sku,
            productName: item.product_name,
            quantity: pending,
            pendingQuantity: pending,
            allocations: [],
        };
        packagePreviewItems = [...packagePreviewItems, newRow];
        // 从数组中拿代理后的引用，保证 Svelte 5 响应式跟踪
        const proxyRow = packagePreviewItems[packagePreviewItems.length - 1];
        await applyFifoSilently(proxyRow);
    }

    function removePreviewItem(id: string) {
        packagePreviewItems = packagePreviewItems.filter(item => item.id !== id);
    }
    
    function clearAllItems() {
        packagePreviewItems = [];
    }

    // ========== 容器分配 ==========

    async function loadStoragesFor(itemFkId: number) {
        if (availableStoragesByItem[itemFkId] !== undefined) return;
        loadingStoragesByItem[itemFkId] = true;
        try {
            const resp = await getAvailableStoragesForItem(itemFkId);
            availableStoragesByItem[itemFkId] = resp.storages;
        } catch (err) {
            availableStoragesByItem[itemFkId] = [];
            error = getErrorMessage(err, '加载可用容器失败');
            setTimeout(() => error = '', 2500);
        } finally {
            loadingStoragesByItem[itemFkId] = false;
        }
    }

    async function toggleAllocationPanel(row: PackagePreviewItem) {
        const willCollapse = !allocationCollapsed[row.id];
        allocationCollapsed[row.id] = willCollapse;
        // 展开时确保可用库存已加载
        if (!willCollapse && row.itemId != null) {
            await loadStoragesFor(row.itemId);
        }
    }

    function setAllocation(row: PackagePreviewItem, containerId: number, qty: number) {
        const idx = row.allocations.findIndex(a => a.container === containerId);
        if (qty <= 0) {
            if (idx >= 0) {
                row.allocations.splice(idx, 1);
            }
        } else if (idx >= 0) {
            row.allocations[idx] = { container: containerId, quantity: qty };
        } else {
            row.allocations.push({ container: containerId, quantity: qty });
        }
        row.quantity = getAllocationTotal(row);
        packagePreviewItems = [...packagePreviewItems];
    }

    function getAllocQty(row: PackagePreviewItem, containerId: number): number {
        return row.allocations.find(a => a.container === containerId)?.quantity ?? 0;
    }

    function getAllocationTotal(row: PackagePreviewItem): number {
        return row.allocations.reduce((s, a) => s + a.quantity, 0);
    }

    /** 添加行时静默 FIFO 自动分配：库存不足或为空都不弹错，让用户自己手动调整。 */
    async function applyFifoSilently(row: PackagePreviewItem) {
        if (row.itemId == null) return;
        await loadStoragesFor(row.itemId);
        const list = availableStoragesByItem[row.itemId] || [];
        if (list.length === 0) return;
        applyFifo(row, list);
    }

    /** 把 row 的 allocations 用 FIFO 重写为对 list 的最大可用分配，返回剩余未分配数量。 */
    function applyFifo(row: PackagePreviewItem, list: AvailableStorage[]): number {
        let remaining = row.quantity;
        const next: PackageItemAllocationCreateRequest[] = [];
        for (const s of list) {
            if (remaining <= 0) break;
            const take = Math.min(s.quantity, remaining);
            if (take > 0) {
                next.push({ container: s.container_id, quantity: take });
                remaining -= take;
            }
        }
        row.allocations = next;
        row.quantity = next.reduce((s, a) => s + a.quantity, 0);
        packagePreviewItems = [...packagePreviewItems];
        return remaining;
    }
    
    async function fillAllPending() {
        const items = availableItems();
        const newRows: PackagePreviewItem[] = [];
        for (const { shipmentId, shipmentNo, item } of items) {
            const itemId = getShipmentItemId(item);
            if (!itemId) continue;
            if (!packagePreviewItems.find(p => p.itemId === itemId && p.shipmentId === shipmentId)) {
                const pending = Math.max(0, safeParseFloat(item.quantity) - safeParseFloat(item.quantity_packed));
                const row: PackagePreviewItem = {
                    id: `${shipmentId}-${item.id}-${Date.now()}`,
                    shipmentId,
                    shipmentNo,
                    itemId,
                    sku: item.sku,
                    productName: item.product_name,
                    quantity: pending,
                    pendingQuantity: pending,
                    allocations: [],
                };
                newRows.push(row);
            }
        }
        if (newRows.length === 0) return;
        const baseLen = packagePreviewItems.length;
        packagePreviewItems = [...packagePreviewItems, ...newRows];
        const proxyRows = packagePreviewItems.slice(baseLen);
        await Promise.all(proxyRows.map(r => applyFifoSilently(r)));
    }

    function generatePackageNo(): string { const date = new Date(); return `PKG${date.toISOString().slice(0,10).replace(/-/g,'')}${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}${String(date.getSeconds()).padStart(2,'0')}`; }

    async function handleSubmit() {
        if (!packageNo.trim()) { error = '请输入包裹编号'; return; }
        if (selectedShipmentIds.length === 0 && mode === 'create') { error = '请至少选择一个发货单'; return; }
        if (packagePreviewItems.length === 0) { error = '请至少添加一个商品到包裹'; return; }
        if (packagePreviewItems.some(item => !item.itemId || !item.shipmentId)) { error = '包裹明细必须同时关联发货单和物品'; return; }

        // 校验：每行必须有容器分配，且总和等于数量
        const allocErrors: string[] = [];
        for (const row of packagePreviewItems) {
            if (row.allocations.length === 0) {
                allocErrors.push(`${row.sku}：未指定出货容器`);
                continue;
            }
            const total = getAllocationTotal(row);
            if (total !== row.quantity) {
                allocErrors.push(`${row.sku}：容器分配总和(${total}) ≠ 数量(${row.quantity})`);
            }
            const ids = row.allocations.map(a => a.container);
            if (ids.length !== new Set(ids).size) {
                allocErrors.push(`${row.sku}：存在重复容器`);
            }
        }
        if (allocErrors.length > 0) {
            allocErrorModal = allocErrors;
            return;
        }

        saving = true; error = ''; success = '';
        try {
            // 使用第一个选中的发货单作为主关联（如果有的话）
            const primaryShipmentId = selectedShipmentIds.length > 0 ? selectedShipmentIds[0] : undefined;
            
            // 处理明细数据：所有 PackageItem 现在都需要指定 shipment + allocations
            const items = packagePreviewItems.map(item => ({
                shipment: item.shipmentId!,
                item: item.itemId!,
                quantity: item.quantity,
                allocations: item.allocations,
            }));
            
            const submitData: PackageCreateRequest = {
                package_no: packageNo, 
                sequence_no: 1,
                tare_weight: tare_weight ?? undefined, 
                weight_adjustment: weight_adjustment ?? undefined,
                estimated_shipping_cost: estimated_shipping_cost ?? undefined,
                length: length ?? undefined, 
                width: width ?? undefined, 
                height: height ?? undefined,
                notes: notes || undefined,
                items: items as PackageItemCreateRequest[],
                ...(primaryShipmentId ? { shipment_id: primaryShipmentId } : {})
            };
            
            let result: Package;
            if (mode === 'create') { 
                result = await packageAPI.create(submitData); 
                
                // 如果有多个发货单，逐个关联其他发货单
                if (selectedShipmentIds.length > 1) {
                    const itemShipmentIds = new Set(packagePreviewItems.map(item => item.shipmentId));
                    for (let i = 1; i < selectedShipmentIds.length; i++) {
                        const shipmentId = selectedShipmentIds[i];
                        if (!itemShipmentIds.has(shipmentId)) {
                            await packageAPI.addToShipment(result.id, shipmentId);
                        }
                    }
                }
                
                success = '包裹创建成功！'; 
            }
            else { result = await packageAPI.update(packageId!, submitData); success = '包裹更新成功！'; }
            onSuccess?.(result);
        } catch (err) { error = getErrorMessage(err, '保存失败'); }
        finally { saving = false; }
    }
</script>

{#if loading}
    <Loading text="加载中..." />
{:else}
    <div class="max-w-6xl mx-auto p-4">
        {#if error}<Alert error={{message: error}} onDismiss={() => error = ''} />{/if}
        {#if success}<Alert error={{message: success}} variant="info" onDismiss={() => success = ''} />{/if}

        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 class="m-0 mb-4 text-gray-600 text-lg font-semibold">基本信息</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="包裹编号" name="packageNo" value={packageNo} required disabled={mode === 'edit'} oninput={(v) => packageNo = v} />
            </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 class="m-0 mb-4 text-gray-600 text-lg font-semibold">尺寸重量</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label for="tare_weight" class="block text-sm text-gray-600 mb-1">箱体自重(kg)</label>
                    <NumberStepper
                        id="tare_weight"
                        value={tare_weight ?? undefined}
                        min={0}
                        step={0.01}
                        decimalPlaces={2}
                        onchange={(v) => tare_weight = v ?? null}
                    />
                </div>
                <div>
                    <label for="weight_adjustment" class="block text-sm text-gray-600 mb-1">重量调整(kg)</label>
                    <NumberStepper
                        id="weight_adjustment"
                        value={weight_adjustment ?? undefined}
                        step={0.01}
                        decimalPlaces={2}
                        onchange={(v) => weight_adjustment = v ?? null}
                    />
                    <p class="text-xs text-gray-400 mt-1">可为负值，用于手动修正</p>
                </div>
                <div>
                    <label for="estimated_shipping_cost" class="block text-sm text-gray-600 mb-1">预估运费(¥)</label>
                    <NumberStepper
                        id="estimated_shipping_cost"
                        value={estimated_shipping_cost ?? undefined}
                        min={0}
                        step={0.01}
                        decimalPlaces={2}
                        onchange={(v) => estimated_shipping_cost = v ?? null}
                    />
                </div>
                <div>
                    <label for="length" class="block text-sm text-gray-600 mb-1">长(cm)</label>
                    <NumberStepper
                        id="length"
                        value={length ?? undefined}
                        min={0}
                        step={0.1}
                        decimalPlaces={1}
                        onchange={(v) => length = v ?? null}
                    />
                </div>
                <div>
                    <label for="width" class="block text-sm text-gray-600 mb-1">宽(cm)</label>
                    <NumberStepper
                        id="width"
                        value={width ?? undefined}
                        min={0}
                        step={0.1}
                        decimalPlaces={1}
                        onchange={(v) => width = v ?? null}
                    />
                </div>
                <div>
                    <label for="height" class="block text-sm text-gray-600 mb-1">高(cm)</label>
                    <NumberStepper
                        id="height"
                        value={height ?? undefined}
                        min={0}
                        step={0.1}
                        decimalPlaces={1}
                        onchange={(v) => height = v ?? null}
                    />
                </div>
            </div>
        </div>

        <!-- 发货单选择 -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 class="m-0 mb-4 text-gray-600 text-lg font-semibold">关联发货单</h3>
            <div class="flex flex-col gap-2 max-h-[200px] overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                {#each availableShipments as shipment}
                    <label class="flex items-center gap-3 p-2 bg-gray-50 rounded cursor-pointer border border-transparent hover:bg-gray-200 hover:border-gray-400 transition-all duration-150">
                        <input type="checkbox" checked={selectedShipmentIds.includes(shipment.id)} onchange={(e) => onShipmentToggle(shipment.id, (e.target as HTMLInputElement).checked)} />
                        <span class="font-medium truncate">{shipment.shipment_no}</span>
                        {#if shipment.order_detail?.customer_name}
                            <span class="text-sm text-gray-500 truncate">-- {shipment.order_detail.customer_name}</span>
                        {/if}
                    </label>
                {/each}
            </div>
        </div>

        <!-- 双栏布局：使用通用组件 -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">

            {#if selectedShipmentIds.length > 0}
                <DualSelectionPanel
                    layout="vertical"
                    availableTitle="📋 发货单明细"
                    availableSubtitle={`待添加: ${formatNumber(totalPending())}`}
                    selectedTitle="📦 包裹内容"
                    selectedSubtitle={`已添加: ${formatNumber(totalAdded())}`}
                >
                    {#snippet available()}
                        {#if availableItems().length > 0}
                            <div class="flex justify-between items-center gap-2 mb-3">
                                <div class="text-sm text-gray-600">当前可添加 {formatNumber(availableItems().length)} 条明细</div>
                                <button 
                                    type="button"
                                    class="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                                    onclick={fillAllPending}
                                >
                                    <Plus class="h-4 w-4" />
                                    全部添加 ({availableItems().length})
                                </button>
                            </div>
                            <table class="w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th class="text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase">发货单</th>
                                        <th class="text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase">SKU</th>
                                        <th class="text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase">商品名称</th>
                                        <th class="text-right p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase w-16">待打包</th>
                                        <th class="text-center p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase w-16">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each availableItems() as { shipmentId, shipmentNo, item }}
                                        <tr class="hover:bg-gray-50">
                                            <td class="p-2 border-b border-gray-200 font-mono text-xs">{shipmentNo}</td>
                                            <td class="p-2 border-b border-gray-200 font-mono text-xs">{item.sku}</td>
                                            <td class="p-2 border-b border-gray-200">{item.product_name}</td>
                                            <td class="text-right p-2 border-b border-gray-200 text-red-600 font-medium">{formatNumber(Math.max(0, safeParseFloat(item.quantity) - safeParseFloat(item.quantity_packed)))}</td>
                                            <td class="text-center p-2 border-b border-gray-200">
                                                <button type="button" class="px-3 py-1 bg-blue-600 text-white rounded text-xs cursor-pointer hover:bg-blue-700 transition-colors" onclick={() => addItemToPreview(shipmentId, item)}>
                                                    添加
                                                </button>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {:else}
                            <div class="text-center p-12 text-gray-400 text-sm">
                                <p>所有商品已添加到包裹</p>
                            </div>
                        {/if}
                    {/snippet}
                    
                    {#snippet selected()}
                        {#if packagePreviewItems.length > 0}
                            <div class="flex justify-end gap-2 mb-2">
                                <button type="button" class="px-2 py-1 text-xs text-blue-600 bg-transparent border-none cursor-pointer hover:underline" onclick={clearAllItems}>清空</button>
                                {#if selectedShipmentIds.length > 0}
                                    <button type="button" class="px-2 py-1 text-xs text-blue-600 bg-transparent border-none cursor-pointer hover:underline" onclick={fillAllPending}>全部填充</button>
                                {/if}
                            </div>
                            <table class="w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th class="text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase">发货单</th>
                                        <th class="text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase">SKU</th>
                                        <th class="text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase">商品</th>
                                        <th class="text-right p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase w-20">待打包</th>
                                        <th class="text-right p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase w-24">数量</th>
                                        <th class="text-center p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase w-16">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each packagePreviewItems as item}
                                        {@const allocTotal = getAllocationTotal(item)}
                                        {@const allocOk = allocTotal === item.pendingQuantity && allocTotal > 0}
                                        {@const allocOver = allocTotal > item.pendingQuantity}
                                        {@const expanded = !allocationCollapsed[item.id]}
                                        <tr
                                            class="hover:bg-gray-50 cursor-pointer select-none"
                                            class:bg-red-50={item.quantity > item.pendingQuantity}
                                            onclick={() => toggleAllocationPanel(item)}
                                            title={expanded ? '点击收起容器分配' : '点击展开容器分配'}
                                        >
                                            <td class="p-2 border-b border-gray-200 font-mono text-xs">
                                                <span class="inline-block w-3 text-gray-400">{expanded ? '▾' : '▸'}</span>
                                                {item.shipmentNo}
                                            </td>
                                            <td class="p-2 border-b border-gray-200 font-mono text-xs">{item.sku}</td>
                                            <td class="p-2 border-b border-gray-200">
                                                {item.productName}
                                                {#if item.allocations.length > 0}
                                                    <span
                                                        class="ml-2 px-1.5 py-0.5 rounded text-xs {allocOk ? 'bg-green-100 text-green-800' : allocOver ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}"
                                                        title="出货容器分配状态"
                                                    >
                                                        {item.allocations.length}位置
                                                    </span>
                                                {/if}
                                            </td>
                                            <td class="text-right p-2 border-b border-gray-200 text-gray-600">{formatNumber(item.pendingQuantity)}</td>
                                            <td class="text-right p-2 border-b border-gray-200 font-medium">
                                                {allocTotal}
                                            </td>
                                            <td class="text-center p-2 border-b border-gray-200" onclick={(e) => e.stopPropagation()}>
                                                <button type="button" class="px-2 py-1 bg-red-600 text-white rounded text-xs cursor-pointer" onclick={() => removePreviewItem(item.id)}>
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                        {#if expanded}
                                            <tr class="bg-gray-50">
                                                <td colspan="6" class="p-3 border-b border-gray-200" onclick={(e) => e.stopPropagation()}>
                                                    {#if item.itemId != null && loadingStoragesByItem[item.itemId]}
                                                        <div class="text-sm text-gray-500">加载可用容器中...</div>
                                                    {:else if item.itemId != null && (availableStoragesByItem[item.itemId]?.length ?? 0) === 0}
                                                        <div class="text-sm text-red-600">该物品没有可用库存（已排除样品）。请先入库后再打包。</div>
                                                    {:else if item.itemId != null}
                                                        <table class="w-full text-xs border border-gray-200">
                                                            <thead>
                                                                <tr class="bg-white">
                                                                    <th class="text-left p-2 border-b border-gray-200">容器编码</th>
                                                                    <th class="text-left p-2 border-b border-gray-200">位置</th>
                                                                    <th class="text-left p-2 border-b border-gray-200">容器标记</th>
                                                                    <th class="text-right p-2 border-b border-gray-200 w-24">现有库存</th>
                                                                    <th class="text-right p-2 border-b border-gray-200 w-32">本次出货</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {#each availableStoragesByItem[item.itemId] || [] as storage}
                                                                    {@const currentAlloc = getAllocQty(item, storage.container_id)}
                                                                    <tr>
                                                                        <td class="p-2 border-b border-gray-100 font-mono">{storage.container_code}</td>
                                                                        <td class="p-2 border-b border-gray-100 text-gray-500">{storage.container_path || '-'}</td>
                                                                        <td class="p-2 border-b border-gray-100">{storage.container_mark || '-'}</td>
                                                                        <td class="text-right p-2 border-b border-gray-100">{storage.quantity}</td>
                                                                        <td class="text-right p-2 border-b border-gray-100">
                                                                            <NumberStepper
                                                                                value={currentAlloc}
                                                                                min={0}
                                                                                max={storage.quantity}
                                                                                step={1}
                                                                                decimalPlaces={0}
                                                                                size="sm"
                                                                                onchange={(v: number | null | undefined) => setAllocation(item, storage.container_id, v ?? 0)}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                {/each}
                                                            </tbody>
                                                        </table>
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/if}
                                    {/each}
                                </tbody>
                            </table>
                        {:else}
                            <div class="text-center p-12 text-gray-400 text-sm">
                                <p>点击左侧"添加"按钮添加商品</p>
                            </div>
                        {/if}
                    {/snippet}
                </DualSelectionPanel>
            {:else}
                <div class="text-center p-12 text-gray-400 text-sm bg-white rounded border">
                    <p>请先在上方勾选关联发货单</p>
                </div>
            {/if}
        </div>

        <!-- 备注 -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 class="m-0 mb-4 text-gray-600 text-lg font-semibold">备注</h3>
            <textarea bind:value={notes} rows={3} placeholder="可选" class="w-full p-3 border border-gray-300 rounded resize-y min-h-[80px]"></textarea>
        </div>

        <!-- 按钮 -->
        <div class="flex justify-end gap-4 mt-6">
            <button type="button" class="px-6 py-3 rounded text-base font-medium cursor-pointer transition-opacity duration-150 bg-gray-500 text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed" onclick={onCancel} disabled={saving}>取消</button>
            <button type="button" class="px-6 py-3 rounded text-base font-medium cursor-pointer transition-opacity duration-150 bg-blue-600 text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed" onclick={handleSubmit} disabled={saving}>{saving ? '保存中...' : mode === 'create' ? '创建包裹' : '更新包裹'}</button>
        </div>
    </div>

    {#if allocErrorModal}
        <div
            class="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
            onclick={(e) => e.target === e.currentTarget && (allocErrorModal = null)}
            onkeydown={(e) => e.key === 'Escape' && (allocErrorModal = null)}
            role="button"
            tabindex="-1"
            aria-label="关闭弹窗"
        >
            <div class="bg-white rounded-lg shadow-xl max-w-lg w-[90%]">
                <div class="flex justify-between items-center px-6 py-5 border-b border-gray-200">
                    <h3 class="text-gray-900 text-lg font-semibold">⚠️ 容器分配错误</h3>
                    <button
                        class="text-gray-500 hover:text-gray-700 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-md transition-all"
                        onclick={() => allocErrorModal = null}
                    >×</button>
                </div>
                <div class="px-6 py-6">
                    <p class="text-gray-700 mb-4 text-sm">请先修正以下容器分配问题：</p>
                    <ul class="space-y-1.5">
                        {#each allocErrorModal as errMsg}
                            <li class="flex items-start gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">
                                <span class="text-red-400 mt-0.5 flex-shrink-0">●</span>
                                <span>{errMsg}</span>
                            </li>
                        {/each}
                    </ul>
                </div>
                <div class="flex justify-end px-6 py-4 border-t border-gray-200">
                    <button
                        class="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                        onclick={() => allocErrorModal = null}
                    >知道了</button>
                </div>
            </div>
        </div>
    {/if}
{/if}
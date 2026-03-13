<script lang="ts">
    import { packageAPI, trackingNumberAPI, shipmentAPI, itemAPI } from '$lib/api';
    import type { TrackingNumberBrief, ShipmentBrief, Shipment, ShipmentItem, Package, PackageItem, PackageCreateRequest, PackageItemCreateRequest } from '$lib/shipmentTypes';
    import type { Item } from '$lib';
    import { safeParseFloat, formatNumber } from '$lib/utils';
    import { config } from '$lib/config';
    import { FormInput, FormSelect, NumberStepper } from '$lib/components/ui';
    import DualSelectionPanel from './DualSelectionPanel.svelte';
    import Alert from './Alert.svelte';
    import Loading from './Loading.svelte';
    import Svelecte from 'svelecte';

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
    let weight = $state<number | null>(null);
    let length = $state<number | null>(null);
    let width = $state<number | null>(null);
    let height = $state<number | null>(null);
    let trackingNumberId = $state<number | null>(null);
    let notes = $state('');

    // 发货单选择状态
    let selectedShipmentIds = $state<number[]>([]);
    let selectedShipmentsDetail = $state<Map<number, Shipment>>(new Map());
    
    interface PackagePreviewItem {
        id: string;
        shipmentItemId: number;
        shipmentId: number;
        shipmentNo: string;
        sku: string;
        productName: string;
        quantity: number;
        maxQuantity: number;
    }
    let packagePreviewItems = $state<PackagePreviewItem[]>([]);
    let existingItems = $state<PackageItem[]>([]);
    let linkedShipments = $state<{id: number, shipment_no: string, status: string}[]>([]);

    // 选项数据
    let availableTrackingNumbers = $state<TrackingNumberBrief[]>([]);
    let availableShipments = $state<ShipmentBrief[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    let success = $state('');
    
    // 手动添加商品表单
    let manualSku = $state('');
    let manualProductName = $state('');
    let manualQuantity = $state<number | null>(1);
    let selectedItemId = $state<number | null>(null);
    
    // 物品搜索 URL
    const itemSearchUrl = $derived(`${config.API_BASE_URL}/product/item/?search=[query]`);
    
    // 物品缓存，用于快速查找
    let itemCache = $state<Map<number, Item>>(new Map());
    
    // 处理 fetch 返回的数据
    function handleItemFetch(json: unknown) {
        const items = Array.isArray(json) ? json : ((json as { results?: Item[] })?.results || []);
        // 缓存物品信息
        items.forEach((item: Item) => {
            itemCache.set(item.id, item);
        });
        return items.map((item: Item) => ({
            value: item.id,
            label: `${item.SKU} - ${item.name}`,
            item: item  // 保存完整物品信息供后续使用
        }));
    }

    // 计算属性
    const trackingOptions = $derived([{ value: '', label: '请选择快递单号' }, ...availableTrackingNumbers.map(t => ({ value: t.id.toString(), label: `${t.carrier_name} - ${t.tracking_no}` }))]);
    
    // 所有可选的商品（过滤掉已添加的）
    const availableItems = $derived(() => {
        const items: Array<{shipmentId: number; shipmentNo: string; item: ShipmentItem; maxQty: number}> = [];
        for (const [shipmentId, shipment] of selectedShipmentsDetail) {
            if (!shipment.items) continue;
            for (const item of shipment.items) {
                const maxQty = safeParseFloat(item.quantity) - safeParseFloat(item.quantity_packed, 0);
                // 过滤掉已添加的商品
                const isAdded = packagePreviewItems.some(p => p.shipmentItemId === item.id);
                if (maxQty > 0 && !isAdded) {
                    items.push({ shipmentId, shipmentNo: shipment.shipment_no, item, maxQty });
                }
            }
        }
        return items;
    });
    
    // 统计
    const totalPending = $derived(() => {
        return availableItems().reduce((sum, { maxQty }) => sum + maxQty, 0);
    });
    
    const totalAdded = $derived(() => {
        return packagePreviewItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    $effect(() => { init(); });

    async function init() {
        try {
            await Promise.all([loadTrackingNumbers(), loadShipments()]);
            if (mode === 'edit' && packageId) {
                await loadPackage(packageId);
            } else {
                if (initialShipmentId) { selectedShipmentIds = [initialShipmentId]; await loadShipmentDetail(initialShipmentId); }
                packageNo = generatePackageNo();
            }
        } catch (err: any) { error = err.message || '加载数据失败'; } 
        finally { loading = false; }
    }

    async function loadTrackingNumbers() { try { availableTrackingNumbers = await trackingNumberAPI.listAvailable(); } catch {} }
    async function loadShipments() { 
        try { 
            const response = await shipmentAPI.list({ status: 'confirmed', page_size: 100 });
            availableShipments = Array.isArray(response) ? response : (response.results || []);
        } catch {} 
    }

    async function loadPackage(id: number) {
        try {
            const pkg = await packageAPI.get(id);
            packageNo = pkg.package_no; weight = pkg.weight ? safeParseFloat(pkg.weight) : null;
            length = pkg.length ? safeParseFloat(pkg.length) : null; width = pkg.width ? safeParseFloat(pkg.width) : null;
            height = pkg.height ? safeParseFloat(pkg.height) : null; trackingNumberId = pkg.tracking_number || null;
            notes = pkg.notes || ''; existingItems = pkg.items || []; linkedShipments = pkg.shipments || [];
            
            // 将现有明细转换为编辑模式下的预览格式
            if (pkg.items) {
                packagePreviewItems = pkg.items.map(item => {
                    const shipmentId = item.shipment_item_detail?.shipment || 0;
                    const linkedShipment = linkedShipments.find(s => s.id === shipmentId);
                    // 如果有 shipment_item 关联，则使用其ID；否则为0（手动添加的）
                    const hasShipmentItem = item.shipment_item && item.shipment_item > 0;
                    return {
                        id: `existing-${item.id}`,
                        shipmentItemId: hasShipmentItem ? item.shipment_item! : 0,
                        shipmentId: shipmentId,
                        shipmentNo: hasShipmentItem ? (linkedShipment?.shipment_no || '-') : '-',
                        sku: item.sku,
                        productName: item.product_name,
                        quantity: safeParseFloat(item.quantity),
                        maxQuantity: safeParseFloat(item.quantity)
                    };
                });
            }
            
            if (pkg.shipments) { for (const s of pkg.shipments) { selectedShipmentIds.push(s.id); await loadShipmentDetail(s.id); } }
        } catch (err: any) { error = err.message || '加载包裹失败'; }
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
        // 只删除关联该发货单的明细，保留手动添加的商品（shipmentId 为 0 的）
        packagePreviewItems = packagePreviewItems.filter(item => item.shipmentId !== shipmentId || item.shipmentId === 0); 
    }

    async function onShipmentToggle(shipmentId: number, checked: boolean) {
        if (checked) { selectedShipmentIds = [...selectedShipmentIds, shipmentId]; await loadShipmentDetail(shipmentId); }
        else { selectedShipmentIds = selectedShipmentIds.filter(id => id !== shipmentId); removeShipmentDetail(shipmentId); }
    }

    function addItemToPreview(shipmentId: number, item: ShipmentItem, maxQty: number) {
        const shipment = selectedShipmentsDetail.get(shipmentId); 
        if (!shipment) return;
        if (packagePreviewItems.find(p => p.shipmentItemId === item.id)) { 
            error = '该商品已在包裹明细中'; 
            setTimeout(() => error = '', 2000); 
            return; 
        }
        packagePreviewItems = [...packagePreviewItems, { 
            id: `${shipmentId}-${item.id}-${Date.now()}`, 
            shipmentItemId: item.id, 
            shipmentId, 
            shipmentNo: shipment.shipment_no, 
            sku: item.sku, 
            productName: item.product_name, 
            quantity: maxQty, 
            maxQuantity: maxQty 
        }];
    }
    
    // 手动添加商品到包裹
    async function addManualItem() {
        const sku = manualSku?.trim() || '';
        const productName = manualProductName?.trim() || '';
        
        if (!sku) {
            error = '请选择或输入SKU';
            setTimeout(() => error = '', 2000);
            return;
        }
        if (!productName) {
            error = '请输入商品名称';
            setTimeout(() => error = '', 2000);
            return;
        }
        if (!manualQuantity || manualQuantity < 1) {
            error = '请输入有效的数量';
            setTimeout(() => error = '', 2000);
            return;
        }
        
        // 检查是否已存在相同SKU
        if (packagePreviewItems.find(p => p.sku === sku)) {
            error = '该SKU已在包裹明细中';
            setTimeout(() => error = '', 2000);
            return;
        }
        
        packagePreviewItems = [...packagePreviewItems, { 
            id: `manual-${Date.now()}`, 
            shipmentItemId: 0,  // 手动添加的没有关联的shipment_item
            shipmentId: 0, 
            shipmentNo: '-',  // 手动添加的显示为‘-’
            sku: sku, 
            productName: productName, 
            quantity: manualQuantity, 
            maxQuantity: manualQuantity 
        }];
        
        // 清空表单
        manualSku = '';
        manualProductName = '';
        manualQuantity = 1;
        selectedItemId = null;
    }
    
    // 处理物品选择
    function handleItemSelect(selectedValue: unknown) {
        // 如果选择为空（清除选择）
        if (selectedValue === null || selectedValue === undefined || selectedValue === '') {
            manualSku = '';
            manualProductName = '';
            selectedItemId = null;
            return;
        }
        
        let selectedId: number | null = null;
        
        if (typeof selectedValue === 'number') {
            selectedId = selectedValue;
        } else if (typeof selectedValue === 'string') {
            selectedId = parseInt(selectedValue, 10);
        } else if (selectedValue && typeof selectedValue === 'object') {
            const obj = selectedValue as Record<string, unknown>;
            // 如果有完整的物品信息直接使用
            if (obj.item && typeof obj.item === 'object') {
                const item = obj.item as Item;
                manualSku = item.SKU || '';
                manualProductName = item.name || '';
                selectedItemId = item.id;
                return;
            }
            // 否则尝试获取 value
            if (typeof obj.value === 'number') {
                selectedId = obj.value;
            } else if (typeof obj.value === 'string') {
                selectedId = parseInt(obj.value, 10);
            }
        }
        
        // 如果无法解析出有效ID，则清空
        if (!selectedId || isNaN(selectedId)) {
            manualSku = '';
            manualProductName = '';
            selectedItemId = null;
            return;
        }
        
        selectedItemId = selectedId;
        
        // 从缓存中获取物品信息
        if (itemCache.has(selectedId)) {
            const item = itemCache.get(selectedId)!;
            manualSku = item.SKU;
            manualProductName = item.name;
        } else {
            // 如果缓存中没有，异步获取
            itemAPI.get(selectedId).then(item => {
                manualSku = item.SKU;
                manualProductName = item.name;
                itemCache.set(item.id, item);
            }).catch(err => {
                console.error('加载物品详情失败:', err);
                error = '加载物品详情失败';
                setTimeout(() => error = '', 2000);
                // 失败时清空
                manualSku = '';
                manualProductName = '';
                selectedItemId = null;
            });
        }
    }

    function removePreviewItem(id: string) { 
        const removedItem = packagePreviewItems.find(item => item.id === id);
        
        // 如果是关联发货单的商品，更新对应的 ShipmentItem 的 quantity_packed
        if (removedItem && removedItem.shipmentItemId > 0 && removedItem.shipmentId > 0) {
            const shipment = selectedShipmentsDetail.get(removedItem.shipmentId);
            if (shipment && shipment.items) {
                const shipmentItem = shipment.items.find(i => i.id === removedItem.shipmentItemId);
                if (shipmentItem) {
                    // 减少 quantity_packed
                    const currentPacked = safeParseFloat(shipmentItem.quantity_packed, 0);
                    const removedQty = removedItem.quantity;
                    shipmentItem.quantity_packed = String(Math.max(0, currentPacked - removedQty));
                    // 触发更新
                    selectedShipmentsDetail = new Map(selectedShipmentsDetail);
                }
            }
        }
        
        packagePreviewItems = packagePreviewItems.filter(item => item.id !== id); 
    }
    
    function clearAllItems() {
        // 恢复所有关联发货单的商品到可选列表
        for (const item of packagePreviewItems) {
            if (item.shipmentItemId > 0 && item.shipmentId > 0) {
                const shipment = selectedShipmentsDetail.get(item.shipmentId);
                if (shipment && shipment.items) {
                    const shipmentItem = shipment.items.find(i => i.id === item.shipmentItemId);
                    if (shipmentItem) {
                        const currentPacked = safeParseFloat(shipmentItem.quantity_packed, 0);
                        const removedQty = item.quantity;
                        shipmentItem.quantity_packed = String(Math.max(0, currentPacked - removedQty));
                    }
                }
            }
        }
        // 触发更新
        if (packagePreviewItems.length > 0) {
            selectedShipmentsDetail = new Map(selectedShipmentsDetail);
        }
        
        packagePreviewItems = [];
    }
    
    function fillAllPending() {
        const items = availableItems();
        for (const { shipmentId, shipmentNo, item, maxQty } of items) {
            if (!packagePreviewItems.find(p => p.shipmentItemId === item.id)) {
                packagePreviewItems = [...packagePreviewItems, {
                    id: `${shipmentId}-${item.id}-${Date.now()}`,
                    shipmentItemId: item.id,
                    shipmentId,
                    shipmentNo,
                    sku: item.sku,
                    productName: item.product_name,
                    quantity: maxQty,
                    maxQuantity: maxQty
                }];
            }
        }
    }

    function getTotalQuantity(): number { return packagePreviewItems.reduce((sum, item) => sum + item.quantity, 0); }
    function getTotalItems(): number { return packagePreviewItems.length; }
    function generatePackageNo(): string { const date = new Date(); return `PKG${date.toISOString().slice(0,10).replace(/-/g,'')}${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}${String(date.getSeconds()).padStart(2,'0')}`; }

    async function handleSubmit() {
        if (!packageNo.trim()) { error = '请输入包裹编号'; return; }
        if (selectedShipmentIds.length === 0 && mode === 'create') { error = '请至少选择一个发货单'; return; }
        if (packagePreviewItems.length === 0) { error = '请至少添加一个商品到包裹'; return; }

        saving = true; error = ''; success = '';
        try {
            // 使用第一个选中的发货单作为主关联（如果有的话）
            const primaryShipmentId = selectedShipmentIds.length > 0 ? selectedShipmentIds[0] : undefined;
            
            // 处理明细数据
            const items = packagePreviewItems.map(item => {
                if (item.shipmentItemId && item.shipmentItemId > 0) {
                    // 关联发货单的明细
                    return { shipment_item: item.shipmentItemId, quantity: item.quantity };
                } else {
                    // 手动添加的明细
                    return { 
                        sku: item.sku, 
                        product_name: item.productName, 
                        quantity: item.quantity 
                    };
                }
            });
            
            const submitData: PackageCreateRequest = {
                package_no: packageNo, 
                sequence_no: 1,
                weight: weight ?? undefined, 
                length: length ?? undefined, 
                width: width ?? undefined, 
                height: height ?? undefined,
                tracking_number: trackingNumberId || undefined, 
                notes: notes || undefined,
                items: items as PackageItemCreateRequest[],
                ...(primaryShipmentId ? { shipment_id: primaryShipmentId } : {})
            };
            
            let result: Package;
            if (mode === 'create') { 
                result = await packageAPI.create(submitData); 
                
                // 如果有多个发货单，逐个关联其他发货单
                if (selectedShipmentIds.length > 1) {
                    for (let i = 1; i < selectedShipmentIds.length; i++) {
                        await packageAPI.addToShipment(result.id, selectedShipmentIds[i]);
                    }
                }
                
                success = '包裹创建成功！'; 
            }
            else { result = await packageAPI.update(packageId!, submitData); success = '包裹更新成功！'; }
            onSuccess?.(result);
        } catch (err: any) { error = err.message || '保存失败'; }
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
                <FormSelect label="快递单号" name="trackingNumber" options={trackingOptions} value={trackingNumberId?.toString() || ''} onchange={(v) => trackingNumberId = v ? Number(v) : null} />
            </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 class="m-0 mb-4 text-gray-600 text-lg font-semibold">尺寸重量</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label for="weight" class="block text-sm text-gray-600 mb-1">重量(kg)</label>
                    <NumberStepper
                        id="weight"
                        value={weight ?? undefined}
                        min={0}
                        step={0.01}
                        decimalPlaces={2}
                        onchange={(v) => weight = v ?? null}
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
                    <label class="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer border border-transparent hover:bg-gray-200 hover:border-gray-400 transition-all duration-150">
                        <input type="checkbox" checked={selectedShipmentIds.includes(shipment.id)} onchange={(e) => onShipmentToggle(shipment.id, (e.target as HTMLInputElement).checked)} />
                        <span>{shipment.shipment_no}</span>
                    </label>
                {/each}
            </div>
        </div>

        <!-- 双栏布局：使用通用组件 -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 class="m-0 mb-4 text-gray-600 text-lg font-semibold">商品明细 <small class="font-normal text-gray-500">(总计: {getTotalItems()} 项, {formatNumber(getTotalQuantity())} 件)</small></h3>
            
            <!-- 手动添加商品表单 - 独立一行 -->
            <div class="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                <div class="text-xs text-blue-700 font-medium mb-2">添加商品:</div>
                <div class="flex flex-wrap gap-2 items-end">
                    <div class="flex-[2] min-w-[200px]">
                        <Svelecte
                            inputId="manual-item-select"
                            valueAsObject={false}
                            placeholder="搜索SKU或名称..."
                            searchable={true}
                            minQuery={1}
                            fetch={itemSearchUrl}
                            fetchCallback={handleItemFetch}
                            valueField="value"
                            labelField="label"
                            bind:value={selectedItemId}
                            onChange={(val: unknown) => handleItemSelect(val)}
                            clearable={true}
                        />
                    </div>
                    <div class="w-28">
                        <NumberStepper
                            bind:value={manualQuantity}
                            min={1}
                            step={1}
                            decimalPlaces={0}
                            size="sm"
                            placeholder="数量"
                        />
                    </div>
                    <button 
                        type="button" 
                        class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                        onclick={addManualItem}
                    >
                        添加
                    </button>
                </div>
            </div>
            
            {#if selectedShipmentIds.length > 0}
                <DualSelectionPanel
                    availableTitle="📋 发货单明细"
                    availableSubtitle={`待添加: ${formatNumber(totalPending())}`}
                    selectedTitle="📦 包裹内容"
                    selectedSubtitle={`已添加: ${formatNumber(totalAdded())}`}
                >
                    {#snippet available()}
                        {#if availableItems().length > 0}
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
                                    {#each availableItems() as { shipmentId, shipmentNo, item, maxQty }}
                                        <tr class="hover:bg-gray-50">
                                            <td class="p-2 border-b border-gray-200 font-mono text-xs">{shipmentNo}</td>
                                            <td class="p-2 border-b border-gray-200 font-mono text-xs">{item.sku}</td>
                                            <td class="p-2 border-b border-gray-200">{item.product_name}</td>
                                            <td class="text-right p-2 border-b border-gray-200 text-red-600 font-medium">{formatNumber(maxQty)}</td>
                                            <td class="text-center p-2 border-b border-gray-200">
                                                <button type="button" class="px-3 py-1 bg-blue-600 text-white rounded text-xs cursor-pointer hover:bg-blue-700 transition-colors" onclick={() => addItemToPreview(shipmentId, item, maxQty)}>
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
                                        <th class="text-right p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase w-24">数量</th>
                                        <th class="text-center p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase w-16">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each packagePreviewItems as item}
                                        <tr class="hover:bg-gray-50">
                                            <td class="p-2 border-b border-gray-200 font-mono text-xs">{item.shipmentNo}</td>
                                            <td class="p-2 border-b border-gray-200 font-mono text-xs">{item.sku}</td>
                                            <td class="p-2 border-b border-gray-200">{item.productName}</td>
                                            <td class="text-right p-2 border-b border-gray-200">
                                                <NumberStepper
                                                    bind:value={item.quantity}
                                                    min={1}
                                                    step={1}
                                                    decimalPlaces={0}
                                                    size="sm"
                                                />
                                            </td>
                                            <td class="text-center p-2 border-b border-gray-200">
                                                <button type="button" class="px-2 py-1 bg-red-600 text-white rounded text-xs cursor-pointer" onclick={() => removePreviewItem(item.id)}>
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
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
                <!-- 没有发货单时，只显示包裹内容 -->
                <div class="bg-white p-4 rounded border">
                    <h4 class="text-sm font-semibold text-gray-700 mb-3">📦 包裹内容 <span class="font-normal text-gray-500">({formatNumber(totalAdded())} 件)</span></h4>
                    
                    {#if packagePreviewItems.length > 0}
                        <div class="flex justify-end gap-2 mb-2">
                            <button type="button" class="px-2 py-1 text-xs text-blue-600 bg-transparent border-none cursor-pointer hover:underline" onclick={clearAllItems}>清空</button>
                        </div>
                        <table class="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th class="text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase">来源</th>
                                    <th class="text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase">SKU</th>
                                    <th class="text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase">商品</th>
                                    <th class="text-right p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase w-24">数量</th>
                                    <th class="text-center p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700 uppercase w-16">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each packagePreviewItems as item}
                                    <tr class="hover:bg-gray-50">
                                        <td class="p-2 border-b border-gray-200 font-mono text-xs">{item.shipmentNo}</td>
                                        <td class="p-2 border-b border-gray-200 font-mono text-xs">{item.sku}</td>
                                        <td class="p-2 border-b border-gray-200">{item.productName}</td>
                                        <td class="text-right p-2 border-b border-gray-200">
                                            <NumberStepper
                                                bind:value={item.quantity}
                                                min={1}
                                                step={1}
                                                decimalPlaces={0}
                                                size="sm"
                                            />
                                        </td>
                                        <td class="text-center p-2 border-b border-gray-200">
                                            <button type="button" class="px-2 py-1 bg-red-600 text-white rounded text-xs cursor-pointer" onclick={() => removePreviewItem(item.id)}>
                                                删除
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <div class="text-center p-12 text-gray-400 text-sm">
                            <p>请使用上方表单添加商品</p>
                        </div>
                    {/if}
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
{/if}

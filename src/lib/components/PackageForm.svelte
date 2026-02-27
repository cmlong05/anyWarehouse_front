<script lang="ts">
    import { packageAPI, trackingNumberAPI, shipmentAPI } from '$lib/shipmentApi';
    import type { TrackingNumberBrief, ShipmentBrief, Shipment, ShipmentItem, Package, PackageItem } from '$lib/shipmentTypes';
    import { safeParseFloat } from '$lib/utils';
    import Alert from './Alert.svelte';
    import Loading from './Loading.svelte';

    // Props
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
    
    // 包裹明细预览（新建模式）
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
    
    // 编辑模式下的现有明细
    let existingItems = $state<PackageItem[]>([]);
    let linkedShipments = $state<{id: number, shipment_no: string, status: string}[]>([]);

    // 选项数据
    let availableTrackingNumbers = $state<TrackingNumberBrief[]>([]);
    let availableShipments = $state<ShipmentBrief[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state('');
    let success = $state('');

    // 初始化
    $effect(() => {
        init();
    });

    async function init() {
        try {
            await Promise.all([
                loadTrackingNumbers(),
                loadShipments()
            ]);
            
            if (mode === 'edit' && packageId) {
                await loadPackage(packageId);
            } else {
                // 新建模式
                if (initialShipmentId) {
                    selectedShipmentIds = [initialShipmentId];
                    await loadShipmentDetail(initialShipmentId);
                }
                packageNo = generatePackageNo();
            }
        } catch (err: any) {
            error = err.message || '加载数据失败';
            console.error('Load error:', err);
        } finally {
            loading = false;
        }
    }

    async function loadTrackingNumbers() {
        try {
            const response = await trackingNumberAPI.listAvailable();
            availableTrackingNumbers = response;
        } catch (err: any) {
            console.error('加载快递单号失败:', err);
        }
    }

    async function loadShipments() {
        try {
            // 只加载已确认及以上状态的发货单（不包括草稿）
            const response = await shipmentAPI.list({ status: 'confirmed', page_size: 100 });
            availableShipments = response.results;
        } catch (err: any) {
            console.error('加载发货单失败:', err);
        }
    }

    async function loadPackage(id: number) {
        try {
            const pkg = await packageAPI.get(id);
            packageNo = pkg.package_no;
            weight = pkg.weight ? safeParseFloat(pkg.weight) : null;
            length = pkg.length ? safeParseFloat(pkg.length) : null;
            width = pkg.width ? safeParseFloat(pkg.width) : null;
            height = pkg.height ? safeParseFloat(pkg.height) : null;
            trackingNumberId = pkg.tracking_number || null;
            notes = pkg.notes || '';
            existingItems = pkg.items || [];
            linkedShipments = pkg.shipments || [];
            
            // 加载已关联的发货单详情
            if (pkg.shipments) {
                for (const s of pkg.shipments) {
                    selectedShipmentIds.push(s.id);
                    await loadShipmentDetail(s.id);
                }
            }
        } catch (err: any) {
            error = err.message || '加载包裹失败';
        }
    }

    async function loadShipmentDetail(shipmentId: number) {
        try {
            const shipment = await shipmentAPI.get(shipmentId);
            selectedShipmentsDetail.set(shipmentId, shipment);
            selectedShipmentsDetail = new Map(selectedShipmentsDetail);
        } catch (err: any) {
            console.error('加载发货单详情失败:', err);
        }
    }

    function removeShipmentDetail(shipmentId: number) {
        selectedShipmentsDetail.delete(shipmentId);
        selectedShipmentsDetail = new Map(selectedShipmentsDetail);
        packagePreviewItems = packagePreviewItems.filter(item => item.shipmentId !== shipmentId);
    }

    async function onShipmentToggle(shipmentId: number, checked: boolean) {
        if (checked) {
            selectedShipmentIds = [...selectedShipmentIds, shipmentId];
            await loadShipmentDetail(shipmentId);
        } else {
            selectedShipmentIds = selectedShipmentIds.filter(id => id !== shipmentId);
            removeShipmentDetail(shipmentId);
        }
    }

    function addItemToPreview(shipmentId: number, item: ShipmentItem) {
        const shipment = selectedShipmentsDetail.get(shipmentId);
        if (!shipment) return;

        const maxQty = safeParseFloat(item.quantity) - safeParseFloat(item.quantity_packed, 0);
        if (maxQty <= 0) return;

        const existingIndex = packagePreviewItems.findIndex(
            p => p.shipmentItemId === item.id
        );
        if (existingIndex >= 0) {
            error = '该商品已在包裹明细中';
            setTimeout(() => error = '', 2000);
            return;
        }

        const previewItem: PackagePreviewItem = {
            id: `${shipmentId}-${item.id}-${Date.now()}`,
            shipmentItemId: item.id,
            shipmentId: shipmentId,
            shipmentNo: shipment.shipment_no,
            sku: item.sku,
            productName: item.product_name,
            quantity: maxQty,
            maxQuantity: maxQty
        };

        packagePreviewItems = [...packagePreviewItems, previewItem];
    }

    function removePreviewItem(id: string) {
        packagePreviewItems = packagePreviewItems.filter(item => item.id !== id);
    }

    function getTotalQuantity(): number {
        return packagePreviewItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    function getTotalItems(): number {
        return packagePreviewItems.length;
    }

    function generatePackageNo(): string {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PKG${dateStr}-${random}`;
    }

    async function handleSubmit() {
        if (!packageNo.trim()) {
            error = '请输入包裹编号';
            return;
        }

        saving = true;
        error = '';
        success = '';

        try {
            if (mode === 'create') {
                // 新建模式
                const items = packagePreviewItems.map(p => ({
                    shipment_item: p.shipmentItemId,
                    quantity: p.quantity,
                    notes: ''
                }));

                const newPackage = await packageAPI.create({
                    package_no: packageNo.trim(),
                    sequence_no: 1,
                    weight: weight ?? undefined,
                    length: length ?? undefined,
                    width: width ?? undefined,
                    height: height ?? undefined,
                    tracking_number: trackingNumberId ?? undefined,
                    notes: notes || undefined,
                    items: items.length > 0 ? items : undefined,
                    shipment_id: selectedShipmentIds[0]
                });

                // 关联其他发货单
                if (selectedShipmentIds.length > 1) {
                    for (let i = 1; i < selectedShipmentIds.length; i++) {
                        await packageAPI.addToShipment(newPackage.id, selectedShipmentIds[i]);
                    }
                }

                success = '包裹创建成功';
                onSuccess?.(newPackage);
            } else {
                // 编辑模式
                const data: import('$lib/shipmentTypes').PackageUpdateRequest = {
                    weight: weight ?? undefined,
                    length: length ?? undefined,
                    width: width ?? undefined,
                    height: height ?? undefined,
                    tracking_number: trackingNumberId ?? undefined,
                    notes: notes
                };

                await packageAPI.update(packageId!, data);
                
                // 如果有新添加的商品，通过API逐个添加
                if (packagePreviewItems.length > 0) {
                    for (const item of packagePreviewItems) {
                        await packageAPI.addItem(packageId!, {
                            shipment_item: item.shipmentItemId,
                            quantity: item.quantity,
                            notes: ''
                        });
                    }
                }
                
                success = '包裹更新成功';
                onSuccess?.({ id: packageId! } as Package);
            }
        } catch (err: any) {
            console.error('Submit error:', err);
            if (err.response?.data) {
                const responseData = err.response.data;
                if (typeof responseData === 'object') {
                    const errorMessages = [];
                    for (const [key, value] of Object.entries(responseData)) {
                        if (Array.isArray(value)) {
                            errorMessages.push(`${key}: ${value.join(', ')}`);
                        } else {
                            errorMessages.push(`${key}: ${value}`);
                        }
                    }
                    error = errorMessages.join('; ') || '操作失败';
                } else {
                    error = err.message || '操作失败';
                }
            } else {
                error = err.message || '操作失败';
            }
        } finally {
            saving = false;
        }
    }

    async function addToShipment(shipmentId: number) {
        if (!packageId) return;
        try {
            await packageAPI.addToShipment(packageId, shipmentId);
            await loadPackage(packageId);
            success = '关联发货单成功';
            setTimeout(() => success = '', 2000);
        } catch (err: any) {
            error = err.message || '关联失败';
        }
    }
</script>

{#if loading}
    <Loading />
{:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左侧：基本信息和发货单选择 -->
        <div class="space-y-6">
            <!-- 基本信息 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold mb-4">基本信息</h2>
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-control">
                            <label class="label" for="packageNo">
                                <span class="label-text">
                                    包裹编号 {#if mode === 'create'}<span class="text-error">*</span>{/if}
                                </span>
                            </label>
                            {#if mode === 'create'}
                                <input 
                                    id="packageNo"
                                    type="text" 
                                    class="input input-bordered"
                                    bind:value={packageNo}
                                    placeholder="输入包裹编号"
                                />
                            {:else}
                                <input 
                                    id="packageNo"
                                    type="text" 
                                    class="input input-bordered bg-gray-100"
                                    value={packageNo}
                                    disabled
                                />
                                <span class="label-text-alt text-gray-500 mt-1">包裹编号不可修改</span>
                            {/if}
                        </div>
                        
                        <div class="form-control">
                            <label class="label" for="trackingNumber">
                                <span class="label-text">快递单号</span>
                            </label>
                            <select id="trackingNumber" class="select select-bordered" bind:value={trackingNumberId}>
                                <option value={null}>暂不关联</option>
                                {#each availableTrackingNumbers as tn}
                                    <option value={tn.id}>{tn.tracking_no} ({tn.carrier_name})</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="form-control">
                            <label class="label" for="weight">
                                <span class="label-text">重量 (kg)</span>
                            </label>
                            <input 
                                id="weight"
                                type="number" 
                                step="0.001"
                                min="0"
                                class="input input-bordered"
                                bind:value={weight}
                                placeholder="重量"
                            />
                        </div>
                        <div class="form-control">
                            <label class="label" for="length">
                                <span class="label-text">长 (cm)</span>
                            </label>
                            <input 
                                id="length"
                                type="number" 
                                step="0.01"
                                min="0"
                                class="input input-bordered"
                                bind:value={length}
                                placeholder="长"
                            />
                        </div>
                        <div class="form-control">
                            <label class="label" for="width">
                                <span class="label-text">宽 (cm)</span>
                            </label>
                            <input 
                                id="width"
                                type="number" 
                                step="0.01"
                                min="0"
                                class="input input-bordered"
                                bind:value={width}
                                placeholder="宽"
                            />
                        </div>
                        <div class="form-control">
                            <label class="label" for="height">
                                <span class="label-text">高 (cm)</span>
                            </label>
                            <input 
                                id="height"
                                type="number" 
                                step="0.01"
                                min="0"
                                class="input input-bordered"
                                bind:value={height}
                                placeholder="高"
                            />
                        </div>
                    </div>

                    <div class="form-control">
                        <label class="label" for="notes">
                            <span class="label-text">备注</span>
                        </label>
                        <textarea 
                            id="notes"
                            class="textarea textarea-bordered"
                            bind:value={notes}
                            placeholder="输入备注信息"
                            rows="2"
                        ></textarea>
                    </div>
                </div>
            </div>

            <!-- 选择发货单 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold mb-4">
                    {mode === 'create' ? '选择发货单' : '关联发货单'}
                    <span class="text-sm font-normal text-gray-500 ml-2">
                        (已选 {selectedShipmentIds.length} 个)
                    </span>
                </h2>
                
                {#if mode === 'edit' && linkedShipments.filter(s => s.status !== 'draft').length > 0}
                    <div class="space-y-2 mb-4">
                        {#each linkedShipments.filter(s => s.status !== 'draft') as shipment}
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <span class="font-medium">{shipment.shipment_no}</span>
                                        <span class="ml-2 text-sm">
                                            {#if shipment.status === 'confirmed'}
                                                <span class="badge badge-info badge-sm">已确认</span>
                                            {:else if shipment.status === 'packed'}
                                                <span class="badge badge-primary badge-sm">已打包</span>
                                            {:else if shipment.status === 'shipped'}
                                                <span class="badge badge-success badge-sm">已发货</span>
                                            {:else}
                                                <span class="badge badge-sm">{shipment.status}</span>
                                            {/if}
                                        </span>
                                    </div>
                                    <a href="/customer/shipment/{shipment.id}" class="btn btn-xs btn-outline">查看</a>
                                </div>
                            {/each}
                        </div>
                {/if}
                
                {#if availableShipments.length === 0}
                    <div class="alert alert-info alert-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>暂无可用发货单</span>
                    </div>
                {:else}
                    <div class="border rounded-lg p-3 max-h-64 overflow-y-auto bg-gray-50">
                        {#each availableShipments.filter(s => mode === 'create' || !linkedShipments.some(ls => ls.id === s.id)) as shipment}
                            <label class="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    class="checkbox checkbox-sm checkbox-primary mr-3"
                                    checked={selectedShipmentIds.includes(shipment.id)}
                                    onchange={(e) => onShipmentToggle(shipment.id, e.currentTarget.checked)}
                                    disabled={mode === 'edit' && linkedShipments.some(ls => ls.id === shipment.id)}
                                />
                                <div class="flex-1">
                                    <div class="font-medium text-sm">{shipment.shipment_no}</div>
                                    <div class="text-xs text-gray-500">
                                        {shipment.total_items} 种商品 · 
                                        {#if shipment.status === 'draft'}
                                            <span class="badge badge-ghost badge-xs">草稿</span>
                                        {:else if shipment.status === 'confirmed'}
                                            <span class="badge badge-info badge-xs">已确认</span>
                                        {:else if shipment.status === 'packed'}
                                            <span class="badge badge-primary badge-xs">已打包</span>
                                        {:else}
                                            <span class="badge badge-xs">{shipment.status}</span>
                                        {/if}
                                    </div>
                                </div>
                            </label>
                        {/each}
                    </div>
                {/if}
                {#if mode === 'edit'}
                    <span class="label-text-alt text-gray-500 mt-2 block">
                        编辑模式：如需添加发货单，请使用上方复选框
                    </span>
                {/if}
            </div>

            <!-- 已选发货单的商品列表（新建和编辑模式都显示） -->
            {#each Array.from(selectedShipmentsDetail.entries()) as [shipmentId, shipment]}
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="font-bold mb-3 flex items-center justify-between">
                            <span>{shipment.shipment_no} 的商品</span>
                            <span class="text-xs text-gray-500 font-normal">
                                点击"添加"按钮将商品加入包裹
                            </span>
                        </h3>
                        
                        {#if shipment.items && shipment.items.length > 0}
                            <div class="overflow-x-auto">
                                <table class="table table-compact w-full text-sm">
                                    <thead>
                                        <tr class="bg-gray-50">
                                            <th class="text-left">SKU</th>
                                            <th class="text-left">商品名称</th>
                                            <th class="text-right w-20">计划数</th>
                                            <th class="text-right w-20">已打包</th>
                                            <th class="text-right w-20">待打包</th>
                                            <th class="text-center w-20">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each shipment.items as item}
                                            {@const qty = safeParseFloat(item.quantity)}
                                            {@const packed = safeParseFloat(item.quantity_packed)}
                                            {@const pending = qty - packed}
                                            {@const alreadyAdded = packagePreviewItems.some(p => p.shipmentItemId === item.id)}
                                            <tr class="border-b" class:bg-green-50={alreadyAdded}>
                                                <td class="font-mono text-xs">{item.sku}</td>
                                                <td>{item.product_name}</td>
                                                <td class="text-right">{qty.toFixed(0)}</td>
                                                <td class="text-right text-success">{packed.toFixed(0)}</td>
                                                <td class="text-right" class:text-error={pending > 0}>
                                                    {pending.toFixed(0)}
                                                </td>
                                                <td class="text-center">
                                                    {#if pending > 0}
                                                        {#if alreadyAdded}
                                                            <span class="text-xs text-green-600">已添加</span>
                                                        {:else}
                                                            <button 
                                                                class="btn btn-xs btn-primary"
                                                                onclick={() => addItemToPreview(shipmentId, item)}
                                                            >
                                                                添加
                                                            </button>
                                                        {/if}
                                                    {:else}
                                                        <span class="text-xs text-gray-400">已完成</span>
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {:else}
                            <p class="text-gray-400 text-sm">该发货单暂无商品明细</p>
                        {/if}
                    </div>
                {/each}
        </div>

        <!-- 右侧：明细预览和操作按钮 -->
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-bold mb-4 flex items-center justify-between">
                <span>{mode === 'create' ? '包裹明细预览' : '包裹明细'}</span>
                <span class="text-sm font-normal text-gray-500">
                    {#if mode === 'create'}
                        {getTotalItems()} 种商品
                    {:else}
                        {existingItems.length + packagePreviewItems.length} 种商品
                        {#if packagePreviewItems.length > 0}
                            <span class="text-green-600">(+{packagePreviewItems.length}新)</span>
                        {/if}
                    {/if}
                </span>
            </h2>

            <!-- 新建模式：只显示预览列表 -->
            {#if mode === 'create'}
                {#if packagePreviewItems.length === 0}
                    <div class="text-center py-12 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p>请从左侧选择发货单</p>
                        <p class="text-sm mt-1">然后点击"添加"按钮将商品加入包裹</p>
                    </div>
                {:else}
                    <div class="space-y-3 max-h-[500px] overflow-y-auto">
                        {#each packagePreviewItems as item}
                            <div class="border rounded-lg p-3 bg-gray-50">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span class="font-mono text-xs text-gray-500">{item.sku}</span>
                                            <span class="text-xs text-gray-400">来自: {item.shipmentNo}</span>
                                        </div>
                                        <div class="font-medium text-sm truncate">{item.productName}</div>
                                    </div>
                                    <button 
                                        type="button"
                                        class="btn btn-xs btn-ghost text-error"
                                        onclick={() => removePreviewItem(item.id)}
                                        aria-label="移除商品"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div class="mt-2 flex items-center gap-2">
                                    <span class="text-xs text-gray-500">数量:</span>
                                    <input 
                                        type="number" 
                                        min="1"
                                        max={item.maxQuantity}
                                        step="1"
                                        class="input input-bordered input-xs w-20 text-center"
                                        bind:value={item.quantity}
                                    />
                                    <span class="text-xs text-gray-400">/ 最大 {item.maxQuantity}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            <!-- 编辑模式：显示现有明细 + 新添加的预览 -->
            {:else}
                <!-- 现有明细 -->
                {#if existingItems.length > 0}
                    <div class="overflow-x-auto mb-4">
                        <h3 class="text-sm font-medium text-gray-500 mb-2">现有明细</h3>
                        <table class="table table-compact w-full text-sm">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="text-left">SKU</th>
                                    <th class="text-left">商品名称</th>
                                    <th class="text-right">数量</th>
                                    <th class="text-left">来源</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each existingItems as item}
                                    <tr class="border-b">
                                        <td class="font-mono text-xs">{item.sku}</td>
                                        <td>{item.product_name}</td>
                                        <td class="text-right">{safeParseFloat(item.quantity)}</td>
                                        <td class="text-xs text-gray-500">
                                            {#if item.shipment_item_detail}
                                                发货明细
                                            {:else}
                                                直接添加
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <p class="text-gray-400 mb-4">暂无现有明细</p>
                {/if}
                
                <!-- 新添加的预览 -->
                {#if packagePreviewItems.length > 0}
                    <div class="border-t pt-4">
                        <h3 class="text-sm font-medium text-green-600 mb-2">新添加（待保存）</h3>
                        <div class="space-y-2 max-h-[300px] overflow-y-auto">
                            {#each packagePreviewItems as item}
                                <div class="border rounded-lg p-2 bg-green-50 border-green-200">
                                    <div class="flex items-start justify-between">
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2">
                                                <span class="font-mono text-xs text-gray-500">{item.sku}</span>
                                                <span class="text-xs text-gray-400">来自: {item.shipmentNo}</span>
                                            </div>
                                            <div class="font-medium text-sm truncate">{item.productName}</div>
                                        </div>
                                        <button 
                                            type="button"
                                            class="btn btn-xs btn-ghost text-error"
                                            onclick={() => removePreviewItem(item.id)}
                                            aria-label="移除商品"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div class="mt-1 flex items-center gap-2">
                                        <span class="text-xs text-gray-500">数量:</span>
                                        <input 
                                            type="number" 
                                            min="1"
                                            max={item.maxQuantity}
                                            step="1"
                                            class="input input-bordered input-xs w-20 text-center"
                                            bind:value={item.quantity}
                                        />
                                        <span class="text-xs text-gray-400">/ 最大 {item.maxQuantity}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="text-center py-8 text-gray-400 border-t">
                        <p>从左侧发货单中选择商品</p>
                        <p class="text-sm mt-1">点击"添加"按钮将新商品加入包裹</p>
                    </div>
                {/if}
            {/if}

            <!-- 操作按钮 -->
            <div class="mt-6 pt-4 border-t flex justify-end gap-3">
                <button 
                    type="button" 
                    class="btn btn-ghost rounded-lg hover:bg-gray-100 transition-all duration-200"
                    onclick={() => onCancel?.()}
                    disabled={saving}
                >
                    取消
                </button>
                <button 
                    type="button"
                    class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap flex items-center gap-2"
                    onclick={handleSubmit}
                    disabled={saving || (mode === 'create' && packagePreviewItems.length === 0)}
                    title={mode === 'create' && packagePreviewItems.length === 0 ? '请至少添加一个商品' : ''}
                >
                    {#if saving}
                        <span class="loading loading-spinner loading-sm"></span>
                        <span>保存中...</span>
                    {:else}
                        {#if mode === 'create'}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>创建包裹</span>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>保存修改</span>
                        {/if}
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

{#if error}
    <div class="fixed top-4 right-4 z-50">
        <Alert error={{ message: error }} />
    </div>
{/if}

{#if success}
    <div class="fixed top-4 right-4 z-50 alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{success}</span>
    </div>
{/if}

<script lang="ts">
    import { packageAPI, trackingNumberAPI, shipmentAPI } from '$lib/api';
    import type { TrackingNumberBrief, ShipmentBrief, Shipment, ShipmentItem, Package, PackageItem } from '$lib/shipmentTypes';
    import { safeParseFloat } from '$lib/utils';
    import { FormInput, FormSelect, NumberStepper } from '$lib/components/ui';
    import DualSelectionPanel from './DualSelectionPanel.svelte';
    import Alert from './Alert.svelte';
    import Loading from './Loading.svelte';

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
        packagePreviewItems = packagePreviewItems.filter(item => item.shipmentId !== shipmentId); 
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

    function removePreviewItem(id: string) { 
        packagePreviewItems = packagePreviewItems.filter(item => item.id !== id); 
    }
    
    function clearAllItems() {
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
        if (selectedShipmentIds.length === 0) { error = '请至少选择一个发货单'; return; }
        if (packagePreviewItems.length === 0 && mode === 'create') { error = '请至少添加一个商品到包裹'; return; }

        saving = true; error = ''; success = '';
        try {
            // 使用第一个选中的发货单作为主关联
            const primaryShipmentId = selectedShipmentIds[0];
            const submitData = {
                package_no: packageNo, 
                sequence_no: 1,
                weight: weight ?? undefined, length: length ?? undefined, 
                width: width ?? undefined, height: height ?? undefined,
                tracking_number: trackingNumberId || undefined, 
                notes: notes || undefined,
                items: packagePreviewItems.map(item => ({ shipment_item: item.shipmentItemId, quantity: item.quantity })),
                shipment_id: primaryShipmentId
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
    <div class="package-form">
        {#if error}<Alert error={{message: error}} onDismiss={() => error = ''} />{/if}
        {#if success}<Alert error={{message: success}} variant="info" onDismiss={() => success = ''} />{/if}

        <div class="form-section">
            <h3>基本信息</h3>
            <div class="form-row">
                <FormInput label="包裹编号" name="packageNo" value={packageNo} required disabled={mode === 'edit'} oninput={(v) => packageNo = v} />
                <FormSelect label="快递单号" name="trackingNumber" options={trackingOptions} value={trackingNumberId?.toString() || ''} onchange={(v) => trackingNumberId = v ? Number(v) : null} />
            </div>
        </div>

        <div class="form-section">
            <h3>尺寸重量</h3>
            <div class="form-row four-cols">
                <FormInput label="重量(kg)" name="weight" type="number" value={weight ?? ''} step={0.01} min={0} oninput={(v) => weight = v ? Number(v) : null} />
                <FormInput label="长(cm)" name="length" type="number" value={length ?? ''} step={0.1} min={0} oninput={(v) => length = v ? Number(v) : null} />
                <FormInput label="宽(cm)" name="width" type="number" value={width ?? ''} step={0.1} min={0} oninput={(v) => width = v ? Number(v) : null} />
                <FormInput label="高(cm)" name="height" type="number" value={height ?? ''} step={0.1} min={0} oninput={(v) => height = v ? Number(v) : null} />
            </div>
        </div>

        <!-- 发货单选择 -->
        <div class="form-section">
            <h3>关联发货单</h3>
            <div class="shipment-list">
                {#each availableShipments as shipment}
                    <label class="shipment-item">
                        <input type="checkbox" checked={selectedShipmentIds.includes(shipment.id)} onchange={(e) => onShipmentToggle(shipment.id, (e.target as HTMLInputElement).checked)} />
                        <span>{shipment.shipment_no}</span>
                    </label>
                {/each}
            </div>
        </div>

        <!-- 双栏布局：使用通用组件 -->
        {#if selectedShipmentIds.length > 0}
            <div class="form-section">
                <h3>商品明细 <small>(总计: {getTotalItems()} 项, {getTotalQuantity()} 件)</small></h3>
                
                <DualSelectionPanel
                    availableTitle="📋 发货单明细"
                    availableSubtitle={`待添加: ${totalPending().toFixed(0)}`}
                    selectedTitle="📦 包裹内容"
                    selectedSubtitle={`已添加: ${totalAdded().toFixed(0)}`}
                >
                    {#snippet available()}
                        {#if availableItems().length > 0}
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th class="text-left">发货单</th>
                                        <th class="text-left">SKU</th>
                                        <th class="text-left">商品名称</th>
                                        <th class="text-right w-16">待打包</th>
                                        <th class="text-center w-16">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each availableItems() as { shipmentId, shipmentNo, item, maxQty }}
                                        <tr>
                                            <td class="font-mono text-xs">{shipmentNo}</td>
                                            <td class="font-mono text-xs">{item.sku}</td>
                                            <td>{item.product_name}</td>
                                            <td class="text-right text-error font-medium">{maxQty.toFixed(0)}</td>
                                            <td class="text-center">
                                                <button type="button" class="btn-add" onclick={() => addItemToPreview(shipmentId, item, maxQty)}>
                                                    添加
                                                </button>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {:else}
                            <div class="empty-state">
                                <p>所有商品已添加到包裹</p>
                            </div>
                        {/if}
                    {/snippet}
                    
                    {#snippet selected()}
                        {#if packagePreviewItems.length > 0}
                            <div class="table-actions">
                                <button type="button" class="btn-text" onclick={clearAllItems}>清空</button>
                                <button type="button" class="btn-text" onclick={fillAllPending}>全部填充</button>
                            </div>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th class="text-left">发货单</th>
                                        <th class="text-left">SKU</th>
                                        <th class="text-left">商品</th>
                                        <th class="text-right w-24">数量</th>
                                        <th class="text-center w-16">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each packagePreviewItems as item}
                                        <tr>
                                            <td class="font-mono text-xs">{item.shipmentNo}</td>
                                            <td class="font-mono text-xs">{item.sku}</td>
                                            <td>{item.productName}</td>
                                            <td class="text-right">
                                                <NumberStepper
                                                    bind:value={item.quantity}
                                                    min={1}
                                                    max={item.maxQuantity}
                                                    step={1}
                                                    size="sm"
                                                />
                                            </td>
                                            <td class="text-center">
                                                <button type="button" class="btn-remove" onclick={() => removePreviewItem(item.id)}>
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {:else}
                            <div class="empty-state">
                                <p>点击左侧"添加"按钮添加商品</p>
                            </div>
                        {/if}
                    {/snippet}
                </DualSelectionPanel>
            </div>
        {/if}

        <!-- 备注 -->
        <div class="form-section">
            <h3>备注</h3>
            <textarea bind:value={notes} rows={3} placeholder="可选"></textarea>
        </div>

        <!-- 按钮 -->
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick={onCancel} disabled={saving}>取消</button>
            <button type="button" class="btn btn-primary" onclick={handleSubmit} disabled={saving}>{saving ? '保存中...' : mode === 'create' ? '创建包裹' : '更新包裹'}</button>
        </div>
    </div>
{/if}

<style>
    .package-form { max-width: 1200px; margin: 0 auto; padding: 1rem; }
    .form-section { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .form-section h3 { margin: 0 0 1rem 0; color: #495057; font-size: 1.1rem; font-weight: 600; }
    .form-section h3 small { font-weight: normal; color: #6c757d; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row.four-cols { grid-template-columns: repeat(4, 1fr); }
    .form-row :global(.form-field) { margin: 0; }
    
    @media (max-width: 768px) {
        .form-row, .form-row.four-cols { grid-template-columns: 1fr; }
    }
    
    .shipment-list { 
        display: flex; 
        flex-direction: column; 
        gap: 0.5rem; 
        max-height: 200px; 
        overflow-y: auto; 
        border: 1px solid #dee2e6; 
        border-radius: 8px; 
        padding: 0.5rem; 
        background: white; 
    }
    
    .shipment-item { 
        display: flex; 
        align-items: center; 
        gap: 0.5rem; 
        padding: 0.5rem; 
        background: #f8f9fa; 
        border-radius: 4px; 
        cursor: pointer; 
        border: 1px solid transparent; 
        transition: all 0.15s; 
    }
    
    .shipment-item:hover { 
        background: #e9ecef; 
        border-color: #adb5bd; 
    }
    
    textarea { 
        width: 100%; 
        padding: 0.75rem; 
        border: 1px solid #ced4da; 
        border-radius: 4px; 
        resize: vertical; 
        min-height: 80px; 
    }
    
    .form-actions { 
        display: flex; 
        justify-content: flex-end; 
        gap: 1rem; 
        margin-top: 1.5rem; 
    }
    
    .btn { 
        padding: 0.75rem 1.5rem; 
        border: none; 
        border-radius: 4px; 
        font-size: 1rem; 
        font-weight: 500; 
        cursor: pointer; 
        transition: opacity 0.15s; 
    }
    
    .btn:disabled { 
        opacity: 0.6; 
        cursor: not-allowed; 
    }
    
    .btn-primary { 
        background: #007bff; 
        color: white; 
    }
    
    .btn-secondary { 
        background: #6c757d; 
        color: white; 
    }
    
    .btn-primary:hover:not(:disabled), 
    .btn-secondary:hover:not(:disabled) { 
        opacity: 0.9; 
    }
</style>

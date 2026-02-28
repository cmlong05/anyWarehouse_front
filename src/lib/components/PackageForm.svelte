<script lang="ts">
    import { packageAPI, trackingNumberAPI, shipmentAPI } from '$lib/api';
    import type { TrackingNumberBrief, ShipmentBrief, Shipment, ShipmentItem, Package, PackageItem } from '$lib/shipmentTypes';
    import { safeParseFloat } from '$lib/utils';
    import { FormInput, FormSelect } from '$lib/components/ui';
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

    // 快递单号选项
    const trackingOptions = $derived([{ value: '', label: '请选择快递单号' }, ...availableTrackingNumbers.map(t => ({ value: t.id.toString(), label: `${t.carrier_name} - ${t.tracking_no}` }))]);

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

    async function loadShipmentDetail(shipmentId: number) { try { selectedShipmentsDetail.set(shipmentId, await shipmentAPI.get(shipmentId)); selectedShipmentsDetail = new Map(selectedShipmentsDetail); } catch {} }
    function removeShipmentDetail(shipmentId: number) { selectedShipmentsDetail.delete(shipmentId); selectedShipmentsDetail = new Map(selectedShipmentsDetail); packagePreviewItems = packagePreviewItems.filter(item => item.shipmentId !== shipmentId); }

    async function onShipmentToggle(shipmentId: number, checked: boolean) {
        if (checked) { selectedShipmentIds = [...selectedShipmentIds, shipmentId]; await loadShipmentDetail(shipmentId); }
        else { selectedShipmentIds = selectedShipmentIds.filter(id => id !== shipmentId); removeShipmentDetail(shipmentId); }
    }

    function addItemToPreview(shipmentId: number, item: ShipmentItem) {
        const shipment = selectedShipmentsDetail.get(shipmentId); if (!shipment) return;
        const maxQty = safeParseFloat(item.quantity) - safeParseFloat(item.quantity_packed, 0); if (maxQty <= 0) return;
        if (packagePreviewItems.find(p => p.shipmentItemId === item.id)) { error = '该商品已在包裹明细中'; setTimeout(() => error = '', 2000); return; }
        packagePreviewItems = [...packagePreviewItems, { id: `${shipmentId}-${item.id}-${Date.now()}`, shipmentItemId: item.id, shipmentId, shipmentNo: shipment.shipment_no, sku: item.sku, productName: item.product_name, quantity: maxQty, maxQuantity: maxQty }];
    }

    function removePreviewItem(id: string) { packagePreviewItems = packagePreviewItems.filter(item => item.id !== id); }
    function getTotalQuantity(): number { return packagePreviewItems.reduce((sum, item) => sum + item.quantity, 0); }
    function getTotalItems(): number { return packagePreviewItems.length; }
    function generatePackageNo(): string { const date = new Date(); return `PKG${date.toISOString().slice(0,10).replace(/-/g,'')}${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}${String(date.getSeconds()).padStart(2,'0')}`; }

    async function handleSubmit() {
        if (!packageNo.trim()) { error = '请输入包裹编号'; return; }
        if (selectedShipmentIds.length === 0) { error = '请至少选择一个发货单'; return; }
        if (packagePreviewItems.length === 0 && mode === 'create') { error = '请至少添加一个商品到包裹'; return; }

        saving = true; error = ''; success = '';
        try {
            const submitData = {
                package_no: packageNo, 
                sequence_no: 1, // 默认序列号
                weight: weight ?? undefined, length: length ?? undefined, 
                width: width ?? undefined, height: height ?? undefined,
                tracking_number: trackingNumberId || undefined, 
                notes: notes || undefined,
                items: packagePreviewItems.map(item => ({ shipment_item: item.shipmentItemId, quantity: item.quantity }))
            };
            let result: Package;
            if (mode === 'create') { result = await packageAPI.create(submitData); success = '包裹创建成功！'; }
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

        <!-- 商品明细 -->
        {#if selectedShipmentIds.length > 0}
            <div class="form-section">
                <h3>商品明细 <small>(总计: {getTotalItems()} 项, {getTotalQuantity()} 件)</small></h3>
                
                <!-- 可选商品列表 -->
                <div class="available-items">
                    <h4>可选商品</h4>
                    {#each Array.from(selectedShipmentsDetail.values()) as shipment}
                        <div class="shipment-group">
                            <div class="shipment-title">{shipment.shipment_no}</div>
                            {#if shipment.items}
                                <div class="item-list">
                                    {#each shipment.items as item}
                                        {@const maxQty = safeParseFloat(item.quantity) - safeParseFloat(item.quantity_packed, 0)}
                                        {#if maxQty > 0}
                                            <button type="button" class="item-chip" onclick={() => addItemToPreview(shipment.id, item)}>
                                                {item.sku} - {item.product_name} (可添加: {maxQty})
                                            </button>
                                        {/if}
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>

                <!-- 已选商品 -->
                {#if packagePreviewItems.length > 0}
                    <div class="selected-items">
                        <h4>已选商品</h4>
                        <table class="items-table">
                            <thead><tr><th>SKU</th><th>商品名称</th><th>数量</th><th>操作</th></tr></thead>
                            <tbody>
                                {#each packagePreviewItems as item}
                                    <tr>
                                        <td>{item.sku}</td>
                                        <td>{item.productName}</td>
                                        <td><input type="number" bind:value={item.quantity} min={0.001} max={item.maxQuantity} step={0.001} class="qty-input" /></td>
                                        <td><button type="button" class="btn-remove" onclick={() => removePreviewItem(item.id)}>删除</button></td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
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
    .package-form { max-width: 900px; margin: 0 auto; padding: 1rem; }
    .form-section { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .form-section h3 { margin: 0 0 1rem 0; color: #495057; font-size: 1.1rem; font-weight: 600; }
    .form-section h3 small { font-weight: normal; color: #6c757d; }
    .form-section h4 { margin: 1rem 0 0.5rem 0; font-size: 0.95rem; color: #495057; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row.four-cols { grid-template-columns: repeat(4, 1fr); }
    .form-row :global(.form-field) { margin: 0; }
    
    @media (max-width: 768px) {
        .form-row, .form-row.four-cols { grid-template-columns: 1fr; }
    }
    
    .shipment-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 8px; padding: 0.5rem; background: white; }
    .shipment-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
    .shipment-item:hover { background: #e9ecef; border-color: #adb5bd; }
    
    .shipment-group { margin-bottom: 1rem; padding: 0.75rem; background: white; border-radius: 4px; border: 1px solid #e9ecef; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .shipment-title { font-weight: 600; color: #495057; margin-bottom: 0.5rem; font-size: 1rem; }
    .item-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .item-chip { padding: 0.375rem 0.75rem; background: #e7f3ff; border: 1px solid #b8daff; border-radius: 4px; font-size: 0.875rem; cursor: pointer; transition: all 0.15s; color: #004085; }
    .item-chip:hover { background: #cce5ff; }
    
    .items-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    .items-table th, .items-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #dee2e6; }
    .items-table th { background: #f1f3f5; font-weight: 600; }
    .qty-input { width: 80px; padding: 0.25rem; border: 1px solid #ced4da; border-radius: 4px; }
    .btn-remove { padding: 0.25rem 0.5rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; }
    
    textarea { width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; resize: vertical; min-height: 80px; }
    
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: #007bff; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-primary:hover:not(:disabled), .btn-secondary:hover:not(:disabled) { opacity: 0.9; }
</style>

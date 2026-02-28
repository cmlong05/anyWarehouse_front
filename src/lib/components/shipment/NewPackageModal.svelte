<script lang="ts">
    import type { TrackingNumberBrief, ShipmentItem } from '$lib/shipmentTypes';
    import type { NewPackageForm, ShipmentItemSelection } from '$lib/composables/useShipmentDetail.svelte';
    import { safeParseFloat } from '$lib/utils';

    interface Props {
        show: boolean;
        form: NewPackageForm;
        trackingNumbers: TrackingNumberBrief[];
        shipmentItems: ShipmentItemSelection[];
        generateFromItems: boolean;
        creating: boolean;
        onClose: () => void;
        onCreate: () => void;
        onToggleGenerate: () => void;
        onUpdateForm: (form: NewPackageForm) => void;
        onUpdateItems: (items: ShipmentItemSelection[]) => void;
    }
    
    let { 
        show, form, trackingNumbers, shipmentItems, generateFromItems, creating,
        onClose, onCreate, onToggleGenerate, onUpdateForm, onUpdateItems
    }: Props = $props();

    function getSelectedTotal(): number {
        return shipmentItems.filter(s => s.quantity > 0).reduce((sum, s) => sum + s.quantity, 0);
    }

    function getSelectedCount(): number {
        return shipmentItems.filter(s => s.quantity > 0).length;
    }

    function fillAll() {
        onUpdateItems(shipmentItems.map(s => {
            const maxQty = safeParseFloat(s.item.quantity) - safeParseFloat(s.item.quantity_packed, 0);
            return { ...s, quantity: maxQty };
        }));
    }
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" 
         onclick={(e) => { if(e.target === e.currentTarget) onClose(); }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 class="font-bold text-lg mb-4">新建包裹</h3>
            <p class="text-sm text-gray-500 mb-4">包裹将自动关联到当前发货单</p>
            
            <div class="space-y-4">
                <!-- 基本信息 -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label" for="package-no">
                            <span class="label-text">包裹编号 <span class="text-error">*</span></span>
                        </label>
                        <input 
                            id="package-no"
                            type="text" 
                            class="input input-bordered"
                            value={form.packageNo}
                            oninput={(e) => onUpdateForm({ ...form, packageNo: e.currentTarget.value })}
                            placeholder="输入包裹编号"
                        />
                    </div>
                    <div class="form-control">
                        <label class="label" for="tracking-number">
                            <span class="label-text">快递单号</span>
                        </label>
                        <select id="tracking-number" class="select select-bordered"
                                value={form.trackingNumberId ?? ''}
                                onchange={(e) => onUpdateForm({ ...form, trackingNumberId: e.currentTarget.value ? Number(e.currentTarget.value) : null })}>
                            <option value="">暂不关联</option>
                            {#each trackingNumbers as tn}
                                <option value={tn.id}>{tn.tracking_no} ({tn.carrier_name})</option>
                            {/each}
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-4 gap-4">
                    <div class="form-control">
                        <label class="label">重量 (kg)</label>
                        <input type="number" step="0.001" class="input input-bordered"
                               value={form.weight ?? ''}
                               oninput={(e) => onUpdateForm({ ...form, weight: e.currentTarget.value ? Number(e.currentTarget.value) : null })}
                               placeholder="重量" />
                    </div>
                    <div class="form-control">
                        <label class="label">长 (cm)</label>
                        <input type="number" step="0.01" class="input input-bordered"
                               value={form.length ?? ''}
                               oninput={(e) => onUpdateForm({ ...form, length: e.currentTarget.value ? Number(e.currentTarget.value) : null })}
                               placeholder="长" />
                    </div>
                    <div class="form-control">
                        <label class="label">宽 (cm)</label>
                        <input type="number" step="0.01" class="input input-bordered"
                               value={form.width ?? ''}
                               oninput={(e) => onUpdateForm({ ...form, width: e.currentTarget.value ? Number(e.currentTarget.value) : null })}
                               placeholder="宽" />
                    </div>
                    <div class="form-control">
                        <label class="label">高 (cm)</label>
                        <input type="number" step="0.01" class="input input-bordered"
                               value={form.height ?? ''}
                               oninput={(e) => onUpdateForm({ ...form, height: e.currentTarget.value ? Number(e.currentTarget.value) : null })}
                               placeholder="高" />
                    </div>
                </div>
                
                <div class="form-control">
                    <label class="label">备注</label>
                    <textarea class="textarea textarea-bordered"
                              value={form.notes}
                              oninput={(e) => onUpdateForm({ ...form, notes: e.currentTarget.value })}
                              placeholder="输入备注" rows="2"></textarea>
                </div>
                
                <!-- 按发货明细生成 -->
                {#if shipmentItems.length > 0}
                    <div class="border-t pt-4 mt-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" class="checkbox checkbox-primary" 
                                   checked={generateFromItems}
                                   onchange={onToggleGenerate} />
                            <span class="font-medium">按发货明细生成包裹内容</span>
                        </label>
                        
                        {#if generateFromItems}
                            <div class="mt-4 bg-gray-50 rounded-lg p-4">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm font-medium text-gray-700">选择要打包的商品：</span>
                                        <button type="button" class="btn btn-xs btn-ghost text-primary" onclick={fillAll}>
                                            全部填充
                                        </button>
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        已选 <span class="font-bold text-primary">{getSelectedCount()}</span> 种，
                                        共 <span class="font-bold text-primary">{getSelectedTotal()}</span> 件
                                    </div>
                                </div>
                                
                                <div class="overflow-x-auto max-h-64 overflow-y-auto">
                                    <table class="table w-full text-sm">
                                        <thead>
                                            <tr class="bg-gray-100">
                                                <th class="text-left">SKU</th>
                                                <th class="text-left">商品名称</th>
                                                <th class="text-right w-20">计划数</th>
                                                <th class="text-right w-20">已打包</th>
                                                <th class="text-right w-20">待打包</th>
                                                <th class="text-center w-24">本次打包</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each shipmentItems as selection, idx}
                                                {@const maxQty = safeParseFloat(selection.item.quantity) - safeParseFloat(selection.item.quantity_packed, 0)}
                                                <tr class="hover:bg-white">
                                                    <td class="font-mono text-xs">{selection.item.sku}</td>
                                                    <td>{selection.item.product_name}</td>
                                                    <td class="text-right">{safeParseFloat(selection.item.quantity).toFixed(0)}</td>
                                                    <td class="text-right text-success">{safeParseFloat(selection.item.quantity_packed, 0).toFixed(0)}</td>
                                                    <td class="text-right">
                                                        <span class="font-medium hover:underline cursor-pointer"
                                                              onclick={() => { selection.quantity = maxQty; onUpdateItems(shipmentItems); }}
                                                              role="button" tabindex="0">
                                                            {maxQty.toFixed(0)}
                                                        </span>
                                                    </td>
                                                    <td class="text-center">
                                                        <input type="number" min="0" max={maxQty} step="1"
                                                               class="input input-bordered input-xs w-20 text-center"
                                                               bind:value={selection.quantity}
                                                               onchange={() => onUpdateItems(shipmentItems)} />
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
            
            <div class="flex justify-end gap-3 mt-6">
                <button class="btn btn-ghost" onclick={onClose}>取消</button>
                <button class="btn btn-primary" onclick={onCreate} disabled={creating}>
                    {creating ? '创建中...' : generateFromItems ? '创建并生成内容' : '创建并关联'}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .form-control { margin-bottom: 0.75rem; }
    .label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }
    .label-text { color: #374151; }
    .text-error { color: #dc2626; }
    .text-primary { color: #1976d2; }
    .text-success { color: #16a34a; }
    
    .input, .select, .textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }
    
    .input-xs { padding: 0.25rem; font-size: 0.75rem; }
    .input-bordered { border-color: #d1d5db; }
    
    .checkbox { width: 1rem; height: 1rem; cursor: pointer; }
    .checkbox-primary { accent-color: #1976d2; }
    
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 0.5rem; }
    .bg-gray-100 { background: #f3f4f6; }
    .bg-gray-50 { background: #f9fafb; }
    
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-ghost { background: transparent; color: #666; }
    .btn-ghost:hover:not(:disabled) { background: #f0f0f0; }
    .btn-primary { background: #1976d2; color: white; }
    .btn-primary:hover:not(:disabled) { background: #1565c0; }
    .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
</style>

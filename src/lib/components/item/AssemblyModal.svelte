<script lang="ts">
    import { itemBOMAPI } from '$lib/api';
    import { buildContainerRelationSearchOptions } from '$lib/utils';
    import type { AssemblyPreview, AssemblyAllocation } from '$lib';
    import { Alert } from '$lib/components';
    import { NumberStepper } from '$lib/components/ui';
    import Svelecte from 'svelecte';

    interface Props {
        itemId: number;
        itemSKU: string;
        itemName: string;
        show: boolean;
        initialPreview: AssemblyPreview | null;
        isLoading: boolean;
        existingContainerId: number | null;
        onClose: () => void;
        onSuccess: () => void;
    }

    let {
        itemId, itemSKU, itemName, show,
        initialPreview, isLoading, existingContainerId,
        onClose, onSuccess,
    }: Props = $props();

    let processing = $state(false);
    let initialLoading = $state(false);
    let error = $state<string | null>(null);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let allocations = $state<Record<number, Record<number, number>>>({});
    let refreshQuantity = $state(1);
    let preview = $state<AssemblyPreview | null>(null);
    let targetContainerId = $state<number | null>(null);


    // Sync initialPreview into preview when modal opens with data
    $effect(() => {
        if (show && initialPreview) {
            preview = initialPreview;
            refreshQuantity = initialPreview.quantity;
            targetContainerId = existingContainerId;
            buildAllocMap(initialPreview);
            error = null;
        } else if (!show) {
            preview = null;
            error = null;
        }
    });

    function buildAllocMap(p: AssemblyPreview) {
        const allocs: Record<number, Record<number, number>> = {};
        for (const comp of p.components) {
            allocs[comp.component_item_id] = {};
            for (const c of comp.containers) {
                if (c.suggested > 0) {
                    allocs[comp.component_item_id][c.container_id] = c.suggested;
                }
            }
        }
        allocations = allocs;
    }

    async function loadPreview(qty: number) {
        error = null;
        try {
            const result = await itemBOMAPI.getAssemblyPreview(itemId, qty);
            preview = result;
            buildAllocMap(result);
        } catch (e: any) {
            error = e?.message || '加载组装预览失败';
        }
    }

    function onQuantityChange(val: number | null | undefined) {
        const qty = val ?? 1;
        if (qty === refreshQuantity) return;
        refreshQuantity = qty;
        // Debounce: wait 400ms after last change before fetching
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => loadPreview(qty), 400);
    }

    function updateAllocation(compId: number, containerId: number, value: number) {
        const compAllocs = { ...allocations[compId] };
        if (value <= 0) {
            delete compAllocs[containerId];
        } else {
            const containerInfo = preview?.components
                .find(c => c.component_item_id === compId)?.containers
                .find(c => c.container_id === containerId);
            const max = containerInfo?.available ?? Infinity;
            compAllocs[containerId] = Math.min(value, max);
        }
        allocations = { ...allocations, [compId]: compAllocs };
    }

    function getAllocatedTotal(compId: number): number {
        return Object.values(allocations[compId] || {}).reduce((s, q) => s + q, 0);
    }

    function buildSubmitAllocations(): AssemblyAllocation[] {
        const result: AssemblyAllocation[] = [];
        for (const [compIdStr, containerMap] of Object.entries(allocations)) {
            const compId = parseInt(compIdStr);
            for (const [contIdStr, qty] of Object.entries(containerMap)) {
                if (qty > 0) {
                    result.push({
                        component_item_id: compId,
                        container_id: parseInt(contIdStr),
                        quantity: qty,
                    });
                }
            }
        }
        return result;
    }

    const containerOptions = $derived(
        preview ? buildContainerRelationSearchOptions(preview.all_containers) : []
    );

    async function handleSubmit() {
        if (!targetContainerId || processing) return;
        processing = true;
        error = null;
        try {
            await itemBOMAPI.assembleItem(itemId, {
                quantity: refreshQuantity,
                target_container_id: targetContainerId,
                allocations: buildSubmitAllocations(),
            });
            onSuccess();
            onClose();
        } catch (e: any) {
            error = e?.message || '组装失败，请检查库存后重试';
        } finally {
            processing = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') onClose();
    }
</script>

{#if show}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        role="dialog" tabindex="-1" aria-modal="true"
        onkeydown={handleKeydown}
    >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">组装成品</h2>
                    <p class="text-sm text-gray-500">{itemSKU} — {itemName}</p>
                </div>
                <button onclick={onClose} class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <!-- Body -->
            <div class="px-6 py-4 overflow-y-auto flex-1">
                {#if isLoading}
                    <div class="text-center py-8 text-gray-500">加载组装预览...</div>
                {:else if error && !preview}
                    <Alert variant="error" error={error} />
                {:else if preview}
                    {#if error}
                        <div class="mb-4">
                            <Alert variant="error" error={error} />
                        </div>
                    {/if}

                    <!-- Top: Quantity & Target -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-5">
                        <div class="flex gap-4 items-end">
                            <div class="w-36">
                                <label class="block text-xs font-medium text-gray-500 mb-1" for="assembly-qty">组装数量</label>
                                <NumberStepper
                                    id="assembly-qty"
                                    value={refreshQuantity}
                                    min={1}
                                    decimalPlaces={0}
                                    onchange={onQuantityChange}
                                />
                            </div>
                            <div class="flex-1">
                                <span class="block text-xs font-medium text-gray-500 mb-1">目标容器</span>
                                <Svelecte
                                    options={containerOptions}
                                    value={targetContainerId}
                                    valueAsObject={false}
                                    emitValues={true}
                                    valueField="value"
                                    labelField="label"
                                    searchProps={{ fields: ['label', 'searchText'] }}
                                    searchable={true}
                                    placeholder="选择成品入库容器"
                                    onChange={(value: unknown) => targetContainerId = (value as number) ?? null}
                                />
                            </div>
                            <div class="text-xs text-gray-400 whitespace-nowrap">
                                共 {preview.components.length} 种组件 · 产出 {refreshQuantity} 件
                            </div>
                        </div>
                    </div>

                    <!-- Component Allocations -->
                    {#each preview.components as comp}
                        {@const allocatedTotal = getAllocatedTotal(comp.component_item_id)}
                        {@const isComplete = allocatedTotal === comp.total_needed}
                        {@const isOver = allocatedTotal > comp.total_needed}
                        {@const remaining = comp.total_needed - allocatedTotal}
                        <div class="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                            <!-- Component header -->
                            <div class="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                <div class="flex items-center gap-2">
                                    <span class="font-mono font-medium text-gray-900 text-sm">{comp.sku}</span>
                                    <span class="text-gray-400 text-xs">{comp.name}</span>
                                </div>
                                <div class="flex items-center gap-3 text-xs">
                                    <span class="text-gray-400">BOM: ×{comp.per_unit}</span>
                                    <span class="text-gray-400">需: {comp.total_needed}</span>
                                    <span class="font-mono {isComplete ? 'text-green-600' : isOver ? 'text-red-600' : 'text-amber-600'}">
                                        已分配 {allocatedTotal}
                                    </span>
                                    {#if remaining > 0 && !isOver}
                                        <span class="text-amber-500">(缺 {remaining})</span>
                                    {:else if isOver}
                                        <span class="text-red-500">(超 {allocatedTotal - comp.total_needed})</span>
                                    {/if}
                                    {#if !comp.sufficient}
                                        <span class="text-red-500 font-medium">库存不足</span>
                                    {/if}
                                </div>
                            </div>
                            <!-- Allocation table -->
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-gray-400 border-b border-gray-100 text-xs">
                                        <th class="text-left py-2 px-4 font-normal">容器编码</th>
                                        <th class="text-left py-2 font-normal">标记</th>
                                        <th class="text-right py-2 font-normal w-20 pr-4">库存</th>
                                        <th class="text-right py-2 font-normal w-32 pr-4">取用数量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each comp.containers as c}
                                        {@const allocQty = (allocations[comp.component_item_id] || {})[c.container_id] ?? 0}
                                        <tr class="border-b border-gray-50 {allocQty > 0 ? 'bg-blue-50/30' : ''}">
                                            <td class="py-2 px-4 font-mono text-gray-700 text-xs">{c.container_fastCode}</td>
                                            <td class="py-2 text-gray-500 text-xs">{c.container_mark || '-'}</td>
                                            <td class="py-2 text-right text-gray-500 text-xs pr-4">{c.available}</td>
                                            <td class="py-2 text-right pr-4">
                                                <NumberStepper
                                                    value={allocQty}
                                                    min={0}
                                                    max={c.available}
                                                    decimalPlaces={0}
                                                    onchange={(v) => updateAllocation(comp.component_item_id, c.container_id, v ?? 0)}
                                                    size="sm"
                                                />
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/each}
                {/if}

                {#if error && preview}
                    <Alert variant="error" error={error} />
                {/if}
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
                <div class="text-sm text-gray-500">
                    {#if preview}
                        {preview.components.length} 种组件，产出 {refreshQuantity} 件成品
                    {/if}
                </div>
                <div class="flex gap-3">
                    <button
                        onclick={onClose}
                        class="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >取消</button>
                    <button
                        onclick={handleSubmit}
                        disabled={processing || !targetContainerId || !preview}
                        class="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? '组装中...' : `组装 ${refreshQuantity} 件`}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

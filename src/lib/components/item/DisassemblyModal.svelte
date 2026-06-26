<script lang="ts">
    import { itemBOMAPI } from '$lib/api';
    import { buildContainerRelationSearchOptions } from '$lib/utils';
    import type { DisassemblyPreview, AssemblyAllocation } from '$lib';
    import { Alert } from '$lib/components';
    import { NumberStepper } from '$lib/components/ui';

    interface Props {
        itemId: number;
        itemSKU: string;
        itemName: string;
        show: boolean;
        initialPreview: DisassemblyPreview | null;
        isLoading: boolean;
        existingSourceContainerId: number | null;
        onClose: () => void;
        onSuccess: () => void;
    }

    let {
        itemId, itemSKU, itemName, show,
        initialPreview, isLoading, existingSourceContainerId,
        onClose, onSuccess,
    }: Props = $props();

    let processing = $state(false);
    let error = $state<string | null>(null);
    let refreshQuantity = $state(1);
    let preview = $state<DisassemblyPreview | null>(null);
    let sourceContainerId = $state<number | null>(null);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let allocations = $state<Record<number, Record<number, number>>>({});
    let newContainerSelections = $state<Record<number, number | null>>({});

    const containerOptions = $derived(
        preview ? buildContainerRelationSearchOptions(preview.all_containers) : []
    );

    $effect(() => {
        if (show && initialPreview) {
            preview = initialPreview;
            refreshQuantity = initialPreview.quantity;
            sourceContainerId = existingSourceContainerId;
            buildAllocMap(initialPreview);
            error = null;
        } else if (!show) {
            preview = null;
            error = null;
        }
    });

    function buildAllocMap(p: DisassemblyPreview) {
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
            const result = await itemBOMAPI.getDisassemblyPreview(itemId, qty);
            preview = result;
            buildAllocMap(result);
        } catch (e: any) {
            error = e?.message || '加载拆分预览失败';
        }
    }

    function onQuantityChange(val: number | null | undefined) {
        const qty = val ?? 1;
        if (qty === refreshQuantity) return;
        refreshQuantity = qty;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => loadPreview(qty), 400);
    }

    function updateAllocation(compId: number, containerId: number, value: number) {
        const compAllocs = { ...allocations[compId] ?? {} };
        if (value <= 0) {
            delete compAllocs[containerId];
        } else {
            compAllocs[containerId] = value;
        }
        allocations = { ...allocations, [compId]: compAllocs };
    }

    function availableContainersFor(compId: number) {
        if (!preview) return [];
        const used = new Set(Object.keys(allocations[compId] || {}).map(Number));
        return preview.all_containers
            .filter(c => !used.has(c.id))
            .map(c => ({ value: c.id, label: c.fastCode + ' · ' + (c.mark || ''), searchText: c.fastCode + ' ' + c.mark }));
    }

    function addContainerRow(compId: number) {
        const cid = newContainerSelections[compId];
        if (!cid) return;
        const compAllocs = { ...allocations[compId] ?? {} };
        compAllocs[cid] = 0;
        allocations = { ...allocations, [compId]: compAllocs };
        newContainerSelections = { ...newContainerSelections, [compId]: null };
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

    async function handleSubmit() {
        if (!sourceContainerId || processing) return;
        processing = true;
        error = null;
        try {
            await itemBOMAPI.disassembleItem(itemId, {
                quantity: refreshQuantity,
                source_container_id: sourceContainerId,
                allocations: buildSubmitAllocations(),
            });
            onSuccess();
            onClose();
        } catch (e: any) {
            error = e?.message || '拆分失败，请重试';
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
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">拆分成品</h2>
                    <p class="text-sm text-gray-500">{itemSKU} — {itemName}</p>
                </div>
                <button onclick={onClose} class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div class="px-6 py-4 overflow-y-auto flex-1">
                {#if isLoading}
                    <div class="text-center py-8 text-gray-500">加载拆分预览...</div>
                {:else if error && !preview}
                    <Alert variant="error" error={error} />
                {:else if preview}
                    {#if error}
                        <div class="mb-4"><Alert variant="error" error={error} /></div>
                    {/if}

                    <div class="bg-gray-50 rounded-lg p-4 mb-5">
                        <div class="flex gap-4 items-end">
                            <div class="w-36">
                                <label class="block text-xs font-medium text-gray-500 mb-1" for="dis-qty">拆分数量</label>
                                <NumberStepper id="dis-qty" value={refreshQuantity} min={1} decimalPlaces={0} onchange={onQuantityChange} />
                            </div>
                            <div class="flex-1">
                                <span class="block text-xs font-medium text-gray-500 mb-1">来源容器</span>
                                <select
                                    value={sourceContainerId ?? ''}
                                    onchange={(e) => sourceContainerId = parseInt(e.currentTarget.value) || null}
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">选择成品来源容器</option>
                                    {#each preview.storages as s}
                                        <option value={s.container_id}>{s.container_fastCode} · {s.container_mark || ''} ({s.quantity} 件)</option>
                                    {/each}
                                </select>
                            </div>
                            <div class="text-xs text-gray-400 whitespace-nowrap">
                                共 {preview.components.length} 种组件 · 拆分 {refreshQuantity} 件
                            </div>
                        </div>
                    </div>

                    {#each preview.components as comp}
                        {@const allocatedTotal = getAllocatedTotal(comp.component_item_id)}
                        {@const isComplete = allocatedTotal === comp.total_produced}
                        {@const isOver = allocatedTotal > comp.total_produced}
                        {@const remaining = comp.total_produced - allocatedTotal}
                        <div class="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                            <div class="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                <div class="flex items-center gap-2">
                                    <span class="font-mono font-medium text-gray-900 text-sm">{comp.sku}</span>
                                    <span class="text-gray-400 text-xs">{comp.name}</span>
                                </div>
                                <div class="flex items-center gap-3 text-xs">
                                    <span class="text-gray-400">每件出: ×{comp.per_unit}</span>
                                    <span class="text-gray-400">产出: {comp.total_produced}</span>
                                    <span class="font-mono {isComplete ? 'text-green-600' : isOver ? 'text-red-600' : 'text-amber-600'}">
                                        已分配 {allocatedTotal}
                                    </span>
                                    {#if remaining > 0 && !isOver}
                                        <span class="text-amber-500">(差 {remaining})</span>
                                    {:else if isOver}
                                        <span class="text-red-500">(超 {allocatedTotal - comp.total_produced})</span>
                                    {/if}
                                </div>
                            </div>
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-gray-400 border-b border-gray-100 text-xs">
                                        <th class="text-left py-2 px-4 font-normal">容器编码</th>
                                        <th class="text-left py-2 font-normal">标记</th>
                                        <th class="text-right py-2 font-normal w-20 pr-4">现有库存</th>
                                        <th class="text-right py-2 font-normal w-32 pr-4">分配数量</th>
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
                                                    decimalPlaces={0}
                                                    onchange={(v) => updateAllocation(comp.component_item_id, c.container_id, v ?? 0)}
                                                    size="sm"
                                                />
                                            </td>
                                        </tr>
                                    {/each}
                                    {#each Object.entries(allocations[comp.component_item_id] || {}) as [cidStr, qty]}
                                        {@const cid = parseInt(cidStr)}
                                        {#if !comp.containers.some(c => c.container_id === cid)}
                                            {@const ct = preview.all_containers.find(x => x.id === cid)}
                                            <tr class="border-b border-gray-50 bg-blue-50/30">
                                                <td class="py-2 px-4 font-mono text-gray-700 text-xs">{ct?.fastCode || `#${cid}`}</td>
                                                <td class="py-2 text-gray-500 text-xs">{ct?.mark || '-'}</td>
                                                <td class="py-2 text-right text-gray-500 text-xs pr-4">-</td>
                                                <td class="py-2 text-right pr-4">
                                                    <NumberStepper
                                                        value={qty}
                                                        min={0}
                                                        decimalPlaces={0}
                                                        onchange={(v) => updateAllocation(comp.component_item_id, cid, v ?? 0)}
                                                        size="sm"
                                                    />
                                                </td>
                                            </tr>
                                        {/if}
                                    {/each}
                                </tbody>
                            </table>

                            <div class="flex gap-2 mt-2 px-4 pb-2">
                                <select
                                    value={newContainerSelections[comp.component_item_id] ?? ''}
                                    onchange={(e) => newContainerSelections = { ...newContainerSelections, [comp.component_item_id]: parseInt(e.currentTarget.value) || null }}
                                    class="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                >
                                    <option value="">+ 添加容器</option>
                                    {#each availableContainersFor(comp.component_item_id) as opt}
                                        <option value={opt.value}>{opt.label}</option>
                                    {/each}
                                </select>
                                <button
                                    onclick={() => addContainerRow(comp.component_item_id)}
                                    disabled={!newContainerSelections[comp.component_item_id]}
                                    class="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >添加</button>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>

            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
                <div class="text-sm text-gray-500">
                    {#if preview}
                        {preview.components.length} 种组件，拆分 {refreshQuantity} 件成品
                    {/if}
                </div>
                <div class="flex gap-3">
                    <button onclick={onClose} class="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">取消</button>
                    <button
                        onclick={handleSubmit}
                        disabled={processing || !sourceContainerId || !preview}
                        class="px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? '拆分中...' : `拆分 ${refreshQuantity} 件`}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

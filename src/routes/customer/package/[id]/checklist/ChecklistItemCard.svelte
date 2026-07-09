<!-- 核查项卡片 — 显示 SKU/商品名称/计划-实际数量，含可展开的出库位置 -->
<!--
被依赖：checklist/+page.svelte
-->
<script lang="ts">
    import type { PackageChecklistItem, PackageChecklistAllocation } from '$lib/shipmentTypes';

    let { item, readonly = false, onchange = () => {}, onallocchange = () => {} }: {
        item: PackageChecklistItem;
        readonly?: boolean;
        onchange?: (item: PackageChecklistItem) => void;
        onallocchange?: (alloc: PackageChecklistAllocation) => void;
    } = $props();

    let allocs = $derived(item.allocations ?? []);

    let itemActual = $derived(
        allocs.length > 0
            ? allocs.reduce((sum, a) => sum + (a.actual_quantity ?? a.planned_quantity), 0)
            : (item.actual_quantity ?? item.planned_quantity)
    );
    let hasDiscrepancy = $derived(itemActual !== item.planned_quantity);

    let allocCheckedCount = $derived(allocs.filter(a => a.checked).length);
    let itemChecked = $derived(allocs.length > 0 ? allocCheckedCount === allocs.length : item.checked);

    let borderColor = $derived(
        itemChecked
            ? (hasDiscrepancy ? 'border-l-orange-400' : 'border-l-green-500')
            : (hasDiscrepancy ? 'border-l-orange-400' : 'border-l-gray-300')
    );

    function onNotesInput(e: Event) {
        if (readonly) return;
        const target = e.target as HTMLInputElement;
        onchange({ ...item, notes: target.value });
    }

    function toggleAllocChecked(alloc: PackageChecklistAllocation) {
        if (readonly) return;
        onallocchange({ ...alloc, checked: !alloc.checked });
    }

    function adjustAllocQuantity(alloc: PackageChecklistAllocation, delta: number) {
        if (readonly) return;
        const current = alloc.actual_quantity ?? alloc.planned_quantity;
        const next = Math.max(0, current + delta);
        onallocchange({ ...alloc, actual_quantity: next });
    }
</script>

<div
    class="rounded-lg border border-gray-200 bg-white shadow-sm border-l-4 {borderColor} {readonly ? 'opacity-60' : ''}"
>
    <div class="flex items-start gap-3 p-4">
        <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
                <span class="text-xs font-mono text-gray-400">{item.sku}</span>
            </div>
            <p class="text-sm font-medium text-gray-900 mt-0.5">{item.product_name}</p>

            <div class="mt-2 flex items-center gap-3 text-sm">
                <span class="text-gray-500">
                    计划: <span class="font-semibold text-gray-700">{item.planned_quantity}</span>
                </span>
                <span class="text-gray-300">|</span>
                <span class="text-gray-500">
                    实际: <span class="font-semibold {hasDiscrepancy ? 'text-orange-600' : 'text-gray-700'}">{itemActual}</span>
                </span>
                {#if hasDiscrepancy}
                    <span class="text-xs text-orange-500 font-medium">
                        {itemActual < item.planned_quantity ? '少' : '多'}{Math.abs(itemActual - item.planned_quantity)}件
                    </span>
                {/if}
            </div>

            <div class="mt-2">
                <input
                    type="text"
                    class="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 placeholder-gray-400"
                    placeholder="备注（如破损、少发等）..."
                    value={item.notes}
                    oninput={onNotesInput}
                    onclick={(e) => e.stopPropagation()}
                    disabled={readonly}
                />
            </div>
        </div>
    </div>

    {#if allocs.length > 0}
        <div class="border-t border-gray-100">
            {#each allocs as alloc (alloc.id)}
                <div
                    class="flex items-center gap-3 border-b border-gray-50 px-4 py-2.5 text-sm {readonly ? '' : 'cursor-pointer'}"
                    onclick={() => toggleAllocChecked(alloc)}
                    role="button"
                    tabindex={readonly ? undefined : 0}
                    onkeydown={(e) => { if (!readonly && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleAllocChecked(alloc); } }}
                    aria-label={alloc.checked ? '标记未核查' : '标记已核查'}
                >
                    <div
                        class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors {alloc.checked ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white'}"
                    >
                        {#if alloc.checked}
                            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        {/if}
                    </div>
                    <span class="min-w-0 flex-1 text-xs font-mono text-gray-500 break-all">{alloc.container_path}</span>
                    <span class="text-gray-400 whitespace-nowrap">计划:{alloc.planned_quantity}</span>
                    <span class="inline-flex items-center rounded border border-gray-200">
                        <button
                            class="flex h-6 w-6 items-center justify-center text-xs text-gray-400 hover:bg-gray-100 rounded-l"
                            onclick={(e) => { e.stopPropagation(); adjustAllocQuantity(alloc, -1); }}
                            disabled={readonly}
                        >−</button>
                        <input
                            type="text"
                            inputmode="numeric"
                            pattern="[0-9]*"
                            class="w-10 text-center text-xs font-semibold tabular-nums border-0 bg-transparent px-0 py-0 outline-none {alloc.actual_quantity !== null && alloc.actual_quantity !== alloc.planned_quantity ? 'text-orange-600' : 'text-gray-700'}"
                            value={alloc.actual_quantity ?? alloc.planned_quantity}
                            oninput={(e) => {
                                if (readonly) return;
                                const val = parseInt(e.currentTarget.value, 10);
                                if (!isNaN(val) && val >= 0) onallocchange({ ...alloc, actual_quantity: val });
                            }}
                            onclick={(e) => e.stopPropagation()}
                            disabled={readonly}
                        />
                        <button
                            class="flex h-6 w-6 items-center justify-center text-xs text-gray-400 hover:bg-gray-100 rounded-r"
                            onclick={(e) => { e.stopPropagation(); adjustAllocQuantity(alloc, 1); }}
                            disabled={readonly}
                        >+</button>
                    </span>
                </div>
            {/each}
        </div>
    {/if}
</div>

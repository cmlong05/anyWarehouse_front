<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';
    import SortableHeader from '$lib/components/ui/SortableHeader.svelte';
    import { toggleSortKey } from '$lib/utils/sort';
    import type { ShipmentPlanItem } from '$lib/composables/useShipmentForm.svelte';

    type SortKey = 'sku' | 'itemName' | 'currentStock' | 'quantityPendingReal';

    interface Props {
        items: ShipmentPlanItem[];
        onRemove: (id: string) => void;
        onClear: () => void;
        onFillAll: () => void;
    }
    
    let { items, onRemove, onClear, onFillAll }: Props = $props();

    let sortKey = $state<SortKey>('sku');
    let sortDirection = $state<'asc' | 'desc'>('asc');

    function toggleSort(key: SortKey) {
        const next = toggleSortKey(sortKey, sortDirection, key);
        sortKey = next.sortKey as SortKey;
        sortDirection = next.sortDirection;
    }

    const sortedItems = $derived.by(() => {
        const sorted = [...items];
        sorted.sort((a, b) => {
            let valueA: number | string;
            let valueB: number | string;
            if (sortKey === 'currentStock') {
                valueA = a.currentStock ?? -1;
                valueB = b.currentStock ?? -1;
            } else if (sortKey === 'quantityPendingReal') {
                valueA = a.quantityPendingReal;
                valueB = b.quantityPendingReal;
            } else {
                valueA = a[sortKey] as string;
                valueB = b[sortKey] as string;
            }
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
            }
            return String(valueA).localeCompare(String(valueB), 'zh-CN', { numeric: true, sensitivity: 'base' }) * (sortDirection === 'asc' ? 1 : -1);
        });
        return sorted;
    });

    function formatStock(stock: number | null): string {
        return stock !== null ? stock.toFixed(0) : '-';
    }

    function getStockClass(stock: number | null, quantityPlan: number): string {
        if (stock === null) return 'text-gray-400';
        if (stock < quantityPlan) return 'text-red-600 font-semibold';
        if (stock > 0) return 'text-blue-700 font-medium';
        return 'text-gray-400';
    }
</script>

<div class="p-2">
    {#if items.length > 0}
        <div class="flex justify-end gap-2 mb-4">
            <button type="button" class="text-blue-600 hover:text-blue-800 text-sm" onclick={onFillAll}>填充最大</button>
            <button type="button" class="text-red-600 hover:text-red-800 text-sm" onclick={onClear}>清空</button>
        </div>
    {/if}
    
    {#if items.length === 0}
        <div class="text-center py-12 px-4 text-gray-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>请从左侧选择商品</p>
            <p class="text-sm mt-1">点击"添加"按钮将商品加入发货计划</p>
        </div>
    {:else}
        <table class="w-full text-sm border-collapse">
            <thead>
                <tr class="bg-gray-50">
                    <SortableHeader title="SKU" columnKey="sku" sortable sortKey={sortKey} {sortDirection} onSort={(k) => toggleSort(k as SortKey)} headerClass="px-3 py-2" />
                    <SortableHeader title="商品名称" columnKey="itemName" sortable sortKey={sortKey} {sortDirection} onSort={(k) => toggleSort(k as SortKey)} headerClass="px-3 py-2" />
                    <SortableHeader title="库存" columnKey="currentStock" sortable sortKey={sortKey} {sortDirection} onSort={(k) => toggleSort(k as SortKey)} align="right" headerClass="px-3 py-2" />
                    <SortableHeader title="待建发货单" columnKey="quantityPendingReal" sortable sortKey={sortKey} {sortDirection} onSort={(k) => toggleSort(k as SortKey)} align="right" headerClass="px-3 py-2" />
                    <th class="px-3 py-2 text-right font-semibold text-blue-700">本次计划</th>
                    <th class="px-3 py-2 text-center font-semibold text-gray-700">操作</th>
                </tr>
            </thead>
            <tbody>
                {#each sortedItems as item}
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="px-3 py-3 align-top font-mono text-xs text-gray-500">{item.sku}</td>
                        <td class="px-3 py-3 align-top text-gray-900">{item.itemName}</td>
                        <td class="px-3 py-3 align-top text-right {getStockClass(item.currentStock ?? null, item.quantityPlan)}">
                            {formatStock(item.currentStock ?? null)}
                        </td>
                        <td class="px-3 py-3 align-top text-right text-gray-900 font-semibold">{item.quantityPendingReal.toFixed(0)}</td>
                        <td class="px-3 py-3 align-top text-right">
                            <div class="flex items-center justify-end gap-2">
                                <NumberStepper
                                    bind:value={item.quantityPlan}
                                    step={1}
                                    decimalPlaces={0}
                                    size="sm"
                                />
                            </div>
                            {#if item.quantityPlan > item.quantityPendingReal}
                                <div class="mt-1 text-right text-xs text-amber-500">⚠️ 超发</div>
                            {/if}
                        </td>
                        <td class="px-3 py-3 align-top text-center">
                            <button
                                type="button"
                                class="text-red-600 hover:text-red-800 text-sm"
                                onclick={() => onRemove(item.id)}
                                aria-label="移除商品"
                            >
                                移除
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>

<script lang="ts">
    import { safeParseFloat, formatNumber } from '$lib/utils';
    import { isVariantChild, getVariantParentId, getVariantAttributes } from '$lib/utils/variant';
    import type { ShipmentItem } from '$lib/shipmentTypes';
    import VariantAttributeBadge from '$lib/components/VariantAttributeBadge.svelte';

    export let items: ShipmentItem[] = [];
    export let showActions = false;
    export let showStatus = true;
    export let lineSyncLoading: Record<number, boolean> = {};
    export let onSyncLine: ((item: ShipmentItem) => Promise<void>) | null = null;

    interface GroupedSection {
        type: 'parent' | 'variant' | 'normal';
        item: ShipmentItem;
    }

    function getGroupedSections(items: ShipmentItem[]): GroupedSection[] {
        const result: GroupedSection[] = [];
        const processed = new Set<number>();
        const variantsByParent = new Map<number, ShipmentItem[]>();

        for (const item of items) {
            if (isVariantChild(item)) {
                const parentId = getVariantParentId(item);
                if (parentId) {
                    if (!variantsByParent.has(parentId)) {
                        variantsByParent.set(parentId, []);
                    }
                    variantsByParent.get(parentId)!.push(item);
                }
            }
        }

        for (const item of items) {
            if (processed.has(item.id)) continue;

            if (isVariantChild(item)) {
                const parentId = getVariantParentId(item);
                if (parentId && variantsByParent.has(parentId)) {
                    const variants = variantsByParent.get(parentId)!;
                    const firstVariant = variants[0];
                    result.push({
                        type: 'parent',
                        item: {
                            ...firstVariant,
                            id: -parentId,
                            sku: firstVariant.item_detail?.parent_item_sku || '',
                            product_name: firstVariant.item_detail?.parent_item_name || '',
                            quantity: variants.reduce((sum, v) => sum + safeParseFloat(v.quantity), 0).toString(),
                            quantity_packed: variants.reduce((sum, v) => sum + safeParseFloat(v.quantity_packed ?? '0'), 0).toString(),
                        } as ShipmentItem,
                    });

                    for (const variant of variants) {
                        result.push({ type: 'variant', item: variant });
                        processed.add(variant.id);
                    }
                }
            } else {
                result.push({ type: 'normal', item });
                processed.add(item.id);
            }
        }

        return result;
    }

    function getCurrentStock(section: GroupedSection): number | null {
        if (section.type === 'parent') {
            const parentId = Math.abs(section.item.id);
            const variants = items.filter((item) => getVariantParentId(item) === parentId);
            return variants.reduce((sum, item) => sum + (item.item_detail?.total_storage || 0), 0);
        }

        return section.item.item_detail?.total_storage ?? null;
    }

    function getPending(item: ShipmentItem): number {
        return safeParseFloat(item.quantity) - safeParseFloat(item.quantity_packed ?? '0');
    }

    function isStockInsufficient(currentStock: number | null, pending: number): boolean {
        return currentStock !== null && pending > 0 && currentStock < pending;
    }

    function canSyncLine(item: ShipmentItem): boolean {
        if (!onSyncLine) return false;
        const packed = safeParseFloat(item.quantity_packed ?? '0');
        const planned = safeParseFloat(item.quantity);
        return packed > 0 && packed !== planned;
    }

    let sections: GroupedSection[] = [];
    $: sections = getGroupedSections(items);
</script>

<div class="overflow-x-auto">
    <table class="w-full text-sm border-collapse">
        <thead>
            <tr class="bg-gray-50">
                <th class="text-left px-3 py-2.5 font-medium text-gray-700">SKU</th>
                <th class="text-left px-3 py-2.5 font-medium text-gray-700">商品名称</th>
                <th class="text-right px-3 py-2.5 font-medium text-gray-700 w-24">现有库存</th>
                <th class="text-right px-3 py-2.5 font-medium text-gray-700 w-24">计划数量</th>
                <th class="text-right px-3 py-2.5 font-medium text-gray-700 w-24">已打包</th>
                <th class="text-right px-3 py-2.5 font-medium text-gray-700 w-24">待打包</th>
                {#if showStatus}
                    <th class="text-center px-3 py-2.5 font-medium text-gray-700 w-20">状态</th>
                {/if}
                {#if showActions}
                    <th class="text-center px-3 py-2.5 font-medium text-gray-700 w-24">操作</th>
                {/if}
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
            {#each sections as section}
                {@const item = section.item}
                {@const qty = safeParseFloat(item.quantity)}
                {@const packed = safeParseFloat(item.quantity_packed ?? '0')}
                {@const pending = getPending(item)}
                {@const currentStock = getCurrentStock(section)}
                {@const stockInsufficient = isStockInsufficient(currentStock, pending)}
                {@const variantAttrs = section.type === 'variant' ? getVariantAttributes(item) : []}
                <tr class="{section.type === 'variant' ? 'bg-purple-50/50' : section.type === 'parent' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'} transition-colors">
                    <td class="px-3 py-2.5 font-mono text-xs {section.type === 'variant' ? 'text-purple-600' : 'text-gray-600'}">
                        {#if section.type === 'variant'}
                            <div class="flex items-center gap-2 pl-4">{item.sku}</div>
                        {:else}
                            {item.sku}
                        {/if}
                    </td>
                    <td class="px-3 py-2.5 text-gray-900">
                        {#if section.type === 'variant'}
                            <div class="flex flex-col gap-1 pl-4">
                                <div class="flex items-center gap-2">
                                    <span>{item.product_name}</span>
                                    <VariantAttributeBadge attributes={variantAttrs} />
                                </div>
                            </div>
                        {:else}
                            {item.product_name}
                        {/if}
                    </td>
                    <td class="px-3 py-2.5 text-right {stockInsufficient ? 'text-red-600 font-semibold' : currentStock !== null && currentStock > 0 ? 'text-blue-700 font-medium' : 'text-gray-400'}">
                        {#if currentStock !== null}
                            {formatNumber(currentStock)}
                        {:else}
                            -
                        {/if}
                    </td>
                    <td class="px-3 py-2.5 text-right font-medium text-gray-900">{formatNumber(qty)}</td>
                    <td class="px-3 py-2.5 text-right {packed > 0 ? 'text-green-600' : 'text-gray-400'}">{formatNumber(packed)}</td>
                    <td class="px-3 py-2.5 text-right {pending > 0 ? 'text-red-600' : 'text-gray-400'}">{formatNumber(pending)}</td>
                    {#if showStatus}
                        <td class="px-3 py-2.5 text-center">
                            {#if pending < 0}
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">超额打包</span>
                            {:else if pending === 0}
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">已打包</span>
                            {:else if packed > 0}
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">部分打包</span>
                            {:else}
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">待打包</span>
                            {/if}
                        </td>
                    {/if}
                    {#if showActions}
                        <td class="px-3 py-2.5 text-center">
                            {#if canSyncLine(item)}
                                <button
                                    type="button"
                                    class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onclick={() => onSyncLine?.(item)}
                                    disabled={lineSyncLoading[item.id]}
                                    title="按已封箱包裹数量同步此行计划数量"
                                >
                                    {#if lineSyncLoading[item.id]}
                                        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                    {:else}
                                        🔄 同步
                                    {/if}
                                </button>
                            {/if}
                        </td>
                    {/if}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

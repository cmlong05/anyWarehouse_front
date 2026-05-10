<script lang="ts">
    import type { QuotationBrief } from '$lib';
    import { formatNumber } from '$lib/utils';

    interface GroupedQuotation {
        parentId: number | null;
        parentName: string;
        parentSku: string;
        isTemplate: boolean;
        quotations: QuotationBrief[];
        expanded: boolean;
    }

    let {
        quotations,
        bestPrice,
        itemId,
        itemSKU,
    }: {
        quotations: QuotationBrief[];
        bestPrice: { price: string; supplier: string; quotation_id: number } | null;
        itemId: number;
        itemSKU: string;
    } = $props();

    let quotationGroups = $state<GroupedQuotation[]>([]);
    let independentQuotations = $state<QuotationBrief[]>([]);
    let hasVariantQuotations = $state(false);

    function groupQuotationsByParent(qs: QuotationBrief[]) {
        const groups = new Map<number | string, GroupedQuotation>();
        const independent: QuotationBrief[] = [];
        let variantCount = 0;

        for (const q of qs) {
            if (q.is_variant && q.parent_item_id) {
                variantCount++;
                const key = q.parent_item_id;
                if (!groups.has(key)) {
                    groups.set(key, {
                        parentId: q.parent_item_id,
                        parentName: q.parent_item_name || '母版',
                        parentSku: q.parent_item_sku || '-',
                        isTemplate: false,
                        quotations: [],
                        expanded: false,
                    });
                }
                groups.get(key)!.quotations.push(q);
            } else if (q.is_variant_template) {
                variantCount++;
                const key = q.item || `template-${q.id}`;
                if (!groups.has(key)) {
                    groups.set(key, {
                        parentId: typeof q.item === 'number' ? q.item : null,
                        parentName: q.item_name || '母版',
                        parentSku: q.item_sku || '-',
                        isTemplate: true,
                        quotations: [],
                        expanded: false,
                    });
                }
                groups.get(key)!.quotations.push(q);
            } else {
                independent.push(q);
            }
        }

        hasVariantQuotations = variantCount > 0 || groups.size > 0;
        quotationGroups = Array.from(groups.values());
        independentQuotations = independent;
    }

    function toggleGroup(index: number) {
        quotationGroups[index].expanded = !quotationGroups[index].expanded;
    }

    function formatPrice(price: string | number | null | undefined): string {
        if (price === null || price === undefined || price === '') return '-';
        return parseFloat(String(price)).toFixed(2);
    }

    function isBestPriceQuotation(quotation: QuotationBrief): boolean {
        return bestPrice?.quotation_id === quotation.id;
    }

    $effect(() => {
        groupQuotationsByParent(quotations);
    });
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">供应商报价</h2>
        <a
            href="/supplier/quotation/add?item_id={itemId}&item_sku={itemSKU}"
            class="inline-flex items-center justify-center px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-md no-underline transition-opacity hover:opacity-90"
        >
            添加报价
        </a>
    </div>

    {#if quotations.length === 0}
        <div class="text-center py-12 bg-gray-50 rounded-lg">
            <div class="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <p class="text-gray-500">暂无供应商报价</p>
        </div>
    {:else}
        <div class="overflow-hidden rounded-lg border border-gray-200">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        {#if hasVariantQuotations}
                            <th class="px-4 py-3 text-left font-medium text-gray-700 w-10"></th>
                        {/if}
                        <th class="px-4 py-3 text-left font-medium text-gray-700">供应商</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-700">单价</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-700">货币</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-700">MOQ</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-700">状态</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    {#if hasVariantQuotations}
                        {#each quotationGroups as group, groupIndex}
                            <tr class="bg-slate-50 cursor-pointer transition-colors hover:bg-slate-100" onclick={() => toggleGroup(groupIndex)}>
                                <td class="px-4 py-3 text-center text-slate-500">
                                    <svg class="w-4 h-4 transition-transform {group.expanded ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </td>
                                <td class="px-4 py-3 font-medium">
                                    {group.parentSku}
                                    {#if group.isTemplate}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 bg-purple-200 text-purple-700">母版</span>
                                    {:else if group.parentId}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 bg-blue-100 text-blue-600">变体组</span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-gray-600">{group.parentName}</td>
                                <td class="px-4 py-3" colspan="3">
                                    <span class="text-sm text-gray-500">{group.quotations.length} 个报价</span>
                                </td>
                            </tr>
                            {#if group.expanded}
                                {#each group.quotations as quotation}
                                    <tr class="{isBestPriceQuotation(quotation) ? 'bg-green-50/70 text-green-700 hover:bg-green-100/70' : 'bg-white hover:bg-gray-50'}">
                                        <td class="px-4 py-3 border-l-[3px] {isBestPriceQuotation(quotation) ? 'border-green-300' : 'border-gray-200'}"></td>
                                        <td class="px-4 py-3 pl-12">
                                            <a href="/supplier/{quotation.supplier}" class="font-medium hover:underline {isBestPriceQuotation(quotation) ? 'text-green-700 hover:text-green-800' : 'text-blue-600'}">
                                                {quotation.supplier_name}
                                            </a>
                                        </td>
                                        <td class="px-4 py-3 text-right font-mono font-medium {isBestPriceQuotation(quotation) ? 'text-green-700' : ''}">{formatPrice(quotation.price)}</td>
                                        <td class="px-4 py-3 {isBestPriceQuotation(quotation) ? 'text-green-700' : 'text-gray-600'}">{quotation.currency}</td>
                                        <td class="px-4 py-3 {isBestPriceQuotation(quotation) ? 'text-green-700' : ''}">{formatNumber(quotation.min_quantity)}</td>
                                        <td class="px-4 py-3 text-center">
                                            {#if quotation.is_preferred}
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    首选
                                                </span>
                                            {:else}
                                                <span class="text-gray-400">-</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            {/if}
                        {/each}
                        {#each independentQuotations as quotation}
                            <tr class="{isBestPriceQuotation(quotation) ? 'bg-green-50/70 text-green-700 hover:bg-green-100/70' : 'hover:bg-gray-50'}">
                                <td class="px-4 py-3"></td>
                                <td class="px-4 py-3">
                                    <a href="/supplier/{quotation.supplier}" class="font-medium hover:underline {isBestPriceQuotation(quotation) ? 'text-green-700 hover:text-green-800' : 'text-blue-600'}">
                                        {quotation.supplier_name}
                                    </a>
                                </td>
                                <td class="px-4 py-3 text-right font-mono font-medium {isBestPriceQuotation(quotation) ? 'text-green-700' : ''}">{formatPrice(quotation.price)}</td>
                                <td class="px-4 py-3 {isBestPriceQuotation(quotation) ? 'text-green-700' : 'text-gray-600'}">{quotation.currency}</td>
                                <td class="px-4 py-3 {isBestPriceQuotation(quotation) ? 'text-green-700' : ''}">{formatNumber(quotation.min_quantity)}</td>
                                <td class="px-4 py-3 text-center">
                                    {#if quotation.is_preferred}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            首选
                                        </span>
                                    {:else}
                                        <span class="text-gray-400">-</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    {:else}
                        {#each quotations as quotation}
                            <tr class="{isBestPriceQuotation(quotation) ? 'bg-green-50/70 text-green-700 hover:bg-green-100/70' : 'hover:bg-gray-50'}">
                                <td class="px-4 py-3">
                                    <a href="/supplier/{quotation.supplier}" class="font-medium hover:underline {isBestPriceQuotation(quotation) ? 'text-green-700 hover:text-green-800' : 'text-blue-600'}">
                                        {quotation.supplier_name}
                                    </a>
                                </td>
                                <td class="px-4 py-3 text-right font-mono font-medium {isBestPriceQuotation(quotation) ? 'text-green-700' : ''}">{formatPrice(quotation.price)}</td>
                                <td class="px-4 py-3 {isBestPriceQuotation(quotation) ? 'text-green-700' : 'text-gray-600'}">{quotation.currency}</td>
                                <td class="px-4 py-3 {isBestPriceQuotation(quotation) ? 'text-green-700' : ''}">{formatNumber(quotation.min_quantity)}</td>
                                <td class="px-4 py-3 text-center">
                                    {#if quotation.is_preferred}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            首选
                                        </span>
                                    {:else}
                                        <span class="text-gray-400">-</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
</div>

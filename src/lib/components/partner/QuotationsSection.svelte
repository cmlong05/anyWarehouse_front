<script lang="ts">
    import Loading from '$lib/components/Loading.svelte';
    import QuotationRow from './QuotationRow.svelte';
    import SortableHeader from '$lib/components/ui/SortableHeader.svelte';
    import { toggleSortKey } from '$lib/utils/sort';
    import type { QuotationBrief, CustomerQuotationBrief } from '$lib';

    type AnyQuotationBrief = QuotationBrief | CustomerQuotationBrief;

    interface GroupedQuotation {
        parentId: number | null;
        parentName: string;
        parentSku: string;
        isTemplate: boolean;
        quotations: AnyQuotationBrief[];
        expanded: boolean;
    }
    
    interface Props {
        title: string;
        quotations: AnyQuotationBrief[];
        loading: boolean;
        emptyText: string;
        addHref: string;
        currency?: string;
        quotationQuantities: Record<number, number | null>;
        onQuantityChange: (id: number, value: number | null) => void;
        onRowClick: (id: number) => void;
        onCreateOrder: () => void;
    }
    
    let { title, quotations, loading, emptyText, addHref, currency, quotationQuantities, onQuantityChange, onRowClick, onCreateOrder }: Props = $props();
    
    const CURRENCY_SYMBOLS: Record<string, string> = {
        USD: '$', CNY: '¥', EUR: '€', GBP: '£', JPY: '¥', HKD: 'HK$', TWD: 'NT$'
    };
    const currencySymbol = $derived(currency ? (CURRENCY_SYMBOLS[currency] ?? currency) : '');

    // 按母版分组的报价
    let groupedQuotations = $state<GroupedQuotation[]>([]);
    let independentQuotations = $state<AnyQuotationBrief[]>([]);
    let hasVariants = $state(false);

    type QuotationSortKey = 'item_sku' | 'item_name' | 'partner_sku' | 'item_total_storage' | 'price' | 'is_preferred';
    let sortKey = $state<QuotationSortKey>('item_sku');
    let sortDir = $state<'asc' | 'desc'>('asc');

    function toggleSort(key: QuotationSortKey) {
        const next = toggleSortKey(sortKey, sortDir, key);
        sortKey = next.sortKey as QuotationSortKey;
        sortDir = next.sortDirection;
    }

    const sortedQuotations = $derived.by(() => {
        return [...quotations].sort((a, b) => {
            let va: number | string;
            let vb: number | string;
            if (sortKey === 'item_total_storage') {
                va = a.item_total_storage ?? -1;
                vb = b.item_total_storage ?? -1;
            } else if (sortKey === 'price') {
                va = parseFloat(a.price || '0');
                vb = parseFloat(b.price || '0');
            } else if (sortKey === 'is_preferred') {
                va = a.is_preferred ? 1 : 0;
                vb = b.is_preferred ? 1 : 0;
            } else {
                va = String((a as unknown as Record<string, unknown>)[sortKey] ?? '');
                vb = String((b as unknown as Record<string, unknown>)[sortKey] ?? '');
            }
            if (typeof va === 'number' && typeof vb === 'number') {
                return sortDir === 'asc' ? va - vb : vb - va;
            }
            return String(va).localeCompare(String(vb), 'zh-CN', { numeric: true, sensitivity: 'base' }) * (sortDir === 'asc' ? 1 : -1);
        });
    });
    
    // 将报价按母版分组
    function groupQuotationsByParent(quotations: AnyQuotationBrief[]) {
        const groups = new Map<number | string, GroupedQuotation>();
        const independent: AnyQuotationBrief[] = [];
        let variantCount = 0;
        
        for (const q of quotations) {
            // 如果是变体且有母版，放入对应组
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
                        expanded: false
                    });
                }
                groups.get(key)!.quotations.push(q);
            }
            // 如果是母版本身
            else if (q.is_variant_template) {
                variantCount++;
                const key = q.item || `template-${q.id}`;
                if (!groups.has(key)) {
                    groups.set(key, {
                        parentId: typeof q.item === 'number' ? q.item : null,
                        parentName: q.item_name || '母版',
                        parentSku: q.item_sku || '-',
                        isTemplate: true,
                        quotations: [],
                        expanded: false
                    });
                }
                groups.get(key)!.quotations.push(q);
            }
            // 独立的普通item - 单独收集，不平铺
            else {
                independent.push(q);
            }
        }
        
        hasVariants = variantCount > 0 || groups.size > 0;
        groupedQuotations = Array.from(groups.values());
        independentQuotations = independent;
    }
    
    function toggleGroup(index: number) {
        groupedQuotations[index].expanded = !groupedQuotations[index].expanded;
    }
    
    $effect(() => {
        if (sortedQuotations.length > 0) {
            groupQuotationsByParent(sortedQuotations);
        }
    });
</script>

<div class="py-4 border-t border-gray-200">
    <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
            <h2 class="text-lg font-medium text-gray-800">{title}</h2>
            <a 
                href={addHref} 
                class="inline-flex items-center px-2.5 py-1 text-sm font-medium text-white bg-green-300 hover:bg-green-400 rounded-md transition-colors shadow-sm"
            >
                添加报价
            </a>
        </div>
        <button 
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
            onclick={onCreateOrder}
        >
            新建订单
        </button>
    </div>
    
    {#if loading}
        <Loading text="加载报价..." />
    {:else if quotations.length === 0}
        <div class="text-center py-8 text-gray-500">
            <p>{emptyText}</p>
        </div>
    {:else}
        <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
                <thead>
                    <tr>
                        {#if hasVariants}
                            <th class="px-2 py-2 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200 w-8"></th>
                        {/if}
                        <SortableHeader title="SKU" columnKey="item_sku" sortable sortKey={sortKey} sortDirection={sortDir} onSort={(k) => toggleSort(k as QuotationSortKey)} headerClass="px-2 py-2 bg-gray-50 border-b border-gray-200" />
                        <SortableHeader title="物品名称" columnKey="item_name" sortable sortKey={sortKey} sortDirection={sortDir} onSort={(k) => toggleSort(k as QuotationSortKey)} headerClass="px-2 py-2 bg-gray-50 border-b border-gray-200" />
                        <SortableHeader title="合作方SKU" columnKey="partner_sku" sortable sortKey={sortKey} sortDirection={sortDir} onSort={(k) => toggleSort(k as QuotationSortKey)} headerClass="px-2 py-2 bg-gray-50 border-b border-gray-200" />
                        <SortableHeader title="库存数量" columnKey="item_total_storage" sortable sortKey={sortKey} sortDirection={sortDir} onSort={(k) => toggleSort(k as QuotationSortKey)} align="right" headerClass="px-2 py-2 bg-gray-50 border-b border-gray-200" />
                        <SortableHeader title={"单价" + (currency ? `（${currency}）` : '')} columnKey="price" sortable sortKey={sortKey} sortDirection={sortDir} onSort={(k) => toggleSort(k as QuotationSortKey)} align="right" headerClass="px-2 py-2 bg-gray-50 border-b border-gray-200" />
                        <th class="px-2 py-2 text-right font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">数量</th>
                        <SortableHeader title="状态" columnKey="is_preferred" sortable sortKey={sortKey} sortDirection={sortDir} onSort={(k) => toggleSort(k as QuotationSortKey)} align="center" headerClass="px-2 py-2 bg-gray-50 border-b border-gray-200" />
                    </tr>
                </thead>
                <tbody>
                    {#if hasVariants}
                        <!-- 有变体时显示折叠结构 -->
                        {#each groupedQuotations as group, groupIndex}
                            <!-- 母版/分组行 -->
                            <tr class="bg-slate-50 cursor-pointer transition-colors duration-200 hover:bg-slate-100" onclick={() => toggleGroup(groupIndex)}>
                                <td class="px-2 py-2 text-slate-500">
                                    <svg class="w-4 h-4 transition-transform {group.expanded ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </td>
                                <td class="px-2 py-2 font-medium">
                                    {group.parentSku}
                                    {#if group.isTemplate}
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-medium ml-1.5 bg-purple-200 text-purple-700">母版</span>
                                    {:else if group.parentId}
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-medium ml-1.5 bg-blue-200 text-blue-600">变体组</span>
                                    {/if}
                                </td>
                                <td class="px-2 py-2 text-gray-600">{group.parentName}</td>
                                <td class="px-2 py-2 text-right" colspan="4">
                                    <span class="text-xs text-gray-500">{group.quotations.length} 个报价</span>
                                </td>
                            </tr>
                            <!-- 变体/报价详情行 -->
                            {#if group.expanded}
                                {#each group.quotations as quotation}
                                    <QuotationRow
                                        quotation={quotation}
                                        currencySymbol={currencySymbol}
                                        quantity={quotationQuantities[quotation.id] ?? null}
                                        onRowClick={onRowClick}
                                        onQuantityChange={onQuantityChange}
                                        showLeftBorder
                                        skuCellClass="px-2 py-1.5 pl-8 text-gray-600 cursor-pointer hover:text-blue-600 hover:underline"
                                    />
                                {/each}
                            {/if}
                        {/each}
                        <!-- 独立物品直接平铺显示（不折叠） -->
                        {#each independentQuotations as quotation}
                            <QuotationRow
                                quotation={quotation}
                                currencySymbol={currencySymbol}
                                quantity={quotationQuantities[quotation.id] ?? null}
                                onRowClick={onRowClick}
                                onQuantityChange={onQuantityChange}
                                showLeftBorder
                                skuCellClass="px-2 py-1.5 pl-8 text-gray-600 cursor-pointer hover:text-blue-600 hover:underline"
                            />
                        {/each}
                    {:else}
                        <!-- 无变体时直接平铺显示 -->
                        {#each sortedQuotations as quotation}
                            <QuotationRow
                                quotation={quotation}
                                currencySymbol={currencySymbol}
                                quantity={quotationQuantities[quotation.id] ?? null}
                                onRowClick={onRowClick}
                                onQuantityChange={onQuantityChange}
                            />
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
        <div class="mt-4 flex justify-end">
            <button 
                class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
                onclick={onCreateOrder}
            >
                新建订单
            </button>
        </div>
    {/if}
</div>

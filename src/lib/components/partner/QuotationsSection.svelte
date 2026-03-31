<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';
    import Loading from '$lib/components/Loading.svelte';

    interface Quotation {
        id: number;
        item?: number | null;
        sku?: string;
        item_sku?: string;
        item_name?: string;
        price?: string;
        currency?: string;
        // 变体相关字段
        is_variant_template?: boolean;
        is_variant?: boolean;
        parent_item_id?: number | null;
        parent_item_name?: string | null;
        parent_item_sku?: string | null;
    }
    
    interface GroupedQuotation {
        parentId: number | null;
        parentName: string;
        parentSku: string;
        isTemplate: boolean;
        quotations: Quotation[];
        expanded: boolean;
    }
    
    interface Props {
        title: string;
        quotations: Quotation[];
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
    let independentQuotations = $state<Quotation[]>([]);
    let hasVariants = $state(false);
    
    // 将报价按母版分组
    function groupQuotationsByParent(quotations: Quotation[]) {
        const groups = new Map<number | string, GroupedQuotation>();
        const independent: Quotation[] = [];
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
        if (quotations.length > 0) {
            groupQuotationsByParent(quotations);
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
                        <th class="px-2 py-2 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">SKU</th>
                        <th class="px-2 py-2 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">物品名称</th>
                        <th class="px-2 py-2 text-right font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">单价{currency ? `（${currency}）` : ''}</th>
                        <th class="px-2 py-2 text-right font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">数量</th>
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
                                <td class="px-2 py-2 text-right" colspan="3">
                                    <span class="text-xs text-gray-500">{group.quotations.length} 个报价</span>
                                </td>
                            </tr>
                            <!-- 变体/报价详情行 -->
                            {#if group.expanded}
                                {#each group.quotations as quotation}
                                    <tr class="bg-white">
                                        <td class="px-2 py-1.5 border-l-[3px] border-slate-200"></td>
                                        <td class="px-2 py-1.5 pl-8 text-gray-600 cursor-pointer hover:text-blue-600 hover:underline" onclick={() => onRowClick(quotation.id)}>{quotation.item_sku || '-'}</td>
                                        <td class="px-2 py-1.5 text-gray-600">{quotation.item_name || '-'}</td>
                                        <td class="px-2 py-1.5 text-gray-600 text-right font-mono">{currencySymbol}{quotation.price}</td>
                                        <td class="px-2 py-1.5 text-right">
                                            <NumberStepper
                                                value={quotationQuantities[quotation.id] ?? undefined}
                                                step={1}
                                                decimalPlaces={0}
                                                size="sm"
                                                onchange={(value) => onQuantityChange(quotation.id, value ?? null)}
                                            />
                                        </td>
                                    </tr>
                                {/each}
                            {/if}
                        {/each}
                        <!-- 独立物品直接平铺显示（不折叠） -->
                        {#each independentQuotations as quotation}
                            <tr class="border-b border-gray-200">
                                <td class="px-2 py-1.5 border-l-[3px] border-slate-200"></td>
                                <td class="px-2 py-1.5 pl-8 text-gray-600 cursor-pointer hover:text-blue-600 hover:underline" onclick={() => onRowClick(quotation.id)}>{quotation.item_sku || '-'}</td>
                                <td class="px-2 py-1.5 text-gray-600">{quotation.item_name || '-'}</td>
                                <td class="px-2 py-1.5 text-gray-600 text-right font-mono">{currencySymbol}{quotation.price}</td>
                                <td class="px-2 py-1.5 text-right">
                                    <NumberStepper
                                        value={quotationQuantities[quotation.id] ?? undefined}
                                        step={1}
                                        decimalPlaces={0}
                                        size="sm"
                                        onchange={(value) => onQuantityChange(quotation.id, value ?? null)}
                                    />
                                </td>
                            </tr>
                        {/each}
                    {:else}
                        <!-- 无变体时直接平铺显示 -->
                        {#each quotations as quotation}
                            <tr class="border-b border-gray-200">
                                <td class="px-2 py-1.5 text-gray-600 cursor-pointer hover:text-blue-600 hover:underline" onclick={() => onRowClick(quotation.id)}>{quotation.item_sku || '-'}</td>
                                <td class="px-2 py-1.5 text-gray-600">{quotation.item_name || '-'}</td>
                                <td class="px-2 py-1.5 text-gray-600 text-right font-mono">{currencySymbol}{quotation.price}</td>
                                <td class="px-2 py-1.5 text-right">
                                    <NumberStepper
                                        value={quotationQuantities[quotation.id] ?? undefined}
                                        step={1}
                                        decimalPlaces={0}
                                        size="sm"
                                        onchange={(value) => onQuantityChange(quotation.id, value ?? null)}
                                    />
                                </td>
                            </tr>
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

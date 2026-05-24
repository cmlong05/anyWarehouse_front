<script lang="ts">
    import type { OrderFormItem } from '$lib/composables/useOrderForm.svelte';
    import {  formatNumber } from '$lib/utils';
    import { getCurrencySymbol } from '$lib/utils/formatters';
    import { NumberStepper } from '$lib/components/ui';
    import Svelecte from 'svelecte';
    import VariantAttributeBadge from '$lib/components/VariantAttributeBadge.svelte';
    import { isVariantChild, getVariantParentId } from '$lib/utils/variant';

    interface QuotationOption {
        value: number;
        label: string;
        quotation: unknown;
    }

    type SectionType = 'parent' | 'variant' | 'normal';

    interface GroupedSection {
        type: SectionType;
        item: OrderFormItem;
        originalIndex: number;
        parentId?: string;
        variantIndex?: number;
        variantCount?: number;
        children?: OrderFormItem[];
    }

    interface Props {
        items: OrderFormItem[];
        quotationOptions: QuotationOption[];
        selectedQuotation: QuotationOption | undefined;
        currentItemQuantity: number;
        currentItemUnitPrice: number;
        itemErrors: { quotation?: string; quantity?: string; unit_price?: string };
        errors: { items?: string };
        loading: boolean;
        loadingQuotations: boolean;
        orderCurrency: string;
        subtotal: number;
        onItemSelect: (selected: QuotationOption | undefined) => void;
        onAddItem: () => void;
        onUpdateItem: (index: number, field: string, value: unknown) => void;
        onRemoveItem: (index: number, item: OrderFormItem) => void;
        onCurrentItemQuantityChange: (v: number | null | undefined) => void;
        onCurrentItemUnitPriceChange: (v: number | null | undefined) => void;
    }

    let {
        items,
        quotationOptions,
        selectedQuotation = $bindable(),
        currentItemQuantity,
        currentItemUnitPrice,
        itemErrors,
        errors,
        loading,
        loadingQuotations,
        orderCurrency,
        subtotal,
        onItemSelect,
        onAddItem,
        onUpdateItem,
        onRemoveItem,
        onCurrentItemQuantityChange,
        onCurrentItemUnitPriceChange,
    }: Props = $props();

    const addedSkus = $derived(new Set(items.map(item => item.sku).filter(Boolean)));
    const filteredQuotationOptions = $derived(
        quotationOptions.filter(opt => {
            const q = opt.quotation as { item_sku?: string };
            return !addedSkus.has(q.item_sku);
        })
    );

    const quantityMin = 1;
    const variantQuantityMin = 0;
    const quantityStep = 1;
    const quantityDecimals = 0;

    let collapsedParents = $state<Record<string, boolean>>({});

    function isParentCollapsed(parentId: string) {
        return collapsedParents[parentId] !== false;
    }

    function toggleParent(parentId: string) {
        collapsedParents = { ...collapsedParents, [parentId]: !isParentCollapsed(parentId) };
    }

    function handleItemSelectInternal(selected: QuotationOption | undefined) {
        selectedQuotation = selected;
        onItemSelect(selected);
    }

    function getGroupedSections(items: OrderFormItem[]): GroupedSection[] {
        const childrenByParent = new Map<string, Array<{ item: OrderFormItem; originalIndex: number }>>();
        const parentMeta = new Map<string, { parentSku?: string; parentName?: string }>();

        items.forEach((item, index) => {
            if (item.parentId) {
                const group = childrenByParent.get(item.parentId) || [];
                group.push({ item, originalIndex: index });
                childrenByParent.set(item.parentId, group);
                return;
            }

            if (isVariantChild(item)) {
                const detailParentId = getVariantParentId(item);
                if (detailParentId !== null) {
                    const key = `parent_${detailParentId}`;
                    const group = childrenByParent.get(key) || [];
                    group.push({ item, originalIndex: index });
                    childrenByParent.set(key, group);
                    parentMeta.set(key, {
                        parentSku: item.item_detail?.parent_item_sku || '',
                        parentName: item.item_detail?.parent_item_name || '',
                    });
                    return;
                }
            }
        });

        const sections: GroupedSection[] = [];
        const usedIndexes = new Set<number>();

        for (const [parentKey, children] of childrenByParent) {
            const explicitParent = items.find((item) => item.id === parentKey);
            if (explicitParent) {
                const parentIndex = items.findIndex((item) => item.id === parentKey);
                sections.push({
                    type: 'parent',
                    item: explicitParent,
                    originalIndex: parentIndex,
                    parentId: parentKey,
                    variantCount: children.length,
                    children: children.map((child) => child.item),
                });
                usedIndexes.add(parentIndex);
            } else {
                const child = children[0].item;
                const meta = parentMeta.get(parentKey);
                sections.push({
                    type: 'parent',
                    item: {
                        ...child,
                        sku: meta?.parentSku || child.sku,
                        item_name: meta?.parentName || child.item_name,
                        quantity: 0,
                        unit_price: child.unit_price,
                    },
                    originalIndex: children[0].originalIndex,
                    parentId: parentKey,
                    variantCount: children.length,
                    children: children.map((child) => child.item),
                });
                usedIndexes.add(children[0].originalIndex);
            }

            children.forEach((child, index) => {
                sections.push({
                    type: 'variant',
                    item: child.item,
                    originalIndex: child.originalIndex,
                    parentId: parentKey,
                    variantIndex: index + 1,
                });
                usedIndexes.add(child.originalIndex);
            });
        }

        items.forEach((item, index) => {
            if (!usedIndexes.has(index)) {
                sections.push({
                    type: 'normal',
                    item,
                    originalIndex: index,
                });
            }
        });

        return sections;
    }

    const groupedSections = $derived.by(() =>
        getGroupedSections(items).filter((section) =>
            !(section.type === 'variant' && section.parentId && isParentCollapsed(section.parentId))
        )
    );

    const displayLineLabels = $derived.by(() => {
        const labels = new Map<GroupedSection, string>();
        const parentLabels = new Map<string, string>();
        let topLevel = 0;

        for (const section of groupedSections) {
            if (section.type === 'parent' && section.parentId) {
                topLevel += 1;
                const label = String(topLevel);
                labels.set(section, label);
                parentLabels.set(section.parentId, label);
            } else if (section.type === 'variant' && section.parentId) {
                const prefix = parentLabels.get(section.parentId) ?? String(topLevel);
                labels.set(section, `${prefix}.${section.variantIndex ?? 1}`);
            } else {
                topLevel += 1;
                labels.set(section, String(topLevel));
            }
        }

        return labels;
    });

    function getDisplayLineLabel(section: GroupedSection) {
        return displayLineLabels.get(section) ?? String(section.originalIndex + 1);
    }

    function getParentSummary(section: GroupedSection) {
        const children = section.children || [];
        const quantity = children.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const total = children.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
        const avgUnit = quantity > 0 ? total / quantity : children.length > 0 ? children.reduce((sum, item) => sum + Number(item.unit_price || 0), 0) / children.length : 0;
        return { quantity, total, avgUnit };
    }

    function handleSectionRowClick(section: GroupedSection) {
        if (section.type === 'parent' && section.parentId) {
            toggleParent(section.parentId);
        }
    }

    function getRowClass(section: GroupedSection): string {
        if (section.type === 'variant') {
            return 'bg-sky-50/70 hover:bg-sky-100/80';
        }
        if (section.type === 'parent') {
            return 'bg-amber-50 hover:bg-amber-100/90 font-medium cursor-pointer';
        }
        return 'hover:bg-gray-50';
    }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900">订单明细</h3>
    </div>

    <!-- 添加明细表单 -->
    <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <div class="flex flex-wrap items-end gap-3">
            <div class="flex-1 min-w-[280px] space-y-1.5">
                <label for="item-select" class="text-sm font-medium text-gray-700">
                    选择SKU <span class="text-red-500">*</span>
                </label>
                {#if filteredQuotationOptions.length === 0}
                    <div class="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500">
                        所有SKU已添加完毕
                    </div>
                {:else}
                    {#key selectedQuotation}
                        <Svelecte
                            inputId="item-select"
                            options={filteredQuotationOptions}
                            value={selectedQuotation}
                            valueAsObject={true}
                            placeholder={loadingQuotations ? '加载中...' : '搜索SKU或物品名称...'}
                            searchable={true}
                            clearable={true}
                            disabled={loading || loadingQuotations}
                            onChange={handleItemSelectInternal}
                        />
                    {/key}
                {/if}
                {#if itemErrors.quotation}
                    <span class="text-xs text-red-500">{itemErrors.quotation}</span>
                {/if}
            </div>

            <div class="w-28 space-y-1.5">
                <label for="item-quantity" class="text-sm font-medium text-gray-700">数量</label>
                <NumberStepper
                    value={currentItemQuantity}
                    min={quantityMin}
                    step={quantityStep}
                    decimalPlaces={quantityDecimals}
                    size="md"
                    disabled={loading}
                    onchange={onCurrentItemQuantityChange}
                />
                {#if itemErrors.quantity}
                    <span class="text-xs text-red-500">{itemErrors.quantity}</span>
                {/if}
            </div>

            <div class="w-32 space-y-1.5">
                <label for="item-price" class="text-sm font-medium text-gray-700">单价</label>
                <NumberStepper
                    value={currentItemUnitPrice}
                    min={0}
                    step={0.01}
                    size="md"
                    disabled={loading}
                    onchange={onCurrentItemUnitPriceChange}
                />
                {#if itemErrors.unit_price}
                    <span class="text-xs text-red-500">{itemErrors.unit_price}</span>
                {/if}
            </div>

            <div class="pb-0.5">
                <button
                    type="button"
                    class="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onclick={onAddItem}
                    disabled={loading}
                >
                    添加
                </button>
            </div>
        </div>
    </div>

    <!-- 明细列表 -->
    {#if groupedSections.length > 0}
        <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="w-full text-sm border-collapse">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-700">#</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-700">SKU</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-700">物品名称</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-700">数量</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-700">单价</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-700">小计</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-700 w-16">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each groupedSections as section}
                        {@const item = section.item}
                        {@const summary = section.type === 'parent' ? getParentSummary(section) : null}
                        <tr class="{getRowClass(section)} transition-colors" onclick={() => handleSectionRowClick(section)}>
                            <td class="px-4 py-3 text-left text-gray-700 align-top">
                                {#if section.type === 'parent' && section.parentId}
                                    <div class="inline-flex items-center gap-1 text-sm text-gray-700">
                                        <svg
                                            class="w-4 h-4 transition-transform {isParentCollapsed(section.parentId!) ? '' : 'rotate-90'}"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span>{getDisplayLineLabel(section)}</span>
                                    </div>
                                {:else}
                                    <span>{getDisplayLineLabel(section)}</span>
                                {/if}
                            </td>
                            <td class="px-4 py-3 align-top">
                                {#if section.type === 'variant'}
                                    <div class="flex items-center gap-2 pl-4">
                                        <span class="font-mono text-xs text-gray-600">{item.sku || '-'}</span>
                                        <span class="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-xs rounded">变体</span>
                                    </div>
                                {:else if section.type === 'parent'}
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono text-xs text-gray-700">{item.sku || '-'}</span>
                                        <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">母版</span>
                                    </div>
                                {:else}
                                    <span class="font-mono text-xs text-gray-600">{item.sku || '-'}</span>
                                {/if}
                            </td>
                            <td class="px-4 py-3 align-top">
                                {#if section.type === 'variant'}
                                    <div class="space-y-1">
                                        <div class="text-gray-900">{item.item_name || '-'}</div>
                                        <VariantAttributeBadge attributes={item.variantAttributes || []} class="mt-0.5" />
                                    </div>
                                {:else if section.type === 'parent'}
                                    <div class="text-gray-700">{item.item_name || '-'}</div>
                                    <div class="text-xs text-gray-500">{section.variantCount} 个变体</div>
                                {:else}
                                    <span class="text-gray-900">{item.item_name || '-'}</span>
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-right align-top">
                                {#if section.type === 'parent'}
                                    <span class="text-gray-700">{summary && summary.quantity > 0 ? formatNumber(summary.quantity) : '-'}</span>
                                {:else}
                                    <NumberStepper
                                        value={item.quantity}
                                        min={section.type === 'variant' ? variantQuantityMin : quantityMin}
                                        step={quantityStep}
                                        decimalPlaces={quantityDecimals}
                                        size="sm"
                                        disabled={loading}
                                        onchange={(v) => onUpdateItem(section.originalIndex, 'quantity', v)}
                                    />
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-right align-top">
                                {#if section.type === 'parent'}
                                    <span class="text-gray-700">{summary && summary.quantity > 0 ? `${getCurrencySymbol(orderCurrency)}${summary.avgUnit.toFixed(2)}` : '-'}</span>
                                {:else}
                                    <NumberStepper
                                        value={item.unit_price}
                                        min={0}
                                        step={0.01}
                                        size="sm"
                                        disabled={loading}
                                        onchange={(v) => onUpdateItem(section.originalIndex, 'unit_price', v)}
                                    />
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-right align-top font-medium text-gray-900">
                                {#if section.type === 'parent'}
                                    <span>{summary ? `${getCurrencySymbol(orderCurrency)}${summary.total.toFixed(2)}` : '-'}</span>
                                {:else}
                                    <span>{getCurrencySymbol(orderCurrency)}{(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)}</span>
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-center align-top">
                                <button
                                    type="button"
                                    class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    onclick={(event) => { event.stopPropagation(); onRemoveItem(section.originalIndex, item); }}
                                    disabled={loading}
                                    title="删除"
                                    aria-label="删除此明细项"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
                <tfoot class="bg-gray-50 font-medium">
                    <tr>
                        <td colspan="5" class="px-4 py-3 text-right text-gray-700">汇总:</td>
                        <td class="px-4 py-3 text-right text-gray-900">{getCurrencySymbol(orderCurrency)}{subtotal.toFixed(2)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    {:else}
        <div class="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>暂无明细项，请在上方添加</p>
            {#if errors.items}
                <span class="text-xs text-red-500 mt-2 block">{errors.items}</span>
            {/if}
        </div>
    {/if}
</div>

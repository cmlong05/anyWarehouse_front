<!-- 报价区块 -->
<!--
被依赖：
- `lib/components/partner/index.ts`
- `routes/customer/[id]/+page.svelte`
- `routes/supplier/[slug]/+page.svelte`
-->
<script lang="ts">
    import { Loading } from '$lib/components';
    import DataTable from '$lib/components/ui/DataTable.svelte';
    import { NumberStepper } from '$lib/components/ui';
    import { formatNumber, safeParseFloat } from '$lib/utils';
    import { toggleSortKey } from '$lib/utils/sort';
    import type { CustomerQuotationBrief, QuotationBrief } from '$lib';

    type AnyQuotationBrief = QuotationBrief | CustomerQuotationBrief;

    interface GroupDefinition {
        key: string;
        parentId: number | null;
        parentSku: string;
        parentName: string;
        isTemplate: boolean;
        parentQuotation?: AnyQuotationBrief;
        quotations: AnyQuotationBrief[];
    }

    interface DisplayRow {
        type: 'group' | 'quotation' | 'normal';
        id: number;
        displayNumber: string;
        groupKey?: string;
        group?: GroupDefinition;
        quotation?: AnyQuotationBrief;
    }

    interface Props {
        title: string;
        quotations: AnyQuotationBrief[];
        loading: boolean;
        emptyText: string;
        addHref: string;
        currency?: string;
        showStatus?: boolean;
        quotationQuantities: Record<number, number | null>;
        onQuantityChange: (id: number, value: number | null) => void;
        onRowClick: (id: number) => void;
        onCreateOrder: () => void;
    }

    interface TableColumn {
        key: string;
        title: string;
        sortable: boolean;
        align: 'left' | 'center' | 'right';
        headerClass: string;
        cellClass?: string;
    }

    let {
        title,
        quotations,
        loading,
        emptyText,
        addHref,
        currency,
        showStatus = true,
        quotationQuantities,
        onQuantityChange,
        onRowClick,
        onCreateOrder
    }: Props = $props();

    const CURRENCY_SYMBOLS: Record<string, string> = {
        USD: '$',
        CNY: '¥',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        HKD: 'HK$',
        TWD: 'NT$'
    };
    const currencySymbol = $derived(currency ? (CURRENCY_SYMBOLS[currency] ?? currency) : '');

    type QuotationSortKey = 'item_sku' | 'item_name' | 'partner_sku' | 'quantity_on_order' | 'item_total_storage' | 'price' | 'is_preferred';
    let sortKey = $state<QuotationSortKey>('item_sku');
    let sortDir = $state<'asc' | 'desc'>('asc');

    function toggleSort(key: QuotationSortKey) {
        const next = toggleSortKey(sortKey, sortDir, key);
        sortKey = next.sortKey as QuotationSortKey;
        sortDir = next.sortDirection;
    }

    const sortedQuotations = $derived.by(() => {
        return [...quotations].sort((a, b) => {
            let valueA: number | string;
            let valueB: number | string;

            if (sortKey === 'quantity_on_order') {
                valueA = a.quantity_on_order ?? 0;
                valueB = b.quantity_on_order ?? 0;
            } else if (sortKey === 'item_total_storage') {
                valueA = a.item_total_storage ?? -1;
                valueB = b.item_total_storage ?? -1;
            } else if (sortKey === 'price') {
                valueA = parseFloat(a.price || '0');
                valueB = parseFloat(b.price || '0');
            } else if (sortKey === 'is_preferred') {
                valueA = a.is_preferred ? 1 : 0;
                valueB = b.is_preferred ? 1 : 0;
            } else {
                valueA = String((a as unknown as Record<string, unknown>)[sortKey] ?? '');
                valueB = String((b as unknown as Record<string, unknown>)[sortKey] ?? '');
            }

            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return sortDir === 'asc' ? valueA - valueB : valueB - valueA;
            }

            return String(valueA).localeCompare(String(valueB), 'zh-CN', { numeric: true, sensitivity: 'base' }) * (sortDir === 'asc' ? 1 : -1);
        });
    });

    let collapsedGroups = $state<Record<string, boolean>>({});

    function isGroupCollapsed(key: string): boolean {
        return collapsedGroups[key] !== false;
    }

    function toggleGroup(key: string) {
        collapsedGroups = { ...collapsedGroups, [key]: !isGroupCollapsed(key) };
    }

    function getGroupKey(quotation: AnyQuotationBrief): string | null {
        if (quotation.is_variant && quotation.parent_item_id) {
            return `parent-${quotation.parent_item_id}`;
        }

        if (quotation.is_variant_template) {
            return `template-${typeof quotation.item === 'number' ? quotation.item : quotation.id}`;
        }

        return null;
    }

    function createSummaryQuotation(group: GroupDefinition): AnyQuotationBrief {
        const base = group.parentQuotation ?? group.quotations[0];

        if (!base) {
            return {
                id: group.parentId ?? 0,
                item: group.parentId,
                customer: 0,
                price: '0',
                currency: currency ?? '',
                min_quantity: 0,
                lead_time_days: null,
                valid_from: null,
                valid_until: null,
                is_preferred: false,
                note: '',
                created_at: '',
                updated_at: '',
                item_sku: group.parentSku,
                item_name: group.parentName,
            } as unknown as AnyQuotationBrief;
        }

        const totalQuantityOnOrder = group.quotations.reduce((sum, quotation) => sum + safeParseFloat(quotation.quantity_on_order), 0);
        const totalStorage = group.quotations.reduce((sum, quotation) => sum + safeParseFloat(quotation.item_total_storage), 0);

        return {
            ...base,
            item_sku: group.parentSku || base.item_sku,
            item_name: group.parentName || base.item_name,
            quantity_on_order: totalQuantityOnOrder,
            item_total_storage: totalStorage,
        } as AnyQuotationBrief;
    }

    const displayRows = $derived.by<DisplayRow[]>(() => {
        const groups = new Map<string, GroupDefinition>();

        for (const quotation of sortedQuotations) {
            const key = getGroupKey(quotation);
            if (!key) continue;

            if (!groups.has(key)) {
                groups.set(key, {
                    key,
                    parentId: quotation.is_variant ? quotation.parent_item_id ?? null : typeof quotation.item === 'number' ? quotation.item : null,
                    parentSku: quotation.is_variant ? quotation.parent_item_sku || '-' : quotation.item_sku || '-',
                    parentName: quotation.is_variant ? quotation.parent_item_name || '母版' : quotation.item_name || '母版',
                    isTemplate: !!quotation.is_variant_template,
                    quotations: []
                });
            }

            const group = groups.get(key)!;
            group.quotations.push(quotation);

            if (quotation.is_variant_template) {
                group.isTemplate = true;
                group.parentQuotation = quotation;
                group.parentId = typeof quotation.item === 'number' ? quotation.item : group.parentId;
                group.parentSku = quotation.item_sku || group.parentSku;
                group.parentName = quotation.item_name || group.parentName;
            }
        }

        const rows: DisplayRow[] = [];
        const emitted = new Set<string>();
        let topLevelIndex = 0;

        for (const quotation of sortedQuotations) {
            const key = getGroupKey(quotation);

            if (!key) {
                topLevelIndex += 1;
                rows.push({
                    type: 'normal',
                    id: quotation.id,
                    displayNumber: String(topLevelIndex),
                    quotation,
                });
                continue;
            }

            const group = groups.get(key);
            if (!group || emitted.has(key)) {
                continue;
            }

            emitted.add(key);
            topLevelIndex += 1;

            rows.push({
                type: 'group',
                id: group.parentQuotation?.id ?? group.parentId ?? quotation.id,
                displayNumber: String(topLevelIndex),
                groupKey: key,
                group,
                quotation: createSummaryQuotation(group),
            });

            if (!isGroupCollapsed(key)) {
                const childQuotations = group.quotations.filter((item) => item.id !== group.parentQuotation?.id);

                childQuotations.forEach((childQuotation, index) => {
                    rows.push({
                        type: 'quotation',
                        id: childQuotation.id,
                        displayNumber: `${topLevelIndex}.${index + 1}`,
                        groupKey: key,
                        group,
                        quotation: childQuotation,
                    });
                });
            }
        }

        return rows;
    });

    function getRowClass(row: DisplayRow): string {
        if (row.type === 'group') {
            if (row.group?.parentId) {
                return 'bg-amber-50 hover:bg-amber-100/90 font-medium cursor-pointer';
            }
            if (row.group?.isTemplate) {
                return 'bg-amber-50 hover:bg-amber-100/90 font-medium cursor-pointer';
            }
            return 'bg-slate-50 hover:bg-slate-100 font-medium cursor-pointer';
        }

        if (row.type === 'quotation' && row.group?.parentId) {
            return 'bg-sky-50/70 hover:bg-sky-100/80 cursor-default';
        }

        return 'cursor-default';
    }

    const columns = $derived.by(() => {
        const baseColumns: TableColumn[] = [
            { key: 'line_number', title: '#', sortable: true, align: 'left' as const, headerClass: 'border-b border-gray-100 bg-gray-50 font-semibold cursor-pointer', cellClass: 'relative' },
            { key: 'item_sku', title: 'SKU', sortable: true, align: 'left' as const, headerClass: 'border-b border-gray-100 bg-gray-50 font-semibold cursor-pointer', cellClass: 'font-mono' },
            { key: 'item_name', title: '物品名称', sortable: true, align: 'left' as const, headerClass: 'border-b border-gray-100 bg-gray-50 font-semibold cursor-pointer whitespace-nowrap', cellClass: 'whitespace-nowrap' },
            { key: 'partner_sku', title: '合作方SKU', sortable: true, align: 'left' as const, headerClass: 'border-b border-gray-100 bg-gray-50 font-semibold cursor-pointer' },
            { key: 'quantity_on_order', title: '在途', sortable: true, align: 'right' as const, headerClass: 'border-b border-gray-100 bg-gray-50 font-semibold cursor-pointer' },
            { key: 'item_total_storage', title: '库存数量', sortable: true, align: 'right' as const, headerClass: 'border-b border-gray-100 bg-gray-50 font-semibold cursor-pointer' },
            { key: 'price', title: `单价${currency ? `（${currency}）` : ''}`, sortable: true, align: 'right' as const, headerClass: 'border-b border-gray-100 bg-gray-50 font-semibold cursor-pointer' },
            { key: 'quantity', title: '数量', sortable: false, align: 'right' as const, headerClass: 'border-b border-gray-100 bg-gray-50 font-semibold cursor-pointer' },
        ];

        if (showStatus) {
            baseColumns.push({
                key: 'status',
                title: '状态',
                sortable: false,
                align: 'center' as const,
                headerClass: 'border-b border-gray-100 bg-gray-50 font-semibold cursor-pointer'
            });
        }

        return baseColumns;
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
            <DataTable
                data={displayRows}
                {columns}
                rowClass={getRowClass}
                sortKey={sortKey as string}
                sortDirection={sortDir}
                onHeaderClick={(key) => toggleSort(key as QuotationSortKey)}
                clickable={true}
                onRowClick={(row) => {
                    if (row.type === 'group' && row.groupKey) {
                        toggleGroup(row.groupKey);
                        return;
                    }

                    if (row.quotation) {
                        onRowClick(row.quotation.id);
                    }
                }}
                rowHover={false}
                loading={false}
                emptyText={emptyText}
                wrapperClass="bg-transparent shadow-none rounded-none"
                tableClass="w-full border-collapse text-sm"
            >
                {#snippet cellRender({ item: row, column }: { item: DisplayRow; column: { key: string }; value: unknown })}
                    {@const quotation = row.quotation}

                    {#if column.key === 'line_number'}
                        {#if row.type === 'group' && row.groupKey && row.group}
                            {@const collapsed = isGroupCollapsed(row.groupKey)}
                            <div>
                                <span class={row.group.isTemplate || row.group.parentId ? 'absolute inset-y-0 left-0 w-1 bg-amber-500' : 'absolute inset-y-0 left-0 w-1 bg-slate-300'}></span>
                                <button
                                    type="button"
                                    class="inline-flex items-center gap-0.5 cursor-pointer hover:text-blue-600 transition-colors"
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        toggleGroup(row.groupKey!);
                                    }}
                                    title={collapsed ? '展开' : '折叠'}
                                >
                                    <svg class="w-4 h-4 {row.group.isTemplate || row.group.parentId ? 'text-amber-700' : ''} transition-transform {collapsed ? '' : 'rotate-90'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span>{row.displayNumber}</span>
                                </button>
                            </div>
                        {:else if row.type === 'quotation' && row.group?.parentId}
                            <div class="flex items-center gap-2 pl-2">
                                <span class="absolute inset-y-0 left-0 w-1 bg-sky-400/90"></span>
                                <span>{row.displayNumber}</span>
                            </div>
                        {:else}
                            {row.displayNumber}
                        {/if}
                    {:else if column.key === 'item_sku'}
                        {#if row.type === 'group' && row.group}
                            <div class="inline-flex items-center gap-1">
                                <span>{row.group.parentSku}</span>
                                {#if row.group.isTemplate}
                                    <span class="inline-flex items-center whitespace-nowrap px-1.5 py-0.5 rounded-full text-[0.625rem] font-medium bg-amber-200 text-amber-800">母版</span>
                                {/if}
                            </div>
                        {:else if quotation?.item}
                            <a
                                href="/item/{quotation.item}"
                                class="text-blue-600 hover:text-blue-700 hover:underline"
                                onclick={(e) => e.stopPropagation()}
                            >
                                {quotation.item_sku || '-'}
                            </a>
                        {:else}
                            {quotation?.item_sku || '-'}
                        {/if}
                    {:else if column.key === 'item_name'}
                        {#if row.type === 'group' && row.group}
                            {row.group.parentName}
                        {:else}
                            <div>
                                {quotation?.item_name || '-'}
                                {#if quotation?.note}
                                    <div class="text-xs text-gray-500 mt-1">备注：{quotation.note}</div>
                                {/if}
                            </div>
                        {/if}
                    {:else if column.key === 'partner_sku'}
                        {quotation?.partner_sku || '-'}
                    {:else if column.key === 'quantity_on_order'}
                        {#if quotation}
                            {formatNumber(quotation.quantity_on_order ?? 0)}
                        {:else}
                            -
                        {/if}
                    {:else if column.key === 'item_total_storage'}
                        {#if quotation}
                            {formatNumber(quotation.item_total_storage ?? 0)}
                        {:else}
                            -
                        {/if}
                    {:else if column.key === 'price'}
                        {#if quotation}
                            {currencySymbol}{safeParseFloat(quotation.price).toFixed(2)}
                        {:else}
                            -
                        {/if}
                    {:else if column.key === 'quantity'}
                        {#if row.type === 'group' && row.group}
                            <span class="text-sm text-gray-500">{row.group.quotations.length} 个报价</span>
                        {:else if quotation}
                                <NumberStepper
                                    value={quotationQuantities[quotation.id] ?? undefined}
                                    step={1}
                                    decimalPlaces={0}
                                    size="sm"
                                    onchange={(value) => onQuantityChange(quotation.id, value ?? null)}
                                />
                        {:else}
                            -
                        {/if}
                    {:else if column.key === 'status'}
                        {#if row.type === 'group' && row.group}
                            <span class="text-gray-400">-</span>
                        {:else if quotation}
                            {#if quotation.is_preferred}
                                <span title="首选" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-help">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </span>
                            {:else if quotation.is_unique_supplier}
                                <span title="唯一" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 cursor-help">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </span>
                            {:else}
                                <span class="text-gray-400">-</span>
                            {/if}
                        {:else}
                            -
                        {/if}
                    {:else}
                        -
                    {/if}
                {/snippet}
            </DataTable>
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
<script lang="ts">
    import { safeParseFloat, formatNumber } from '$lib/utils';
    import { localeStore } from '$lib/i18n/sales';

    import { 
        isVariantChild, 
        getVariantParentId, 
        getVariantAttributes,
        type VariantAttribute 
    } from '$lib/utils/variant';
    import VariantAttributeBadge from '$lib/components/VariantAttributeBadge.svelte';

    interface ItemDetail {
        id: number;
        name: string;
        name_en?: string;
        SKU: string;
        total_storage?: number;
        is_variant_template?: boolean;
        is_variant?: boolean;
        parent_item_id?: number | null;
        parent_item_name?: string;
        parent_item_sku?: string;
        variant_attributes?: VariantAttribute[];
    }

    interface OrderItem {
        line_number: number;
        sku: string;
        item_name: string;
        item_name_en?: string;
        quantity: string | number;
        quantity_shipped?: string | number;
        quantity_received?: string | number;
        quantity_pending?: string | number;
        unit_price?: string | number;
        line_total?: string | number;
        is_fully_shipped?: boolean;
        is_fully_received?: boolean;
        item_detail?: ItemDetail;
    }

    interface Labels {
        title?: string;
        itemName?: string;
        currentStock?: string;
        quantity?: string;
        shipped?: string;
        received?: string;
        pendingShip?: string;
        pendingReceive?: string;
        unitPrice?: string;
        subtotal?: string;
        status?: string;
        completed?: string;
        partial?: string;
        pending?: string;
        noItems?: string;
    }

    interface Props {
        items: OrderItem[];
        showPrices?: boolean;
        type: 'sales' | 'purchase';
        labels?: Labels;
        currency?: string;
        /**
         * 对单行执行“反向同步”（将订单数量减少到已发货数量）
         */
        onReverseSync?: (item: OrderItem) => Promise<void>;
        /**
         * 加载状态：key 为 SKU
         */
        reverseSyncLoading?: Record<string, boolean>;
    }
    
    let { items, showPrices = true, type, labels = {}, currency = 'CNY', onReverseSync, reverseSyncLoading = {} }: Props = $props();
    
    // 获取货币符号
    function getCurrencySymbol(curr: string): string {
        const symbols: Record<string, string> = {
            'CNY': '¥',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
        };
        return symbols[curr] || curr + ' ';
    }

    const defaultLabels: Labels = {
        title: '订单明细',
        itemName: '物品名称',
        currentStock: '现有库存',
        quantity: '数量',
        shipped: '已发货',
        received: '已到货',
        pendingShip: '待发货',
        pendingReceive: '待到货',
        unitPrice: '单价',
        subtotal: '小计',
        status: '状态',
        completed: '已完成',
        partial: '部分完成',
        pending: '待处理',
        noItems: '暂无明细',
    };

    // 使用 $derived 使标签对象具有响应性
    const l = $derived({ ...defaultLabels, ...labels });

    function getShippedQty(item: OrderItem): number {
        return safeParseFloat(type === 'sales' ? item.quantity_shipped : item.quantity_received);
    }

    function getPendingQty(item: OrderItem): number {
        return safeParseFloat(item.quantity_pending);
    }

    function isFullyProcessed(item: OrderItem): boolean {
        return type === 'sales' ? !!item.is_fully_shipped : !!item.is_fully_received;
    }

    function getCurrentStock(section: GroupedSection): number | null {
        if (section.type === 'parent') {
            const parentId = getVariantParentId(section.item);
            if (!parentId) return null;

            const variants = items.filter((item) => getVariantParentId(item) === parentId);
            return variants.reduce((sum, item) => sum + (item.item_detail?.total_storage || 0), 0);
        }

        return section.item.item_detail?.total_storage ?? null;
    }

    function isStockInsufficient(section: GroupedSection): boolean {
        const currentStock = getCurrentStock(section);
        if (currentStock === null) return false;

        const pending = getPendingQty(section.item);
        return pending > 0 && currentStock < pending;
    }

    // 按母版分组物品
    interface GroupedSection {
        type: 'parent' | 'variant' | 'normal';
        item: OrderItem;
        isFirstVariant?: boolean;
    }

    function getGroupedSections(items: OrderItem[]): GroupedSection[] {
        const result: GroupedSection[] = [];
        const processed = new Set<number>();
        
        // 先找出所有变体子项并按母版分组
        const variantsByParent = new Map<number, OrderItem[]>();
        const normalItems: OrderItem[] = [];
        
        for (const item of items) {
            if (isVariantChild(item)) {
                const parentId = getVariantParentId(item);
                if (parentId) {
                    if (!variantsByParent.has(parentId)) {
                        variantsByParent.set(parentId, []);
                    }
                    variantsByParent.get(parentId)!.push(item);
                } else {
                    normalItems.push(item);
                }
            } else {
                normalItems.push(item);
            }
        }
        
        // 按原始顺序处理物品
        for (const item of items) {
            if (processed.has(item.line_number)) continue;
            
            if (isVariantChild(item)) {
                const parentId = getVariantParentId(item);
                if (parentId && variantsByParent.has(parentId)) {
                    const variants = variantsByParent.get(parentId)!;
                    
                    // 插入母版行（汇总所有变体的信息）
                    const firstVariant = variants[0];
                    result.push({
                        type: 'parent',
                        item: {
                            ...firstVariant,
                            line_number: firstVariant.line_number,
                            sku: firstVariant.item_detail?.parent_item_sku || '',
                            item_name: firstVariant.item_detail?.parent_item_name || '',
                            quantity: variants.reduce((sum, v) => sum + safeParseFloat(v.quantity), 0).toString(),
                            quantity_shipped: variants.reduce((sum, v) => sum + safeParseFloat(v.quantity_shipped), 0).toString(),
                            quantity_received: variants.reduce((sum, v) => sum + safeParseFloat(v.quantity_received), 0).toString(),
                            quantity_pending: variants.reduce((sum, v) => sum + safeParseFloat(v.quantity_pending), 0).toString(),
                        } as OrderItem,
                    });
                    
                    // 插入变体子项
                    for (let i = 0; i < variants.length; i++) {
                        result.push({
                            type: 'variant',
                            item: variants[i],
                            isFirstVariant: i === 0,
                        });
                        processed.add(variants[i].line_number);
                    }
                }
            } else {
                result.push({ type: 'normal', item });
                processed.add(item.line_number);
            }
        }
        
        return result;
    }

    // 获取行样式类
    function getRowClass(section: GroupedSection): string {
        if (section.type === 'variant') {
            return 'bg-purple-50/50';
        }
        if (section.type === 'parent') {
            return 'bg-gray-100 font-medium';
        }
        return isFullyProcessed(section.item) ? 'opacity-70' : '';
    }

    // 分组后的物品列表
    let groupedSections = $derived(getGroupedSections(items));
</script>

<div class="bg-white rounded-lg p-6 shadow-sm">
    <h2 class="m-0 mb-4 text-lg text-gray-800">{l.title} ({items.length})</h2>
    {#if items.length > 0}
        <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
                <thead>
                    <tr>
                        <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">#</th>
                        <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">SKU</th>
                        <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">{l.itemName}</th>
                        {#if type === 'sales'}
                            <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{l.currentStock}</th>
                        {/if}
                        <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{l.quantity}</th>
                        <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{type === 'sales' ? l.shipped : l.received}</th>
                        <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{type === 'sales' ? l.pendingShip : l.pendingReceive}</th>
                        {#if showPrices}
                            <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{l.unitPrice}</th>
                            <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{l.subtotal}</th>
                        {/if}
                        <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">{l.status}</th>
                        {#if onReverseSync && type === 'sales'}
                            <th class="p-3 text-center border-b border-gray-100 bg-gray-50 font-semibold">操作</th>
                        {/if}
                    </tr>
                </thead>
                <tbody>
                    {#each groupedSections as section}
                        {@const item = section.item}
                        {@const shipped = getShippedQty(item)}
                        {@const pending = getPendingQty(item)}
                        {@const variantAttrs = section.type === 'variant' ? getVariantAttributes(item) : []}
                        {@const itemId = item.item_detail?.id}
                        {@const currentStock = getCurrentStock(section)}
                        {@const stockInsufficient = isStockInsufficient(section)}
                        <tr class={getRowClass(section)}>
                            <td class="p-3 text-left border-b border-gray-100 {section.type === 'variant' ? 'text-purple-600' : ''}">
                                {#if section.type === 'variant'}
                                    <div class="flex items-center gap-2">
                                        <svg class="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span>{item.line_number}</span>
                                    </div>
                                {:else}
                                    {item.line_number}
                                {/if}
                            </td>
                            <td class="p-3 text-left border-b border-gray-100 font-mono {section.type === 'variant' ? 'pl-4' : ''}">
                                {#if itemId}
                                    <a href="/item/{itemId}" class="text-blue-600 hover:underline">{item.sku}</a>
                                {:else}
                                    {item.sku}
                                {/if}
                            </td>
                            <td class="p-3 text-left border-b border-gray-100">
                                {#if section.type === 'variant'}
                                    <div class="flex flex-col gap-1 pl-4">
                                        <div class="flex items-center gap-2">
                                            <span class="text-gray-900">
                                                {$localeStore === 'en' ? (item.item_name_en ?? '') : item.item_name}
                                            </span>
                                            <VariantAttributeBadge attributes={variantAttrs} />
                                        </div>
                                    </div>
                                {:else}
                                    {$localeStore === 'en' ? (item.item_name_en ?? '') : item.item_name}
                                {/if}
                            </td>
                            {#if type === 'sales'}
                                <td class="p-3 text-right border-b border-gray-100 {stockInsufficient ? 'text-red-600 font-semibold' : currentStock !== null && currentStock > 0 ? 'text-blue-700 font-medium' : 'text-gray-400'}">
                                    {#if currentStock !== null}
                                        {formatNumber(currentStock)}
                                    {:else}
                                        -
                                    {/if}
                                </td>
                            {/if}
                            <td class="p-3 text-right border-b border-gray-100">{formatNumber(item.quantity)}</td>
                            <td class="p-3 text-right border-b border-gray-100">{formatNumber(shipped)}</td>
                            <td class="p-3 text-right border-b border-gray-100">{formatNumber(pending)}</td>
                            {#if showPrices}
                                <td class="p-3 text-right border-b border-gray-100">{getCurrencySymbol(currency)}{safeParseFloat(item.unit_price).toFixed(2)}</td>
                                <td class="p-3 text-right border-b border-gray-100">{getCurrencySymbol(currency)}{safeParseFloat(item.line_total).toFixed(2)}</td>
                            {/if}
                            <td class="p-3 text-left border-b border-gray-100">
                                {#if isFullyProcessed(item)}
                                    <span class="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">{l.completed}</span>
                                {:else if shipped > 0}
                                    <span class="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{l.partial}</span>
                                {:else}
                                    <span class="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{l.pending}</span>
                                {/if}
                            </td>
                            {#if onReverseSync && type === 'sales'}
                                <td class="p-3 text-center border-b border-gray-100">
                                    {#if section.type !== 'parent' && shipped < safeParseFloat(item.quantity)}
                                        <button
                                            type="button"
                                            class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            onclick={() => onReverseSync(item)}
                                            disabled={reverseSyncLoading[item.sku]}
                                            title="将订单数量同步为已发货数量（只可减少）"
                                        >
                                            {#if reverseSyncLoading[item.sku]}
                                                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                </svg>
                                            {:else}
                                                ↩️ 反向同步
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
    {:else}
        <p class="text-gray-500 text-center p-8">{l.noItems}</p>
    {/if}
</div>

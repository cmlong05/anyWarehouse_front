<script lang="ts">
    import type { OrderFormItem } from '$lib/composables/useOrderForm.svelte';
    import { getCurrencySymbol } from '$lib/utils/formatters';
    import { NumberStepper } from '$lib/components/ui';
    import Svelecte from 'svelecte';
    import VariantAttributeBadge from '$lib/components/VariantAttributeBadge.svelte';

    interface QuotationOption {
        value: number;
        label: string;
        quotation: unknown;
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
                            onChange={onItemSelect}
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
    {#if items.length > 0}
        <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="w-full text-sm">
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
                    {#each items as item, index}
                        {@const parentIndex = item.parentId ? items.findIndex(i => i.id === item.parentId) + 1 : null}
                        {@const siblingIndex = item.parentId ? items.filter(i => i.parentId === item.parentId).findIndex(i => i.id === item.id) + 1 : null}
                        {@const displayIndex = item.isVariantChild && parentIndex ? `${parentIndex}-${siblingIndex}` : String(index + 1)}
                        <tr class="{item.isVariantChild ? 'bg-purple-50/50' : 'hover:bg-gray-50'} transition-colors">
                            <td class="px-4 py-3 {item.isVariantChild ? 'text-purple-600' : 'text-gray-500'}">{displayIndex}</td>
                            <td class="px-4 py-3">
                                {#if item.isVariantChild}
                                    <div class="flex items-center gap-2">
                                        <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span class="font-mono text-xs text-gray-600">{item.sku || '-'}</span>
                                        <span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">变体</span>
                                    </div>
                                {:else if item.quantity === 0 && items.some(i => i.parentId === item.id)}
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono text-xs text-gray-500">{item.sku || '-'}</span>
                                        <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">母版</span>
                                    </div>
                                {:else}
                                    <span class="font-mono text-xs text-gray-600">{item.sku || '-'}</span>
                                {/if}
                            </td>
                            <td class="px-4 py-3">
                                {#if item.isVariantChild}
                                    <div class="text-gray-900">{item.item_name || '-'}</div>
                                    <VariantAttributeBadge attributes={item.variantAttributes || []} class="mt-0.5" />
                                {:else if item.quantity === 0 && items.some(i => i.parentId === item.id)}
                                    <span class="text-gray-500">{item.item_name || '-'}</span>
                                {:else}
                                    <span class="text-gray-900">{item.item_name || '-'}</span>
                                {/if}
                            </td>
                            <td class="px-4 py-3 text-right">
                                <NumberStepper
                                    value={item.quantity}
                                    min={item.isVariantChild ? variantQuantityMin : (items.some(i => i.parentId === item.id) ? 0 : quantityMin)}
                                    step={quantityStep}
                                    decimalPlaces={quantityDecimals}
                                    size="sm"
                                    disabled={loading}
                                    onchange={(v) => onUpdateItem(index, 'quantity', v)}
                                />
                            </td>
                            <td class="px-4 py-3 text-right">
                                <NumberStepper
                                    value={item.unit_price}
                                    min={0}
                                    step={0.01}
                                    size="sm"
                                    disabled={loading}
                                    onchange={(v) => onUpdateItem(index, 'unit_price', v)}
                                />
                            </td>
                            <td class="px-4 py-3 text-right font-medium text-gray-900">
                                {getCurrencySymbol(orderCurrency)}{(item.quantity * Number(item.unit_price)).toFixed(2)}
                            </td>
                            <td class="px-4 py-3 text-center">
                                <button
                                    type="button"
                                    class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    onclick={() => onRemoveItem(index, item)}
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

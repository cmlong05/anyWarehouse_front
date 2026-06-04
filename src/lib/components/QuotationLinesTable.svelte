<!-- 报价行表格 -->
<script lang="ts">
    import Svelecte from 'svelecte';
    import { CurrencySelect, NumberStepper } from '$lib/components/ui';
    import type { QuotationLine } from '$lib/composables/useQuotationLineForm.svelte';

    type CurrencyMode = 'editable' | 'fixed';

    interface QuotationLinesFormLike {
        quotationLines: QuotationLine[];
        addLine: () => void;
        removeLine: (lineId: number) => void;
        handleItemFetch: (json: unknown) => Array<{ value: number; label: string }>;
        handleSelectChange: (line: QuotationLine, selectedValue: unknown) => void;
    }

    interface Props {
        form: QuotationLinesFormLike;
        itemSearchUrl: string;
        currencyMode?: CurrencyMode;
        fixedCurrency?: string;
        onCurrencyChange?: (line: QuotationLine, newCurrency: string) => void;
    }

    let {
        form,
        itemSearchUrl,
        currencyMode = 'editable',
        fixedCurrency = 'CNY',
        onCurrencyChange,
    }: Props = $props();

    function handleLineCurrencyChange(line: QuotationLine, newCurrency: string) {
        if (onCurrencyChange) {
            onCurrencyChange(line, newCurrency);
            return;
        }
        line.currency = newCurrency;
    }
</script>

<div class="bg-white rounded-lg border border-gray-200">
    <div class="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            报价列表
            <span class="ml-2 text-xs font-normal text-gray-500">
                (共 {form.quotationLines.filter(l => l.item !== null).length} 个有效报价)
            </span>
        </h2>
        <button
            type="button"
            class="text-sm text-blue-600 hover:text-blue-800 font-medium"
            onclick={() => form.addLine()}
        >
            + 手动添加行
        </button>
    </div>

    <div class="overflow-visible">
        <table class="w-full text-sm min-w-[1200px]">
            <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th class="px-3 py-3 text-left font-medium text-gray-700 w-12">#</th>
                    <th class="px-3 py-3 text-left font-medium text-gray-700 w-[200px]">物品 *</th>
                    <th class="px-3 py-3 text-right font-medium text-gray-700 w-24">参考价</th>
                    <th class="px-3 py-3 text-right font-medium text-gray-700 w-28">报价 *</th>
                    <th class="px-3 py-3 text-center font-medium text-gray-700 w-20">货币</th>
                    <th class="px-3 py-3 text-center font-medium text-gray-700 w-20">MOQ</th>
                    <th class="px-3 py-3 text-center font-medium text-gray-700 w-24">交货周期</th>
                    <th class="px-3 py-3 text-left font-medium text-gray-700 w-[100px]">合作方SKU</th>
                    <th class="px-3 py-3 text-left font-medium text-gray-700 w-[100px]">备注</th>
                    <th class="px-3 py-3 text-center font-medium text-gray-700 w-16">操作</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                {#each form.quotationLines as line, index (line.id)}
                    {@const parentIndex = line.parentLineId ? form.quotationLines.findIndex(l => l.id === line.parentLineId) + 1 : null}
                    {@const siblingIndex = line.parentLineId ? form.quotationLines.filter(l => l.parentLineId === line.parentLineId).findIndex(l => l.id === line.id) + 1 : null}
                    {@const displayIndex = line.isVariantChild && parentIndex ? `${parentIndex}-${siblingIndex}` : String(index + 1)}
                    <tr class="{line.isVariantChild ? 'bg-purple-50/50' : 'hover:bg-gray-50'}">
                        <td class="px-3 py-3 {line.isVariantChild ? 'text-purple-600' : 'text-gray-500'}">{displayIndex}</td>
                        <td class="px-3 py-3">
                            {#if line.isVariantChild}
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span class="text-sm font-medium text-gray-800">
                                        {line.itemDetail?.SKU || line.variantInfo?.variant_item_detail?.SKU || '-'}
                                    </span>
                                    <span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">变体</span>
                                </div>
                                <div class="text-xs text-gray-500 mt-1 pl-6">
                                    {line.itemDetail?.name || line.variantInfo?.variant_item_detail?.name || '-'}
                                </div>
                            {:else}
                                {#if line.itemDetail}
                                    <div class="text-sm font-medium text-gray-800">
                                        {line.itemDetail.SKU} - {line.itemDetail.name}
                                    </div>
                                {:else}
                                    <Svelecte
                                        inputId="item-{line.id}"
                                        name="item-{line.id}"
                                        valueAsObject={false}
                                        placeholder="搜索SKU或名称..."
                                        searchable={true}
                                        minQuery={1}
                                        fetch={itemSearchUrl}
                                        fetchCallback={form.handleItemFetch}
                                        valueField="value"
                                        labelField="label"
                                        onChange={(val: unknown) => form.handleSelectChange(line, val)}
                                    />
                                {/if}
                            {/if}
                        </td>

                        <td class="px-3 py-3 text-right">
                            {#if line.itemDetail?.b_Price}
                                <span class="text-sm text-gray-500">
                                    {line.itemDetail.b_Price} {line.itemDetail.currency || 'CNY'}
                                </span>
                            {:else}
                                <span class="text-sm text-gray-300">-</span>
                            {/if}
                        </td>

                        <td class="px-3 py-3">
                            <NumberStepper
                                id="price-{line.id}"
                                value={line.price ? Number(line.price) : undefined}
                                min={0}
                                step={0.01}
                                decimalPlaces={2}
                                size="sm"
                                placeholder="0.00"
                                onchange={(v) => line.price = v !== undefined && v !== null ? v.toFixed(2) : ''}
                            />
                        </td>

                        <td class="px-3 py-3">
                            {#if currencyMode === 'editable'}
                                <CurrencySelect
                                    value={line.currency}
                                    onchange={(v) => handleLineCurrencyChange(line, v)}
                                />
                            {:else}
                                <span class="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                    {fixedCurrency}
                                </span>
                            {/if}
                        </td>

                        <td class="px-3 py-3">
                            <NumberStepper
                                id="moq-{line.id}"
                                value={line.min_quantity}
                                min={1}
                                step={1}
                                decimalPlaces={0}
                                size="sm"
                                onchange={(v) => line.min_quantity = v ?? 1}
                            />
                        </td>

                        <td class="px-3 py-3">
                            <NumberStepper
                                id="lead-{line.id}"
                                value={line.lead_time_days ?? undefined}
                                min={1}
                                step={1}
                                decimalPlaces={0}
                                size="sm"
                                placeholder="天数"
                                onchange={(v) => line.lead_time_days = v ?? null}
                            />
                        </td>

                        <td class="px-3 py-3">
                            <input
                                type="text"
                                bind:value={line.partner_sku}
                                placeholder="Partner"
                                class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                        </td>

                        <td class="px-3 py-3">
                            <input
                                type="text"
                                bind:value={line.note}
                                placeholder="备注"
                                class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                        </td>

                        <td class="px-3 py-3 text-center">
                            <button
                                type="button"
                                class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                onclick={() => form.removeLine(line.id)}
                                title="删除此行"
                                aria-label="删除此行"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    {#if form.quotationLines.length === 0}
        <div class="text-center py-8 text-gray-500">
            <p>暂无报价行，请选择物品或手动添加</p>
        </div>
    {/if}
</div>

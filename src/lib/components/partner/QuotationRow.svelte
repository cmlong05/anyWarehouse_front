<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';
    import type { QuotationBrief, CustomerQuotationBrief } from '$lib';

    export let quotation: QuotationBrief | CustomerQuotationBrief;
    export let currencySymbol: string = '';
    export let quantity: number | null = null;
    export let onRowClick: (id: number) => void;
    export let onQuantityChange: (id: number, value: number | null) => void;
    export let skuCellClass: string = 'p-3 text-gray-600 cursor-pointer hover:text-blue-600 hover:underline';
    export let showLeftBorder: boolean = false;
    export let leftBorderClasses: string = 'border-l-[3px] border-slate-200';
</script>

<tr class="bg-white cursor-pointer transition-colors hover:bg-gray-50" onclick={() => onRowClick(quotation.id)}>
    {#if showLeftBorder}
        <td class={"p-3 " + leftBorderClasses}></td>
    {/if}
    <td class={skuCellClass}>
        {#if quotation.item}
            <a
                href="/item/{quotation.item}"
                class="text-blue-600 hover:text-blue-700 hover:underline"
                onclick={(e) => e.stopPropagation()}
            >
                {quotation.item_sku || '-'}
            </a>
        {:else}
            {quotation.item_sku || '-'}
        {/if}
    </td>
    <td class="p-3 text-gray-600">
        <div>{quotation.item_name || '-'}</div>
        {#if quotation.note}
            <div class="text-xs text-gray-500 mt-1">备注：{quotation.note}</div>
        {/if}
    </td>
    <td class="p-3 text-gray-600 font-mono">{quotation.partner_sku || '-'}</td>
    <td class="p-3 text-right font-mono">
        {#if (quotation.quantity_on_order ?? 0) > 0}
            <span class="text-amber-600 font-medium">{quotation.quantity_on_order}</span>
        {:else}
            <span class="text-gray-300">-</span>
        {/if}
    </td>
    <td class="p-3 text-gray-600 text-right font-mono">{quotation.item_total_storage ?? 0}</td>
    <td class="p-3 text-gray-600 text-right font-mono">{currencySymbol}{quotation.price}</td>
    <td class="p-3 text-right" onclick={(e) => e.stopPropagation()}>
        <NumberStepper
            value={quantity ?? undefined}
            step={1}
            decimalPlaces={0}
            size="sm"
            onchange={(value) => onQuantityChange(quotation.id, value ?? null)}
        />
    </td>
    <td class="p-3 text-center" onclick={(e) => e.stopPropagation()}>
        {#if quotation.is_preferred}
            <span title="首选供应商" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-help">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            </span>
        {:else if quotation.is_unique_supplier}
            <span title="唯一供应商" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 cursor-help">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            </span>
        {:else}
            <span class="text-gray-400">-</span>
        {/if}
    </td>
</tr>

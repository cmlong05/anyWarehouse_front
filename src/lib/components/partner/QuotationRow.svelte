<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';
    import type { QuotationBrief, CustomerQuotationBrief } from '$lib';

    export let quotation: QuotationBrief | CustomerQuotationBrief;
    export let currencySymbol: string = '';
    export let quantity: number | null = null;
    export let onRowClick: (id: number) => void;
    export let onQuantityChange: (id: number, value: number | null) => void;
    export let skuCellClass: string = 'px-2 py-1.5 text-gray-600 cursor-pointer hover:text-blue-600 hover:underline';
    export let showLeftBorder: boolean = false;
    export let leftBorderClasses: string = 'border-l-[3px] border-slate-200';
</script>

<tr class="bg-white cursor-pointer transition-colors hover:bg-gray-50" onclick={() => onRowClick(quotation.id)}>
    {#if showLeftBorder}
        <td class={"px-2 py-1.5 " + leftBorderClasses}></td>
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
    <td class="px-2 py-1.5 text-gray-600">
        <div>{quotation.item_name || '-'}</div>
        {#if quotation.note}
            <div class="text-xs text-gray-500 mt-1">备注：{quotation.note}</div>
        {/if}
    </td>
    <td class="px-2 py-1.5 text-gray-600 font-mono">{quotation.partner_sku || '-'}</td>
    <td class="px-2 py-1.5 text-gray-600 text-right font-mono">{quotation.item_total_storage ?? 0}</td>
    <td class="px-2 py-1.5 text-gray-600 text-right font-mono">{currencySymbol}{quotation.price}</td>
    <td class="px-2 py-1.5 text-right" onclick={(e) => e.stopPropagation()}>
        <NumberStepper
            value={quantity ?? undefined}
            step={1}
            decimalPlaces={0}
            size="sm"
            onchange={(value) => onQuantityChange(quotation.id, value ?? null)}
        />
    </td>
</tr>

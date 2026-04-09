<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';
    import type { QuotationBrief } from '$lib';

    export let quotation: QuotationBrief;
    export let currencySymbol: string = '';
    export let quantity: number | null = null;
    export let onRowClick: (id: number) => void;
    export let onQuantityChange: (id: number, value: number | null) => void;
    export let skuCellClass: string = 'px-2 py-1.5 text-gray-600 cursor-pointer hover:text-blue-600 hover:underline';
    export let showLeftBorder: boolean = false;
    export let leftBorderClasses: string = 'border-l-[3px] border-slate-200';
</script>

<tr class="bg-white">
    {#if showLeftBorder}
        <td class={"px-2 py-1.5 " + leftBorderClasses}></td>
    {/if}
    <td class={skuCellClass} onclick={() => onRowClick(quotation.id)}>{quotation.item_sku || '-'}</td>
    <td class="px-2 py-1.5 text-gray-600">
        <div>{quotation.item_name || '-'}</div>
        {#if quotation.note}
            <div class="text-xs text-gray-500 mt-1">备注：{quotation.note}</div>
        {/if}
    </td>
    <td class="px-2 py-1.5 text-gray-600 font-mono">{quotation.partner_sku || '-'}</td>
    <td class="px-2 py-1.5 text-gray-600 text-right font-mono">{currencySymbol}{quotation.price}</td>
    <td class="px-2 py-1.5 text-right">
        <NumberStepper
            value={quantity ?? undefined}
            step={1}
            decimalPlaces={0}
            size="sm"
            onchange={(value) => onQuantityChange(quotation.id, value ?? null)}
        />
    </td>
</tr>

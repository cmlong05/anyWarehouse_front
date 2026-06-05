<!-- 订单金额网格 -->
<!--
被依赖：
- `lib/components/OrderForm.svelte`
- `lib/components/order/index.ts`
-->
<script lang="ts">
    import { safeParseFloat } from '$lib/utils';
    import { getCurrencySymbol as getCurrencySymbolFn } from '$lib/utils/formatters';

    interface AmountItem {
        label: string;
        value: string | number | undefined;
        isNegative?: boolean;
        isTotal?: boolean;
        prefix?: string;
    }

    interface Props {
        items: AmountItem[];
        title?: string;
        currency?: string;
    }
    
    let { items, title = '金额信息', currency = 'CNY' }: Props = $props();
    
    // 获取货币符号
    const getCurrencySymbol = (curr: string) => getCurrencySymbolFn(curr);

    function formatValue(item: AmountItem): string {
        const prefix = item.prefix !== undefined ? item.prefix : getCurrencySymbol(currency);
        const value = safeParseFloat(item.value);
        const sign = item.isNegative ? '-' : '';
        return `${sign}${prefix}${value.toFixed(2)}`;
    }
</script>

<div class="bg-white rounded-lg p-6 mb-6 shadow-sm">
    <h2 class="m-0 mb-4 text-lg text-gray-800">{title}</h2>
    <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));">
        {#each items as item}
            <div class="flex flex-col p-3 bg-gray-50 rounded" class:bg-blue-50={item.isTotal}>
                <span class="text-xs text-gray-500 mb-1">{item.label}</span>
                <span class="font-medium text-base" class:text-blue-600={item.isTotal} class:text-xl={item.isTotal}>
                    {formatValue(item)}
                </span>
            </div>
        {/each}
    </div>
</div>
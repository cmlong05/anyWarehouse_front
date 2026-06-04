<!-- 报价价格卡片 -->
<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';

    interface Props {
        price: string | number | null | undefined;
        currency?: string | null;
        minQuantity?: number | null;
        leadTimeDays?: number | null;
        partnerSku?: string;
        currencyEditable?: boolean;
        currencyOptions?: string[];
        partnerSkuLabel?: string;
        partnerSkuPlaceholder?: string;
        priceStep?: number;
        pricePlaceholder?: string;
        leadTimeOptional?: boolean;
        onPriceChange: (value: number | null | undefined) => void;
        onCurrencyChange?: (value: string) => void;
        onMinQuantityChange: (value: number | null | undefined) => void;
        onLeadTimeChange: (value: number | null | undefined) => void;
        onPartnerSkuChange: (value: string) => void;
    }

    let {
        price,
        currency = 'CNY',
        minQuantity = 1,
        leadTimeDays = null,
        partnerSku = '',
        currencyEditable = false,
        currencyOptions = ['CNY', 'USD', 'EUR', 'GBP', 'JPY'],
        partnerSkuLabel = '合作方SKU',
        partnerSkuPlaceholder = '合作方自己的物品编码（可选）',
        priceStep = 0.01,
        pricePlaceholder = '0.00',
        leadTimeOptional = true,
        onPriceChange,
        onCurrencyChange,
        onMinQuantityChange,
        onLeadTimeChange,
        onPartnerSkuChange,
    }: Props = $props();

    function toNumber(value: string | number | null | undefined): number | undefined {
        if (value === '' || value === null || value === undefined) return undefined;
        const parsed = typeof value === 'number' ? value : Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }

</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        价格信息
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label for="price" class="block text-sm font-medium text-gray-700 mb-2">单价 <span class="text-red-500">*</span></label>
            <NumberStepper
                id="price"
                value={toNumber(price)}
                min={0}
                step={priceStep}
                decimalPlaces={2}
                placeholder={pricePlaceholder}
                onchange={onPriceChange}
            />
        </div>

        <div>
            <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">货币</label>
            {#if currencyEditable}
                <select
                    id="currency"
                    value={currency || 'CNY'}
                    onchange={(e) => onCurrencyChange?.((e.currentTarget as HTMLSelectElement).value)}
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {#each currencyOptions as option}
                        <option value={option}>{option}</option>
                    {/each}
                </select>
            {:else}
                <div class="flex items-center h-10 px-3 rounded-lg border border-gray-200 bg-gray-50">
                    <span class="text-sm font-semibold text-gray-700">{currency || 'CNY'}</span>
                </div>
            {/if}
        </div>

        <div>
            <label for="min_quantity" class="block text-sm font-medium text-gray-700 mb-2">最小订购量 (MOQ)</label>
            <NumberStepper
                id="min_quantity"
                value={minQuantity ?? 1}
                min={1}
                step={1}
                decimalPlaces={0}
                onchange={onMinQuantityChange}
            />
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
            <label for="lead_time_days" class="block text-sm font-medium text-gray-700 mb-2">交货周期 (天)</label>
            <NumberStepper
                id="lead_time_days"
                value={leadTimeOptional ? (leadTimeDays ?? undefined) : (leadTimeDays || 1)}
                min={1}
                step={1}
                decimalPlaces={0}
                placeholder={leadTimeOptional ? '可选' : undefined}
                onchange={onLeadTimeChange}
            />
        </div>
        <div>
            <label for="partner_sku" class="block text-sm font-medium text-gray-700 mb-2">{partnerSkuLabel}</label>
            <input
                type="text"
                id="partner_sku"
                value={partnerSku}
                oninput={(e) => onPartnerSkuChange((e.currentTarget as HTMLInputElement).value)}
                placeholder={partnerSkuPlaceholder}
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
    </div>

</div>
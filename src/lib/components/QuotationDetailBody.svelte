<!-- 报价详情主体 -->
<script lang="ts">
    interface Props {
        partnerTitle: string;
        partnerCodeLabel: string;
        partnerCode?: string | null;
        partnerName?: string | null;
        partnerHref?: string | null;

        itemId?: number | null;
        itemSku?: string | null;
        itemName?: string | null;
        itemWeight?: string | null;

        price: string;
        currency: string;
        minQuantity: number;
        totalValue?: string | null;
        totalLabel?: string;

        leadTimeDays?: number | null;
        validFrom?: string | null;
        validUntil?: string | null;

        partnerSku?: string | null;
        note?: string | null;

        createdAt: string;
        updatedAt: string;
    }

    let {
        partnerTitle,
        partnerCodeLabel,
        partnerCode = null,
        partnerName = null,
        partnerHref = null,

        itemId = null,
        itemSku = null,
        itemName = null,
        itemWeight = null,

        price,
        currency,
        minQuantity,
        totalValue = null,
        totalLabel = '总价',

        leadTimeDays = null,
        validFrom = null,
        validUntil = null,

        partnerSku = null,
        note = null,

        createdAt,
        updatedAt,
    }: Props = $props();

    function fmtDateTime(value: string): string {
        return new Date(value).toLocaleString();
    }
</script>

<div class="grid gap-6 mb-6 md:grid-cols-1" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
    <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">{partnerTitle}</h3>
        <div class="flex flex-col gap-3">
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">{partnerCodeLabel}</span>
                <span class="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{partnerCode || '-'}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">名称</span>
                <span class="font-medium text-gray-900">
                    {#if partnerHref}
                        <a href={partnerHref} class="text-blue-500 hover:underline">{partnerName || '-'}</a>
                    {:else}
                        {partnerName || '-'}
                    {/if}
                </span>
            </div>
            {#if partnerSku}
                <div class="flex justify-between items-center">
                    <span class="text-gray-500 text-sm">合作方SKU</span>
                    <span class="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{partnerSku}</span>
                </div>
            {/if}
        </div>
    </div>

    <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">物品信息</h3>
        <div class="flex flex-col gap-3">
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">SKU</span>
                <span class="font-medium">
                    {#if itemId}
                        <a href={`/item/${itemId}`} class="text-blue-500 hover:underline font-mono bg-gray-100 px-2 py-1 rounded text-sm">{itemSku || '-'}</a>
                    {:else}
                        <span class="font-mono bg-gray-100 px-2 py-1 rounded text-sm">-</span>
                    {/if}
                </span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">物品名称</span>
                <span class="font-medium text-gray-900">
                    {#if itemId}
                        <a href={`/item/${itemId}`} class="text-blue-500 hover:underline">{itemName || '-'}</a>
                    {:else}
                        {itemName || '-'}
                    {/if}
                </span>
            </div>
            {#if itemWeight}
                <div class="flex justify-between items-center">
                    <span class="text-gray-500 text-sm">重量</span>
                    <span class="font-medium">{itemWeight} g</span>
                </div>
            {/if}
        </div>
    </div>

    <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">价格信息</h3>
        <div class="flex flex-col gap-3">
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">单价</span>
                <span class="font-medium text-blue-500 text-lg">{price} {currency}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">最小订购量</span>
                <span class="font-medium">{minQuantity}</span>
            </div>
            {#if totalValue}
                <div class="flex justify-between items-center">
                    <span class="text-gray-500 text-sm">{totalLabel}</span>
                    <span class="font-medium text-blue-500 text-lg">{totalValue} {currency}</span>
                </div>
            {/if}
        </div>
    </div>

    <div class="bg-white p-6 rounded-lg border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">其他信息</h3>
        <div class="flex flex-col gap-3">
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">交货周期</span>
                <span class="font-medium">{leadTimeDays ? `${leadTimeDays} 天` : '-'}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">有效期开始</span>
                <span class="font-medium">{validFrom || '-'}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-500 text-sm">有效期结束</span>
                <span class="font-medium">{validUntil || '-'}</span>
            </div>
        </div>
    </div>
</div>

{#if note}
    <div class="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">备注</h3>
        <p class="text-gray-600 leading-relaxed whitespace-pre-wrap m-0">{note}</p>
    </div>
{/if}

<div class="text-gray-500 text-sm py-4 border-t border-gray-200">
    <p class="my-1">创建时间: {fmtDateTime(createdAt)}</p>
    <p class="my-1">更新时间: {fmtDateTime(updatedAt)}</p>
</div>
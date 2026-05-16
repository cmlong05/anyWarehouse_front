<script lang="ts">
    import type { Item } from '$lib';
    import type { ItemVariantInfo } from '$lib/types/variant';
    import type { ItemDisplayPrice } from '$lib/utils/item-price';
    import { useImageSquare } from '$lib/composables/useImageSquare.svelte';

    interface Props {
        item: Item;
        isVariantTemplate: boolean;
        variantInfo: ItemVariantInfo | null;
        displayPrice: ItemDisplayPrice;
        totalStock: number;
    }

    let { item, isVariantTemplate, variantInfo, displayPrice, totalStock }: Props = $props();

    const square = useImageSquare();
    let imageLoadFailed = $state(false);
    const skuBadgeClass = $derived.by(() => {
        switch (item.item_status) {
            case 'clearance':
                return 'bg-amber-100 text-amber-800';
            case 'discontinued':
                return 'bg-red-100 text-red-800';
            case 'normal':
            default:
                return 'bg-green-100 text-green-800';
        }
    });
    const visiblePriceCardCount = $derived.by(() => {
        let count = 0;
        if (displayPrice.local) count += 1;
        if (displayPrice.preferred) count += 1;
        if (displayPrice.showHighest) count += 1;
        return count;
    });

    function formatPrice(price: string | number | null | undefined): string {
        if (price === null || price === undefined || price === '') return '-';
        return parseFloat(String(price)).toFixed(2);
    }

    $effect(() => {
        item.image;
        imageLoadFailed = false;
    });
</script>

<div class="bg-white rounded-xl rounded-b-none shadow-sm border border-gray-200 border-b-0 overflow-hidden">
    <div class="p-6">
        <div class="flex flex-col sm:flex-row gap-5">
            <!-- 图片：移动端 -->
            <div class="sm:hidden mx-auto w-40 h-40 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                {#if item.image && !imageLoadFailed}
                    <a
                        href={item.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block w-full h-full leading-[0]"
                        title="点击查看大图"
                    >
                        <img
                            src={item.image}
                            alt={item.name}
                            class="w-full h-full object-contain"
                            onerror={() => { imageLoadFailed = true; }}
                        />
                    </a>
                {:else}
                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                {/if}
            </div>
            <!-- 图片：桌面端正方形自适应 -->
            <div
                class="hidden sm:flex flex-shrink-0 bg-gray-50 rounded-lg border border-gray-200 items-center justify-center overflow-hidden"
                style="width: {square.size}px; height: {square.size}px;"
            >
                {#if item.image && !imageLoadFailed}
                    <a
                        href={item.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block w-full h-full leading-[0]"
                        title="点击查看大图"
                    >
                        <img
                            src={item.image}
                            alt="{item.name}{item.name_en ? ` / ${item.name_en}` : ''}"
                            class="w-full h-full object-contain hover:scale-105 transition-transform"
                            onerror={() => { imageLoadFailed = true; }}
                        />
                    </a>
                {:else}
                    <svg class="w-14 h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                {/if}
            </div>

            <!-- 基本信息 -->
            <div class="flex-1 min-w-0" use:square.bind>
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 mb-1">{item.name}</h1>
                        {#if item.name_en}
                            <p class="text-lg text-gray-500 mb-2">{item.name_en}</p>
                        {/if}
                        <div class="flex items-center gap-3 text-sm flex-wrap">
                            <span class={`px-2.5 py-0.5 rounded-full font-mono ${skuBadgeClass}`}>{item.SKU}</span>

                            {#if isVariantTemplate}
                                <span class="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    变体母版
                                </span>
                            {:else if variantInfo?.is_variant}
                                <span class="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                    变体
                                </span>
                                {#if variantInfo?.parent_item}
                                    <a href="/item/{variantInfo.parent_item.id}" class="text-xs text-blue-600 hover:underline">
                                        母版: {variantInfo.parent_item.sku}
                                    </a>
                                {/if}
                            {/if}
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <a
                            href="/item/add?copy_from={item.id}"
                            class="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
                            title="复制"
                            aria-label="复制"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </a>
                        <a
                            href="/item/{item.id}/edit"
                            class="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
                            title="编辑"
                            aria-label="编辑"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- 价格网格（本地/首选/最高） -->
                <div
                    class="mb-4 grid gap-3 {visiblePriceCardCount <= 1 ? 'grid-cols-1' : visiblePriceCardCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}"
                >
                    {#if displayPrice.local}
                        <div class="p-3 bg-gray-50 rounded-lg text-center">
                            <div class="text-xs text-gray-500 mb-1">本地价格</div>
                            <div class="font-medium text-gray-900">
                                {formatPrice(displayPrice.local.price)} {displayPrice.local.currency || 'CNY'}
                            </div>
                        </div>
                    {/if}
                    {#if displayPrice.preferred}
                        <div class="p-3 bg-gray-50 rounded-lg text-center">
                            <div class="text-xs text-gray-500 mb-1">首选价格</div>
                            <div class="font-medium text-gray-900">
                                {formatPrice(displayPrice.preferred.price)} {displayPrice.preferred.currency || 'CNY'}
                            </div>
                        </div>
                    {/if}
                    {#if displayPrice.showHighest}
                        <div class="p-3 bg-gray-50 rounded-lg text-center">
                            <div class="text-xs text-gray-500 mb-1">最高价格</div>
                            <div class="font-medium text-gray-900">
                                {#if displayPrice.highest}
                                    {formatPrice(displayPrice.highest.price)} {displayPrice.highest.currency || 'CNY'}
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- 属性网格 -->
                <div class="grid grid-cols-3 gap-3">
                    <div class="p-3 bg-gray-50 rounded-lg text-center">
                        <div class="text-xs text-gray-500 mb-1">重量</div>
                        <div class="font-medium text-gray-900">{item.weight != null && item.weight !== '' ? `${item.weight}g` : '-'}</div>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg text-center">
                        <div class="text-xs text-gray-500 mb-1">体积</div>
                        <div class="font-medium text-gray-900">{item.s_volume != null && String(item.s_volume) !== '' ? `${item.s_volume}cm³` : '-'}</div>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg text-center">
                        <div class="text-xs text-gray-500 mb-1">总库存</div>
                        <div class="font-medium {totalStock > 0 ? 'text-green-600' : 'text-red-600'}">{totalStock}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

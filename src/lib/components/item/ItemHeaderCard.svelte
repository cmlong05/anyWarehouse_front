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

    function formatPrice(price: string | number | null | undefined): string {
        if (price === null || price === undefined || price === '') return '-';
        return parseFloat(String(price)).toFixed(2);
    }

    $effect(() => {
        item.image;
        imageLoadFailed = false;
    });
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
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
                            <span class="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full font-mono">{item.SKU}</span>

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

                <!-- 价格 -->
                <div class="mb-4 flex items-baseline flex-wrap gap-x-2">
                    <span class="text-3xl font-bold {displayPrice.source === 'preferred' ? 'text-amber-800' : 'text-gray-900'}">
                        {formatPrice(displayPrice.price)}
                    </span>
                    <span class="text-gray-500">{displayPrice.currency || 'CNY'}</span>
                    {#if displayPrice.source === 'preferred'}
                        <button type="button" class="group relative inline-flex items-center align-middle text-amber-800" aria-label="首选最优报价">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span class="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                首选最优报价: {displayPrice.supplierName || '-'}
                            </span>
                        </button>
                        <span class="text-xs text-amber-700">首选报价</span>
                    {:else if displayPrice.source === 'highest'}
                        <span class="text-xs text-gray-400">供应商最高报价</span>
                    {:else if displayPrice.source === 'item'}
                        <span class="text-xs text-gray-400">商品价格</span>
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

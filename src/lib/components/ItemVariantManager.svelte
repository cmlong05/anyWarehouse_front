<script lang="ts">
    import { goto } from '$app/navigation';
    import type { ItemVariantInfo, ItemVariant, ItemAttributeValue } from '$lib/types/variant';
    import { config } from '$lib/config';
    import VariantCreator from './VariantCreator.svelte';

    interface Props {
        itemId: number;
        itemSku: string;
        itemName: string;
        variantInfo: ItemVariantInfo | null;
        onRefresh?: () => void;
    }

    let { itemId, itemSku, itemName, variantInfo, onRefresh }: Props = $props();

    // 创建变体弹窗状态
    let showCreator = $state(false);

    // 本地状态
    let selectedAttributes = $state<Record<string, number | null>>({});
    let matchedVariant = $state<ItemVariant | null>(null);
    let isMatching = $state(false);
    let matchError = $state<string | null>(null);

    // 初始化选择
    $effect(() => {
        if (variantInfo?.variant_summary?.attributes) {
            const initial: Record<string, number | null> = {};
            Object.keys(variantInfo.variant_summary.attributes).forEach(code => {
                initial[code] = null;
            });
            selectedAttributes = initial;
        }
    });

    // 格式化价格
    function formatPrice(price: string | null | undefined): string {
        if (!price) return '-';
        return parseFloat(price).toFixed(2);
    }

    // 获取属性值名称
    function getAttributeValueName(variant: ItemVariant, attrCode: string): string {
        const attrValue = variant.attribute_values_detail?.find(
            av => av.attribute_code === attrCode
        );
        return attrValue?.value || '-';
    }

    // 获取属性值颜色
    function getAttributeValueColor(variant: ItemVariant, attrCode: string): string | null {
        const attrValue = variant.attribute_values_detail?.find(
            av => av.attribute_code === attrCode
        );
        return attrValue?.color_hex || null;
    }

    // 匹配变体
    async function handleMatchVariant() {
        const selections = Object.entries(selectedAttributes)
            .filter(([_, valueId]) => valueId !== null)
            .map(([attribute_code, selected_value_id]) => ({
                attribute_code,
                selected_value_id: selected_value_id!
            }));

        if (selections.length === 0) {
            matchError = '请至少选择一个属性值';
            return;
        }

        isMatching = true;
        matchError = null;

        try {
            const response = await fetch(`${config.API_BASE_URL}/product/variants/match_variant/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parent_item_id: itemId,
                    selections
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.matched && data.variant) {
                    matchedVariant = data.variant;
                } else {
                    matchedVariant = null;
                    matchError = data.message || '未找到匹配的变体';
                }
            } else {
                matchError = '匹配失败，请重试';
            }
        } catch (error) {
            console.error('匹配变体失败:', error);
            matchError = '网络错误，请检查连接';
        } finally {
            isMatching = false;
        }
    }

    // 跳转到变体详情
    function goToVariant(variantItemId: number) {
        goto(`/item/${variantItemId}`);
    }

    // 判断当前Item是否是变体
    function isVariant(): boolean {
        return variantInfo?.is_variant === true;
    }

    // 判断当前Item是否是母版
    function isTemplate(): boolean {
        return variantInfo?.is_template === true;
    }
</script>

<div class="space-y-6">
    <!-- 变体信息标题 -->
    <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">物品变体</h2>
        <div class="flex items-center gap-2">
            {#if isTemplate()}
                <button
                    onclick={() => showCreator = true}
                    class="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    + 创建变体
                </button>
                <span class="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    变体母版
                </span>
            {:else if isVariant()}
                <span class="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    变体
                </span>
            {/if}
        </div>
    </div>

    <!-- 创建变体弹窗 -->
    {#if showCreator}
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">创建变体</h3>
                    <button
                        onclick={() => showCreator = false}
                        class="text-gray-400 hover:text-gray-600"
                        aria-label="关闭"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <VariantCreator
                        parentItemId={itemId}
                        parentItemSku={itemSku}
                        onSuccess={() => {
                            showCreator = false;
                            onRefresh?.();
                        }}
                        onCancel={() => showCreator = false}
                    />
                </div>
            </div>
        </div>
    {/if}

    <!-- 变体选择器（仅母版显示） -->
    {#if isTemplate() && variantInfo?.variant_summary?.attributes}
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 class="text-sm font-medium text-gray-700 mb-3">变体选择器</h3>
            
            <div class="space-y-4">
                {#each Object.entries(variantInfo.variant_summary.attributes) as [code, attr]}
                    <div>
                        <span class="block text-sm text-gray-600 mb-2">{attr.name}</span>
                        <div class="flex flex-wrap gap-2">
                            {#each attr.values as value}
                                <button
                                    onclick={() => selectedAttributes[code] = selectedAttributes[code] === value.id ? null : value.id}
                                    class="px-3 py-1.5 text-sm rounded-lg border transition-all {selectedAttributes[code] === value.id 
                                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
                                >
                                    {#if value.color_hex}
                                        <span 
                                            class="inline-block w-3 h-3 rounded-full mr-1.5 align-middle"
                                            style="background-color: {value.color_hex}"
                                        ></span>
                                    {/if}
                                    {value.value}
                                </button>
                            {/each}
                        </div>
                    </div>
                {/each}

                <div class="flex items-center gap-3 pt-2">
                    <button
                        onclick={handleMatchVariant}
                        disabled={isMatching}
                        class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isMatching ? '匹配中...' : '查找变体'}
                    </button>
                    
                    {#if matchedVariant}
                        <button
                            onclick={() => goToVariant(matchedVariant!.variant_item)}
                            class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                            查看变体详情
                        </button>
                    {/if}
                </div>

                {#if matchError}
                    <div class="text-sm text-red-600">{matchError}</div>
                {/if}

                {#if matchedVariant}
                    <div class="mt-3 p-3 bg-white rounded-lg border border-green-200">
                        <div class="text-sm font-medium text-green-800 mb-1">匹配成功</div>
                        <div class="flex items-center gap-4 text-sm">
                            <span class="font-mono text-gray-900">{matchedVariant.variant_item_detail?.SKU}</span>
                            <span class="text-gray-600">{matchedVariant.variant_item_detail?.name}</span>
                            <span class="font-medium text-purple-600">¥{formatPrice(matchedVariant.effective_price)}</span>
                            <span class="text-gray-500">库存: {matchedVariant.variant_item_detail?.total_storage || 0}</span>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- 当前变体信息（如果是变体） -->
    {#if isVariant() && variantInfo?.variant_info}
        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 class="text-sm font-medium text-blue-800 mb-2">当前变体信息</h3>
            <div class="flex flex-wrap items-center gap-3 text-sm">
                {#each variantInfo.variant_info.attribute_values as av}
                    <span class="inline-flex items-center px-2.5 py-1 bg-white rounded border border-blue-200">
                        {#if av.color_hex}
                            <span 
                                class="inline-block w-3 h-3 rounded-full mr-1.5"
                                style="background-color: {av.color_hex}"
                            ></span>
                        {/if}
                        <span class="text-gray-500">{av.attribute}:</span>
                        <span class="ml-1 font-medium text-gray-900">{av.value}</span>
                    </span>
                {/each}
                <span class="px-2.5 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                    ¥{formatPrice(variantInfo.variant_info.effective_price)}
                </span>
            </div>
            
            {#if variantInfo.parent_item}
                <div class="mt-3 pt-3 border-t border-blue-200">
                    <a 
                        href="/item/{variantInfo.parent_item.id}" 
                        class="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        ← 查看母版: {variantInfo.parent_item.sku}
                    </a>
                </div>
            {/if}
        </div>
    {/if}

    <!-- 变体列表（仅母版显示） -->
    {#if isTemplate() && variantInfo?.variants && variantInfo.variants.length > 0}
        <div>
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">
                    所有变体 ({variantInfo.variant_summary?.total_variants || variantInfo.variants.length})
                </h3>
                <span class="text-xs text-gray-500">
                    总库存: {variantInfo.variant_summary?.total_stock || 0}
                </span>
            </div>

            <div class="overflow-hidden rounded-lg border border-gray-200">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            {#if variantInfo.variant_summary?.attributes}
                                {#each Object.entries(variantInfo.variant_summary.attributes) as [code, attr]}
                                    <th class="px-4 py-3 text-left font-medium text-gray-700">{attr.name}</th>
                                {/each}
                            {/if}
                            <th class="px-4 py-3 text-left font-medium text-gray-700">SKU</th>
                            <th class="px-4 py-3 text-right font-medium text-gray-700">价格</th>
                            <th class="px-4 py-3 text-right font-medium text-gray-700">库存</th>
                            <th class="px-4 py-3 text-center font-medium text-gray-700">状态</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        {#each variantInfo.variants as variant}
                            <tr 
                                class="hover:bg-gray-50 cursor-pointer {variant.is_default ? 'bg-amber-50/50' : ''}"
                                onclick={() => goToVariant(variant.variant_item)}
                            >
                                {#if variantInfo.variant_summary?.attributes}
                                    {#each Object.keys(variantInfo.variant_summary.attributes) as code}
                                        <td class="px-4 py-3">
                                            <div class="flex items-center gap-1.5">
                                                {#if getAttributeValueColor(variant, code)}
                                                    <span 
                                                        class="inline-block w-3 h-3 rounded-full"
                                                        style="background-color: {getAttributeValueColor(variant, code)}"
                                                    ></span>
                                                {/if}
                                                <span>{getAttributeValueName(variant, code)}</span>
                                            </div>
                                        </td>
                                    {/each}
                                {/if}
                                <td class="px-4 py-3 font-mono text-blue-600">
                                    {variant.variant_item_detail?.SKU}
                                </td>
                                <td class="px-4 py-3 text-right">
                                    ¥{formatPrice(variant.effective_price)}
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <span class={variant.variant_item_detail?.total_storage ? 'text-green-600' : 'text-red-500'}>
                                        {variant.variant_item_detail?.total_storage || 0}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    {#if variant.is_default}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            默认
                                        </span>
                                    {:else if !variant.is_active}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            停用
                                        </span>
                                    {:else}
                                        <span class="text-gray-400">-</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {:else if isTemplate() && (!variantInfo?.variants || variantInfo.variants.length === 0)}
        <div class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <div class="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            </div>
            <p class="text-gray-500">暂无变体</p>
            <p class="text-sm text-gray-400 mt-1">该物品尚未创建任何变体</p>
        </div>
    {/if}

    <!-- 兄弟变体（如果是变体） -->
    {#if isVariant() && variantInfo?.sibling_variants && variantInfo.sibling_variants.length > 0}
        <div>
            <h3 class="text-sm font-medium text-gray-700 mb-3">其他变体</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {#each variantInfo.sibling_variants as sibling}
                    <a
                        href="/item/{sibling.variant_item}"
                        class="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                        <div class="font-mono text-xs text-blue-600 mb-1">{sibling.variant_item_detail?.SKU}</div>
                        <div class="text-sm text-gray-900 truncate">{sibling.variant_item_detail?.name}</div>
                        <div class="flex items-center justify-between mt-2 text-xs">
                            <span class="text-purple-600 font-medium">¥{formatPrice(sibling.effective_price)}</span>
                            <span class={sibling.variant_item_detail?.total_storage ? 'text-green-600' : 'text-red-500'}>
                                库存: {sibling.variant_item_detail?.total_storage || 0}
                            </span>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/if}
</div>

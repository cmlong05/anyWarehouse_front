<script lang="ts">
    import { goto } from '$app/navigation';
    import type { ItemSet, QuotationBrief } from '$lib';
    import type { ItemVariantInfo } from '$lib/types/variant';
    import { config } from '$lib/config';
    import ItemComponentManager from '$lib/components/ItemComponentManager.svelte';
    import ItemVariantManager from '$lib/components/ItemVariantManager.svelte';
    import { NumberStepper } from '$lib/components/ui';

    let { data } = $props<{ 
        data: { 
            itemDetail: ItemSet;
            quotations: QuotationBrief[];
            bestPrice: { price: string; supplier: string; quotation_id: number } | null;
            variantInfo: ItemVariantInfo | null;
        } 
    }>();
    
    // 判断是否为变体母版（处理字符串和布尔值）
    function isVariantTemplate(): boolean {
        return data.itemDetail.item.is_variant_template === true || 
               data.itemDetail.item.is_variant_template === 'true' ||
               data.itemDetail.item.is_variant_template === 1;
    }
    
    // 默认标签：母版显示变体，普通Item显示库存
    let activeTab = $state<'overview' | 'bom' | 'quotations' | 'variants'>(
        isVariantTemplate() ? 'variants' : 'overview'
    );
    let quantityValues = $state<Record<number, number>>({});
    let descriptionExpanded = $state(false);

    // 获取首选供应商的报价
    function getPreferredQuotation(): QuotationBrief | null {
        return data.quotations.find((q: QuotationBrief) => 
            q.is_preferred === true || String(q.is_preferred).toLowerCase() === 'true'
        ) || null;
    }

    // 计算显示价格（如果item的b_Price为空，则显示首选供应商报价）
    const displayPrice = $derived(() => {
        const itemPrice = data.itemDetail.item.b_Price;
        // 检查item自身价格是否有效（非空字符串、非null、非undefined、非0）
        if (itemPrice && itemPrice !== '' && itemPrice !== '0' && itemPrice !== '0.00') {
            return { price: itemPrice, currency: data.itemDetail.item.currency || 'CNY', source: 'item' as const };
        }
        
        // 尝试获取首选供应商报价（处理可能的字符串/布尔类型）
        const preferred = data.quotations.find((q: QuotationBrief) => 
            q.is_preferred === true || String(q.is_preferred).toLowerCase() === 'true'
        );
        if (preferred) {
            return { price: preferred.price, currency: preferred.currency, source: 'preferred' as const };
        }
        
        // 尝试获取最优价格
        if (data.bestPrice && data.bestPrice.price) {
            return { price: data.bestPrice.price, currency: data.itemDetail.item.currency || 'CNY', source: 'best' as const };
        }
        
        return { price: '-', currency: '', source: 'item' as const };
    });

    // 刷新变体数据
    async function refreshVariantInfo() {
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/item/${data.itemDetail.item.id}/variants/`);
            if (response.ok) {
                const variantInfo = await response.json();
                data = { ...data, variantInfo };
            }
        } catch (e) {
            console.error('刷新变体数据失败:', e);
        }
    }

    function formatPrice(price: string | number | null | undefined): string {
        if (price === null || price === undefined || price === '') {
            return '-';
        }
        return parseFloat(String(price)).toFixed(2);
    }

    // 报价分组相关
    interface GroupedQuotation {
        parentId: number | null;
        parentName: string;
        parentSku: string;
        isTemplate: boolean;
        quotations: QuotationBrief[];
        expanded: boolean;
    }
    
    let quotationGroups = $state<GroupedQuotation[]>([]);
    let independentQuotations = $state<QuotationBrief[]>([]);
    let hasVariantQuotations = $state(false);
    
    // 将报价按母版分组
    function groupQuotationsByParent(quotations: QuotationBrief[]) {
        const groups = new Map<number | string, GroupedQuotation>();
        const independent: QuotationBrief[] = [];
        let variantCount = 0;
        
        for (const q of quotations) {
            // 如果是变体且有母版，放入对应组
            if (q.is_variant && q.parent_item_id) {
                variantCount++;
                const key = q.parent_item_id;
                if (!groups.has(key)) {
                    groups.set(key, {
                        parentId: q.parent_item_id,
                        parentName: q.parent_item_name || '母版',
                        parentSku: q.parent_item_sku || '-',
                        isTemplate: false,
                        quotations: [],
                        expanded: false
                    });
                }
                groups.get(key)!.quotations.push(q);
            }
            // 如果是母版本身
            else if (q.is_variant_template) {
                variantCount++;
                const key = q.item || `template-${q.id}`;
                if (!groups.has(key)) {
                    groups.set(key, {
                        parentId: typeof q.item === 'number' ? q.item : null,
                        parentName: q.item_name || '母版',
                        parentSku: q.item_sku || '-',
                        isTemplate: true,
                        quotations: [],
                        expanded: false
                    });
                }
                groups.get(key)!.quotations.push(q);
            }
            // 独立的普通item - 单独收集，不平铺
            else {
                independent.push(q);
            }
        }
        
        hasVariantQuotations = variantCount > 0 || groups.size > 0;
        quotationGroups = Array.from(groups.values());
        independentQuotations = independent;
    }
    
    function toggleGroup(index: number) {
        quotationGroups[index].expanded = !quotationGroups[index].expanded;
    }
    
    $effect(() => {
        if (data.quotations.length > 0) {
            groupQuotationsByParent(data.quotations);
        }
    });

    function getTotalStock(): number {
        return data.itemDetail.item.total_storage ?? 0;
    }

    const handleStorage = async (event: Event, storage: any) => {
        event.preventDefault();
        
        const quantity = quantityValues[storage.id] ?? 1;
        if (isNaN(quantity) || quantity <= 0) {
            alert('请输入有效的出库数量');
            return;
        }
        if (quantity > storage.quantity) {
            alert('出库数量不能超过库存数量');
            return;
        }

        try {
            const newQuantity = storage.quantity - quantity;
            const response = await fetch(`${config.API_BASE_URL}/warehouse/storage/${storage.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQuantity }),
            });

            if (response.ok) {
                const updatedStorage = await response.json();
                const index = data.itemDetail.storages.findIndex((s: { id: number }) => s.id === storage.id);
                if (index !== -1) {
                    data.itemDetail.storages[index] = { ...data.itemDetail.storages[index], ...updatedStorage };
                }
                quantityValues[storage.id] = 1;
                data = { ...data };
            } else {
                alert('出库失败，请稍后重试');
            }
        } catch (error) {
            console.error('出库错误:', error);
            alert('网络错误，请检查网络连接');
        }
    };
    
    $effect(() => {
        if (data.itemDetail?.storages) {
            data.itemDetail.storages.forEach((storage: { id: number }) => {
                if (quantityValues[storage.id] === undefined) {
                    quantityValues[storage.id] = 1;
                }
            });
        }
    });
</script>

<svelte:head>
    <title>{data.itemDetail.item.name} | 品项详情</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-6">
    <!-- 面包屑导航 -->
    <div class="mb-6 space-y-2">
        {#each data.itemDetail.categories as category, catIndex}
            <nav class="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                <a href="/item/category/4" class="hover:text-blue-600 transition-colors">主分类</a>
                <span>/</span>
                {#each category.ancestors as ancestor}
                    <a href="/item/category/{ancestor.id}" class="hover:text-blue-600 transition-colors">{ancestor.name}</a>
                    <span>/</span>
                {/each}
                <a href="/item/category/{category.category.id}" class="hover:text-blue-600 transition-colors">{category.category.name}</a>
                <span>/</span>
                {#if catIndex === data.itemDetail.categories.length - 1}
                    <span class="text-gray-900 font-medium font-mono">{data.itemDetail.item.SKU}</span>
                {/if}
            </nav>
        {/each}
    </div>

    <!-- 主布局：左侧内容 + 右侧边栏 -->
    <div class="flex flex-col lg:flex-row gap-6">
        <!-- 左侧主内容区 -->
        <div class="flex-1 min-w-0">
            <!-- 顶部信息卡片 -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div class="flex flex-col lg:flex-row">
                    <!-- 图片区域 -->
                    <div class="lg:w-80 bg-gray-50 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200 overflow-hidden p-4">
                        {#if data.itemDetail.item.image}
                            <a
                                href={data.itemDetail.item.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="block leading-[0]"
                                title="点击查看大图"
                            >
                                <img 
                                    src={data.itemDetail.item.image.trim()} 
                                    alt={data.itemDetail.item.name}
                                    class="max-w-full max-h-80 object-contain hover:scale-105 transition-transform"
                                />
                            </a>
                        {:else}
                            <div class="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                <svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        {/if}
                    </div>

                    <!-- 基本信息 -->
                    <div class="flex-1 p-6">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900 mb-2">{data.itemDetail.item.name}</h1>
                                <div class="flex items-center gap-3 text-sm flex-wrap">
                                    <span class="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full font-mono">{data.itemDetail.item.SKU}</span>
                                    
                                    <!-- 变体标识 -->
                                    {#if isVariantTemplate()}
                                        <span class="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            变体母版
                                        </span>
                                    {:else if data.variantInfo?.is_variant}
                                        <span class="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                            变体
                                        </span>
                                        {#if data.variantInfo?.parent_item}
                                            <a href="/item/{data.variantInfo.parent_item.id}" class="text-xs text-blue-600 hover:underline">
                                                母版: {data.variantInfo.parent_item.sku}
                                            </a>
                                        {/if}
                                    {:else if getTotalStock() > 0}
                                        <span class="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">库存充足</span>
                                    {:else}
                                        <span class="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">暂无库存</span>
                                    {/if}
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <a 
                                    href="/item/add?copy_from={data.itemDetail.item.id}" 
                                    class="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
                                    title="复制"
                                    aria-label="复制"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </a>
                                <a 
                                    href="/item/{data.itemDetail.item.id}/edit" 
                                    class="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
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
                        <div class="mb-4">
                            {#if displayPrice().source === 'item'}
                                <span class="text-3xl font-bold text-gray-900">
                                    {formatPrice(displayPrice().price)}
                                </span>
                                <span class="text-gray-500 ml-1">{displayPrice().currency || 'CNY'}</span>
                                {#if data.bestPrice && parseFloat(data.bestPrice.price) < parseFloat(data.itemDetail.item.b_Price || '0')}
                                    <div class="mt-1 text-sm text-green-600">
                                        最优采购价: {formatPrice(data.bestPrice.price)} ({data.bestPrice.supplier})
                                    </div>
                                {/if}
                            {:else if displayPrice().source === 'preferred'}
                                {@const preferred = data.quotations.find((q: QuotationBrief) => 
                                    q.is_preferred === true || String(q.is_preferred).toLowerCase() === 'true'
                                )}
                                <span class="text-3xl font-bold text-amber-600">
                                    {formatPrice(displayPrice().price)}
                                </span>
                                <span class="text-gray-500 ml-1">{displayPrice().currency || 'CNY'}</span>
                                <div class="mt-1 text-sm text-amber-600 flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    首选供应商价: {preferred?.supplier_name || data.bestPrice?.supplier}
                                </div>
                            {:else}
                                <span class="text-3xl font-bold text-gray-900">
                                    {formatPrice(displayPrice().price)}
                                </span>
                                <span class="text-gray-500 ml-1">{displayPrice().currency || 'CNY'}</span>
                                {#if data.bestPrice}
                                    <div class="mt-1 text-sm text-green-600">
                                        最优采购价: {formatPrice(data.bestPrice?.price)} ({data.bestPrice?.supplier})
                                    </div>
                                {/if}
                            {/if}
                        </div>

                        <!-- 属性网格 -->
                        <div class="grid grid-cols-4 gap-3">
                            <div class="p-3 bg-gray-50 rounded-lg text-center">
                                <div class="text-xs text-gray-500 mb-1">重量</div>
                                <div class="font-medium text-gray-900">{data.itemDetail.item.weight}g</div>
                            </div>
                            <div class="p-3 bg-gray-50 rounded-lg text-center">
                                <div class="text-xs text-gray-500 mb-1">体积</div>
                                <div class="font-medium text-gray-900">{data.itemDetail.item.s_volume}cm³</div>
                            </div>
                            <div class="p-3 bg-gray-50 rounded-lg text-center">
                                <div class="text-xs text-gray-500 mb-1">总库存</div>
                                <div class="font-medium {getTotalStock() > 0 ? 'text-green-600' : 'text-red-600'}">{getTotalStock()}</div>
                            </div>
                            <div class="p-3 bg-gray-50 rounded-lg text-center">
                                <div class="text-xs text-gray-500 mb-1">位置数</div>
                                <div class="font-medium text-gray-900">{data.itemDetail.storages.length}</div>
                            </div>
                        </div>

                        <!-- 描述 -->
                        {#if data.itemDetail.item.description}
                            <div class="border-t border-gray-200 mt-4 pt-4">
                                <div class="relative">
                                    <p 
                                        class="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300 {descriptionExpanded ? '' : 'line-clamp-6'}"
                                    >
                                        {data.itemDetail.item.description}
                                    </p>
                                    {#if !descriptionExpanded && data.itemDetail.item.description.length > 100}
                                        <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
                                    {/if}
                                </div>
                                {#if data.itemDetail.item.description.length > 100}
                                    <div class="flex justify-end mt-1">
                                        <button 
                                            onclick={() => descriptionExpanded = !descriptionExpanded}
                                            class="text-[10px] flex items-center gap-0.5 cursor-pointer text-gray-500 hover:text-gray-700"
                                            style="background: none; border: none; padding: 0; margin: 0; font: inherit; outline: none; color: #6b7280;"
                                        >
                                            {descriptionExpanded ? '收起' : '更多...'}
                                            <svg 
                                                class="w-3 h-3 transition-transform duration-200 {descriptionExpanded ? 'rotate-180' : ''}" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- 标签页内容 -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <!-- 标签页导航 -->
                <div class="border-b border-gray-200">
                    <nav class="flex gap-1 px-4">
                        {#if !isVariantTemplate()}
                            <!-- 普通Item显示库存管理 -->
                            <button 
                                onclick={() => activeTab = 'overview'}
                                class="px-4 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
                            >
                                库存管理
                            </button>
                        {/if}
                        <button 
                            onclick={() => activeTab = 'quotations'}
                            class="px-4 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'quotations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
                        >
                            供应商报价
                            {#if data.quotations.length > 0}
                                <span class="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{data.quotations.length}</span>
                            {/if}
                        </button>
                        <button 
                            onclick={() => activeTab = 'bom'}
                            class="px-4 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'bom' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
                        >
                            BOM 组件
                        </button>
                        <!-- 只有母版或有变体时才显示变体标签 -->
                        {#if isVariantTemplate() || (data.variantInfo?.is_variant)}
                            <button 
                                onclick={() => activeTab = 'variants'}
                                class="px-4 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'variants' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
                            >
                                {#if isVariantTemplate()}
                                    <span class="mr-1">变体管理</span>
                                {:else}
                                    变体
                                {/if}
                                {#if data.variantInfo?.variants && data.variantInfo.variants.length > 0}
                                    <span class="ml-1.5 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">{data.variantInfo.variants.length}</span>
                                {/if}
                            </button>
                        {/if}
                    </nav>
                </div>

                <div class="p-6">
                    <!-- 库存管理标签 -->
                    {#if activeTab === 'overview'}
                        <div class="space-y-4">
                            {#if !isVariantTemplate()}
                                <!-- 普通Item库存管理 -->
                                <div class="flex items-center justify-between">
                                    <h2 class="text-lg font-semibold text-gray-900">库存分布</h2>
                                    <button
                                        type="button"
                                        class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                                        onclick={() => goto(`/storage/add/${data.itemDetail.item.id}`)}
                                    >
                                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        入库
                                    </button>
                                </div>
                            {/if}

                            {#if data.itemDetail.storages.length === 0 && !isVariantTemplate()}
                                <div class="text-center py-12 bg-gray-50 rounded-lg">
                                    <div class="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <p class="text-gray-500">暂无库存记录</p>
                                    <p class="text-sm text-gray-400 mt-1">点击上方按钮添加库存</p>
                                </div>
                            {:else if !isVariantTemplate()}
                                <div class="overflow-x-auto rounded-lg border border-gray-200">
                                    <table class="w-full text-sm min-w-[500px]">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-2 sm:px-4 py-3 text-left font-medium text-gray-700">位置</th>
                                                <th class="px-2 sm:px-4 py-3 text-left font-medium text-gray-700">标记</th>
                                                <th class="px-2 sm:px-4 py-3 text-right font-medium text-gray-700">数量</th>
                                                <th class="px-2 sm:px-4 py-3 text-center font-medium text-gray-700 whitespace-nowrap">出库</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200">
                                            {#each data.itemDetail.storages as storage}
                                                <tr class="hover:bg-gray-50">
                                                    <td class="px-2 sm:px-4 py-3">
                                                        <a href="/container/{storage.container_fastCode}" class="font-medium text-blue-600 hover:underline">
                                                            {storage.container_fastCode}
                                                        </a>
                                                    </td>
                                                    <td class="px-2 sm:px-4 py-3">
                                                        {#if storage.mark}
                                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                                                {storage.mark}
                                                            </span>
                                                        {:else}
                                                            <span class="text-gray-400">-</span>
                                                        {/if}
                                                    </td>
                                                    <td class="px-2 sm:px-4 py-3 text-right">
                                                        <a href="/storage/{storage.id}" class="font-medium text-gray-900 hover:text-blue-600">
                                                            {storage.quantity}
                                                        </a>
                                                    </td>
                                                    <td class="px-2 sm:px-4 py-3">
                                                        <div class="flex items-center justify-center gap-1 sm:gap-2">
                                                            <NumberStepper
                                                                bind:value={quantityValues[storage.id]}
                                                                min={1}
                                                                max={storage.quantity}
                                                                step={1}
                                                                decimalPlaces={0}
                                                                size="sm"
                                                            />
                                                            <button
                                                                onclick={(e) => handleStorage(e, storage)}
                                                                class="px-2 sm:px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
                                                            >
                                                                出库
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    <!-- 供应商报价标签 -->
                    {#if activeTab === 'quotations'}
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-semibold text-gray-900">供应商报价</h2>
                                <a 
                                    href="/supplier/quotation/add?item_id={data.itemDetail.item.id}&item_sku={data.itemDetail.item.SKU}" 
                                    class="btn btn-success btn-sm no-underline"
                                >
                                    添加报价
                                </a>
                            </div>

                            {#if data.quotations.length === 0}
                                <div class="text-center py-12 bg-gray-50 rounded-lg">
                                    <div class="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p class="text-gray-500">暂无供应商报价</p>
                                </div>
                            {:else}
                                {#if data.bestPrice}
                                    <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div class="flex items-center gap-2 text-green-800">
                                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                            </svg>
                                            <span class="font-medium">最优价格: {formatPrice(data.bestPrice.price)}</span>
                                            <span class="text-green-600">来自 {data.bestPrice.supplier}</span>
                                        </div>
                                    </div>
                                {/if}

                                <!-- 按母版/变体分组显示 -->
                                <div class="overflow-hidden rounded-lg border border-gray-200">
                                    <table class="w-full text-sm">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                {#if hasVariantQuotations}
                                                    <th class="px-4 py-3 text-left font-medium text-gray-700" style="width: 40px;"></th>
                                                {/if}
                                                <th class="px-4 py-3 text-left font-medium text-gray-700">供应商</th>
                                                <th class="px-4 py-3 text-right font-medium text-gray-700">单价</th>
                                                <th class="px-4 py-3 text-left font-medium text-gray-700">货币</th>
                                                <th class="px-4 py-3 text-left font-medium text-gray-700">MOQ</th>
                                                <th class="px-4 py-3 text-center font-medium text-gray-700">状态</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200">
                                            {#if hasVariantQuotations}
                                                <!-- 有变体时显示折叠结构 -->
                                                {#each quotationGroups as group, groupIndex}
                                                    <!-- 母版/分组行 -->
                                                    <tr class="group-header" onclick={() => toggleGroup(groupIndex)}>
                                                        <td class="px-4 py-3 expand-icon">
                                                            <svg class="w-4 h-4 transition-transform {group.expanded ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </td>
                                                        <td class="px-4 py-3 font-medium">
                                                            {group.parentSku}
                                                            {#if group.isTemplate}
                                                                <span class="badge badge-purple">母版</span>
                                                            {:else if group.parentId}
                                                                <span class="badge badge-blue">变体组</span>
                                                            {/if}
                                                        </td>
                                                        <td class="px-4 py-3 text-gray-600">{group.parentName}</td>
                                                        <td class="px-4 py-3" colspan="3">
                                                            <span class="text-sm text-gray-500">{group.quotations.length} 个报价</span>
                                                        </td>
                                                    </tr>
                                                    <!-- 变体/报价详情行 -->
                                                    {#if group.expanded}
                                                        {#each group.quotations as quotation}
                                                            <tr class="group-item hover:bg-gray-50">
                                                                <td class="px-4 py-3"></td>
                                                                <td class="px-4 py-3">
                                                                    <a href="/supplier/{quotation.supplier}" class="font-medium text-blue-600 hover:underline">
                                                                        {quotation.supplier_name}
                                                                    </a>
                                                                </td>
                                                                <td class="px-4 py-3 text-right font-mono font-medium">{formatPrice(quotation.price)}</td>
                                                                <td class="px-4 py-3 text-gray-600">{quotation.currency}</td>
                                                                <td class="px-4 py-3">{quotation.min_quantity}</td>
                                                                <td class="px-4 py-3 text-center">
                                                                    {#if quotation.is_preferred}
                                                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                            </svg>
                                                                            首选
                                                                        </span>
                                                                    {:else}
                                                                        <span class="text-gray-400">-</span>
                                                                    {/if}
                                                                </td>
                                                            </tr>
                                                        {/each}
                                                    {/if}
                                                {/each}
                                                <!-- 独立物品直接平铺显示（不折叠） -->
                                                {#each independentQuotations as quotation}
                                                    <tr class="hover:bg-gray-50">
                                                        <td class="px-4 py-3"></td>
                                                        <td class="px-4 py-3">
                                                            <a href="/supplier/{quotation.supplier}" class="font-medium text-blue-600 hover:underline">
                                                                {quotation.supplier_name}
                                                            </a>
                                                        </td>
                                                        <td class="px-4 py-3 text-right font-mono font-medium">{formatPrice(quotation.price)}</td>
                                                        <td class="px-4 py-3 text-gray-600">{quotation.currency}</td>
                                                        <td class="px-4 py-3">{quotation.min_quantity}</td>
                                                        <td class="px-4 py-3 text-center">
                                                            {#if quotation.is_preferred}
                                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                    首选
                                                                </span>
                                                            {:else}
                                                                <span class="text-gray-400">-</span>
                                                            {/if}
                                                        </td>
                                                    </tr>
                                                {/each}
                                            {:else}
                                                <!-- 无变体时直接平铺显示 -->
                                                {#each data.quotations as quotation}
                                                    <tr class="hover:bg-gray-50">
                                                        <td class="px-4 py-3">
                                                            <a href="/supplier/{quotation.supplier}" class="font-medium text-blue-600 hover:underline">
                                                                {quotation.supplier_name}
                                                            </a>
                                                        </td>
                                                        <td class="px-4 py-3 text-right font-mono font-medium">{formatPrice(quotation.price)}</td>
                                                        <td class="px-4 py-3 text-gray-600">{quotation.currency}</td>
                                                        <td class="px-4 py-3">{quotation.min_quantity}</td>
                                                        <td class="px-4 py-3 text-center">
                                                            {#if quotation.is_preferred}
                                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                    首选
                                                                </span>
                                                            {:else}
                                                                <span class="text-gray-400">-</span>
                                                            {/if}
                                                        </td>
                                                    </tr>
                                                {/each}
                                            {/if}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    <!-- BOM 标签 -->
                    {#if activeTab === 'bom'}
                        <ItemComponentManager 
                            itemId={data.itemDetail.item.id}
                            itemSKU={data.itemDetail.item.SKU}
                            itemName={data.itemDetail.item.name}
                        />
                    {/if}

                    <!-- 变体标签 -->
                    {#if activeTab === 'variants'}
                        <ItemVariantManager 
                            itemId={data.itemDetail.item.id}
                            itemSku={data.itemDetail.item.SKU}
                            itemName={data.itemDetail.item.name}
                            variantInfo={data.variantInfo}
                            onRefresh={refreshVariantInfo}
                        />
                    {/if}
                </div>
            </div>
        </div>

        <!-- 右侧边栏 -->
        <aside class="lg:w-72 flex-shrink-0 lg:sticky lg:top-4 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4 pr-1">
            {#each data.itemDetail.categories as category}
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
                    <!-- 分类标题 -->
                    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 sticky top-0">
                        <a href="/item/category/{category.category.id}" class="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {category.category.name}
                        </a>
                    </div>
                    
                    <!-- 品项列表 -->
                    <ul class="divide-y divide-gray-100">
                        {#each category.items as cateItem}
                            <li>
                                {#if cateItem.SKU === data.itemDetail.item.SKU}
                                    <div class="px-4 py-3 bg-blue-50 border-l-4 border-blue-500">
                                        <div class="font-mono text-sm font-medium text-blue-700">{cateItem.SKU}</div>
                                        <div class="text-sm text-blue-900 mt-0.5 line-clamp-2">{cateItem.name}</div>
                                    </div>
                                {:else}
                                    <a href="/item/{cateItem.id}" class="block px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 border-transparent">
                                        <div class="font-mono text-sm text-blue-600">{cateItem.SKU}</div>
                                        <div class="text-sm text-gray-700 mt-0.5 line-clamp-2">{cateItem.name}</div>
                                    </a>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </aside>
    </div>
</div>

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
    }
    
    .btn:hover {
        opacity: 0.9;
    }
    
    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
    }
    
    .btn-success {
        background-color: #10b981;
        color: white;
    }
    
    .btn-success:hover {
        background-color: #059669;
    }
    
    .no-underline {
        text-decoration: none;
    }
    
    /* 报价分组样式 */
    .group-header {
        background-color: #f8fafc;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .group-header:hover {
        background-color: #f1f5f9;
    }
    .group-item {
        background-color: white;
    }
    .group-item td:first-child {
        border-left: 3px solid #e2e8f0;
    }
    .group-item td:nth-child(2) {
        padding-left: 3rem;
    }
    .expand-icon {
        text-align: center;
        color: #64748b;
    }
    .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        margin-left: 0.5rem;
    }
    .badge-purple {
        background-color: #e9d5ff;
        color: #7c3aed;
    }
    .badge-blue {
        background-color: #dbeafe;
        color: #2563eb;
    }
    .rotate-90 {
        transform: rotate(90deg);
    }
</style>

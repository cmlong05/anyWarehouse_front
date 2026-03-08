<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { quotationAPI, supplierAPI, itemAPI } from '$lib/api';
    import type { SupplierBrief, Item, QuotationCreateRequest, QuotationBrief } from '$lib';
    import { config } from '$lib/config';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Svelecte from 'svelecte';
    import { NumberStepper } from '$lib/components/ui';
    
    // 从URL获取预设的供应商ID和物品ID
    const presetIds = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const supplierId = urlParams.get('supplier_id');
        const itemId = urlParams.get('item_id');
        return {
            supplierId: supplierId ? parseInt(supplierId) : null,
            itemId: itemId ? parseInt(itemId) : null
        };
    });
    
    let suppliers = $state<SupplierBrief[]>([]);
    let selectedItem = $state<Item | null>(null);
    let existingQuotations = $state<QuotationBrief[]>([]);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let success = $state('');
    
    // 表单数据
    let formData = $state<QuotationCreateRequest>({
        supplier: 0,
        item: null,
        price: '',
        currency: 'CNY',
        min_quantity: 1,
        postage: null,
        lead_time_days: null,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: null,
        is_preferred: false,
        note: ''
    });
    
    // 计算总价
    let totalPrice = $derived(() => {
        const price = parseFloat(formData.price as string) || 0;
        const postage = parseFloat(formData.postage as string) || 0;
        return price + postage;
    });
    
    // 供应商选项
    const supplierOptions = $derived(suppliers.map(s => ({
        value: s.id,
        label: `${s.name} (${s.code})`
    })));
    
    // 选中的供应商信息
    let selectedSupplier = $derived(suppliers.find(s => s.id === formData.supplier));
    
    async function loadInitialData() {
        try {
            suppliers = await supplierAPI.listBrief();
            
            const { supplierId, itemId } = presetIds();
            
            if (supplierId) {
                formData.supplier = supplierId;
            }
            
            if (itemId) {
                await selectItem(itemId);
            }
        } catch (err) {
            error = '加载数据失败';
        }
    }
    
    async function selectItem(itemId: number) {
        try {
            selectedItem = await itemAPI.get(itemId);
            formData.item = itemId;
            // 加载该物品的现有报价
            await loadExistingQuotations(itemId);
        } catch (err) {
            console.error('加载物品失败:', err);
        }
    }
    
    async function loadExistingQuotations(itemId: number) {
        try {
            const response = await fetch(`${config.API_BASE_URL}/supplier/quotations/by_item/?item_id=${itemId}`);
            if (response.ok) {
                const data = await response.json();
                existingQuotations = data.quotations || [];
            }
        } catch (err) {
            console.error('加载现有报价失败:', err);
        }
    }
    
    // 监听物品选择变化
    $effect(() => {
        const itemId = formData.item;
        if (itemId && typeof itemId === 'number' && itemId > 0) {
            if (!selectedItem || selectedItem.id !== itemId) {
                selectItem(itemId);
            }
        } else if (itemId === null) {
            selectedItem = null;
            existingQuotations = [];
        }
    });
    
    // 构建物品搜索 URL
    const itemSearchUrl = $derived(`${config.API_BASE_URL}/product/item/?search=[query]`);
    
    // 处理 fetch 返回的数据
    function handleItemFetch(json: unknown) {
        const items = Array.isArray(json) ? json : ((json as { results?: Item[] })?.results || []);
        return items.map((item: Item) => ({
            id: item.id,
            value: item.id,
            label: `${item.SKU} - ${item.name}`
        }));
    }
    
    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = '';
        success = '';
        
        if (!formData.supplier) {
            error = '请选择供应商';
            return;
        }
        if (!formData.item) {
            error = '请选择物品';
            return;
        }
        if (!formData.price || parseFloat(formData.price as string) <= 0) {
            error = '请输入有效的价格';
            return;
        }
        
        submitting = true;
        try {
            await quotationAPI.create(formData);
            success = '报价创建成功';
            setTimeout(() => goto(`/supplier/${formData.supplier}`), 1000);
        } catch (err) {
            error = err instanceof Error ? err.message : '创建失败';
        } finally {
            submitting = false;
        }
    }
    
    function goBack() {
        const { supplierId } = presetIds();
        if (supplierId) {
            goto(`/supplier/${supplierId}`);
        } else {
            goto('/supplier');
        }
    }
    
    function formatPrice(price: string | number | null): string {
        if (!price) return '-';
        return parseFloat(price.toString()).toFixed(2);
    }
    
    onMount(async () => {
        await loadInitialData();
        loading = false;
    });
</script>

<div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <button
                        onclick={goBack}
                        class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="返回"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 class="text-xl font-bold text-gray-900">添加供应商报价</h1>
                        <p class="text-sm text-gray-500 mt-0.5">
                            {#if selectedSupplier}
                                为 <span class="font-medium text-gray-700">{selectedSupplier.name}</span> 添加报价
                            {:else}
                                选择供应商并添加报价信息
                            {/if}
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button
                        type="button"
                        onclick={goBack}
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        form="quotationForm"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        disabled={submitting}
                    >
                        {#if submitting}
                            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            保存中...
                        {:else}
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            保存报价
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-6">
        {#if loading}
            <Loading text="加载中..." />
        {:else}
            <form id="quotationForm" onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- 左侧：物品选择和预览 -->
                <div class="lg:col-span-1 space-y-4">
                    <!-- 供应商选择 -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <span class="block text-sm font-medium text-gray-700 mb-2">
                            供应商 <span class="text-red-500">*</span>
                        </span>
                        <Svelecte
                            options={supplierOptions}
                            bind:value={formData.supplier}
                            placeholder="选择供应商..."
                            searchable={true}
                            required
                            class="w-full"
                        />
                        {#if selectedSupplier}
                            <div class="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div class="flex items-center gap-2 text-sm">
                                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span class="font-medium text-blue-900">{selectedSupplier.name}</span>
                                </div>
                                {#if selectedSupplier.contact}
                                    <p class="text-xs text-blue-700 mt-1">联系人: {selectedSupplier.contact}</p>
                                {/if}
                            </div>
                        {/if}
                    </div>

                    <!-- 物品选择 -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <span class="block text-sm font-medium text-gray-700 mb-2">
                            选择物品 <span class="text-red-500">*</span>
                        </span>
                        <Svelecte
                            bind:value={formData.item}
                            valueAsObject={false}
                            placeholder="搜索SKU或名称..."
                            searchable={true}
                            minQuery={1}
                            fetch={itemSearchUrl}
                            fetchCallback={handleItemFetch}
                            valueField="value"
                            labelField="label"
                            class="w-full"
                        />
                    </div>

                    <!-- 物品预览卡片 -->
                    {#if selectedItem}
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div class="aspect-video bg-gray-100 flex items-center justify-center">
                                {#if selectedItem.image}
                                    <img 
                                        src={selectedItem.image} 
                                        alt={selectedItem.name}
                                        class="w-full h-full object-cover"
                                    />
                                {:else}
                                    <div class="text-center text-gray-400">
                                        <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span class="text-sm">暂无图片</span>
                                    </div>
                                {/if}
                            </div>
                            <div class="p-4">
                                <div class="text-xs font-mono text-blue-600 mb-1">{selectedItem.SKU}</div>
                                <h3 class="font-semibold text-gray-900">{selectedItem.name}</h3>
                                <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
                                    <div class="bg-gray-50 rounded-lg p-2 text-center">
                                        <div class="text-gray-500 text-xs">重量</div>
                                        <div class="font-medium">{selectedItem.weight}g</div>
                                    </div>
                                    <div class="bg-gray-50 rounded-lg p-2 text-center">
                                        <div class="text-gray-500 text-xs">体积</div>
                                        <div class="font-medium">{selectedItem.s_volume}cm³</div>
                                    </div>
                                </div>
                                {#if selectedItem.b_Price}
                                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span class="text-sm text-gray-500">当前参考价</span>
                                        <span class="font-semibold text-gray-900">¥{selectedItem.b_Price}</span>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <!-- 现有报价对比 -->
                    {#if existingQuotations.length > 0}
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                该物品的其他报价
                            </h3>
                            <div class="space-y-2">
                                {#each existingQuotations.slice(0, 5) as quotation}
                                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                        <div class="flex items-center gap-2">
                                            <span class="font-medium">{quotation.supplier_name}</span>
                                            {#if quotation.is_preferred}
                                                <span class="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">首选</span>
                                            {/if}
                                        </div>
                                        <span class="font-semibold">¥{formatPrice(quotation.price)}</span>
                                    </div>
                                {/each}
                                {#if existingQuotations.length > 5}
                                    <div class="text-center text-xs text-gray-500">
                                        还有 {existingQuotations.length - 5} 个报价...
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- 右侧：报价表单 -->
                <div class="lg:col-span-2 space-y-4">
                    {#if error}
                        <Alert {error} />
                    {/if}
                    {#if success}
                        <Alert error={success} variant="info" />
                    {/if}

                    <!-- 主要价格信息 -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            价格信息
                        </h2>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <!-- 单价 -->
                            <div>
                                <label for="price" class="block text-sm font-medium text-gray-700 mb-2">
                                    单价 <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                                    <input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        bind:value={formData.price}
                                        placeholder="0.00"
                                        class="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <!-- 货币 -->
                            <div>
                                <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">货币</label>
                                <select
                                    id="currency"
                                    bind:value={formData.currency}
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="CNY">CNY - 人民币</option>
                                    <option value="USD">USD - 美元</option>
                                    <option value="EUR">EUR - 欧元</option>
                                    <option value="GBP">GBP - 英镑</option>
                                    <option value="JPY">JPY - 日元</option>
                                </select>
                            </div>

                            <!-- 最小订购量 -->
                            <div>
                                <label for="moq" class="block text-sm font-medium text-gray-700 mb-2">最小订购量 (MOQ)</label>
                                <NumberStepper
                                    id="moq"
                                    value={formData.min_quantity || 1}
                                    min={1}
                                    step={1}
                                    onchange={(v) => formData.min_quantity = v}
                                />
                            </div>
                        </div>

                        <!-- 附加费用 -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label for="postage" class="block text-sm font-medium text-gray-700 mb-2">邮费/运费</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                                    <input
                                        id="postage"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        bind:value={formData.postage}
                                        placeholder="可选"
                                        class="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label for="leadTime" class="block text-sm font-medium text-gray-700 mb-2">交货周期</label>
                                <div class="relative">
                                    <input
                                        id="leadTime"
                                        type="number"
                                        min="1"
                                        bind:value={formData.lead_time_days}
                                        placeholder="天数"
                                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">天</span>
                                </div>
                            </div>
                        </div>

                        <!-- 价格预览 -->
                        {#if formData.price}
                            <div class="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="text-sm text-green-700">单价 + 运费</div>
                                        <div class="text-2xl font-bold text-green-900">
                                            ¥{formatPrice(totalPrice())}
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-green-700">预估单价成本</div>
                                        <div class="text-lg font-semibold text-green-800">
                                            {#if formData.min_quantity && formData.min_quantity > 1}
                                                ¥{(totalPrice() / formData.min_quantity).toFixed(2)}/件
                                            {:else}
                                                ¥{formatPrice(formData.price)}
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- 有效期和备注 -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            有效期和其他
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label for="validFrom" class="block text-sm font-medium text-gray-700 mb-2">有效期开始</label>
                                <input
                                    id="validFrom"
                                    type="date"
                                    bind:value={formData.valid_from}
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label for="validUntil" class="block text-sm font-medium text-gray-700 mb-2">有效期结束</label>
                                <input
                                    id="validUntil"
                                    type="date"
                                    bind:value={formData.valid_until}
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <!-- 首选报价 -->
                        <label class="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
                            <input
                                type="checkbox"
                                bind:checked={formData.is_preferred}
                                class="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                            />
                            <div>
                                <div class="font-medium text-amber-900">设为首选报价</div>
                                <div class="text-sm text-amber-700">该供应商将成为此物品的默认供应商</div>
                            </div>
                        </label>

                        <!-- 备注 -->
                        <div class="mt-4">
                            <label for="note" class="block text-sm font-medium text-gray-700 mb-2">备注</label>
                            <textarea
                                id="note"
                                bind:value={formData.note}
                                rows="3"
                                placeholder="添加关于此报价的备注信息..."
                                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                            ></textarea>
                        </div>
                    </div>
                </div>
            </form>
        {/if}
    </div>
</div>

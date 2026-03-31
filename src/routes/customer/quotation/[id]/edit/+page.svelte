<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { customerQuotationAPI } from '$lib/api';
    import type { CustomerQuotation, CustomerQuotationCreateRequest } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import { NumberStepper } from '$lib/components/ui';
    
    // 修复 TypeScript 错误：处理 params.id 可能为 undefined 的情况
    const id = $derived(() => {
        const paramId = page.params.id;
        return paramId ? parseInt(paramId) : 0;
    });
    
    let quotation = $state<CustomerQuotation | null>(null);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let success = $state('');
    
    // 表单数据
    let formData = $state<CustomerQuotationCreateRequest>({
        customer: 0,
        item: null,
        price: '',
        currency: 'USD',
        min_quantity: 1,
        lead_time_days: null,
        valid_from: null,
        note: ''
    });
    
    // 计算总价
    let totalPrice = $derived(() => {
        const price = typeof formData.price === 'number' ? formData.price : parseFloat(formData.price as string) || 0;
        return price;
    });
    
    async function loadData() {
        const quotationId = id();
        if (!quotationId) {
            error = '无效的报价ID';
            return;
        }
        
        try {
            const quotationData = await customerQuotationAPI.get(quotationId);
            
            quotation = quotationData;
            
            // 填充表单数据
            formData = {
                customer: quotation.customer,
                item: quotation.item,
                price: quotation.price,
                currency: quotation.currency,
                min_quantity: quotation.min_quantity,
                lead_time_days: quotation.lead_time_days,
                valid_from: quotation.valid_from,
                note: quotation.note
            };
        } catch (err) {
            error = err instanceof Error ? err.message : '加载数据失败';
        }
    }
    
    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = '';
        success = '';
        
        const quotationId = id();
        if (!quotationId) {
            error = '无效的报价ID';
            return;
        }
        
        if (!formData.customer) {
            error = '请选择客户';
            return;
        }
        
        const priceNum = typeof formData.price === 'number' ? formData.price : parseFloat(formData.price as string);
        if (formData.price === '' || formData.price === null || formData.price === undefined || isNaN(priceNum) || priceNum < 0) {
            error = '请输入有效的价格';
            return;
        }
        
        submitting = true;
        try {
            await customerQuotationAPI.update(quotationId, formData);
            success = '报价更新成功';
            setTimeout(() => goto(`/customer/quotation/${quotationId}`), 1000);
        } catch (err) {
            error = err instanceof Error ? err.message : '更新失败';
        } finally {
            submitting = false;
        }
    }
    
    function goBack() {
        const quotationId = id();
        if (quotationId) {
            goto(`/customer/quotation/${quotationId}`);
        } else {
            goto('/customer/quotation');
        }
    }
    
    function formatPrice(price: string | number | null): string {
        if (!price) return '-';
        return parseFloat(price.toString()).toFixed(2);
    }
    
    onMount(async () => {
        await loadData();
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
                        <h1 class="text-xl font-bold text-gray-900">编辑客户报价</h1>
                        {#if quotation}
                            <p class="text-sm text-gray-500 mt-0.5">
                                报价 ID: <span class="font-mono">{quotation.id}</span>
                            </p>
                        {/if}
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
                <!-- 左侧：客户和物品选择 -->
                <div class="lg:col-span-1 space-y-4">
                    <!-- 客户信息（只读） -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <span class="block text-sm font-medium text-gray-700 mb-2">
                            客户
                        </span>
                        {#if quotation?.customer_detail}
                            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div class="text-sm font-semibold text-gray-900">{quotation.customer_detail.code}</div>
                                <div class="text-sm text-gray-700 mt-0.5">{quotation.customer_detail.name}</div>
                            </div>
                        {:else if quotation?.customer}
                            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div class="text-sm text-gray-700">客户 ID: {quotation.customer}</div>
                            </div>
                        {:else}
                            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div class="text-sm text-gray-500">未关联客户</div>
                            </div>
                        {/if}
                    </div>

                    <!-- 物品信息（只读） -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <span class="block text-sm font-medium text-gray-700 mb-2">
                            物品
                        </span>
                        {#if quotation?.item_detail}
                            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-sm font-semibold text-gray-900">{quotation.item_detail.SKU}</span>
                                    {#if (quotation.item_detail as any).is_variant}
                                        <span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">变体</span>
                                    {/if}
                                </div>
                                <div class="text-sm text-gray-700">{quotation.item_detail.name}</div>
                                {#if quotation.item_detail.name_en}
                                    <div class="text-xs text-gray-500 mt-0.5">{quotation.item_detail.name_en}</div>
                                {/if}
                            </div>
                        {:else if quotation?.item}
                            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div class="text-sm text-gray-700">物品 ID: {quotation.item}</div>
                            </div>
                        {:else}
                            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div class="text-sm text-gray-500">未关联物品</div>
                            </div>
                        {/if}
                    </div>

                    {#if error}
                        <Alert {error} />
                    {/if}
                    {#if success}
                        <Alert error={success} variant="info" />
                    {/if}
                </div>

                <!-- 右侧：价格信息 -->
                <div class="lg:col-span-2 space-y-4">
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
                                <NumberStepper
                                    id="price"
                                    value={typeof formData.price === 'number' ? formData.price : parseFloat(formData.price as string) || 0}
                                    min={0}
                                    step={1}
                                    decimalPlaces={2}
                                    onchange={(v) => formData.price = v || 0}
                                />
                            </div>

                            <!-- 货币（只读） -->
                            <div>
                                <p class="block text-sm font-medium text-gray-700 mb-2">货币</p>
                                <div class="flex items-center h-10 px-3 rounded-lg border border-gray-200 bg-gray-50">
                                    <span class="text-sm font-semibold text-gray-700">{formData.currency || 'USD'}</span>
                                </div>
                            </div>

                            <!-- 最小订购量 -->
                            <div>
                                <label for="moq" class="block text-sm font-medium text-gray-700 mb-2">最小订购量 (MOQ)</label>
                                <NumberStepper
                                    id="moq"
                                    value={formData.min_quantity || 1}
                                    min={1}
                                    step={1}
                                    decimalPlaces={0}
                                    onchange={(v) => formData.min_quantity = v || 1}
                                />
                            </div>
                        </div>

                        <!-- 附加费用 -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label for="leadTime" class="block text-sm font-medium text-gray-700 mb-2">交货周期 (天)</label>
                                <NumberStepper
                                    id="leadTime"
                                    value={formData.lead_time_days || 1}
                                    min={1}
                                    step={1}
                                    decimalPlaces={0}
                                    onchange={(v) => formData.lead_time_days = v || 1}
                                />
                            </div>
                        </div>

                        <!-- 价格预览 -->
                        {#if formData.price}
                            <div class="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="text-sm text-green-700">单价</div>
                                        <div class="text-2xl font-bold text-green-900">
                                            ¥{formatPrice(totalPrice())}
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-green-700">预估单价</div>
                                        <div class="text-lg font-semibold text-green-800">
                                            {#if formData.min_quantity && formData.min_quantity > 1}
                                                ¥{(totalPrice() / (formData.min_quantity || 1)).toFixed(2)}/件
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
                        </div>

                        <!-- 备注 -->
                        <div>
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

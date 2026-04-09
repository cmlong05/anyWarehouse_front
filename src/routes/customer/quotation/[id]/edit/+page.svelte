<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { customerQuotationAPI } from '$lib/api';
    import type { CustomerQuotation, CustomerQuotationCreateRequest } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import QuotationEditHeader from '$lib/components/QuotationEditHeader.svelte';
    import QuotationReadonlyInfoCards from '$lib/components/QuotationReadonlyInfoCards.svelte';
    import { NumberStepper } from '$lib/components/ui';
    import { loadQuotationEditData, parseRouteId, submitQuotationEditData, validateQuotationPrice } from '$lib/composables/quotationEdit';
    
    // 修复 TypeScript 错误：处理 params.id 可能为 undefined 的情况
    const id = $derived(() => {
        return parseRouteId(page.params.id);
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
        note: '',
        partner_sku: ''
    });
    
    // 计算总价
    let totalPrice = $derived(() => {
        const price = typeof formData.price === 'number' ? formData.price : parseFloat(formData.price as string) || 0;
        return price;
    });
    
    async function loadData() {
        await loadQuotationEditData<CustomerQuotation, CustomerQuotationCreateRequest>({
            quotationId: id(),
            fetchQuotation: (quotationId) => customerQuotationAPI.get(quotationId),
            mapToFormData: (quotationData) => ({
                customer: quotationData.customer,
                item: quotationData.item,
                price: quotationData.price,
                currency: quotationData.currency,
                min_quantity: quotationData.min_quantity,
                lead_time_days: quotationData.lead_time_days,
                valid_from: quotationData.valid_from,
                note: quotationData.note,
                partner_sku: quotationData.partner_sku || ''
            }),
            onSuccess: ({ quotation: quotationData, formData: nextFormData }) => {
                quotation = quotationData;
                formData = nextFormData;
            },
            onError: (message) => {
                error = message;
            },
            onLoadingChange: (value) => {
                loading = value;
            },
            invalidIdMessage: '无效的报价ID',
            loadFailedMessage: '加载数据失败',
        });
    }
    
    async function handleSubmit(e: Event) {
        e.preventDefault();

        await submitQuotationEditData<CustomerQuotationCreateRequest, CustomerQuotation>({
            quotationId: id(),
            formData,
            quotation,
            validate: ({ formData: currentFormData }) => {
                if (!currentFormData.customer) {
                    return '请选择客户';
                }
                return validateQuotationPrice(currentFormData.price, { allowZero: true });
            },
            update: (quotationId, payload) => customerQuotationAPI.update(quotationId, payload),
            onSubmittingChange: (value) => {
                submitting = value;
            },
            onError: (message) => {
                error = message;
            },
            onSuccess: (message) => {
                success = message;
            },
            successMessage: '报价更新成功',
            updateFailedMessage: '更新失败',
            onAfterSuccess: () => {
                setTimeout(() => goto(`/customer/quotation/${id()}`), 1000);
            },
        });
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
    
    onMount(loadData);
</script>

<div class="min-h-screen bg-gray-50">
    <QuotationEditHeader
        title="编辑客户报价"
        quotationId={quotation?.id}
        {submitting}
        onBack={goBack}
    />

    <div class="max-w-7xl mx-auto px-4 py-6">
        {#if loading}
            <Loading text="加载中..." />
        {:else}
            <form id="quotationForm" onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- 左侧：客户和物品选择 -->
                <div class="lg:col-span-1 space-y-4">
                    <QuotationReadonlyInfoCards
                        partnerLabel="客户"
                        partnerCode={quotation?.customer_detail?.code}
                        partnerName={quotation?.customer_detail?.name}
                        partnerId={quotation?.customer}
                        itemLabel="物品"
                        itemSku={quotation?.item_detail?.SKU}
                        itemName={quotation?.item_detail?.name}
                        itemNameEn={quotation?.item_detail?.name_en}
                        itemId={quotation?.item}
                        itemIsVariant={(quotation?.item_detail as any)?.is_variant === true}
                    />

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
                            <div>
                                <label for="partner_sku" class="block text-sm font-medium text-gray-700 mb-2">合作方SKU</label>
                                <input
                                    type="text"
                                    id="partner_sku"
                                    bind:value={formData.partner_sku}
                                    placeholder="客户自己的物品编码（可选）"
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

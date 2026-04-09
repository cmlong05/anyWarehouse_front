<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { quotationAPI } from '$lib/api';
    import type { Quotation, QuotationCreateRequest } from '$lib';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import QuotationEditHeader from '$lib/components/QuotationEditHeader.svelte';
    import QuotationReadonlyInfoCards from '$lib/components/QuotationReadonlyInfoCards.svelte';
    import {  NumberStepper } from '$lib/components/ui';
    import { loadQuotationEditData, parseRouteId, submitQuotationEditData, validateQuotationPrice } from '$lib/composables/quotationEdit';
    
    let quotation = $state<Quotation | null>(null);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let success = $state('');
    
    const id = $derived(() => {
        return parseRouteId(page.params.id);
    });
    
    // 表单数据
    let formData = $state<QuotationCreateRequest>({
        supplier: 0,
        item: null,
        price: '',
        currency: 'CNY',
        min_quantity: 1,
        lead_time_days: null,
        valid_from: null,
        valid_until: null,
        is_preferred: false,
        note: '',
        partner_sku: ''
    });
    
    async function loadData() {
        await loadQuotationEditData<Quotation, QuotationCreateRequest>({
            quotationId: id(),
            fetchQuotation: (quotationId) => quotationAPI.get(quotationId),
            mapToFormData: (quotationData) => ({
                supplier: quotationData.supplier,
                item: quotationData.item,
                price: quotationData.price,
                currency: quotationData.currency,
                min_quantity: quotationData.min_quantity,
                lead_time_days: quotationData.lead_time_days,
                valid_from: quotationData.valid_from,
                valid_until: quotationData.valid_until,
                is_preferred: quotationData.is_preferred,
                note: quotationData.note || '',
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
            loadFailedMessage: '加载失败',
        });
    }
    
    async function handleSubmit(e: Event) {
        e.preventDefault();

        await submitQuotationEditData<QuotationCreateRequest, Quotation, QuotationCreateRequest>({
            quotationId: id(),
            formData,
            quotation,
            validate: ({ formData: currentFormData, quotation: currentQuotation }) => {
                const supplierId = currentQuotation?.supplier ?? currentFormData.supplier;
                if (!supplierId) {
                    return '请选择供应商';
                }

                const itemId = currentFormData.item ?? currentQuotation?.item ?? null;
                if (!itemId) {
                    return '请选择物品';
                }

                return validateQuotationPrice(currentFormData.price, { allowZero: false });
            },
            buildPayload: ({ formData: currentFormData, quotation: currentQuotation }) => ({
                ...currentFormData,
                // 编辑时固定关联，不允许变更供应商
                supplier: currentQuotation?.supplier ?? currentFormData.supplier,
                // Svelecte 远程模式下可能在未触发搜索时清空 value，回退到原始报价 item
                item: currentFormData.item ?? currentQuotation?.item ?? null
            }),
            update: (quotationId, payload) => quotationAPI.update(quotationId, payload),
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
                setTimeout(() => goto(`/supplier/quotation/${id()}`), 1000);
            },
        });
    }
    
    function goBack() {
        const quotationId = id();
        if (quotationId) {
            goto(`/supplier/quotation/${quotationId}`);
        } else {
            goto('/supplier/quotation');
        }
    }
    
    onMount(loadData);
</script>

<div class="min-h-screen bg-gray-50">
    <QuotationEditHeader
        title="编辑供应商报价"
        quotationId={quotation?.id}
        {submitting}
        onBack={goBack}
    />

    <div class="max-w-7xl mx-auto px-4 py-6">
        {#if loading}
            <Loading text="加载中..." />
        {:else if error && !quotation}
            <Alert {error} />
            <button class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors mt-4" onclick={() => goto('/supplier')}>
                返回供应商列表
            </button>
        {:else}
            <form id="quotationForm" onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-1 space-y-4">
                    <QuotationReadonlyInfoCards
                        partnerLabel="供应商"
                        partnerCode={quotation?.supplier_detail?.code}
                        partnerName={quotation?.supplier_detail?.name}
                        partnerId={quotation?.supplier}
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

                <div class="lg:col-span-2 space-y-4">
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
                                    value={formData.price ? Number(formData.price) : undefined}
                                    min={0}
                                    step={0.01}
                                    decimalPlaces={2}
                                    placeholder="0.00"
                                    onchange={(v) => formData.price = v !== undefined ? String(v) : ''}
                                />
                            </div>

                            <div>
                                <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">货币</label>
                                <select id="currency" bind:value={formData.currency} class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="CNY">CNY</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="JPY">JPY</option>
                                </select>
                            </div>

                            <div>
                                <label for="min_quantity" class="block text-sm font-medium text-gray-700 mb-2">最小订购量 (MOQ)</label>
                                <NumberStepper
                                    id="min_quantity"
                                    value={formData.min_quantity}
                                    min={1}
                                    step={1}
                                    decimalPlaces={0}
                                    onchange={(v) => formData.min_quantity = v ?? 1}
                                />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label for="lead_time_days" class="block text-sm font-medium text-gray-700 mb-2">交货周期 (天)</label>
                                <NumberStepper
                                    id="lead_time_days"
                                    value={formData.lead_time_days ?? undefined}
                                    min={1}
                                    step={1}
                                    decimalPlaces={0}
                                    placeholder="可选"
                                    onchange={(v) => formData.lead_time_days = v ?? null}
                                />
                            </div>
                            <div>
                                <label for="partner_sku" class="block text-sm font-medium text-gray-700 mb-2">合作方SKU</label>
                                <input
                                    type="text"
                                    id="partner_sku"
                                    bind:value={formData.partner_sku}
                                    placeholder="供应商自己的物品编码（可选）"
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            有效期和其他
                        </h2>

                        <div class="mb-4">
                            <label class="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                <input type="checkbox" bind:checked={formData.is_preferred} class="w-auto" />
                                设为首选报价
                            </label>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label for="valid_from" class="block text-sm font-medium text-gray-700 mb-2">有效期开始</label>
                                <input
                                    type="date"
                                    id="valid_from"
                                    bind:value={formData.valid_from}
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label for="valid_until" class="block text-sm font-medium text-gray-700 mb-2">有效期结束</label>
                                <input
                                    type="date"
                                    id="valid_until"
                                    bind:value={formData.valid_until}
                                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label for="note" class="block text-sm font-medium text-gray-700 mb-2">备注</label>
                            <textarea
                                id="note"
                                rows="3"
                                bind:value={formData.note}
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

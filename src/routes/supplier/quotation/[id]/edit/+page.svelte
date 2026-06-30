<!-- 编辑采购报价页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { quotationAPI } from '$lib/api';
    import type { Quotation, QuotationCreateRequest } from '$lib';
    import {
        Alert,
        Loading,
        QuotationEditHeader,
        QuotationMetaCard,
        QuotationReadonlyInfoCards
    } from '$lib/components';
    import { NumberStepper } from '$lib/components/ui';
    import { loadQuotationEditData, parseRouteId, submitQuotationEditData } from '$lib/composables/quotationEdit';
    
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

                return null;
            },
            buildPayload: ({ formData: currentFormData, quotation: currentQuotation }) => ({
                ...currentFormData,
                supplier: currentQuotation?.supplier ?? currentFormData.supplier,
                item: currentFormData.item ?? currentQuotation?.item ?? null
            }),
            update: async (quotationId, payload) => {
                await quotationAPI.update(quotationId, payload);
            },
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
                        itemIsVariant={(quotation?.item_detail as { is_variant?: boolean } | undefined)?.is_variant === true}
                    />

                    {#if error}
                        <Alert {error} />
                    {/if}
                    {#if success}
                        <Alert error={success} variant="info" />
                    {/if}
                </div>

                <div class="lg:col-span-2 space-y-4">
                    <!-- 当前价格（只读） -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-500">当前价格</label>
                            <p class="mt-1 text-2xl font-bold text-gray-900">
                                {Number(quotation?.current_version?.price ?? '0').toFixed(2)} {quotation?.currency ?? 'CNY'}
                            </p>
                            {#if quotation?.current_version?.created_at}
                                <p class="text-xs text-gray-400 mt-1">
                                    自 {new Date(quotation.current_version.created_at).toLocaleDateString('zh-CN')} 起
                                    {#if quotation.current_version.note}
                                        · {quotation.current_version.note}
                                    {/if}
                                </p>
                            {/if}
                        </div>
                    </div>

                    <!-- 元数据编辑 -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="minQuantity" class="block text-sm font-medium text-gray-700">最小订购量</label>
                                <NumberStepper
                                    value={formData.min_quantity ?? 1}
                                    min={1}
                                    onchange={(v) => formData.min_quantity = v ?? 1}
                                />
                            </div>
                            <div>
                                <label for="leadTime" class="block text-sm font-medium text-gray-700">交货周期（天）</label>
                                <NumberStepper
                                    value={formData.lead_time_days ?? undefined}
                                    min={0}
                                    placeholder="选填"
                                    onchange={(v) => formData.lead_time_days = v ?? null}
                                />
                            </div>
                        </div>
                        <div>
                            <label for="partnerSku" class="block text-sm font-medium text-gray-700">合作方SKU</label>
                            <input
                                id="partnerSku"
                                type="text"
                                bind:value={formData.partner_sku}
                                maxlength="100"
                                placeholder="供应商自己的物品编码（可选）"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <QuotationMetaCard
                        validFrom={formData.valid_from || ''}
                        validUntil={formData.valid_until || ''}
                        note={formData.note || ''}
                        isPreferred={formData.is_preferred || false}
                        showValidUntil={true}
                        showPreferred={true}
                        onValidFromChange={(v) => formData.valid_from = v || null}
                        onValidUntilChange={(v) => formData.valid_until = v || null}
                        onNoteChange={(v) => formData.note = v}
                        onPreferredChange={(v) => formData.is_preferred = v}
                    />
                </div>
            </form>
        {/if}
    </div>
</div>
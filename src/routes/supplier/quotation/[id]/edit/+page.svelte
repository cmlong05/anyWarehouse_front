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
    import { Alert, Loading } from '$lib/components';
    import QuotationEditHeader from '$lib/components/QuotationEditHeader.svelte';
    import QuotationReadonlyInfoCards from '$lib/components/QuotationReadonlyInfoCards.svelte';
    import QuotationPriceCard from '$lib/components/QuotationPriceCard.svelte';
    import QuotationMetaCard from '$lib/components/QuotationMetaCard.svelte';
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
                    <QuotationPriceCard
                        price={formData.price}
                        currency={formData.currency}
                        minQuantity={formData.min_quantity}
                        leadTimeDays={formData.lead_time_days}
                        partnerSku={formData.partner_sku || ''}
                        currencyEditable={true}
                        priceStep={0.01}
                        leadTimeOptional={true}
                        partnerSkuPlaceholder="供应商自己的物品编码（可选）"
                        onPriceChange={(v) => formData.price = v !== undefined ? String(v) : ''}
                        onCurrencyChange={(v) => formData.currency = v}
                        onMinQuantityChange={(v) => formData.min_quantity = v ?? 1}
                        onLeadTimeChange={(v) => formData.lead_time_days = v ?? null}
                        onPartnerSkuChange={(v) => formData.partner_sku = v}
                    />

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
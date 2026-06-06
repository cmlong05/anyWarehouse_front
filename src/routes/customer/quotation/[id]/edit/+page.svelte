<!-- 编辑客户报价页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { customerQuotationAPI } from '$lib/api';
    import type { CustomerQuotation, CustomerQuotationCreateRequest } from '$lib';
    import {
        Alert,
        Loading,
        QuotationEditHeader,
        QuotationMetaCard,
        QuotationPriceCard,
        QuotationReadonlyInfoCards
    } from '$lib/components';
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
                        itemIsVariant={(quotation?.item_detail as { is_variant?: boolean } | undefined)?.is_variant === true}
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
                    <QuotationPriceCard
                        price={formData.price}
                        currency={formData.currency}
                        minQuantity={formData.min_quantity}
                        leadTimeDays={formData.lead_time_days}
                        partnerSku={formData.partner_sku || ''}
                        currencyEditable={false}
                        priceStep={1}
                        leadTimeOptional={false}
                        partnerSkuPlaceholder="客户自己的物品编码（可选）"
                        onPriceChange={(v) => formData.price = v || 0}
                        onMinQuantityChange={(v) => formData.min_quantity = v || 1}
                        onLeadTimeChange={(v) => formData.lead_time_days = v || 1}
                        onPartnerSkuChange={(v) => formData.partner_sku = v}
                    />

                    <QuotationMetaCard
                        validFrom={formData.valid_from || ''}
                        note={formData.note || ''}
                        showValidUntil={false}
                        showPreferred={false}
                        onValidFromChange={(v) => formData.valid_from = v || null}
                        onNoteChange={(v) => formData.note = v}
                    />
                </div>
            </form>
        {/if}
    </div>
</div>
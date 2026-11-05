<!-- 编辑客户报价页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { customerQuotationAPI } from '$lib/api';
    import type { CustomerQuotation, CustomerQuotationUpdateRequest } from '$lib';
    import {
        Alert,
        Loading,
        QuotationEditHeader,
        QuotationMetaCard,
        QuotationReadonlyInfoCards
    } from '$lib/components';
    import { NumberStepper } from '$lib/components/ui';
    import { loadQuotationEditData, parseRouteId, submitQuotationEditData } from '$lib/composables/quotationEdit';
    
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
    let formData = $state<CustomerQuotationUpdateRequest>({
        customer: 0,
        item: null,
        currency: 'USD',
        min_quantity: 1,
        lead_time_days: null,
        valid_from: null,
        note: '',
        partner_sku: ''
    });
    
    async function loadData() {
        await loadQuotationEditData<CustomerQuotation, CustomerQuotationUpdateRequest>({
            quotationId: id(),
            fetchQuotation: (quotationId) => customerQuotationAPI.get(quotationId),
            mapToFormData: (quotationData) => ({
                customer: quotationData.customer,
                item: quotationData.item,
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

        await submitQuotationEditData<CustomerQuotationUpdateRequest, CustomerQuotation>({
            quotationId: id(),
            formData,
            quotation,
            validate: ({ formData: currentFormData }) => {
                if (!currentFormData.customer) {
                    return '请选择客户';
                }
                return null;
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

<svelte:head>
    <title>编辑客户报价 - AnyWarehouse</title>
</svelte:head>

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
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <p class="text-sm font-medium text-gray-500">当前价格</p>
                        <p class="mt-1 text-2xl font-bold text-gray-900">
                            {Number(quotation?.current_version?.price ?? '0').toFixed(2)}
                            {quotation?.currency ?? 'CNY'}
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
                                value={formData.partner_sku || ''}
                                oninput={(e) => formData.partner_sku = (e.currentTarget as HTMLInputElement).value}
                                maxlength="100"
                                placeholder="客户自己的物品编码（可选）"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

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

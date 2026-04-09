<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { quotationAPI, supplierAPI } from '$lib/api';
    import type { SupplierBrief, Item, Quotation, QuotationCreateRequest } from '$lib';
    import { config } from '$lib/config';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Svelecte from 'svelecte';
    import {  NumberStepper } from '$lib/components/ui';
    import { loadQuotationEditData, parseRouteId, submitQuotationEditData, validateQuotationPrice } from '$lib/composables/quotationEdit';
    
    let quotation = $state<Quotation | null>(null);
    let suppliers = $state<SupplierBrief[]>([]);
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
        note: ''
    });
    
    // 供应商选项
    const supplierOptions = $derived(suppliers.map(s => ({
        value: s.id,
        label: s.name
    })));
    
    // 当前选中物品的显示标签
    let selectedItemLabel = $state('');

    // 物品选项（用于回显当前值，避免远程搜索组件初始化时清空已选值）
    const itemOptions = $derived(
        formData.item && selectedItemLabel
            ? [{ value: formData.item, label: selectedItemLabel }]
            : []
    );
    
    // 构建物品搜索 URL
    const itemSearchUrl = $derived(`${config.API_BASE_URL}/product/item/?search=[query]`);
    
    // 处理 fetch 返回的数据
    function handleItemFetch(json: unknown) {
        const items = Array.isArray(json) ? json : ((json as { results?: Item[] })?.results || []);
        return items.map((item: Item) => ({
            value: item.id,
            label: `${item.SKU} - ${item.name}`
        }));
    }
    
    async function loadData() {
        await loadQuotationEditData<Quotation, QuotationCreateRequest, SupplierBrief[]>({
            quotationId: id(),
            fetchQuotation: (quotationId) => quotationAPI.get(quotationId),
            fetchExtraData: () => supplierAPI.listBrief(),
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
                note: quotationData.note || ''
            }),
            onSuccess: ({ quotation: quotationData, formData: nextFormData, extraData: supplierData }) => {
                quotation = quotationData;
                formData = nextFormData;
                suppliers = supplierData || [];

                if (quotationData.item_detail) {
                    selectedItemLabel = `${quotationData.item_detail.SKU} - ${quotationData.item_detail.name}`;
                }
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
                if (!currentFormData.supplier) {
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

<div class="p-6">
    <h1 class="text-2xl font-bold mb-6">编辑报价</h1>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else if error && !quotation}
        <Alert {error} />
        <button class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors mt-4" onclick={() => goto('/supplier')}>
            返回供应商列表
        </button>
    {:else}
        <form onsubmit={handleSubmit} class="max-w-3xl">
            {#if error}
                <Alert {error} />
            {/if}
            {#if success}
                <Alert error={success} variant="info" />
            {/if}
            
            <div class="flex gap-4 mb-4 flex-wrap">
                <div class="flex-1 min-w-52">
                    <label for="supplier" class="block mb-1 font-medium">供应商 <span class="text-red-600">*</span></label>
                    <Svelecte
                        inputId="supplier"
                        options={supplierOptions}
                        bind:value={formData.supplier}
                        placeholder="选择供应商..."
                        searchable={true}
                        required
                    />
                </div>
                
                <div class="flex-1 min-w-52">
                    <label for="item" class="block mb-1 font-medium">物品 <span class="text-red-600">*</span></label>
                    <Svelecte
                        inputId="item"
                        options={itemOptions}
                        bind:value={formData.item}
                        valueAsObject={false}
                        placeholder="搜索SKU或名称..."
                        searchable={true}
                        minQuery={1}
                        fetch={itemSearchUrl}
                        fetchCallback={handleItemFetch}
                        valueField="value"
                        labelField="label"
                    />

                </div>
            </div>
            
            <div class="flex gap-4 mb-4 flex-wrap">
                <div class="flex-1 min-w-52">
                    <label for="price" class="block mb-1 font-medium">单价 <span class="text-red-600">*</span></label>
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
                
                <div class="flex-1 min-w-52">
                    <label for="currency" class="block mb-1 font-medium">货币</label>
                    <select id="currency" bind:value={formData.currency} class="w-full p-2 border border-gray-300 rounded text-base">
                        <option value="CNY">CNY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                    </select>
                </div>
                
                <div class="flex-1 min-w-52">
                    <label for="min_quantity" class="block mb-1 font-medium">最小订购量 (MOQ)</label>
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
            
            <div class="flex gap-4 mb-4 flex-wrap">
                <div class="flex-1 min-w-52">
                    <label for="lead_time_days" class="block mb-1 font-medium">交货周期(天)</label>
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
            </div>
            
            <div class="flex gap-4 mb-4 flex-wrap">
                <div class="flex-1 min-w-52">
                    <label for="valid_from" class="block mb-1 font-medium">有效期开始</label>
                    <input 
                        type="date" 
                        id="valid_from"
                        bind:value={formData.valid_from}
                        class="w-full p-2 border border-gray-300 rounded text-base"
                    />
                </div>
                
                <div class="flex-1 min-w-52">
                    <label for="valid_until" class="block mb-1 font-medium">有效期结束</label>
                    <input 
                        type="date" 
                        id="valid_until"
                        bind:value={formData.valid_until}
                        class="w-full p-2 border border-gray-300 rounded text-base"
                    />
                </div>
                
                <div class="flex-1 min-w-52 flex items-end pb-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" bind:checked={formData.is_preferred} class="w-auto" />
                        设为首选报价
                    </label>
                </div>
            </div>
            
            <div class="mb-4">
                <label for="note" class="block mb-1 font-medium">备注</label>
                <textarea 
                    id="note"
                    rows="3"
                    bind:value={formData.note}
                    placeholder="可选"
                    class="w-full p-2 border border-gray-300 rounded text-base resize-y"
                ></textarea>
            </div>
            
            <div class="flex gap-4 justify-end mt-8 pt-4 border-t border-gray-200">
                <button type="button" class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors" onclick={goBack}>
                    取消
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" disabled={submitting}>
                    {submitting ? '保存中...' : '保存'}
                </button>
            </div>
        </form>
    {/if}
</div>

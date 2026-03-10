<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { quotationAPI, supplierAPI, itemAPI } from '$lib/api';
    import type { SupplierBrief, Item, Quotation, QuotationCreateRequest } from '$lib';
    import { config } from '$lib/config';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Svelecte from 'svelecte';
    import { CurrencySelect } from '$lib/components/ui';
    
    let quotation = $state<Quotation | null>(null);
    let suppliers = $state<SupplierBrief[]>([]);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let success = $state('');
    
    const id = $derived(() => {
        const paramId = page.params.id;
        return paramId ? parseInt(paramId) : 0;
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
        const quotationId = id();
        if (!quotationId) {
            error = '无效的报价ID';
            loading = false;
            return;
        }
        
        loading = true;
        error = '';
        try {
            const [quotationData, supplierData] = await Promise.all([
                quotationAPI.get(quotationId),
                supplierAPI.listBrief()
            ]);
            quotation = quotationData;
            suppliers = supplierData;
            
            // 填充表单
            formData = {
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
            };
            
            // 设置当前物品显示标签
            if (quotationData.item_detail) {
                selectedItemLabel = `${quotationData.item_detail.SKU} - ${quotationData.item_detail.name}`;
            }
        } catch (err) {
            error = err instanceof Error ? err.message : '加载失败';
        } finally {
            loading = false;
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
        
        if (!formData.supplier) {
            error = '请选择供应商';
            return;
        }
        
        const priceNum = typeof formData.price === 'number' ? formData.price : parseFloat(formData.price as string) || 0;
        if (!formData.price || priceNum <= 0) {
            error = '请输入有效的价格';
            return;
        }
        
        submitting = true;
        try {
            await quotationAPI.update(quotationId, formData);
            success = '报价更新成功';
            setTimeout(() => goto(`/supplier/quotation/${quotationId}`), 1000);
        } catch (err) {
            error = err instanceof Error ? err.message : '更新失败';
        } finally {
            submitting = false;
        }
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

<div class="content-container">
    <h1>编辑报价</h1>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else if error && !quotation}
        <Alert {error} />
        <button class="btn btn-secondary" onclick={() => goto('/supplier')}>
            返回供应商列表
        </button>
    {:else}
        <form onsubmit={handleSubmit} class="form">
            {#if error}
                <Alert {error} />
            {/if}
            {#if success}
                <Alert error={success} variant="info" />
            {/if}
            
            <div class="form-row">
                <div class="form-group required">
                    <label for="supplier">供应商</label>
                    <Svelecte
                        inputId="supplier"
                        options={supplierOptions}
                        bind:value={formData.supplier}
                        placeholder="选择供应商..."
                        searchable={true}
                        required
                    />
                </div>
                
                <div class="form-group">
                    <label for="item">物品</label>
                    <Svelecte
                        inputId="item"
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
            
            <div class="form-row">
                <div class="form-group required">
                    <label for="price">单价</label>
                    <input 
                        type="number" 
                        id="price"
                        step="0.01"
                        min="0"
                        bind:value={formData.price}
                        required
                    />
                </div>
                
                <div class="form-group">
                    <label for="currency">货币</label>
                    <select id="currency" bind:value={formData.currency}>
                        <option value="CNY">CNY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="min_quantity">最小订购量 (MOQ)</label>
                    <input 
                        type="number" 
                        id="min_quantity"
                        min="1"
                        bind:value={formData.min_quantity}
                    />
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="lead_time_days">交货周期(天)</label>
                    <input 
                        type="number" 
                        id="lead_time_days"
                        min="1"
                        bind:value={formData.lead_time_days}
                        placeholder="可选"
                    />
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="valid_from">有效期开始</label>
                    <input 
                        type="date" 
                        id="valid_from"
                        bind:value={formData.valid_from}
                    />
                </div>
                
                <div class="form-group">
                    <label for="valid_until">有效期结束</label>
                    <input 
                        type="date" 
                        id="valid_until"
                        bind:value={formData.valid_until}
                    />
                </div>
                
                <div class="form-group checkbox-group">
                    <label>
                        <input type="checkbox" bind:checked={formData.is_preferred} />
                        设为首选报价
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label for="note">备注</label>
                <textarea 
                    id="note"
                    rows="3"
                    bind:value={formData.note}
                    placeholder="可选"
                ></textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick={goBack}>
                    取消
                </button>
                <button type="submit" class="btn btn-primary" disabled={submitting}>
                    {submitting ? '保存中...' : '保存'}
                </button>
            </div>
        </form>
    {/if}
</div>

<style>
    .form {
        max-width: 800px;
    }
    
    .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    
    .form-group {
        flex: 1;
        min-width: 200px;
    }
    
    .form-group.required label::after {
        content: ' *';
        color: #dc2626;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
        font-size: 1rem;
    }
    
    .form-group textarea {
        resize: vertical;
    }
    
    .checkbox-group {
        display: flex;
        align-items: flex-end;
        padding-bottom: 0.5rem;
    }
    
    .checkbox-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }
    
    .checkbox-group input {
        width: auto;
    }
    
    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border, #eee);
    }
    
    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
</style>

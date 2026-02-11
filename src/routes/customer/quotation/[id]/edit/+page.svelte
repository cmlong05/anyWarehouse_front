<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { customerQuotationAPI, customerAPI, itemAPI } from '$lib/api';
    import type { CustomerBrief, Item, CustomerQuotation, CustomerQuotationCreateRequest } from '$lib';
    import { config } from '$lib/config';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Svelecte from 'svelecte';
    
    const id = $derived(parseInt(page.params.id));
    
    let quotation = $state<CustomerQuotation | null>(null);
    let customers = $state<CustomerBrief[]>([]);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let success = $state('');
    
    // 表单数据
    let formData = $state<CustomerQuotationCreateRequest>({
        customer: 0,
        item: null,
        price: '',
        currency: 'CNY',
        min_quantity: 1,
        postage: null,
        lead_time_days: null,
        valid_from: null,
        valid_until: null,
        is_preferred: false,
        note: ''
    });
    
    // 客户选项
    const customerOptions = $derived(customers.map(c => ({
        value: c.id,
        label: `${c.code} - ${c.name}`
    })));
    
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
        try {
            const [quotationData, customersData] = await Promise.all([
                customerQuotationAPI.get(id),
                customerAPI.listBrief()
            ]);
            
            quotation = quotationData;
            customers = customersData;
            
            // 填充表单数据
            formData = {
                customer: quotation.customer,
                item: quotation.item,
                price: quotation.price,
                currency: quotation.currency,
                min_quantity: quotation.min_quantity,
                postage: quotation.postage,
                lead_time_days: quotation.lead_time_days,
                valid_from: quotation.valid_from,
                valid_until: quotation.valid_until,
                is_preferred: quotation.is_preferred,
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
        
        if (!formData.customer) {
            error = '请选择客户';
            return;
        }
        if (!formData.price || parseFloat(formData.price as string) <= 0) {
            error = '请输入有效的价格';
            return;
        }
        
        submitting = true;
        try {
            await customerQuotationAPI.update(id, formData);
            success = '报价更新成功';
            setTimeout(() => goto(`/customer/quotation/${id}`), 1000);
        } catch (err) {
            error = err instanceof Error ? err.message : '更新失败';
        } finally {
            submitting = false;
        }
    }
    
    function goBack() {
        goto(`/customer/quotation/${id}`);
    }
    
    onMount(async () => {
        await loadData();
        loading = false;
    });
</script>

<div class="content-container">
    <h1>编辑客户报价</h1>
    
    {#if loading}
        <Loading text="加载中..." />
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
                    <label for="customer">客户</label>
                    <Svelecte
                        inputId="customer"
                        options={customerOptions}
                        bind:value={formData.customer}
                        placeholder="选择客户..."
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
                        <option value="CNY">CNY - 人民币</option>
                        <option value="USD">USD - 美元</option>
                        <option value="EUR">EUR - 欧元</option>
                        <option value="GBP">GBP - 英镑</option>
                        <option value="JPY">JPY - 日元</option>
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
                    <label for="postage">邮费/运费</label>
                    <input 
                        type="number" 
                        id="postage"
                        step="0.01"
                        min="0"
                        bind:value={formData.postage}
                        placeholder="可选"
                    />
                </div>
                
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
    .content-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }
    
    h1 {
        margin-bottom: 1.5rem;
    }
    
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
    
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #2563eb;
    }
    
    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }
    
    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>

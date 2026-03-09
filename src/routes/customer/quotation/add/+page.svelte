<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { customerQuotationAPI, customerAPI, itemAPI } from '$lib/api';
    import type { CustomerBrief, Item, CustomerQuotationCreateRequest } from '$lib';
    import { config } from '$lib/config';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Svelecte from 'svelecte';
    import { CurrencySelect } from '$lib/components/ui';
    import { NumberStepper } from '$lib/components/ui';
    
    // 从URL获取预设的客户ID和物品ID
    const presetIds = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const customerId = urlParams.get('customer_id');
        const itemId = urlParams.get('item_id');
        return {
            customerId: customerId ? parseInt(customerId) : null,
            itemId: itemId ? parseInt(itemId) : null
        };
    });
    
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
    
    async function loadInitialData() {
        try {
            customers = await customerAPI.listBrief();
            
            const { customerId, itemId } = presetIds();
            
            if (customerId) {
                formData.customer = customerId;
            }
            
            if (itemId) {
                try {
                    const item = await itemAPI.get(itemId);
                    formData.item = item.id;
                } catch (err) {
                    console.error('加载预设物品失败:', err);
                }
            }
        } catch (err) {
            error = '加载数据失败';
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
            await customerQuotationAPI.create(formData);
            success = '报价创建成功';
            setTimeout(() => goto(`/customer/${formData.customer}`), 1000);
        } catch (err) {
            error = err instanceof Error ? err.message : '创建失败';
        } finally {
            submitting = false;
        }
    }
    
    function goBack() {
        const { customerId } = presetIds();
        if (customerId) {
            goto(`/customer/${customerId}`);
        } else {
            goto('/customer');
        }
    }
    
    onMount(async () => {
        await loadInitialData();
        loading = false;
    });
</script>

<div class="max-w-4xl mx-auto px-4 py-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">添加客户报价</h1>
            <p class="text-sm text-gray-500 mt-1">为客户创建新的报价记录</p>
        </div>
        <div class="flex gap-3">
            <button 
                type="button" 
                class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                onclick={goBack}
            >
                取消
            </button>
            <button 
                type="submit" 
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                disabled={submitting}
            >
                {submitting ? '保存中...' : '保存'}
            </button>
        </div>
    </div>
    
    {#if loading}
        <Loading text="加载中..." />
    {:else}
        <form onsubmit={handleSubmit} class="space-y-6">
            <!-- 提示消息 -->
            {#if error}
                <Alert {error} />
            {/if}
            {#if success}
                <Alert error={success} variant="info" />
            {/if}
            
            <!-- 基本信息卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">基本信息</h2>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label for="customer" class="block text-sm font-medium text-gray-700 mb-1">
                            客户 <span class="text-red-500">*</span>
                        </label>
                        <Svelecte
                            inputId="customer"
                            options={customerOptions}
                            bind:value={formData.customer}
                            placeholder="选择客户..."
                            searchable={true}
                            disabled={!!presetIds().customerId}
                            required
                        />
                    </div>
                    
                    <div>
                        <label for="item" class="block text-sm font-medium text-gray-700 mb-1">
                            物品 <span class="text-gray-400 text-xs">(可选)</span>
                        </label>
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
            </div>
            
            <!-- 价格信息卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">价格信息</h2>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label for="price" class="block text-sm font-medium text-gray-700 mb-1">
                                单价 <span class="text-red-500">*</span>
                            </label>
                            <NumberStepper
                                id="price"
                                name="price"
                                value={formData.price ? Number(formData.price) : undefined}
                                min={0}
                                step={0.01}
                                decimalPlaces={2}
                                size="md"
                                onchange={(v) => formData.price = v !== undefined ? v.toFixed(2) : ''}
                            />
                        </div>
                        
                        <div>
                            <label for="currency" class="block text-sm font-medium text-gray-700 mb-1">货币</label>
                            <CurrencySelect bind:value={formData.currency} />
                        </div>
                        
                        <div>
                            <label for="postage" class="block text-sm font-medium text-gray-700 mb-1">
                                邮费/运费 <span class="text-gray-400 text-xs">(可选)</span>
                            </label>
                            <NumberStepper
                                id="postage"
                                name="postage"
                                value={formData.postage !== null ? Number(formData.postage) : undefined}
                                min={0}
                                step={0.01}
                                decimalPlaces={2}
                                size="md"
                                placeholder="0.00"
                                onchange={(v) => formData.postage = v ?? null}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 订单条款卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">订单条款</h2>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="min_quantity" class="block text-sm font-medium text-gray-700 mb-1">
                                最小订购量 (MOQ)
                            </label>
                            <NumberStepper
                                id="min_quantity"
                                name="min_quantity"
                                value={formData.min_quantity ?? undefined}
                                min={1}
                                step={1}
                                decimalPlaces={0}
                                size="md"
                                onchange={(v) => formData.min_quantity = v ?? 1}
                            />
                            <p class="text-xs text-gray-500 mt-1">单次订单的最小数量要求</p>
                        </div>
                        
                        <div>
                            <label for="lead_time_days" class="block text-sm font-medium text-gray-700 mb-1">
                                交货周期 <span class="text-gray-400 text-xs">(可选)</span>
                            </label>
                            <NumberStepper
                                id="lead_time_days"
                                name="lead_time_days"
                                value={formData.lead_time_days ?? undefined}
                                min={1}
                                step={1}
                                decimalPlaces={0}
                                size="md"
                                placeholder="天数"
                                onchange={(v) => formData.lead_time_days = v ?? null}
                            />
                            <p class="text-xs text-gray-500 mt-1">从下单到交货所需的天数</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 有效期卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">有效期设置</h2>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label for="valid_from" class="block text-sm font-medium text-gray-700 mb-1">
                                有效期开始
                            </label>
                            <input 
                                type="date" 
                                id="valid_from"
                                bind:value={formData.valid_from}
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label for="valid_until" class="block text-sm font-medium text-gray-700 mb-1">
                                有效期结束
                            </label>
                            <input 
                                type="date" 
                                id="valid_until"
                                bind:value={formData.valid_until}
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        <div class="flex items-center pb-2">
                            <label class="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    bind:checked={formData.is_preferred}
                                    class="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span class="text-sm font-medium text-gray-700">设为首选报价</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 备注卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">备注</h2>
                </div>
                <div class="p-6">
                    <textarea 
                        id="note"
                        rows="3"
                        bind:value={formData.note}
                        placeholder="添加关于此报价的额外说明..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    ></textarea>
                </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex justify-end gap-4 pt-4">
                <button 
                    type="button" 
                    class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    onclick={goBack}
                >
                    取消
                </button>
                <button 
                    type="submit" 
                    class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    disabled={submitting}
                >
                    {submitting ? '保存中...' : '保存报价'}
                </button>
            </div>
        </form>
    {/if}
</div>

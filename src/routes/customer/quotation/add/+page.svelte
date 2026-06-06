<!-- 新增客户报价页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { customerQuotationAPI, customerAPI } from '$lib/api';
    import type { CustomerBrief, CustomerQuotationCreateRequest } from '$lib';
    import { config } from '$lib/config';
    import { Alert, Loading, QuotationLinesTable } from '$lib/components';
    import Svelecte from 'svelecte';
    import { useQuotationLineForm } from '$lib/composables/useQuotationLineForm.svelte';

    // 从URL获取预设的客户ID和物品IDs
    const presetCustomerId = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const customerId = urlParams.get('customer_id');
        return customerId ? parseInt(customerId) : null;
    });

    const presetItemIds = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const itemIds = urlParams.get('item_ids');
        if (!itemIds) return [];
        return itemIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    });

    let customers = $state<CustomerBrief[]>([]);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let success = $state('');

    let selectedCustomer = $state<number | null>(null);

    // 客户货币：跟随选中客户，新报价行默认使用该货币
    const customerCurrency = $derived(
        customers.find(c => c.id === selectedCustomer)?.currency || 'USD'
    );

    const customerOptions = $derived(customers.map(c => ({
        value: c.id,
        label: `${c.code} - ${c.name}`
    })));

    const itemSearchUrl = $derived(`${config.API_BASE_URL}/product/item/?search=[query]`);

    const form = useQuotationLineForm({
        getCurrency: () => customerCurrency,
        apiBaseUrl: config.API_BASE_URL,
        onInlineError: (msg) => {
            error = msg;
            setTimeout(() => { error = ''; }, 3000);
        },
    });

    async function loadInitialData() {
        try {
            customers = await customerAPI.listBrief();

            const customerId = presetCustomerId();
            if (customerId) selectedCustomer = customerId;

            const itemIds = presetItemIds();
            if (itemIds.length > 0) {
                await form.loadPresetItems(itemIds);
            }

            if (form.quotationLines.length === 0) form.addLine();
        } catch {
            error = '加载数据失败';
        }
    }

    function validateForm(): boolean {
        if (!selectedCustomer) {
            error = '请选择客户';
            return false;
        }
        const result = form.validateLines();
        if (!result.valid) {
            error = result.error || '表单验证失败';
            return false;
        }
        return true;
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = '';
        success = '';

        if (!validateForm()) return;

        submitting = true;
        const { successCount, failCount, errors } = await form.submitLines(
            (line) => ({
                customer: selectedCustomer!,
                item: line.item,
                price: line.price,
                currency: customerCurrency,
                min_quantity: line.min_quantity,
                lead_time_days: line.lead_time_days,
                note: line.note,
                partner_sku: line.partner_sku || undefined,
            } as CustomerQuotationCreateRequest),
            (data) => customerQuotationAPI.create(data as CustomerQuotationCreateRequest)
        );
        submitting = false;

        if (successCount > 0) success = `成功创建 ${successCount} 个报价`;

        if (failCount > 0) {
            error = errors.join('\n') || '创建失败';
        } else if (successCount > 0) {
            setTimeout(() => { goto(`/customer/${selectedCustomer}`); }, 1500);
        }
    }

    function goBack() {
        const customerId = presetCustomerId();
        if (customerId) goto(`/customer/${customerId}`);
        else goto('/customer');
    }

    onMount(async () => {
        await loadInitialData();
        loading = false;
    });
</script>

<svelte:head>
    <title>添加客户报价 - AnyWarehouse</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">添加客户报价</h1>
            <p class="text-sm text-gray-500 mt-1">为客户创建新的报价记录，选择物品自动添加一行</p>
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
                form="quotationForm"
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
        <form id="quotationForm" onsubmit={handleSubmit} class="space-y-6">
            <!-- 提示消息 -->
            {#if error}
                <Alert {error} />
            {/if}
            {#if success}
                <Alert error={success} variant="info" />
            {/if}
            
            <!-- 客户选择卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">客户信息</h2>
                </div>
                <div class="p-6">
                    <div class="max-w-md">
                        <label for="customer" class="block text-sm font-medium text-gray-700 mb-1">
                            选择客户 <span class="text-red-500">*</span>
                        </label>
                        <Svelecte
                            inputId="customer"
                            name="customer"
                            options={customerOptions}
                            bind:value={selectedCustomer}
                            placeholder="选择客户..."
                            searchable={true}
                            disabled={!!presetCustomerId()}
                            required
                        />
                    </div>
                </div>
            </div>
            
            <QuotationLinesTable
                {form}
                {itemSearchUrl}
                currencyMode="fixed"
                fixedCurrency={customerCurrency}
            />
            
            <!-- 操作按钮 -->
            <div class="flex justify-between items-center pt-4">
                <div class="text-sm text-gray-500">
                    提示：选择物品后将自动添加新行，可一次性添加多个报价
                </div>
                <div class="flex gap-4">
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
            </div>
        </form>
    {/if}
</div>
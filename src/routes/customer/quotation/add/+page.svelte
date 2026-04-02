<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { customerQuotationAPI, customerAPI } from '$lib/api';
    import type { CustomerBrief, CustomerQuotationCreateRequest } from '$lib';
    import { config } from '$lib/config';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Svelecte from 'svelecte';
    import { NumberStepper } from '$lib/components/ui';
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
            
            <!-- 报价列表卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        报价列表
                        <span class="ml-2 text-xs font-normal text-gray-500">
                            (共 {form.quotationLines.filter(l => l.item !== null).length} 个有效报价)
                        </span>
                    </h2>
                    <button
                        type="button"
                        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onclick={() => form.addLine()}
                    >
                        + 手动添加行
                    </button>
                </div>
                
                <div class="overflow-visible">
                    <table class="w-full text-sm min-w-[1200px]">
                        <thead class="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th class="px-3 py-3 text-left font-medium text-gray-700 w-12">#</th>
                                <th class="px-3 py-3 text-left font-medium text-gray-700 w-[200px]">物品 *</th>
                                <th class="px-3 py-3 text-right font-medium text-gray-700 w-24">参考价</th>
                                <th class="px-3 py-3 text-right font-medium text-gray-700 w-28">报价 *</th>
                                <th class="px-3 py-3 text-center font-medium text-gray-700 w-20">货币</th>
                                <th class="px-3 py-3 text-center font-medium text-gray-700 w-20">MOQ</th>
                                <th class="px-3 py-3 text-center font-medium text-gray-700 w-24">交货周期</th>
                                <th class="px-3 py-3 text-left font-medium text-gray-700 w-[100px]">备注</th>
                                <th class="px-3 py-3 text-center font-medium text-gray-700 w-16">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            {#each form.quotationLines as line, index (line.id)}
                                {@const parentIndex = line.parentLineId ? form.quotationLines.findIndex(l => l.id === line.parentLineId) + 1 : null}
                                {@const siblingIndex = line.parentLineId ? form.quotationLines.filter(l => l.parentLineId === line.parentLineId).findIndex(l => l.id === line.id) + 1 : null}
                                {@const displayIndex = line.isVariantChild && parentIndex ? `${parentIndex}-${siblingIndex}` : String(index + 1)}
                                <tr class="{line.isVariantChild ? 'bg-purple-50/50' : 'hover:bg-gray-50'}">
                                    <td class="px-3 py-3 {line.isVariantChild ? 'text-purple-600' : 'text-gray-500'}">{displayIndex}</td>
                                    <td class="px-3 py-3">
                                        {#if line.isVariantChild}
                                            <!-- 变体子项：显示缩进和物品信息（不可编辑） -->
                                            <div class="flex items-center gap-2">
                                                <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span class="text-sm font-medium text-gray-800">
                                                    {line.itemDetail?.SKU || line.variantInfo?.variant_item_detail?.SKU || '-'}
                                                </span>
                                                <span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">变体</span>
                                            </div>
                                            <div class="text-xs text-gray-500 mt-1 pl-6">
                                                {line.itemDetail?.name || line.variantInfo?.variant_item_detail?.name || '-'}
                                            </div>
                                        {:else}
                                            <!-- 普通行：可编辑的 Svelecte -->
                                            {#if line.itemDetail}
                                                <!-- 已加载物品详情，直接显示 -->
                                                <div class="text-sm font-medium text-gray-800">
                                                    {line.itemDetail.SKU} - {line.itemDetail.name}
                                                </div>
                                            {:else}
                                                <!-- 未选择物品，显示 Svelecte -->
                                                <Svelecte
                                                    inputId="item-{line.id}"
                                                    name="item-{line.id}"
                                                    valueAsObject={false}
                                                    placeholder="搜索SKU或名称..."
                                                    searchable={true}
                                                    minQuery={1}
                                                    fetch={itemSearchUrl}
                                                    fetchCallback={form.handleItemFetch}
                                                    valueField="value"
                                                    labelField="label"
                                                    onChange={(val: unknown) => form.handleSelectChange(line, val)}
                                                />
                                            {/if}
                                        {/if}
                                    </td>
                                    <!-- 参考价列 -->
                                    <td class="px-3 py-3 text-right">
                                        {#if line.itemDetail?.b_Price}
                                            <span class="text-sm text-gray-500">
                                                {line.itemDetail.b_Price} {line.itemDetail.currency || 'CNY'}
                                            </span>
                                        {:else}
                                            <span class="text-sm text-gray-300">-</span>
                                        {/if}
                                    </td>
                                    <td class="px-3 py-3">
                                        <NumberStepper
                                            id="price-{line.id}"
                                            value={line.price ? Number(line.price) : undefined}
                                            min={0}
                                            step={0.01}
                                            decimalPlaces={2}
                                            size="sm"
                                            placeholder="0.00"
                                            onchange={(v) => line.price = v !== undefined && v !== null ? v.toFixed(2) : ''}
                                        />
                                    </td>
                                    <td class="px-3 py-3">
                                        <span class="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                            {customerCurrency}
                                        </span>
                                    </td>
                                    <td class="px-3 py-3">
                                        <NumberStepper
                                            id="moq-{line.id}"
                                            value={line.min_quantity}
                                            min={1}
                                            step={1}
                                            decimalPlaces={0}
                                            size="sm"
                                            onchange={(v) => line.min_quantity = v ?? 1}
                                        />
                                    </td>
                                    <td class="px-3 py-3">
                                        <NumberStepper
                                            id="lead-{line.id}"
                                            value={line.lead_time_days ?? undefined}
                                            min={1}
                                            step={1}
                                            decimalPlaces={0}
                                            size="sm"
                                            placeholder="天数"
                                            onchange={(v) => line.lead_time_days = v ?? null}
                                        />
                                    </td>
                                    <td class="px-3 py-3">
                                        <input
                                            type="text"
                                            bind:value={line.note}
                                            placeholder="备注"
                                            class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        />
                                    </td>
                                    <td class="px-3 py-3 text-center">
                                        <button
                                            type="button"
                                            class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                            onclick={() => form.removeLine(line.id)}
                                            title="删除此行"
                                            aria-label="删除此行"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                
                {#if form.quotationLines.length === 0}
                    <div class="text-center py-8 text-gray-500">
                        <p>暂无报价行，请选择物品或手动添加</p>
                    </div>
                {/if}
            </div>
            
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

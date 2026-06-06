<!-- 新增采购报价页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { quotationAPI, supplierAPI } from '$lib/api';
    import type { SupplierBrief, QuotationCreateRequest } from '$lib';
    import { config } from '$lib/config';
    import { Alert, Loading } from '$lib/components';
    import Svelecte from 'svelecte';
    import QuotationLinesTable from '$lib/components/QuotationLinesTable.svelte';
    import { useQuotationLineForm } from '$lib/composables/useQuotationLineForm.svelte';

    // 从URL获取预设的供应商ID、物品IDs和SKU
    const presetIds = $derived(() => {
        const urlParams = new URLSearchParams(page.url.search);
        const supplierId = urlParams.get('supplier_id');
        const itemId = urlParams.get('item_id');
        const itemIds = urlParams.get('item_ids');
        const itemSku = urlParams.get('item_sku');
        return {
            supplierId: supplierId ? parseInt(supplierId) : null,
            itemId: itemId ? parseInt(itemId) : null,
            itemIds: itemIds ? itemIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [],
            itemSku: itemSku || null
        };
    });

    let suppliers = $state<SupplierBrief[]>([]);
    let loading = $state(true);
    let submitting = $state(false);
    let error = $state('');
    let success = $state('');

    let selectedSupplier = $state<number | null>(null);

    // 供应商货币：跟随选中供应商，新报价行默认使用该货币
    const supplierCurrency = $derived(
        suppliers.find(s => s.id === selectedSupplier)?.currency || 'CNY'
    );

    const supplierOptions = $derived(suppliers.map(s => ({
        value: s.id,
        label: `${s.code} - ${s.name}`
    })));

    const itemSearchUrl = $derived(`${config.API_BASE_URL}/product/item/?search=[query]`);

    const form = useQuotationLineForm({
        getCurrency: () => supplierCurrency,
        apiBaseUrl: config.API_BASE_URL,
        onInlineError: (msg) => {
            error = msg;
            setTimeout(() => { error = ''; }, 3000);
        },
    });

    // 切换供应商时，同步已有行的货币展示
    // 用 untrack 读取 form.quotationLines，避免读写同一状态导致无限循环
    $effect(() => {
        const nextCurrency = supplierCurrency;
        untrack(() => {
            form.quotationLines = form.quotationLines.map(line => ({ ...line, currency: nextCurrency }));
        });
    });

    async function loadInitialData() {
        try {
            suppliers = await supplierAPI.listBrief();

            const { supplierId, itemId, itemIds } = presetIds();

            if (supplierId) selectedSupplier = supplierId;

            // item_ids 优先（支持从物品列表多选跳转）
            const allItemIds = itemIds.length > 0
                ? itemIds
                : itemId ? [itemId] : [];

            if (allItemIds.length > 0) {
                await form.loadPresetItems(allItemIds);
            }

            if (form.quotationLines.length === 0) form.addLine();
        } catch {
            error = '加载数据失败';
        }
    }

    function validateForm(): boolean {
        if (!selectedSupplier) {
            error = '请选择供应商';
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
                supplier: selectedSupplier!,
                item: line.item,
                price: line.price,
                currency: supplierCurrency,
                min_quantity: line.min_quantity,
                lead_time_days: line.lead_time_days,
                note: line.note,
                partner_sku: line.partner_sku || undefined,
            } as QuotationCreateRequest),
            (data) => quotationAPI.create(data as QuotationCreateRequest)
        );
        submitting = false;

        if (successCount > 0) success = `成功创建 ${successCount} 个报价`;

        if (failCount > 0) {
            error = errors.join('\n') || '创建失败';
        } else if (successCount > 0) {
            setTimeout(() => { goto(`/supplier/${selectedSupplier}`); }, 1500);
        }
    }

    function goBack() {
        const { supplierId } = presetIds();
        if (supplierId) goto(`/supplier/${supplierId}`);
        else goto('/supplier');
    }

    onMount(async () => {
        await loadInitialData();
        loading = false;
    });
</script>

<svelte:head>
    <title>添加供应商报价 - AnyWarehouse</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">添加供应商报价</h1>
            <p class="text-sm text-gray-500 mt-1">为供应商创建新的报价记录，选择物品自动添加一行</p>
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
            
            <!-- 供应商选择卡片 -->
            <div class="bg-white rounded-lg border border-gray-200">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">供应商信息</h2>
                </div>
                <div class="p-6">
                    <div class="max-w-md">
                        <label for="supplier" class="block text-sm font-medium text-gray-700 mb-1">
                            选择供应商 <span class="text-red-500">*</span>
                        </label>
                        <Svelecte
                            inputId="supplier"
                            name="supplier"
                            options={supplierOptions}
                            bind:value={selectedSupplier}
                            placeholder="选择供应商..."
                            searchable={true}
                            disabled={!!presetIds().supplierId}
                            required
                        />
                    </div>
                </div>
            </div>
            
            <QuotationLinesTable
                {form}
                {itemSearchUrl}
                currencyMode="fixed"
                fixedCurrency={supplierCurrency}
            />
            
            <!-- 操作按钮 -->
            <div class="flex justify-between items-center pt-4">
                <div class="text-sm text-gray-500">
                    提示：选择物品后将自动添加新行，可一次性添加多个报价。变体母版会自动展开子变体。
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
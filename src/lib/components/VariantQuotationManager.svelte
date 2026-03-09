<script lang="ts">
    import { config } from '$lib/config';
    import type { ItemVariant } from '$lib/types/variant';
    import type { SupplierBrief, QuotationBrief, QuotationCreateRequest } from '$lib';
    import { NumberStepper, CurrencySelect } from '$lib/components/ui';
    import Svelecte from 'svelecte';

    interface Props {
        variants: ItemVariant[];
        attributes: Record<string, {
            name: string;
            values: Array<{
                id: number;
                value: string;
                code: string;
                color_hex: string;
            }>;
        }>;
        parentItemName: string;
        parentItemSku: string;
        presetSupplierId?: number;
        onSuccess?: () => void;
        onCancel?: () => void;
    }

    let { 
        variants, 
        attributes, 
        parentItemName, 
        parentItemSku,
        presetSupplierId,
        onSuccess, 
        onCancel 
    }: Props = $props();

    // 供应商列表
    let suppliers = $state<SupplierBrief[]>([]);
    let loading = $state(false);
    let saving = $state(false);
    let error = $state('');

    // 选中的供应商
    let selectedSupplierId = $state<number>(presetSupplierId || 0);
    let selectedSupplier = $derived(suppliers.find(s => s.id === selectedSupplierId));

    // 加载状态
    let loadedQuotations = $state<Record<number, QuotationBrief[]>>({});

    // 编辑数据：变体ID -> 报价数据
    let editData = $state<Record<number, {
        price: string;
        currency: string;
        min_quantity: number;
        is_preferred: boolean;
        note: string;
        existingId?: number;  // 如果已有报价，记录ID用于更新
    }>>({});

    // 加载供应商列表
    async function loadSuppliers() {
        try {
            const response = await fetch(`${config.API_BASE_URL}/supplier/suppliers/brief/`);
            if (response.ok) {
                suppliers = await response.json();
            }
        } catch (err) {
            console.error('加载供应商失败:', err);
        }
    }

    // 加载该供应商对这些变体的现有报价
    async function loadSupplierQuotations() {
        if (!selectedSupplierId) return;
        
        loading = true;
        loadedQuotations = {};
        
        try {
            for (const variant of variants) {
                const response = await fetch(
                    `${config.API_BASE_URL}/supplier/quotations/by_item/?item_id=${variant.variant_item}`
                );
                if (response.ok) {
                    const data = await response.json();
                    // 筛选出该供应商的报价
                    const supplierQuotations = (data.quotations || []).filter(
                        (q: QuotationBrief) => q.supplier === selectedSupplierId
                    );
                    loadedQuotations[variant.variant_item] = supplierQuotations;
                    
                    // 初始化编辑数据
                    const preferred = supplierQuotations.find((q: QuotationBrief) => q.is_preferred);
                    const existing = preferred || supplierQuotations[0];
                    
                    editData[variant.variant_item] = {
                        price: existing ? existing.price : '',
                        currency: existing ? existing.currency : 'CNY',
                        min_quantity: existing ? (existing.min_quantity || 1) : 1,
                        is_preferred: true,
                        note: existing ? (existing.note || '') : '',
                        existingId: existing ? existing.id : undefined
                    };
                }
            }
        } catch (err) {
            console.error('加载报价失败:', err);
        } finally {
            loading = false;
        }
    }

    // 保存所有变体的报价
    async function saveAllQuotations() {
        if (!selectedSupplierId) {
            error = '请先选择供应商';
            return;
        }

        saving = true;
        error = '';
        let successCount = 0;
        let errorCount = 0;

        try {
            for (const variant of variants) {
                const data = editData[variant.variant_item];
                if (!data || !data.price) continue;  // 跳过未填写价格的

                const requestData: QuotationCreateRequest = {
                    supplier: selectedSupplierId,
                    item: variant.variant_item,
                    price: data.price,
                    currency: data.currency,
                    min_quantity: data.min_quantity,
                    is_preferred: data.is_preferred,
                    note: data.note
                };

                try {
                    if (data.existingId) {
                        // 更新现有报价
                        await fetch(`${config.API_BASE_URL}/supplier/quotations/${data.existingId}/`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestData)
                        });
                    } else {
                        // 创建新报价
                        await fetch(`${config.API_BASE_URL}/supplier/quotations/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestData)
                        });
                    }
                    successCount++;
                } catch (err) {
                    errorCount++;
                    console.error(`保存变体 ${variant.variant_item} 报价失败:`, err);
                }
            }

            if (errorCount === 0) {
                onSuccess?.();
            } else {
                error = `保存完成：${successCount} 成功，${errorCount} 失败`;
            }
        } catch (err) {
            error = '保存失败，请重试';
        } finally {
            saving = false;
        }
    }

    // 获取属性值显示
    function getAttributeValueDisplay(variant: ItemVariant, attrCode: string): string {
        const attrValue = variant.attribute_values_detail?.find(av => av.attribute_code === attrCode);
        return attrValue?.value || '-';
    }

    function getAttributeValueColor(variant: ItemVariant, attrCode: string): string | null {
        const attrValue = variant.attribute_values_detail?.find(av => av.attribute_code === attrCode);
        return attrValue?.color_hex || null;
    }

    // 格式化价格
    function formatPrice(price: string | number | null): string {
        if (!price) return '-';
        return parseFloat(price.toString()).toFixed(2);
    }

    // 供应商选项
    let supplierOptions = $derived(suppliers.map(s => ({
        value: s.id,
        label: `${s.name} (${s.code})`
    })));

    // 初始化
    $effect(() => {
        loadSuppliers();
    });

    // 当供应商改变时重新加载报价
    $effect(() => {
        if (selectedSupplierId) {
            loadSupplierQuotations();
        }
    });
</script>

<div class="space-y-6">
    <!-- 供应商选择 -->
    <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <label class="block text-sm font-medium text-blue-900 mb-2">
            选择供应商 <span class="text-red-500">*</span>
        </label>
        {#if presetSupplierId}
            <!-- 已预设供应商，只显示信息 -->
            <div class="flex items-center gap-3">
                <div class="flex-1">
                    {#if selectedSupplier}
                        <div class="font-medium text-gray-900">{selectedSupplier.name}</div>
                        <div class="text-sm text-gray-500">{selectedSupplier.code}</div>
                    {:else}
                        <span class="text-gray-500">加载中...</span>
                    {/if}
                </div>
            </div>
        {:else}
            <!-- 需要选择供应商 -->
            <Svelecte
                options={supplierOptions}
                bind:value={selectedSupplierId}
                placeholder="选择供应商..."
                searchable={true}
                class="w-full"
            />
        {/if}
    </div>

    {#if loading}
        <div class="text-center py-8">
            <svg class="w-8 h-8 mx-auto animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500 mt-2">加载报价中...</p>
        </div>
    {:else if selectedSupplierId}
        <!-- 变体报价表格 -->
        <div class="border rounded-lg overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        {#each Object.entries(attributes) as [code, attr]}
                            <th class="px-3 py-2 text-left font-medium text-gray-700">{attr.name}</th>
                        {/each}
                        <th class="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                        <th class="px-3 py-2 text-right font-medium text-gray-700 w-28">单价 *</th>
                        <th class="px-3 py-2 text-center font-medium text-gray-700 w-20">货币</th>
                        <th class="px-3 py-2 text-center font-medium text-gray-700 w-24">MOQ</th>
                        <th class="px-3 py-2 text-left font-medium text-gray-700">备注</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    {#each variants as variant}
                        {@const data = editData[variant.variant_item] || {
                            price: '', currency: 'CNY', min_quantity: 1, is_preferred: true, note: ''
                        }}
                        <tr class="hover:bg-gray-50">
                            {#each Object.keys(attributes) as code}
                                <td class="px-3 py-2">
                                    <div class="flex items-center gap-1.5">
                                        {#if getAttributeValueColor(variant, code)}
                                            <span 
                                                class="w-3 h-3 rounded-full"
                                                style="background-color: {getAttributeValueColor(variant, code)}"
                                            ></span>
                                        {/if}
                                        <span class="text-sm">{getAttributeValueDisplay(variant, code)}</span>
                                    </div>
                                </td>
                            {/each}
                            <td class="px-3 py-2 font-mono text-xs text-gray-600">
                                {variant.variant_item_detail?.SKU}
                            </td>
                            <td class="px-3 py-2">
                                <NumberStepper
                                    value={parseFloat(data.price) || 0}
                                    min={0}
                                    step={0.5}
                                    decimalPlaces={2}
                                    size="sm"
                                    onchange={(v) => data.price = v?.toFixed(2) || ''}
                                />
                            </td>
                            <td class="px-3 py-2">
                                <CurrencySelect bind:value={data.currency} />
                            </td>
                            <td class="px-3 py-2">
                                <NumberStepper
                                    value={data.min_quantity}
                                    min={1}
                                    step={1}
                                    decimalPlaces={0}
                                    size="sm"
                                    onchange={(v) => data.min_quantity = v || 1}
                                />
                            </td>
                            <td class="px-3 py-2">
                                <input
                                    type="text"
                                    bind:value={data.note}
                                    placeholder="备注"
                                    class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <!-- 统计信息 -->
        <div class="flex items-center justify-between text-sm text-gray-500">
            <div>
                共 {variants.length} 个变体，
                {Object.values(editData).filter(d => d.price).length} 个已填写价格
            </div>
            <div class="text-xs">
                * 留空表示不为此变体设置报价
            </div>
        </div>
    {:else}
        <div class="text-center py-8 text-gray-500">
            请先选择供应商
        </div>
    {/if}

    {#if error}
        <div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
        </div>
    {/if}

    <!-- 按钮 -->
    <div class="flex justify-end gap-3 pt-4 border-t">
        <button
            onclick={onCancel}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
            取消
        </button>
        <button
            onclick={saveAllQuotations}
            disabled={saving || !selectedSupplierId}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
            {#if saving}
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
            {:else}
                保存所有报价
            {/if}
        </button>
    </div>
</div>

<script lang="ts">
    /**
     * 通用订单表单组件 - TailwindCSS 版本
     * 支持采购订单和销售订单
     */
    import type { OrderFormData, OrderFormItem } from '$lib/composables/useOrderForm.svelte';
    import { useOrderForm } from '$lib/composables/useOrderForm.svelte';
    import Svelecte from 'svelecte';
    import { NumberStepper } from './ui';
    
    export type OrderType = 'purchase' | 'sales';
    
    interface QuotationOption {
        value: number;
        label: string;
        quotation: unknown;
    }
    
    interface Labels {
        partner: string;
        shipping: string;
        orderSection: string;
        shippingSection: string;
        feesSection: string;
        itemsSection: string;
        notesSection: string;
        partnerVisibleNote: string;
        internalNote: string;
    }
    
    interface Props {
        type: OrderType;
        partnerId: number;
        partnerName?: string;
        initialData?: Partial<OrderFormData>;
        quotationOptions: QuotationOption[];
        loadingQuotations?: boolean;
        labels: Labels;
        loading?: boolean;
        submitLabel?: string;
        onSubmit: (data: Record<string, unknown>) => void;
        onCancel: () => void;
    }
    
    let {
        type,
        partnerId,
        partnerName = '加载中...',
        initialData = {},
        quotationOptions,
        loadingQuotations = false,
        labels,
        loading = false,
        submitLabel = '保存',
        onSubmit,
        onCancel
    }: Props = $props();
    
    const {
        formData,
        errors,
        itemErrors,
        currentItem,
        subtotal,
        taxAmount,
        totalAmount,
        priorityOptions,
        validate,
        validateItem,
        addItem,
        resetCurrentItem,
        removeItem,
        setCurrentItemQuotation,
        prepareSubmitData,
    } = useOrderForm(partnerId, initialData);

    const quantityStep = 1;
    const quantityMin = 1;
    const quantityDecimals = 0;
    
    // 获取已添加的 SKU 列表
    const addedSkus = $derived(new Set(formData.items.map(item => item.sku).filter(Boolean)));
    
    // 过滤掉已存在的 SKU
    const filteredQuotationOptions = $derived(
        quotationOptions.filter(opt => {
            const q = opt.quotation as { sku?: string };
            return !addedSkus.has(q.sku);
        })
    );
    
    // Svelecte 选中值
    let selectedQuotation = $state<QuotationOption | undefined>(undefined);
    
    function handleItemSelect(selected: QuotationOption | undefined) {
        selectedQuotation = selected;
        if (selected && 'quotation' in selected) {
            const q = selected.quotation as { 
                id: number; 
                item?: number; 
                sku?: string; 
                item_name?: string; 
                price: string;
            };
            setCurrentItemQuotation(q);
        } else {
            setCurrentItemQuotation(undefined);
        }
    }
    
    function handleAddItem() {
        if (addItem()) {
            // 添加成功后清空选择
            selectedQuotation = undefined;
            resetCurrentItem();
        }
    }
    
    function handleSubmit(e: Event) {
        e.preventDefault();
        if (validate()) {
            onSubmit(prepareSubmitData(type));
        }
    }
</script>

<form class="max-w-6xl mx-auto space-y-6" onsubmit={handleSubmit}>
    <!-- 订单基本信息 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-900">{partnerName}</h3>
                <p class="text-sm text-gray-500">{labels.orderSection}</p>
            </div>
        </div>
        
        <input type="hidden" value={partnerId} />
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-1.5">
                <label for="priority" class="text-sm font-medium text-gray-700">优先级</label>
                <select 
                    id="priority" 
                    bind:value={formData.priority} 
                    disabled={loading}
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                    {#each priorityOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
            
            <div class="space-y-1.5">
                <label for="order_date" class="text-sm font-medium text-gray-700">
                    下单日期 <span class="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    id="order_date"
                    bind:value={formData.order_date}
                    disabled={loading}
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                />
                {#if errors.order_date}
                    <span class="text-xs text-red-500">{errors.order_date}</span>
                {/if}
            </div>
            
            <div class="space-y-1.5">
                <label for="expected_delivery" class="text-sm font-medium text-gray-700">预计交货日期</label>
                <input
                    type="date"
                    id="expected_delivery"
                    bind:value={formData.expected_delivery}
                    disabled={loading}
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                />
                {#if errors.expected_delivery}
                    <span class="text-xs text-red-500">{errors.expected_delivery}</span>
                {/if}
            </div>
        </div>
    </div>
    
    <!-- 收货信息 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{labels.shippingSection}</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2 space-y-1.5">
                <label for="shipping_address" class="text-sm font-medium text-gray-700">{labels.shipping}地址</label>
                <input
                    type="text"
                    id="shipping_address"
                    bind:value={formData.shipping_address}
                    placeholder="请输入{labels.shipping}地址"
                    disabled={loading}
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                />
            </div>
            
            <div class="space-y-1.5">
                <label for="contact_person" class="text-sm font-medium text-gray-700">{labels.shipping}联系人</label>
                <input
                    type="text"
                    id="contact_person"
                    bind:value={formData.contact_person}
                    placeholder="请输入联系人"
                    disabled={loading}
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                />
            </div>
            
            <div class="space-y-1.5">
                <label for="contact_phone" class="text-sm font-medium text-gray-700">{labels.shipping}电话</label>
                <input
                    type="tel"
                    id="contact_phone"
                    bind:value={formData.contact_phone}
                    placeholder="请输入联系电话"
                    disabled={loading}
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                />
            </div>
        </div>
    </div>
    
    <!-- 订单明细 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{labels.itemsSection}</h3>
        </div>
        
        <!-- 添加明细表单 -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <div class="flex flex-wrap items-end gap-3">
                <div class="flex-1 min-w-[280px] space-y-1.5">
                    <label for="item-select" class="text-sm font-medium text-gray-700">
                        选择SKU <span class="text-red-500">*</span>
                    </label>
                    {#if filteredQuotationOptions.length === 0}
                        <div class="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500">
                            所有SKU已添加完毕
                        </div>
                    {:else}
                        {#key selectedQuotation}
                            <Svelecte
                                inputId="item-select"
                                options={filteredQuotationOptions}
                                value={selectedQuotation}
                                valueAsObject={true}
                                placeholder={loadingQuotations ? '加载中...' : '搜索SKU或物品名称...'}
                                searchable={true}
                                clearable={true}
                                disabled={loading || loadingQuotations}
                                onChange={handleItemSelect}
                            />
                        {/key}
                    {/if}
                    {#if itemErrors.quotation}
                        <span class="text-xs text-red-500">{itemErrors.quotation}</span>
                    {/if}
                </div>
                
                <div class="w-28 space-y-1.5">
                    <label for="item-quantity" class="text-sm font-medium text-gray-700">数量</label>
                    <NumberStepper
                        bind:value={currentItem.quantity}
                        min={quantityMin}
                        step={quantityStep}
                        decimalPlaces={quantityDecimals}
                        size="md"
                        disabled={loading}
                    />
                    {#if itemErrors.quantity}
                        <span class="text-xs text-red-500">{itemErrors.quantity}</span>
                    {/if}
                </div>
                
                <div class="w-32 space-y-1.5">
                    <label for="item-price" class="text-sm font-medium text-gray-700">单价</label>
                    <NumberStepper
                        bind:value={currentItem.unit_price}
                        min={0}
                        step={0.01}
                        size="md"
                        disabled={loading}
                    />
                    {#if itemErrors.unit_price}
                        <span class="text-xs text-red-500">{itemErrors.unit_price}</span>
                    {/if}
                </div>
                
                <div class="pb-0.5">
                    <button
                        type="button"
                        class="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onclick={handleAddItem}
                        disabled={loading}
                    >
                        添加
                    </button>
                </div>
            </div>
        </div>
        
        <!-- 明细列表 -->
        {#if formData.items.length > 0}
            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left font-medium text-gray-700">#</th>
                            <th class="px-4 py-3 text-left font-medium text-gray-700">SKU</th>
                            <th class="px-4 py-3 text-left font-medium text-gray-700">物品名称</th>
                            <th class="px-4 py-3 text-right font-medium text-gray-700">数量</th>
                            <th class="px-4 py-3 text-right font-medium text-gray-700">单价</th>
                            <th class="px-4 py-3 text-right font-medium text-gray-700">小计</th>
                            <th class="px-4 py-3 text-center font-medium text-gray-700 w-16">操作</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        {#each formData.items as item, index}
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-4 py-3 text-gray-500">{index + 1}</td>
                                <td class="px-4 py-3 font-mono text-xs text-gray-600">{item.sku || '-'}</td>
                                <td class="px-4 py-3 text-gray-900">{item.item_name || '-'}</td>
                                <td class="px-4 py-3 text-right">
                                    <NumberStepper
                                        value={item.quantity}
                                        min={quantityMin}
                                        step={quantityStep}
                                        decimalPlaces={quantityDecimals}
                                        size="sm"
                                        disabled={loading}
                                        onchange={(v) => formData.items[index].quantity = v ?? 0}
                                    />
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <NumberStepper
                                        value={item.unit_price}
                                        min={0}
                                        step={0.01}
                                        size="sm"
                                        disabled={loading}
                                        onchange={(v) => formData.items[index].unit_price = v ?? 0}
                                    />
                                </td>
                                <td class="px-4 py-3 text-right font-medium text-gray-900">
                                    ¥{(item.quantity * Number(item.unit_price)).toFixed(2)}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <button
                                        type="button"
                                        class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        onclick={() => removeItem(index)}
                                        disabled={loading}
                                        title="删除"
                                        aria-label="删除此明细项"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                    <tfoot class="bg-gray-50 font-medium">
                        <tr>
                            <td colspan="5" class="px-4 py-3 text-right text-gray-700">小计:</td>
                            <td class="px-4 py-3 text-right text-gray-900">¥{subtotal.toFixed(2)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        {:else}
            <div class="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p>暂无明细项，请在上方添加</p>
                {#if errors.items}
                    <span class="text-xs text-red-500 mt-2 block">{errors.items}</span>
                {/if}
            </div>
        {/if}
    </div>
    
    <!-- 费用信息 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{labels.feesSection}</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="space-y-1.5">
                <label for="tax_rate" class="text-sm font-medium text-gray-700">税率 (%)</label>
                <NumberStepper
                    bind:value={formData.tax_rate}
                    min={0}
                    max={100}
                    step={0.01}
                    size="md"
                    disabled={loading}
                />
            </div>
            
            <div class="space-y-1.5">
                <label for="shipping_cost" class="text-sm font-medium text-gray-700">运费</label>
                <NumberStepper
                    bind:value={formData.shipping_cost}
                    min={0}
                    step={0.01}
                    size="md"
                    disabled={loading}
                />
            </div>
            
            <div class="space-y-1.5">
                <label for="discount" class="text-sm font-medium text-gray-700">折扣</label>
                <NumberStepper
                    bind:value={formData.discount}
                    min={0}
                    step={0.01}
                    size="md"
                    disabled={loading}
                />
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4 space-y-2 lg:col-span-1">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">商品小计:</span>
                    <span class="font-medium text-gray-900">¥{subtotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">税额:</span>
                    <span class="font-medium text-gray-900">¥{taxAmount.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">运费:</span>
                    <span class="font-medium text-gray-900">¥{Number(formData.shipping_cost).toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">折扣:</span>
                    <span class="font-medium text-gray-900">-¥{Number(formData.discount).toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                    <span class="text-gray-900">订单总计:</span>
                    <span class="text-blue-600">¥{totalAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 备注 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{labels.notesSection}</h3>
        </div>
        
        <div class="space-y-4">
            <div class="space-y-1.5">
                <label for="notes" class="text-sm font-medium text-gray-700">订单备注</label>
                <textarea
                    id="notes"
                    bind:value={formData.notes}
                    placeholder="输入订单备注（{labels.partnerVisibleNote}）"
                    rows="2"
                    disabled={loading}
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors resize-none"
                ></textarea>
            </div>
            
            <div class="space-y-1.5">
                <label for="internal_notes" class="text-sm font-medium text-gray-700">内部备注</label>
                <textarea
                    id="internal_notes"
                    bind:value={formData.internal_notes}
                    placeholder="输入内部备注（{labels.internalNote}）"
                    rows="2"
                    disabled={loading}
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors resize-none"
                ></textarea>
            </div>
        </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="flex justify-end gap-3 pt-4">
        <button
            type="button"
            class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onclick={onCancel}
            disabled={loading}
        >
            取消
        </button>
        <button
            type="submit"
            class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            disabled={loading}
        >
            {loading ? '保存中...' : submitLabel}
        </button>
    </div>
</form>

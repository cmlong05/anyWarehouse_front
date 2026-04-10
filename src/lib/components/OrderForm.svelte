<script lang="ts">
    /**
     * 通用订单表单组件 - TailwindCSS 版本
     * 支持采购订单和销售订单
     */
    import type { OrderFormData, OrderFormItem } from '$lib/composables/useOrderForm.svelte';
    import type { CustomerAddress } from '$lib';
    import { useOrderForm } from '$lib/composables/useOrderForm.svelte';
    import Svelecte from 'svelecte';
    import { NumberStepper } from './ui';
    import { config } from '$lib/config';
    import type { ItemVariant } from '$lib/types/variant';
    import { buildVariantAttributes } from '$lib/utils/variant';
    import VariantAttributeBadge from '$lib/components/VariantAttributeBadge.svelte';
    
    export type OrderType = 'purchase' | 'sales';
    
    interface QuotationOption {
        value: number;
        label: string;
        quotation: unknown;
    }

    interface ShippingAddressOption {
        value: number;
        label: string;
        address: CustomerAddress;
        disabled?: boolean;
    }

    type ShippingAddressSelectValue = ShippingAddressOption | ShippingAddressOption[] | number | string | null | undefined;
    
    interface Labels {
        partner: string;
        shipping: string;
        orderSection: string;
        shippingSection: string;
        feesSection: string;
        paymentFee?: string;
        itemsSection: string;
        notesSection: string;
        partnerVisibleNote: string;
        internalNote: string;
    }
    
    interface Props {
        type: OrderType;
        partnerId: number;
        partnerName?: string;
        /** 合作伙伴货币，由调用方传入；未传时从报价推导（采购单兼容模式） */
        currency?: string;
        initialData?: Partial<OrderFormData>;
        shippingAddresses?: CustomerAddress[];
        loadingShippingAddresses?: boolean;
        enableShippingAddressSelection?: boolean;
        initialShippingAddressId?: number | null;
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
        currency = undefined,
        initialData = {},
        shippingAddresses = [],
        loadingShippingAddresses = false,
        enableShippingAddressSelection = false,
        initialShippingAddressId = null,
        quotationOptions,
        loadingQuotations = false,
        labels,
        loading = false,
        submitLabel = '保存',
        onSubmit,
        onCancel
    }: Props = $props();
    
    // 直接使用 composable，不要用 $derived 包裹
    // svelte-ignore state_referenced_locally
    const orderForm = useOrderForm(partnerId, initialData);
    
    const {
        formData,
        errors,
        itemErrors,
        currentItem,
        priorityOptions,
        validate,
        validateItem,
        addItem,
        resetCurrentItem,
        removeItem,
        updateItemField,
        setCurrentItemQuotation,
        prepareSubmitData,
    } = orderForm;
    
    // 使用 $derived 包装计算属性，确保响应式更新
    const subtotal = $derived(orderForm.subtotal);
    const taxAmount = $derived(orderForm.taxAmount);
    const totalAmount = $derived(orderForm.totalAmount);

    // Svelecte 选中值
    let selectedQuotation = $state<QuotationOption | undefined>(undefined);

    // 获取已添加的 SKU 列表
    const addedSkus = $derived(new Set(formData.items.map(item => item.sku).filter(Boolean)));
    
    // 订单货币：优先使用传入的合作伙伴货币（销售订单），否则从报价推导（采购订单兼容）
    const orderCurrency = $derived((() => {
        if (currency) return currency;
        // 采购订单：从第一个有报价的明细推导
        for (const item of formData.items) {
            if (item.quotation) {
                const opt = quotationOptions.find(o => o.value === item.quotation);
                const q = opt?.quotation as { currency?: string } | undefined;
                if (q?.currency) return q.currency;
            }
        }
        return 'CNY';
    })());

    let selectedShippingAddressId = $state<number | ''>('');
    let selectedShippingOption = $state<ShippingAddressOption | undefined>(undefined);
    let hasAppliedInitialShippingAddress = $state(false);

    function toDisplayText(value: unknown): string {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (typeof value === 'object') {
            const obj = value as Record<string, unknown>;
            const preferred = obj.label ?? obj.name ?? obj.text ?? obj.value;
            return toDisplayText(preferred);
        }
        return '';
    }

    const shippingAddressOptions = $derived(
        shippingAddresses.map((address) => ({
            value: address.id,
            label: [
                toDisplayText(address.contact_name),
                toDisplayText(address.company),
                toDisplayText(address.city),
                address.status !== 'ACTIVE' ? '未启用' : ''
            ].filter(Boolean).join(' · ') || '地址',
            address,
            disabled: address.status !== 'ACTIVE'
        }))
    );

    const selectedShippingAddress = $derived(
        shippingAddresses.find((addr) => addr.id === selectedShippingAddressId) ?? null
    );
    const showManualShippingFields = $derived(
        !(type === 'sales' && enableShippingAddressSelection)
    );
    
    // 获取货币符号
    function getCurrencySymbol(currency: string): string {
        const symbols: Record<string, string> = {
            'CNY': '¥',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
        };
        return symbols[currency] || currency + ' ';
    }

    function formatShippingAddress(address: CustomerAddress): string {
        return [
            toDisplayText(address.country),
            toDisplayText(address.province),
            toDisplayText(address.city),
            toDisplayText(address.district),
            toDisplayText(address.detail_address),
            toDisplayText(address.detail_address2),
        ].filter(Boolean).join(' ');
    }

    function applyShippingAddress(address: CustomerAddress) {
        formData.shipping_address = formatShippingAddress(address);
        formData.contact_person = toDisplayText(address.contact_name);
        formData.contact_phone = toDisplayText(address.phone) || toDisplayText(address.mobile);
        formData.company_name = address.company || '';
    }

    function normalizeShippingAddressOption(value: ShippingAddressSelectValue): ShippingAddressOption | undefined {
        if (!value) return undefined;

        const selected = Array.isArray(value) ? value[0] : value;
        if (!selected) return undefined;

        if (typeof selected === 'number' || typeof selected === 'string') {
            const id = Number(selected);
            const address = shippingAddresses.find((addr) => addr.id === id);
            if (!address) return undefined;
            return {
                value: address.id,
                label: [
                    toDisplayText(address.contact_name),
                    toDisplayText(address.company),
                    toDisplayText(address.city),
                    address.status !== 'ACTIVE' ? '未启用' : ''
                ].filter(Boolean).join(' · ') || '地址',
                address,
                disabled: address.status !== 'ACTIVE'
            };
        }

        if (typeof selected === 'object') {
            const option = selected as Partial<ShippingAddressOption> & { value?: number | string };
            const optionValue = option.value;
            const normalizedValue = typeof optionValue === 'number' ? optionValue : Number(optionValue);
            const address = option.address || shippingAddresses.find((addr) => addr.id === normalizedValue);
            if (!address || Number.isNaN(normalizedValue)) return undefined;

            return {
                value: normalizedValue,
                label: option.label || [
                    toDisplayText(address.contact_name),
                    toDisplayText(address.company),
                    toDisplayText(address.city),
                    address.status !== 'ACTIVE' ? '未启用' : ''
                ].filter(Boolean).join(' · ') || '地址',
                address,
                disabled: address.status !== 'ACTIVE'
            };
        }

        return undefined;
    }

    function handleShippingAddressSelect(option: ShippingAddressSelectValue) {
        const normalizedOption = normalizeShippingAddressOption(option);
        selectedShippingOption = normalizedOption;

        if (!normalizedOption) {
            selectedShippingAddressId = '';
            return;
        }

        if (normalizedOption.address.status !== 'ACTIVE') {
            selectedShippingAddressId = '';
            return;
        }

        selectedShippingAddressId = normalizedOption.value;
        applyShippingAddress(normalizedOption.address);
    }

    function handleQuotationSelect(selected: QuotationOption | undefined) {
        if (selected && 'quotation' in selected) {
            const q = selected.quotation as { 
                id: number; 
                item?: number; 
                item_sku?: string; 
                item_name?: string; 
                item_name_en?: string;
                price: string;
                item_is_variant_template?: boolean;
                is_variant_template?: boolean;
            };
            setCurrentItemQuotation(q);
        } else {
            setCurrentItemQuotation(undefined);
        }
    }
    
    // 过滤掉已存在的 SKU
    const filteredQuotationOptions = $derived(
        quotationOptions.filter(opt => {
            const q = opt.quotation as { item_sku?: string };
            return !addedSkus.has(q.item_sku);
        })
    );

    // 数量输入配置
    // regular items require at least 1, but variant child rows may be left at
    // zero (preloaded or intentionally unselected) and are filtered out on
    // submit.  give them a lower min so the native browser validator doesn't
    // block the form.
    const quantityMin = 1;
    const variantQuantityMin = 0;
    const quantityStep = 1;
    const quantityDecimals = 0;

    // --------------------------------------------------------
    // ensure that when initialData.items is populated (for example
    // after preload expansion) we copy those items into the underlying
    // formData.  useOrderForm only reads the initial data once, so
    // when the derived `initialData` value changes later we must
    // patch the state manually.  We only overwrite when the form
    // is still empty to avoid blowing away user edits.
    // --------------------------------------------------------
    // 修复：添加条件避免不必要的执行
    $effect(() => {
        const items = initialData?.items;
        if (Array.isArray(items) && items.length > 0 && formData.items.length === 0) {
            // copy the array so that we don't hold a reference to the
            // original object; the objects themselves may carry the
            // isVariantChild/parentId flags which are important for
            // styling.
            formData.items = items.map(i => ({ ...i }));
        }
    });

    $effect(() => {
        if (!initialData) return;
        if (!formData.shipping_address && initialData.shipping_address) {
            formData.shipping_address = initialData.shipping_address;
        }
        if (!formData.contact_person && initialData.contact_person) {
            formData.contact_person = initialData.contact_person;
        }
        if (!formData.contact_phone && initialData.contact_phone) {
            formData.contact_phone = initialData.contact_phone;
        }
    });

    $effect(() => {
        if (!enableShippingAddressSelection || type !== 'sales') return;
        if (hasAppliedInitialShippingAddress) return;
        if (!initialShippingAddressId) return;

        const address = shippingAddresses.find((addr) => addr.id === initialShippingAddressId);
        if (!address) return;

        selectedShippingAddressId = address.id;
        selectedShippingOption = {
            value: address.id,
            label: [
                address.contact_name,
                address.company,
                address.city,
                address.status !== 'ACTIVE' ? '未启用' : ''
            ].filter(Boolean).join(' · ') || '地址',
            address,
            disabled: address.status !== 'ACTIVE'
        };
        applyShippingAddress(address);
        hasAppliedInitialShippingAddress = true;
    });

    function handleItemSelect(selected: QuotationOption | undefined) {
        selectedQuotation = selected;
        handleQuotationSelect(selected);
    }
    
    // 获取物品的变体列表
    async function fetchItemVariants(itemId: number): Promise<ItemVariant[]> {
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/item/${itemId}/variants/`);
            if (response.ok) {
                const data = await response.json();
                return data.variants || [];
            }
        } catch (err) {
            // 获取变体列表失败
        }
        return [];
    }
    
    // 检查是否为变体母版
    function isVariantTemplate(quotation: unknown): boolean {
        const q = quotation as { item_is_variant_template?: boolean; is_variant_template?: boolean };
        return q.item_is_variant_template === true || q.is_variant_template === true;
    }
    
    async function handleAddItem() {
        if (!validateItem()) return;
        
        // 获取当前要添加的报价信息
        const quotation = selectedQuotation?.quotation as { 
            id: number; 
            item?: number; 
            sku?: string; 
            item_name?: string; 
            item_name_en?: string;
            price: string;
            item_is_variant_template?: boolean;
            is_variant_template?: boolean;
        } | undefined;
        
        if (!quotation) return;
        
        // 添加主项
        const parentId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const isTemplate = isVariantTemplate(quotation);
        const newItem: OrderFormItem = {
            id: parentId,
            item: currentItem.item || null,
            sku: currentItem.sku || '',
            item_name: currentItem.item_name || '',
            item_name_en: (currentItem.item_name_en || quotation.item_name_en) || '',
            // 如果是变体母版，数量设为 0（仅作为分组标识）
            quantity: isTemplate ? 0 : (currentItem.quantity || 1),
            unit_price: currentItem.unit_price || 0,
            quotation: currentItem.quotation || null,
            expected_delivery: currentItem.expected_delivery || null,
            notes: currentItem.notes || '',
            isVariantChild: false,
        };
        
        // 将新项目添加到列表
        const currentItems = [...formData.items, newItem];
        
        // 如果是变体母版，自动展开变体子项
        if (isVariantTemplate(quotation) && quotation.item) {
            const variants = await fetchItemVariants(quotation.item);
            if (variants.length > 0) {
                // 尝试从 sessionStorage 获取预加载的报价价格信息
                let preloadPrices: Record<string, { price: number; currency: string }> = {};
                try {
                    const preloadData = sessionStorage.getItem('sales_order_preload_items');
                    if (preloadData) {
                        const parsed = JSON.parse(preloadData);
                        preloadPrices = parsed.all_quotation_prices || {};
                    }
                } catch {
                    // 忽略解析错误
                }
                
                const variantItems: OrderFormItem[] = variants.map((variant, idx) => {
                    const variantDetail = variant.variant_item_detail as { 
                        id: number; 
                        SKU: string; 
                        name: string;
                        name_en?: string;
                        b_Price?: string;
                    } | null;
                    
                    const variantSku = variantDetail?.SKU || '';
                    // 优先使用预加载的报价价格，如果没有则使用基础价格
                    const unitPrice = preloadPrices[variantSku]?.price ?? parseFloat(variantDetail?.b_Price || '0') ?? 0;
                    
                    // 构建变体属性数组
                    const attrValues = buildVariantAttributes(variant.attribute_values_detail);
                    
                    return {
                        id: `item_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
                        item: variant.variant_item,
                        sku: variantSku,
                        item_name: variantDetail?.name || '',
                        item_name_en: variantDetail?.name_en || '',
                        quantity: 1,
                        unit_price: unitPrice,
                        quotation: null,
                        expected_delivery: null,
                        notes: '',
                        isVariantChild: true,
                        parentId: parentId,
                        variantAttributes: attrValues,
                    };
                });
                
                // 将变体子项添加到主项后面
                formData.items = [...currentItems, ...variantItems];
            } else {
                formData.items = currentItems;
            }
        } else {
            formData.items = currentItems;
        }
        
        // 重置当前项和选择
        selectedQuotation = undefined;
        resetCurrentItem();
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
            {#if type === 'sales' && enableShippingAddressSelection}
                <div class="md:col-span-2 space-y-1.5">
                    <label for="shipping_address_selector" class="text-sm font-medium text-gray-700">选择地址</label>
                    {#key selectedShippingOption}
                        <Svelecte
                            inputId="shipping_address_selector"
                            options={shippingAddressOptions}
                            labelField="label"
                            valueField="value"
                            value={selectedShippingOption}
                            valueAsObject={true}
                            placeholder="请选择地址"
                            searchable={true}
                            clearable={false}
                            disabled={loading || loadingShippingAddresses}
                            onChange={handleShippingAddressSelect}
                        />
                    {/key}

                    {#if loadingShippingAddresses}
                        <p class="text-xs text-gray-500">正在加载客户地址...</p>
                    {:else if shippingAddresses.length === 0}
                        <p class="text-xs text-amber-600">该客户暂无可用地址。</p>
                    {:else}
                        <p class="text-xs text-gray-500">选择地址后会自动带入订单收货快照，下方只展示所选地址信息。</p>
                    {/if}
                </div>

                {#if selectedShippingAddress}
                    <div class="md:col-span-2 rounded-lg border border-green-200 bg-green-50/60 px-4 py-3 text-sm">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-gray-700">
                            <div>
                                <span class="text-gray-500">收件人：</span>
                                <span>{selectedShippingAddress.contact_name || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">公司名称：</span>
                                <span>{selectedShippingAddress.company || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">电话：</span>
                                <span>{selectedShippingAddress.phone || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">手机：</span>
                                <span>{selectedShippingAddress.mobile || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">邮箱：</span>
                                <span>{selectedShippingAddress.email || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">税号：</span>
                                <span>{selectedShippingAddress.tax_number || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">国家：</span>
                                <span>{selectedShippingAddress.country || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">州/省：</span>
                                <span>{selectedShippingAddress.province || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">城市：</span>
                                <span>{selectedShippingAddress.city || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">区/县：</span>
                                <span>{selectedShippingAddress.district || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">地址1：</span>
                                <span>{selectedShippingAddress.detail_address || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">地址2：</span>
                                <span>{selectedShippingAddress.detail_address2 || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">邮编：</span>
                                <span>{selectedShippingAddress.postal_code || '-'}</span>
                            </div>
                            <div class="md:col-span-2">
                                <span class="text-gray-500">备注：</span>
                                <span>{selectedShippingAddress.remark || '-'}</span>
                            </div>
                        </div>
                    </div>
                {:else if formData.contact_person || formData.shipping_address}
                    <!-- 未匹配到地址记录时，显示订单已保存的地址快照（只读） -->
                    <div class="md:col-span-2 rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm">
                        <p class="text-xs text-gray-400 mb-2">当前订单地址快照（未匹配到地址记录，可重新选择地址覆盖）</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-gray-700">
                            {#if formData.contact_person}
                                <div><span class="text-gray-500">收件人：</span><span>{formData.contact_person}</span></div>
                            {/if}
                            {#if formData.company_name}
                                <div><span class="text-gray-500">公司名称：</span><span>{formData.company_name}</span></div>
                            {/if}
                            {#if formData.contact_phone}
                                <div><span class="text-gray-500">电话：</span><span>{formData.contact_phone}</span></div>
                            {/if}
                            {#if formData.shipping_address}
                                <div class="md:col-span-2"><span class="text-gray-500">地址：</span><span>{formData.shipping_address}</span></div>
                            {/if}
                        </div>
                    </div>
                {/if}
            {/if}

            {#if showManualShippingFields}
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
            {:else}
                <input type="hidden" value={formData.shipping_address} />
                <input type="hidden" value={formData.contact_person} />
                <input type="hidden" value={formData.contact_phone} />
            {/if}
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
                            {@const parentIndex = item.parentId ? formData.items.findIndex(i => i.id === item.parentId) + 1 : null}
                            {@const siblingIndex = item.parentId ? formData.items.filter(i => i.parentId === item.parentId).findIndex(i => i.id === item.id) + 1 : null}
                            {@const displayIndex = item.isVariantChild && parentIndex ? `${parentIndex}-${siblingIndex}` : String(index + 1)}
                            <tr class="{item.isVariantChild ? 'bg-purple-50/50' : 'hover:bg-gray-50'} transition-colors">
                                <td class="px-4 py-3 {item.isVariantChild ? 'text-purple-600' : 'text-gray-500'}">{displayIndex}</td>
                                <td class="px-4 py-3">
                                    {#if item.isVariantChild}
                                        <!-- 变体子项：显示缩进和物品信息 -->
                                        <div class="flex items-center gap-2">
                                            <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                            <span class="font-mono text-xs text-gray-600">{item.sku || '-'}</span>
                                            <span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">变体</span>
                                        </div>
                                    {:else if item.quantity === 0 && formData.items.some(i => i.parentId === item.id)}
                                        <!-- 母版分组行（数量为0，作为分组标识） -->
                                        <div class="flex items-center gap-2">
                                            <span class="font-mono text-xs text-gray-500">{item.sku || '-'}</span>
                                            <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">母版</span>
                                        </div>
                                    {:else}
                                        <!-- 普通行：直接显示 SKU -->
                                        <span class="font-mono text-xs text-gray-600">{item.sku || '-'}</span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3">
                                    {#if item.isVariantChild}
                                        <!-- 变体子项：显示物品名称和属性 -->
                                        <div class="text-gray-900">{item.item_name || '-'}</div>
                                        <VariantAttributeBadge attributes={item.variantAttributes || []} class="mt-0.5" />
                                    {:else if item.quantity === 0 && formData.items.some(i => i.parentId === item.id)}
                                        <!-- 母版分组行 -->
                                        <span class="text-gray-500">{item.item_name || '-'}</span>
                                    {:else}
                                        <!-- 普通行/母版行：直接显示物品名称 -->
                                        <span class="text-gray-900">{item.item_name || '-'}</span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <NumberStepper
                                        value={item.quantity}
                                        min={item.isVariantChild ? variantQuantityMin : (formData.items.some(i => i.parentId === item.id) ? 0 : quantityMin)}
                                        step={quantityStep}
                                        decimalPlaces={quantityDecimals}
                                        size="sm"
                                        disabled={loading}
                                        onchange={(v) => updateItemField(index, 'quantity', v)}
                                    />
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <NumberStepper
                                        value={item.unit_price}
                                        min={0}
                                        step={0.01}
                                        size="sm"
                                        disabled={loading}
                                        onchange={(v) => updateItemField(index, 'unit_price', v)}
                                    />
                                </td>
                                <td class="px-4 py-3 text-right font-medium text-gray-900">
                                    {getCurrencySymbol(orderCurrency)}{(item.quantity * Number(item.unit_price)).toFixed(2)}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <button
                                        type="button"
                                        class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        onclick={() => {
                                            // 如果是母版行，同时删除其所有变体子项
                                            if (!item.isVariantChild && item.id) {
                                                formData.items = formData.items.filter(i => i.id !== item.id && i.parentId !== item.id);
                                            } else {
                                                removeItem(index);
                                            }
                                        }}
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
                            <td colspan="5" class="px-4 py-3 text-right text-gray-700">汇总:</td>
                            <td class="px-4 py-3 text-right text-gray-900">{getCurrencySymbol(orderCurrency)}{subtotal.toFixed(2)}</td>
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

            {#if type === 'sales'}
                <div class="space-y-1.5">
                    <label for="payment_fee" class="text-sm font-medium text-gray-700">{labels.paymentFee || '付款费用'}</label>
                    <NumberStepper
                        bind:value={formData.payment_fee}
                        min={0}
                        step={0.01}
                        size="md"
                        disabled={loading}
                    />
                </div>
            {/if}
            
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

            <div class="space-y-1.5">
                <label for="adjustment" class="text-sm font-medium text-gray-700">其他调整</label>
                <NumberStepper
                    bind:value={formData.adjustment}
                    min={-999999}
                    step={1}
                    size="md"
                    disabled={loading}
                />
            </div>

            <div class="bg-gray-50 rounded-lg p-4 space-y-2 lg:col-span-1">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">商品小计:</span>
                    <span class="font-medium text-gray-900">{getCurrencySymbol(orderCurrency)}{subtotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">税额:</span>
                    <span class="font-medium text-gray-900">{getCurrencySymbol(orderCurrency)}{taxAmount.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">运费:</span>
                    <span class="font-medium text-gray-900">{getCurrencySymbol(orderCurrency)}{Number(formData.shipping_cost).toFixed(2)}</span>
                </div>
                {#if type === 'sales'}
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">{labels.paymentFee || '付款费用'}:</span>
                        <span class="font-medium text-gray-900">{getCurrencySymbol(orderCurrency)}{Number(formData.payment_fee).toFixed(2)}</span>
                    </div>
                {/if}
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">折扣:</span>
                    <span class="font-medium text-gray-900">-{getCurrencySymbol(orderCurrency)}{Number(formData.discount).toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">其他调整:</span>
                    <span class="font-medium text-gray-900">{getCurrencySymbol(orderCurrency)}{Number(formData.adjustment).toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                    <span class="text-gray-900">订单总计:</span>
                    <span class="text-blue-600">{getCurrencySymbol(orderCurrency)}{totalAmount.toFixed(2)}</span>
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
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors resize-y"
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
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors resize-y"
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

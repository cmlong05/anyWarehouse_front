<script lang="ts">
    /**
     * 采购订单表单 - 基于通用 OrderForm 组件
     */
    import type { 
        PurchaseOrder, 
        PurchaseOrderCreateRequest,
        QuotationBrief,
        OrderFormItem
    } from '$lib';
    import type { ItemVariant } from '$lib/types/variant';
    import { buildVariantAttributes } from '$lib/utils/variant';
    import OrderForm from './OrderForm.svelte';
    import { supplierAPI } from '$lib/api';
    import { config } from '$lib/config';
    import { onMount } from 'svelte';
    
    interface Props {
        purchaseOrder?: PurchaseOrder;
        supplierId: number;
        supplier?: { id: number; name: string; contact_name?: string; phone?: string; email?: string; code?: string };
        preloadItems?: any[] | null;
        preloadQuotationPrices?: Record<string, { price: number; currency: string }> | null;
        purchaseOrderDefaults?: {
            shipping_address: string;
            contact_person: string;
            contact_phone: string;
        } | null;
        onSubmit: (data: PurchaseOrderCreateRequest) => void;
        onCancel: () => void;
        submitLabel?: string;
        loading?: boolean;
    }
    
    let { 
        purchaseOrder, 
        supplierId,
        supplier,
        preloadItems,
        preloadQuotationPrices,
        purchaseOrderDefaults,
        onSubmit, 
        onCancel, 
        submitLabel = '保存',
        loading = false
    }: Props = $props();
    
    // 供应商报价列表
    let quotations = $state<QuotationBrief[]>([]);
    let loadingQuotations = $state(false);
    // 预加载并展开变体的订单项
    let expandedPreloadItems = $state<OrderFormItem[] | undefined>(undefined);
    
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
    
    // 转换为Svelecte选项格式
    const quotationOptions = $derived(quotations.map(q => ({
        value: q.id,
        label: `${q.item_sku || '-'} - ${q.item_name || '-'} (${getCurrencySymbol(q.currency)}${q.price})`,
        quotation: q
    })));
    
    // 加载供应商报价
    async function loadQuotations() {
        loadingQuotations = true;
        try {
            const result = await supplierAPI.getQuotations(supplierId);
            quotations = result.quotations;
            // note: we no longer perform preload expansion directly here; a
            // reactive effect below will watch quotations + preloadItems and
            // run processPreloadItems whenever both are available.
        } catch (err) {
            console.error('加载报价失败:', err);
        } finally {
            loadingQuotations = false;
        }
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
            console.error('获取变体失败:', err);
        }
        return [];
    }
    
    // 处理预加载数据，展开变体母版并按母版分组
    async function processPreloadItems(
        items: any[], 
        allQuotations: QuotationBrief[],
        allQuotationPrices?: Record<string, { price: number; currency: string }> | null
    ): Promise<OrderFormItem[]> {
        const result: OrderFormItem[] = [];
        
        // 按母版ID分组收集选中的项
        const groups = new Map<number | string, {
            parentQuotation: QuotationBrief | null;
            parentItem: any;
            children: any[];
        }>();
        const independentItems: any[] = [];
        
        for (const item of items) {
            const quotation = allQuotations.find(q => q.id === item.quotation_id);
            
            // 如果是变体母版本身
            if (quotation?.is_variant_template && item.item) {
                if (!groups.has(item.item)) {
                    groups.set(item.item, {
                        parentQuotation: quotation,
                        parentItem: item,
                        children: []
                    });
                } else {
                    // 更新母版的数量
                    const group = groups.get(item.item)!;
                    group.parentItem = item;
                }
            }
            // 如果是变体子项（有 parent_item_id）
            else if (quotation?.parent_item_id && item.item) {
                const parentId = quotation.parent_item_id;
                if (!groups.has(parentId)) {
                    // 查找母版报价
                    const parentQuotation = allQuotations.find(q => 
                        q.item === parentId && q.is_variant_template
                    );
                    groups.set(parentId, {
                        parentQuotation: parentQuotation || null,
                        parentItem: null,  // 稍后填充
                        children: [item]
                    });
                } else {
                    groups.get(parentId)!.children.push(item);
                }
            }
            // 普通独立项
            else {
                independentItems.push(item);
            }
        }
        
        // 处理每个变体组
        for (const [parentId, group] of groups) {
            const parentIdStr = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // 获取母版信息
            let parentSku = group.parentQuotation?.item_sku || '-';
            let parentName = group.parentQuotation?.item_name || '母版';
            let parentQuantity = group.parentItem?.quantity || 0;
            
            // 添加母版行（如果选中了母版，使用其数量；否则作为分组标识，数量为0）
            result.push({
                id: parentIdStr,
                item: typeof parentId === 'number' ? parentId : null,
                sku: parentSku,
                item_name: parentName,
                quantity: parentQuantity,
                unit_price: group.parentItem?.unit_price || 0,
                quotation: group.parentItem?.quotation_id || null,
                expected_delivery: null,
                notes: '',
                isVariantChild: false,
            });
            
            // 获取所有子变体
            const variants = await fetchItemVariants(Number(parentId));
            
            // 为每个子变体创建行
            for (const variant of variants) {
                const variantDetail = variant.variant_item_detail as { 
                    id: number; 
                    SKU: string; 
                    name: string;
                    b_Price?: string;
                } | null;
                
                // 查找是否选中了此变体
                const selectedChild = group.children.find(c => c.item === variant.variant_item);
                
                const variantSku = variantDetail?.SKU || '';
                // 优先使用预加载的报价价格，其次是选中项的价格，最后回退到基础价格
                const unitPrice = selectedChild?.unit_price 
                    ?? allQuotationPrices?.[variantSku]?.price 
                    ?? parseFloat(variantDetail?.b_Price || '0') 
                    ?? 0;
                
                // 构建变体属性数组
                const attrValues = buildVariantAttributes(variant.attribute_values_detail);
                
                result.push({
                    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    item: variant.variant_item,
                    sku: variantSku,
                    item_name: variantDetail?.name || '',
                    quantity: selectedChild?.quantity || 0,  // 如果选中了，使用其数量
                    unit_price: unitPrice,
                    quotation: selectedChild?.quotation_id || null,
                    expected_delivery: null,
                    notes: '',
                    isVariantChild: true,
                    parentId: parentIdStr,
                    variantAttributes: attrValues,
                });
            }
        }
        
        // 添加独立项
        for (const item of independentItems) {
            result.push({
                id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                item: item.item || null,
                sku: item.sku || '',
                item_name: item.item_name || '',
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0,
                quotation: item.quotation_id || null,
                expected_delivery: null,
                notes: '',
                isVariantChild: false,
            });
        }
        
        return result;
    }
    
    onMount(() => {
        loadQuotations();
    });

    // whenever quotations or preloadItems update we need to expand
    // the latter if necessary.  this covers the case where preloadItems
    // arrives after the quotations request completes.
    $effect(() => {
        if (preloadItems && preloadItems.length > 0 && quotations.length > 0) {
            // avoid repeating work if we already expanded the same payload
            // (simple by comparing lengths)
            if (!expandedPreloadItems || expandedPreloadItems.length !== preloadItems.length) {
                (async () => {
                    expandedPreloadItems = await processPreloadItems(preloadItems, quotations, preloadQuotationPrices);
                })();
            }
        }
    });

    // 准备初始数据
    const initialData = $derived({
        priority: purchaseOrder?.priority,
        order_date: purchaseOrder?.order_date,
        expected_delivery: purchaseOrder?.expected_delivery || undefined,
        tax_rate: purchaseOrder?.tax_rate ? parseFloat(purchaseOrder.tax_rate) : 0,
        shipping_cost: purchaseOrder?.shipping_cost ? parseFloat(purchaseOrder.shipping_cost) : 0,
        discount: purchaseOrder?.discount ? parseFloat(purchaseOrder.discount) : 0,
        shipping_address: purchaseOrder?.shipping_address || purchaseOrderDefaults?.shipping_address || undefined,
        contact_person: purchaseOrder?.contact_person || purchaseOrderDefaults?.contact_person || undefined,
        contact_phone: purchaseOrder?.contact_phone || purchaseOrderDefaults?.contact_phone || undefined,
        payment_terms: purchaseOrder?.payment_terms || undefined,
        notes: purchaseOrder?.notes || undefined,
        internal_notes: purchaseOrder?.internal_notes || undefined,
        items: purchaseOrder?.items?.map(item => ({
            id: `item_${item.id}`,  // 使用数据库 ID 生成临时 ID
            dbId: item.id,  // 保存数据库 ID 用于更新
            item: item.item || null,
            sku: item.sku || '',
            item_name: item.item_name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price ? parseFloat(item.unit_price) : 0,
            quotation: item.quotation || null,
            expected_delivery: item.expected_delivery || null,
            notes: item.notes || ''
        })) || expandedPreloadItems || preloadItems?.map(item => ({
            item: item.item || null,
            sku: item.sku || '',
            item_name: item.item_name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            quotation: item.quotation_id || null,
            expected_delivery: null,
            notes: ''
        })),
    });
    
    // 标签配置
    const labels = {
        partner: '供应商',
        shipping: '收货',
        orderSection: '基本信息',
        shippingSection: '收货信息',
        feesSection: '费用信息',
        itemsSection: '订单明细',
        notesSection: '备注',
        partnerVisibleNote: '供应商可见',
        internalNote: '供应商不可见'
    };
    
    // 处理提交
    function handleSubmit(data: Record<string, unknown>) {
        onSubmit(data as unknown as PurchaseOrderCreateRequest);
    }
</script>

<OrderForm
    type="purchase"
    partnerId={supplierId}
    partnerName={supplier?.name || '加载中...'}
    {initialData}
    {quotationOptions}
    {loadingQuotations}
    {labels}
    {loading}
    {submitLabel}
    onSubmit={handleSubmit}
    {onCancel}
/>

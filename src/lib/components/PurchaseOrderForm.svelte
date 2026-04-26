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
    import OrderForm from './OrderForm.svelte';
    import { getCurrencySymbol } from '$lib/utils/formatters';
    import { processPreloadItems } from '$lib/utils/preloadItems';
    import { supplierAPI } from '$lib/api';
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
    
    // 变体拓展逻辑已提取至 $lib/utils/preloadItems
    
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

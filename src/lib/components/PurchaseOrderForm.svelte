<!-- 采购订单表单 -->
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
    import OrderForm from '$lib/components/OrderForm.svelte';
    import { getCurrencySymbol } from '$lib/utils/formatters';
    import { processPreloadItems, type PreloadItem } from '$lib/utils/preloadItems';
    import { buildInitialOrderItems } from '$lib/utils/orderFormData';
    import { supplierAPI } from '$lib/api';
    import { logger } from '$lib/logger';
    import { onMount } from 'svelte';
    
    interface Props {
        purchaseOrder?: PurchaseOrder;
        supplierId: number;
        supplier?: { id: number; name: string; contact_name?: string; phone?: string; email?: string; code?: string };
        preloadItems?: PreloadItem[] | null;
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
            logger.error('加载报价失败', err);
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
                let cancelled = false;
                (async () => {
                    const result = await processPreloadItems(preloadItems, quotations, preloadQuotationPrices);
                    if (!cancelled) expandedPreloadItems = result;
                })();
                return () => { cancelled = true; };
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
        items: buildInitialOrderItems(purchaseOrder?.items, expandedPreloadItems, preloadItems),
    });
    
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
    {loading}
    {submitLabel}
    onSubmit={handleSubmit}
    {onCancel}
/>

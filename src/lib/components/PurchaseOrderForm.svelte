<script lang="ts">
    /**
     * 采购订单表单 - 基于通用 OrderForm 组件
     */
    import type { 
        PurchaseOrder, 
        PurchaseOrderCreateRequest,
        QuotationBrief,
        SupplierBrief
    } from '$lib';
    import OrderForm from './OrderForm.svelte';
    import { supplierAPI } from '$lib/api';
    import { onMount } from 'svelte';
    
    interface Props {
        purchaseOrder?: PurchaseOrder;
        supplierId: number;
        supplier?: { id: number; name: string; contact?: string; telephone?: string; e_mail?: string; code?: string };
        preloadItems?: any[] | null;
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
        onSubmit, 
        onCancel, 
        submitLabel = '保存',
        loading = false
    }: Props = $props();
    
    // 供应商报价列表
    let quotations = $state<QuotationBrief[]>([]);
    let loadingQuotations = $state(false);
    
    // 转换为Svelecte选项格式
    const quotationOptions = $derived(quotations.map(q => ({
        value: q.id,
        label: `${q.sku || '-'} - ${q.item_name || '-'} (¥${q.price})`,
        quotation: q
    })));
    
    // 加载供应商报价
    async function loadQuotations() {
        loadingQuotations = true;
        try {
            const result = await supplierAPI.getQuotations(supplierId);
            quotations = result.quotations;
        } catch (err) {
            console.error('加载报价失败:', err);
        } finally {
            loadingQuotations = false;
        }
    }
    
    onMount(() => {
        loadQuotations();
    });
    
    // 准备初始数据
    const initialData = $derived({
        priority: purchaseOrder?.priority,
        order_date: purchaseOrder?.order_date,
        expected_delivery: purchaseOrder?.expected_delivery || undefined,
        tax_rate: purchaseOrder?.tax_rate ? parseFloat(purchaseOrder.tax_rate) : 0,
        shipping_cost: purchaseOrder?.shipping_cost ? parseFloat(purchaseOrder.shipping_cost) : 0,
        discount: purchaseOrder?.discount ? parseFloat(purchaseOrder.discount) : 0,
        shipping_address: purchaseOrder?.shipping_address || undefined,
        contact_person: purchaseOrder?.contact_person || undefined,
        contact_phone: purchaseOrder?.contact_phone || undefined,
        payment_terms: purchaseOrder?.payment_terms || undefined,
        notes: purchaseOrder?.notes || undefined,
        internal_notes: purchaseOrder?.internal_notes || undefined,
        items: preloadItems?.map(item => ({
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

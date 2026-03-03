<script lang="ts">
    /**
     * 销售订单表单 - 基于通用 OrderForm 组件
     */
    import type { 
        SalesOrder, 
        SalesOrderCreateRequest,
        CustomerQuotationBrief,
        Customer
    } from '$lib';
    import OrderForm from './OrderForm.svelte';
    import { customerAPI } from '$lib/api';
    import { onMount } from 'svelte';
    
    interface Props {
        salesOrder?: SalesOrder;
        customerId: number;
        customer?: Customer;
        preloadItems?: any[] | null;
        onSubmit: (data: SalesOrderCreateRequest) => void;
        onCancel: () => void;
        submitLabel?: string;
        loading?: boolean;
    }
    
    let { 
        salesOrder, 
        customerId,
        customer,
        preloadItems,
        onSubmit, 
        onCancel, 
        submitLabel = '保存',
        loading = false
    }: Props = $props();
    
    // 客户报价列表
    let quotations = $state<CustomerQuotationBrief[]>([]);
    let loadingQuotations = $state(false);
    
    // 转换为Svelecte选项格式
    const quotationOptions = $derived(quotations.map(q => ({
        value: q.id,
        label: `${q.sku || '-'} - ${q.item_name || '-'} (¥${q.price})`,
        quotation: q
    })));
    
    // 加载客户报价
    async function loadQuotations() {
        loadingQuotations = true;
        try {
            const result = await customerAPI.getQuotations(customerId);
            quotations = result.results || [];
        } catch (err) {
            console.error('加载报价失败:', err);
        } finally {
            loadingQuotations = false;
        }
    }
    
    onMount(() => {
        loadQuotations();
    });
    
    // 准备初始数据 - 优先从 salesOrder 读取，否则从 preloadItems 读取
    const initialData = $derived({
        priority: salesOrder?.priority,
        order_date: salesOrder?.order_date,
        expected_delivery: salesOrder?.expected_delivery || undefined,
        tax_rate: salesOrder?.tax_rate ? parseFloat(salesOrder.tax_rate) : 0,
        shipping_cost: salesOrder?.shipping_cost ? parseFloat(salesOrder.shipping_cost) : 0,
        discount: salesOrder?.discount ? parseFloat(salesOrder.discount) : 0,
        shipping_address: salesOrder?.shipping_address || undefined,
        contact_person: salesOrder?.contact_person || undefined,
        contact_phone: salesOrder?.contact_phone || undefined,
        payment_terms: salesOrder?.payment_terms || undefined,
        notes: salesOrder?.notes || undefined,
        internal_notes: salesOrder?.internal_notes || undefined,
        items: salesOrder?.items?.map(item => ({
            item: item.item || null,
            sku: item.sku || '',
            item_name: item.item_name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price ? parseFloat(item.unit_price) : 0,
            quotation: item.quotation || null,
            expected_delivery: item.expected_delivery || null,
            notes: item.notes || ''
        })) || preloadItems?.map(item => ({
            item: item.item || null,
            sku: item.sku || '',
            item_name: item.item_name || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            quotation: item.quotation_id || null,
            expected_delivery: null,
            notes: ''
        })) || [],
    });
    
    // 标签配置
    const labels = {
        partner: '客户',
        shipping: '收货',
        orderSection: '基本信息',
        shippingSection: '收货信息',
        feesSection: '费用信息',
        itemsSection: '订单明细',
        notesSection: '备注',
        partnerVisibleNote: '客户可见',
        internalNote: '客户不可见'
    };
    
    // 处理提交
    function handleSubmit(data: Record<string, unknown>) {
        onSubmit(data as unknown as SalesOrderCreateRequest);
    }
</script>

<OrderForm
    type="sales"
    partnerId={customerId}
    partnerName={customer?.name || '加载中...'}
    {initialData}
    {quotationOptions}
    {loadingQuotations}
    {labels}
    {loading}
    {submitLabel}
    onSubmit={handleSubmit}
    {onCancel}
/>

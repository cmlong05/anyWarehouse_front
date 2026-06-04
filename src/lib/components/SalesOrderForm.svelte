<!-- 销售订单表单 -->
<script lang="ts">
    /**
     * 销售订单表单 - 基于通用 OrderForm 组件
     */
    import type { 
        SalesOrder, 
        SalesOrderCreateRequest,
        CustomerQuotationBrief,
        Customer,
        OrderFormItem,
        CustomerAddress
    } from '$lib';
    import OrderForm from '$lib/components/OrderForm.svelte';
    import { getCurrencySymbol } from '$lib/utils/formatters';
    import { processPreloadItems, type PreloadItem } from '$lib/utils/preloadItems';
    import { buildInitialOrderItems } from '$lib/utils/orderFormData';
    import { customerAPI, customerAddressAPI } from '$lib/api';
    import { logger } from '$lib/logger';
    import { onMount } from 'svelte';
    
    interface Props {
        salesOrder?: SalesOrder;
        customerId: number;
        customer?: Customer;
        preloadItems?: PreloadItem[] | null;
        preloadQuotationPrices?: Record<string, { price: number; currency: string }> | null;
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
        preloadQuotationPrices,
        onSubmit, 
        onCancel, 
        submitLabel = '保存',
        loading = false
    }: Props = $props();
    
    // 客户报价列表
    let quotations = $state<CustomerQuotationBrief[]>([]);
    let loadingQuotations = $state(false);
    let shippingAddresses = $state<CustomerAddress[]>([]);
    let loadingShippingAddresses = $state(true);
    // 预加载并展开变体的订单项
    let expandedPreloadItems = $state<OrderFormItem[] | undefined>(undefined);
    // 标记是否已经处理过预加载数据（防止重复处理）
    let preloadProcessed = $state(false);
    
    // 获取货币符号
    
    // 转换为Svelecte选项格式
    const quotationOptions = $derived(quotations.map(q => ({
        value: q.id,
        label: `${q.item_sku || '-'} - ${q.item_name || '-'} (${getCurrencySymbol(q.currency)}${q.price})`,
        quotation: q
    })));
    
    // 加载客户报价
    async function loadQuotations() {
        loadingQuotations = true;
        try {
            const result = await customerAPI.getQuotations(customerId);
            quotations = result.quotations || [];
            
            // 如果有预加载数据，处理变体展开
            if (preloadItems && preloadItems.length > 0) {
                expandedPreloadItems = await processPreloadItems(preloadItems, quotations, preloadQuotationPrices);
            }
        } catch (err) {
            logger.error('加载报价失败', err);
        } finally {
            loadingQuotations = false;
        }
    }

    async function loadShippingAddresses() {
        loadingShippingAddresses = true;
        try {
            shippingAddresses = await customerAddressAPI.listAddresses({
                customer_id: customerId
            });
        } catch (err) {
            logger.error('加载客户地址失败', err);
            shippingAddresses = [];
        } finally {
            loadingShippingAddresses = false;
        }
    }

    function getDefaultShippingAddressId(addresses: CustomerAddress[]): number | null {
        const activeAddresses = addresses.filter((addr) => addr.status === 'ACTIVE');
        if (activeAddresses.length === 0) return null;

        const defaultAddress = activeAddresses.find((addr) => addr.is_default);
        return defaultAddress?.id ?? activeAddresses[0]?.id ?? null;
    }
    
    // 变体拓展逻辑已提取至 $lib/utils/preloadItems
    
    onMount(() => {
        loadQuotations();
        loadShippingAddresses();
    });
    
    // whenever quotations or preloadItems update we need to expand
    // the latter if necessary
    $effect(() => {
        if (preloadItems && preloadItems.length > 0 && quotations.length > 0 && !preloadProcessed) {
            let cancelled = false;
            (async () => {
                const result = await processPreloadItems(preloadItems, quotations, preloadQuotationPrices);
                if (!cancelled) {
                    expandedPreloadItems = result;
                    preloadProcessed = true;
                }
            })();
            return () => { cancelled = true; };
        }
    });
    
    // 准备初始数据 - 优先从 salesOrder 读取，否则从 expandedPreloadItems 读取
    const initialData = $derived({
        priority: salesOrder?.priority,
        order_date: salesOrder?.order_date,
        expected_delivery: salesOrder?.expected_delivery || undefined,
        tax_rate: salesOrder?.tax_rate ? parseFloat(salesOrder.tax_rate) : 0,
        shipping_cost: salesOrder?.shipping_cost ? parseFloat(salesOrder.shipping_cost) : 0,
        payment_fee: salesOrder?.payment_fee ? parseFloat(salesOrder.payment_fee) : 0,
        discount: salesOrder?.discount ? parseFloat(salesOrder.discount) : 0,
        adjustment: salesOrder?.adjustment ? parseFloat(salesOrder.adjustment) : 0,
        shipping_address: salesOrder?.shipping_address || undefined,
        contact_person: salesOrder?.contact_person || undefined,
        contact_phone: salesOrder?.contact_phone || undefined,
        company_name: salesOrder?.company_name ?? '',
        payment_terms: salesOrder?.payment_terms || undefined,
        notes: salesOrder?.notes || undefined,
        internal_notes: salesOrder?.internal_notes || undefined,
        items: buildInitialOrderItems(salesOrder?.items, expandedPreloadItems, preloadItems) || [],
    });

    const hasInitialShippingSnapshot = $derived(
        Boolean(
            salesOrder?.shipping_address ||
            salesOrder?.contact_person ||
            salesOrder?.contact_phone
        )
    );

    // 尝试将订单的地址快照匹配到客户地址列表中的某一条
    function findMatchingAddressId(addresses: CustomerAddress[]): number | null {
        if (!salesOrder) return null;
        const person = (salesOrder.contact_person || '').trim();
        const phone = (salesOrder.contact_phone || '').trim();
        if (!person && !phone) return null;

        const match = addresses.find((addr) => {
            const addrName = (addr.contact_name || '').trim();
            const addrPhone = (addr.phone || addr.mobile || '').trim();
            if (person && addrName && addrName !== person) return false;
            if (phone && addrPhone && addrPhone !== phone) return false;
            return Boolean(person || phone);
        });
        return match?.id ?? null;
    }

    const initialShippingAddressId = $derived(
        hasInitialShippingSnapshot
            ? findMatchingAddressId(shippingAddresses)
            : getDefaultShippingAddressId(shippingAddresses)
    );
    
    // 处理提交
    function handleSubmit(data: Record<string, unknown>) {
        onSubmit(data as unknown as SalesOrderCreateRequest);
    }
</script>

    <OrderForm
        type="sales"
        partnerId={customerId}
        partnerName={customer?.name || '加载中...'}
        currency={customer?.currency || 'USD'}
        {initialData}
        {shippingAddresses}
        {loadingShippingAddresses}
        enableShippingAddressSelection={true}
        {initialShippingAddressId}
        {quotationOptions}
        {loadingQuotations}
    {loading}
    {submitLabel}
    onSubmit={handleSubmit}
    {onCancel}
/>

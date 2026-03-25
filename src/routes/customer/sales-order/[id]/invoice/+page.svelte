<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { salesOrderAPI, systemSettingAPI } from '$lib/api';
    import type { SalesOrder } from '$lib';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import PrintOrderDocument from '$lib/components/PrintOrderDocument.svelte';
    import { localeStore } from '$lib/i18n/sales';

    let orderId = $derived(parseInt(page.params.id || '0'));
    let order = $state<SalesOrder | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    let invoiceDate = $state('');
    let paymentTerms = $state('T/T 30% deposit, 70% before shipment');
    let deliveryTerms = $state('FOB Shenzhen');
    let notes = $state('');
    let companyName = $state('Your Company Name');
    let companyAddress = $state('');

    const invoiceNo = $derived(order ? `INV-${order.order_number}` : '');
    const metaRows = $derived(order ? [
        { label: 'Invoice No.:', value: invoiceNo },
        { label: 'Date:', value: formatDate(invoiceDate) },
        { label: 'SO No.:', value: order.order_number },
    ] : []);

    onMount(async () => {
        invoiceDate = new Date().toISOString().split('T')[0];

        await loadDefaults();
        await loadOrder();
    });

    async function loadDefaults() {
        try {
            const defaults = await systemSettingAPI.getPIDefaults();
            companyName = defaults.company_name || companyName;
            companyAddress = defaults.company_address || companyAddress;
            paymentTerms = defaults.payment_terms || paymentTerms;
            deliveryTerms = defaults.delivery_terms || deliveryTerms;
            notes = defaults.notes || notes;
        } catch {
            // 读取失败时使用内置默认值
        }
    }

    async function loadOrder() {
        loading = true;
        error = null;
        try {
            order = await salesOrderAPI.get(orderId);
        } catch (err) {
            error = err instanceof Error ? err.message : '加载失败';
        } finally {
            loading = false;
        }
    }

    function formatDate(dateStr: string): string {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-CN');
    }
</script>

<div class="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
    {#if loading}
        <Loading />
    {:else if error}
        <Alert {error} onDismiss={() => error = null} />
        <div class="mt-4 text-center">
            <button class="px-4 py-2 bg-gray-500 text-white rounded-lg" onclick={() => goto(`/customer/sales-order/${orderId}`)}>
                返回
            </button>
        </div>
    {:else if order}
        <PrintOrderDocument
            {order}
            {companyName}
            {companyAddress}
            {paymentTerms}
            {deliveryTerms}
            {notes}
            title="INVOICE"
            {metaRows}
            showCustomerSignature={false}
            locale={$localeStore}
            onBack={() => goto(`/customer/sales-order/${orderId}`)}
            onPrint={() => window.print()}
        />
    {/if}
</div>

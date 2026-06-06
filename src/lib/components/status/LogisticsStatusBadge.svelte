<!-- 物流状态徽标 -->
<!--
被依赖：
- `lib/components/order/OrderPaymentRecords.svelte`
- `lib/components/forms/PackageForm.svelte`
- `lib/components/forms/ShipmentForm.svelte`
- `lib/components/index.ts`
- `lib/components/order/ShipReceiveModal.svelte`
- `lib/components/partner/OrdersSection.svelte`
- `lib/components/partner/QuotationsSection.svelte`
- `lib/components/shipment/TrackingNumberDetailModal.svelte`
- `lib/components/status/index.ts`
- `routes/customer/+page.svelte`
- `routes/customer/[id]/+page.svelte`
- `routes/customer/[id]/edit/+page.svelte`
- `routes/customer/add/+page.svelte`
- `routes/customer/package/+page.svelte`
- `routes/customer/package/[id]/+page.svelte`
- `routes/customer/quotation/[id]/+page.svelte`
- `routes/customer/quotation/[id]/edit/+page.svelte`
- `routes/customer/quotation/add/+page.svelte`
- `routes/customer/sales-order/+page.svelte`
- `routes/customer/sales-order/[id]/+page.svelte`
- `routes/customer/sales-order/[id]/edit/+page.svelte`
- `routes/customer/sales-order/add/+page.svelte`
- `routes/customer/shipment/+page.svelte`
- `routes/customer/shipment/[id]/+page.svelte`
- `routes/customer/shipment/[id]/edit/+page.svelte`
- `routes/customer/shipment/tracking-number/+page.svelte`
- `routes/item/[slug]/edit/+page.svelte`
- `routes/settings/address/+page.svelte`
- `routes/settings/aliexpress/+page.svelte`
- `routes/settings/pi/+page.svelte`
- `routes/storage/movement/+page.svelte`
- `routes/storage/movement/add/+page.svelte`
- `routes/supplier/+page.svelte`
- `routes/supplier/[slug]/+page.svelte`
- `routes/supplier/[slug]/edit/+page.svelte`
- `routes/supplier/add/+page.svelte`
- `routes/supplier/purchase-order/+page.svelte`
- `routes/supplier/purchase-order/[id]/+page.svelte`
- `routes/supplier/purchase-order/add/+page.svelte`
- `routes/supplier/purchase-order/edit/+page.svelte`
- `routes/supplier/quotation/[id]/+page.svelte`
- `routes/supplier/quotation/[id]/edit/+page.svelte`
- `routes/supplier/quotation/add/+page.svelte`
-->
<script lang="ts">
    export let status: string;

    const statusMap: Record<string, { label: string; classes: string }> = {
        pending: { label: '待揽收', classes: 'bg-gray-100 text-gray-600' },
        collected: { label: '已揽收', classes: 'bg-blue-100 text-blue-700' },
        in_transit: { label: '运输中', classes: 'bg-indigo-100 text-indigo-700' },
        exception: { label: '异常', classes: 'bg-yellow-100 text-yellow-700' },
        delivered: { label: '已签收', classes: 'bg-green-100 text-green-700' },
        returned: { label: '已退回', classes: 'bg-orange-100 text-orange-700' },
        cancelled: { label: '已作废', classes: 'bg-red-100 text-red-600' },
    };

    const config = statusMap[status] || { label: status, classes: 'bg-gray-100 text-gray-500' };
</script>

<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {config.classes}">
    {config.label}
</span>
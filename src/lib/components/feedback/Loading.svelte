<!-- 加载 -->
<!--
被依赖：
- `lib/components/order/OrderPaymentRecords.svelte`
- `lib/components/forms/PackageForm.svelte`
- `lib/components/forms/ShipmentForm.svelte`
- `lib/components/feedback/index.ts`
- `lib/components/index.ts`
- `lib/components/order/ShipReceiveModal.svelte`
- `lib/components/partner/OrdersSection.svelte`
- `lib/components/partner/QuotationsSection.svelte`
- `lib/components/shipment/TrackingNumberDetailModal.svelte`
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
    interface Props {
        size?: 'small' | 'medium' | 'large';
        text?: string;
        inline?: boolean;
    }
    
    let { 
        size = 'medium',
        text = '加载中...',
        inline = false
    }: Props = $props();
    
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };
</script>

<div class="flex items-center justify-center gap-3 {inline ? 'flex-row p-2' : 'flex-col p-8'}">
    <div class="{sizeClasses[size]} rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin"></div>
    {#if text}
        <span class="text-gray-500 text-sm">{text}</span>
    {/if}
</div>
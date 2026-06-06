<!-- 面包屑 -->
<!--
被依赖：
- `lib/components/OrderPaymentRecords.svelte`
- `lib/components/PackageForm.svelte`
- `lib/components/ShipmentForm.svelte`
- `lib/components/index.ts`
- `lib/components/navigation/index.ts`
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
    interface BreadcrumbItem {
        label: string;
        href?: string;
    }
    
    interface Props {
        items: BreadcrumbItem[];
    }
    
        let { items }: Props = $props();
</script>

<nav class="mt-2 mb-2 text-sm" aria-label="Breadcrumb">
    <ol class="flex items-center gap-2 list-none m-0 p-0">
        {#each items as item, i}
            <li class="flex items-center gap-2">
                {#if item.href}
                    <a href={item.href} class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                        {item.label}
                    </a>
                {:else}
                    <span class="text-gray-500 font-medium" aria-current="page">
                        {item.label}
                    </span>
                {/if}
                {#if i < items.length - 1}
                    <span class="text-gray-500 mx-1" aria-hidden="true">&gt;</span>
                {/if}
            </li>
        {/each}
    </ol>
</nav>
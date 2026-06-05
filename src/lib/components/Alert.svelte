<!-- 提示 -->
<!--
被依赖：
- `lib/components/PackageForm.svelte`
- `lib/components/ShipmentForm.svelte`
- `lib/components/order/ShipReceiveModal.svelte`
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
- `routes/customer/shipment/tracking-number/+page.svelte`
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
    export interface ErrorInfo {
        message: string;
        code?: string;
        details?: string;
    }
    
    interface Props {
        error?: ErrorInfo | string | null;
        onDismiss?: () => void;
        variant?: 'error' | 'warning' | 'info';
    }
    
    let { 
        error, 
        onDismiss,
        variant = 'error'
    }: Props = $props();
    
    const errorMessage = $derived(typeof error === 'string' ? error : error?.message);
    const errorDetails = $derived(typeof error === 'object' ? error?.details : undefined);
    
    const variantClasses = {
        error: 'bg-red-50 border-red-200 text-red-600',
        warning: 'bg-amber-50 border-amber-200 text-amber-600',
        info: 'bg-blue-50 border-blue-200 text-blue-600'
    };
</script>

{#if error && errorMessage}
    <div class="p-4 mb-4 rounded-md border {variantClasses[variant]}" role="alert">
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 text-xl">
                {#if variant === 'error'}
                    ⚠️
                {:else if variant === 'warning'}
                    ⚠️
                {:else}
                    ℹ️
                {/if}
            </div>
            <div class="flex-1">
                <div class="font-medium">{errorMessage}</div>
                {#if errorDetails}
                    <div class="mt-1 text-sm opacity-80">{errorDetails}</div>
                {/if}
            </div>
            {#if onDismiss}
                <button 
                    type="button" 
                    class="flex-shrink-0 text-xl opacity-60 hover:opacity-100 transition-opacity" 
                    onclick={onDismiss}
                    aria-label="关闭"
                >
                    ✕
                </button>
            {/if}
        </div>
    </div>
{/if}
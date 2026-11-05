<!-- 确认弹窗 -->
<!--
被依赖：
- `lib/components/order/OrderPaymentRecords.svelte`
- `lib/components/forms/PackageForm.svelte`
- `lib/components/forms/ShipmentForm.svelte`
- `lib/components/index.ts`
- `lib/components/modal/index.ts`
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
    import { BaseModal } from '$lib/components/modal';

    interface Props {
        isOpen?: boolean;
        title?: string;
        message?: string;
        itemName?: string;
        confirmText?: string;
        cancelText?: string;
        loading?: boolean;
        onConfirm?: () => void;
        onCancel?: () => void;
    }
    
    let {
        isOpen = false,
        title = '确认删除',
        message = '确定要删除以下项目吗？此操作不可撤销。',
        itemName = '',
        confirmText = '删除',
        cancelText = '取消',
        loading = false,
        onConfirm,
        onCancel
    }: Props = $props();
    
    function handleConfirm() {
        onConfirm?.();
    }
    
    function handleCancel() {
        onCancel?.();
    }
</script>

<BaseModal
    open={isOpen}
    {title}
    size="sm"
    busy={loading}
    onClose={handleCancel}
>
    <div class="px-6 py-8 text-center">
        <div class="mb-4 text-5xl">⚠️</div>
        <p class="mb-3 whitespace-pre-line break-words leading-relaxed text-gray-600">{message}</p>
        {#if itemName}
            <p class="text-lg font-semibold break-words text-gray-900">"{itemName}"</p>
        {/if}
    </div>

    {#snippet footer()}
        <div class="flex justify-end gap-3 px-6 py-4">
            <button
                class="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                onclick={handleCancel}
                disabled={loading}
            >
                {cancelText}
            </button>
            <button
                class="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                onclick={handleConfirm}
                disabled={loading}
            >
                {#if loading}
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                    删除中...
                {:else}
                    {confirmText}
                {/if}
            </button>
        </div>
    {/snippet}
</BaseModal>

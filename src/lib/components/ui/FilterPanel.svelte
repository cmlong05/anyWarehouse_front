<!-- 筛选面板 -->
<!--
被依赖：
- `lib/components/item/AttributeManager.svelte`
- `lib/components/forms/CategoryForm.svelte`
- `lib/components/forms/ContainerForm.svelte`
- `lib/components/forms/CustomerForm.svelte`
- `lib/components/forms/ItemForm.svelte`
- `lib/components/order/OrderForm.svelte`
- `lib/components/forms/PackageForm.svelte`
- `lib/components/quotation/QuotationLinesTable.svelte`
- `lib/components/quotation/QuotationPriceCard.svelte`
- `lib/components/forms/StorageForm.svelte`
- `lib/components/forms/SupplierForm.svelte`
- `lib/components/item/VariantCreator.svelte`
- `lib/components/item/VariantQuotationManager.svelte`
- `lib/components/bom/AddComponentForm.svelte`
- `lib/components/bom/ComponentList.svelte`
- `lib/components/item/ItemInventoryTab.svelte`
- `lib/components/item/TransferConfirmModal.svelte`
- `lib/components/order/OrderFormItemsSection.svelte`
- `lib/components/order/ShipReceiveModal.svelte`
- `lib/components/partner/PartyForm.svelte`
- `lib/components/partner/QuotationsSection.svelte`
- `lib/components/shipment-form/PlanItemsList.svelte`
- `lib/components/ui/index.ts`
- `lib/index.ts`
- `routes/container/[slug]/+page.svelte`
- `routes/customer/+page.svelte`
- `routes/customer/package/+page.svelte`
- `routes/customer/sales-order/+page.svelte`
- `routes/customer/shipment/+page.svelte`
- `routes/item/+page.svelte`
- `routes/supplier/+page.svelte`
- `routes/supplier/purchase-order/+page.svelte`
-->
<script lang="ts">
    /**
     * 通用筛选面板组件 - TailwindCSS 版本
     */
    import type { Snippet } from 'svelte';
    
    interface Props {
        children: Snippet;
        onApply?: () => void;
        onReset?: () => void;
        applyText?: string;
        resetText?: string;
        showActions?: boolean;
    }
    
    let {
        children,
        onApply,
        onReset,
        applyText = '应用筛选',
        resetText = '重置',
        showActions = true
    }: Props = $props();
</script>

<div class="bg-gray-50 p-4 rounded-lg mb-6">
    <div class="flex flex-wrap items-end gap-4">
        {@render children()}
        
        {#if showActions}
            <div class="flex gap-2">
                {#if onReset}
                    <button 
                        type="button"
                        class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        onclick={onReset}
                    >
                        {resetText}
                    </button>
                {/if}
                {#if onApply}
                    <button 
                        type="button"
                        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        onclick={onApply}
                    >
                        {applyText}
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>
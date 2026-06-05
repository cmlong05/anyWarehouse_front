<!-- 表单字段 -->
<!--
被依赖：
- `lib/components/AttributeManager.svelte`
- `lib/components/CategoryForm.svelte`
- `lib/components/ContainerForm.svelte`
- `lib/components/CustomerForm.svelte`
- `lib/components/ItemForm.svelte`
- `lib/components/OrderForm.svelte`
- `lib/components/PackageForm.svelte`
- `lib/components/QuotationLinesTable.svelte`
- `lib/components/QuotationPriceCard.svelte`
- `lib/components/StorageForm.svelte`
- `lib/components/SupplierForm.svelte`
- `lib/components/VariantCreator.svelte`
- `lib/components/VariantQuotationManager.svelte`
- `lib/components/bom/AddComponentForm.svelte`
- `lib/components/bom/ComponentList.svelte`
- `lib/components/item/ItemInventoryTab.svelte`
- `lib/components/item/TransferConfirmModal.svelte`
- `lib/components/order/OrderFormItemsSection.svelte`
- `lib/components/order/ShipReceiveModal.svelte`
- `lib/components/partner/PartyForm.svelte`
- `lib/components/partner/QuotationsSection.svelte`
- `lib/components/shipment-form/PlanItemsList.svelte`
- `lib/components/ui/FormInput.svelte`
- `lib/components/ui/FormSelect.svelte`
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
     * 通用表单字段组件
     * 提供标签、错误提示和统一样式的包装
     */
    interface Props {
        label: string;
        for?: string;
        required?: boolean;
        error?: string;
        fullWidth?: boolean;
        class?: string;
        children?: import('svelte').Snippet;
    }
    
    let { 
        label, 
        for: htmlFor,
        required = false,
        error = '',
        fullWidth = false,
        class: className = '',
        children
    }: Props = $props();
</script>

<div class="flex flex-col gap-1 {className}" class:col-span-full={fullWidth}>
    <label for={htmlFor} class="text-sm font-medium text-gray-700">
        {label}
        {#if required}
            <span class="text-red-600 ml-1">*</span>
        {/if}
    </label>
    <div class={error ? '[&_input]:border-red-600 [&_input]:focus:border-red-600 [&_input]:focus:ring-2 [&_input]:focus:ring-red-600/20 [&_select]:border-red-600 [&_select]:focus:border-red-600 [&_select]:focus:ring-2 [&_select]:focus:ring-red-600/20 [&_textarea]:border-red-600 [&_textarea]:focus:border-red-600 [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-red-600/20' : ''}>
        {@render children?.()}
    </div>
    {#if error}
        <span class="text-red-600 text-xs mt-1">{error}</span>
    {/if}
</div>
<!-- 币种选择器 -->
<!--
被依赖：
- `lib/components/item/AttributeManager.svelte`
- `lib/components/ui/BulkEditTable.svelte`
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
    interface Props {
        value?: string;
        id?: string;
        onchange?: (value: string) => void;
    }
    
    let {
        value = $bindable('CNY'),
        id = 'currency',
        onchange
    }: Props = $props();
    
    const currencies = [
        { code: 'CNY', name: 'CNY' },
        { code: 'USD', name: 'USD' },
        { code: 'EUR', name: 'EUR' },
        { code: 'GBP', name: 'GBP' },
        { code: 'JPY', name: 'JPY' },
    ];
    
    function handleChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        value = target.value;
        onchange?.(value);
    }
</script>

<select
    {id}
    bind:value
    onchange={handleChange}
    class="w-20 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
>
    {#each currencies as currency}
        <option value={currency.code}>{currency.name}</option>
    {/each}
</select>
<!-- 可排序标题区 -->
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
- `lib/components/ui/DataTable.svelte`
- `lib/components/ui/index.ts`
- `lib/index.ts`
- `routes/container/[slug]/+page.svelte`
- `routes/customer/+page.svelte`
- `routes/customer/package/+page.svelte`
- `routes/customer/sales-order/+page.svelte`
- `routes/customer/shipment/+page.svelte`
- `routes/customer/shipment/[id]/+page.svelte`
- `routes/item/+page.svelte`
- `routes/supplier/+page.svelte`
- `routes/supplier/purchase-order/+page.svelte`
-->
<script lang="ts">
    export interface Props {
        title: string;
        columnKey: string;
        sortable?: boolean;
        sortKey?: string;
        sortDirection?: 'asc' | 'desc';
        onSort?: (key: string) => void;
        align?: 'left' | 'center' | 'right';
        headerClass?: string;
        width?: string;
    }

    let {
        title,
        columnKey,
        sortable = false,
        sortKey,
        sortDirection = 'asc',
        onSort,
        align = 'left',
        headerClass = '',
        width
    }: Props = $props();

    function getIndicator(): string {
        return sortKey === columnKey ? (sortDirection === 'asc' ? '▲' : '▼') : '↕';
    }

    function handleClick() {
        if (sortable && onSort) {
            onSort(columnKey);
        }
    }
</script>

<th
    class={[
        'p-3',
        'text-gray-700',
        'font-semibold',
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
        sortable && onSort ? 'cursor-pointer' : '',
        headerClass
    ].join(' ')}
    style:width={width}
    onclick={handleClick}
>
    <div class="flex items-center gap-1">
        <span>{title}</span>
        {#if sortable && onSort}
            <span class="text-xs text-gray-500">{getIndicator()}</span>
        {/if}
    </div>
</th>
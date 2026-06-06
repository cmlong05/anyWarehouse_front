<!-- 表单输入框 -->
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
     * 通用文本输入组件
     */
    import FormField from './FormField.svelte';
    
    interface Props {
        // 字段配置
        label: string;
        name: string;
        required?: boolean;
        error?: string;
        fullWidth?: boolean;
        
        // 输入配置
        type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'date';
        value: string | number;
        placeholder?: string;
        disabled?: boolean;
        
        // 验证
        min?: number;
        max?: number;
        step?: number;
        pattern?: string;
        maxlength?: number;
        
        // 事件
        onchange?: (value: string) => void;
        oninput?: (value: string) => void;
        onblur?: () => void;
    }
    
    let { 
        label,
        name,
        required = false,
        error = '',
        fullWidth = false,
        type = 'text',
        value,
        placeholder = '',
        disabled = false,
        min,
        max,
        step,
        pattern,
        maxlength,
        onchange,
        oninput,
        onblur
    }: Props = $props();
    
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        oninput?.(target.value);
    }
    
    function handleChange(e: Event) {
        const target = e.target as HTMLInputElement;
        onchange?.(target.value);
    }
</script>

<FormField {label} for={name} {required} {error} {fullWidth}>
    <input
        {type}
        id={name}
        {name}
        {value}
        {placeholder}
        {disabled}
        {min}
        {max}
        {step}
        {pattern}
        {maxlength}
        oninput={handleInput}
        onchange={handleChange}
        onblur={onblur}
        class="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm transition-all duration-150 ease-in-out focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 placeholder:text-gray-400"
    />
</FormField>
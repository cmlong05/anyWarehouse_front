<!-- 数字步进器 -->
<!--
被依赖：
- `lib/components/AttributeManager.svelte`
- `lib/components/BulkEditTable.svelte`
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
        id?: string;
        name?: string;
        value?: number | null | undefined;
        min?: number;
        max?: number;
        step?: number;
        decimalPlaces?: number;
        placeholder?: string;
        disabled?: boolean;
        size?: 'sm' | 'md' | 'lg';
        class?: string;
        onchange?: (value: number | null | undefined) => void;
    }
    
    let {
        id,
        name,
        value = $bindable(undefined),
        min = 0,
        max,
        step = 1,
        decimalPlaces = 2,
        placeholder = '-',
        disabled = false,
        size = 'md',
        class: className = '',
        onchange,
    }: Props = $props();
    
    const sizeClass = $derived({
        sm: 'stepper-sm',
        md: '',
        lg: 'stepper-lg',
    }[size]);
    
    // 输入框的显示值（允许临时编辑）
    let inputValue = $state('');
    // 是否正在编辑
    let isEditing = $state(false);
    
    // 格式化值用于显示
    function formatValue(val: number | null | undefined): string {
        if (val === undefined || val === null) return '';
        return Number(val).toFixed(decimalPlaces);
    }

    // Sync display from value (non-editing state)
    $effect(() => {
        if (!isEditing) {
            inputValue = formatValue(value);
        }
    });
    
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const rawValue = target.value;
        inputValue = rawValue;
        
        const val = rawValue === '' ? null : parseFloat(rawValue);
        value = val;
        onchange?.(val);
    }
    
    function handleFocus() {
        isEditing = true;
        // 聚焦时，如果有值，移除末尾的0，方便编辑
        if (value !== undefined && value !== null) {
            inputValue = String(value);
        }
    }
    
    function handleBlur() {
        isEditing = false;
        // 失焦时格式化
        inputValue = formatValue(value);
    }
    
    function handleWheel(e: WheelEvent) {
        // 只有在编辑状态（聚焦）时才响应滚轮
        if (!isEditing) return;
        e.preventDefault();
        if (disabled) return;
        if (e.deltaY < 0) {
            increment();
        } else {
            decrement();
        }
    }
    
    function decrement() {
        if (disabled) return;
        const current = value ?? 0;
        const newVal = current - step;
        if (newVal < min) return;
        value = newVal;
        onchange?.(newVal);
        inputValue = formatValue(newVal);
    }
    
    function increment() {
        if (disabled) return;
        const current = value ?? 0;
        const newVal = current + step;
        if (max !== undefined && newVal > max) return;
        value = newVal;
        onchange?.(newVal);
        inputValue = formatValue(newVal);
    }
</script>

<div class="number-stepper {sizeClass} {className}" class:disabled>
    <button 
        type="button" 
        class="stepper-btn stepper-minus"
        {disabled}
        onclick={decrement}
        aria-label="减少"
    >
        −
    </button>
    <input
        {id}
        {name}
        type="number"
        class="stepper-input"
        value={inputValue}
        {min}
        {max}
        step="any"
        {placeholder}
        {disabled}
        oninput={handleInput}
        onfocus={handleFocus}
        onblur={handleBlur}
        onwheel={handleWheel}
    />
    <button 
        type="button" 
        class="stepper-btn stepper-plus"
        {disabled}
        onclick={increment}
        aria-label="增加"
    >
        +
    </button>
</div>
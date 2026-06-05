<!-- 供应商表单 -->
<!--
被依赖：
- `routes/supplier/[slug]/edit/+page.svelte`
- `routes/supplier/add/+page.svelte`
-->
<script lang="ts">
    import PartyForm from '$lib/components/partner/PartyForm.svelte';
    import { supplierSchema, type SupplierFormData } from '$lib/schemas';

    interface Props {
        supplier?: Partial<SupplierFormData>;
        onSubmit: (data: SupplierFormData) => void;
        onCancel: () => void;
        onDelete?: () => void;
        submitLabel?: string;
        deleteLabel?: string;
        loading?: boolean;
    }
    
    let { 
        supplier, 
        onSubmit, 
        onCancel, 
        onDelete,
        submitLabel = '保存',
        deleteLabel = '删除供应商',
        loading = false
    }: Props = $props();

    import { CurrencySelect } from '$lib/components/ui';

    let currency: string = $state('CNY');

    $effect(() => {
        currency = supplier?.currency || 'CNY';
    });

    const cleanInitial = $derived({ ...supplier });

    function handlePartySubmit(data: Record<string, unknown>) {
        onSubmit({ ...data, currency } as SupplierFormData);
    }
</script>

{#snippet extras()}
    <div>
        <label for="supplier-currency" class="block text-sm font-medium text-gray-700 mb-1">货币</label>
        <CurrencySelect id="supplier-currency" value={currency} onchange={(v) => currency = v} />
    </div>
{/snippet}

<PartyForm
    onSubmit={handlePartySubmit}
    {onCancel}
    {onDelete}
    initialData={cleanInitial}
    schema={supplierSchema}
    {submitLabel}
    {deleteLabel}
    {loading}
    showIsActive={true}
    {extras}
/>
<script lang="ts">
    import PartyForm from '$lib/components/partner/PartyForm.svelte';
    import { supplierSchema, type SupplierFormData } from '$lib/schemas';

    interface Props {
        supplier?: Partial<SupplierFormData>;
        onSubmit: (data: SupplierFormData) => void;
        onCancel: () => void;
        submitLabel?: string;
        loading?: boolean;
    }
    
    let { 
        supplier, 
        onSubmit, 
        onCancel, 
        submitLabel = '保存',
        loading = false
    }: Props = $props();

    import { CurrencySelect } from '$lib/components/ui';

    let currency: string = $state('CNY');

    $effect(() => {
        currency = supplier?.currency || 'CNY';
    });

    const cleanInitial = $derived({ ...supplier });

    function handlePartySubmit(data: any) {
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
    initialData={cleanInitial}
    schema={supplierSchema}
    {submitLabel}
    {loading}
    showIsActive={true}
    {extras}
/>

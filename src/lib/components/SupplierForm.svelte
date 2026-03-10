<script lang="ts">
    import PartyForm from '$lib/components/partner/PartyForm.svelte';
    import { supplierSchema, type SupplierFormData } from '$lib/schemas';

    interface Props {
        supplier?: SupplierFormData;
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

    function handleSubmit(data: any) {
        onSubmit(data as SupplierFormData);
    }
</script>

<PartyForm
    {onSubmit}
    {onCancel}
    initialData={supplier || {}}
    schema={supplierSchema}
    {submitLabel}
    {loading}
    showIsActive={true}
/>

<script lang="ts">
    import PartyForm from '$lib/components/partner/PartyForm.svelte';
    import { customerSchema, type CustomerFormData } from '$lib/schemas';
    import { FormSelect } from '$lib/components/ui';

    interface Props {
        onSubmit: (data: CustomerFormData) => void;
        onCancel: () => void;
        initialData?: Partial<CustomerFormData>;
        submitLabel?: string;
        loading?: boolean;
    }
    
    let { 
        onSubmit, 
        onCancel, 
        initialData = {},
        submitLabel = '保存',
        loading = false 
    }: Props = $props();

    // extras state
    let level: 'VIP' | 'NORMAL' | 'TEMP' = $state('NORMAL');
    let status: 'ACTIVE' | 'INACTIVE' = $state('ACTIVE');
    
    // 当 initialData 变化时更新状态
    $effect(() => {
        level = initialData.level || 'NORMAL';
        status = initialData.status || 'ACTIVE';
    });

    // initialData without extras for PartyForm
    const cleanInitial: Partial<CustomerFormData> = $derived({ ...initialData });
    $effect(() => {
        delete cleanInitial.level;
        delete cleanInitial.status;
    });

    const levelOptions = [
        { value: 'VIP', label: 'VIP客户' },
        { value: 'NORMAL', label: '普通客户' },
        { value: 'TEMP', label: '临时客户' }
    ];
    
    const statusOptions = [
        { value: 'ACTIVE', label: '活跃' },
        { value: 'INACTIVE', label: '停用' }
    ];

    function handlePartySubmit(data: any) {
        onSubmit({ ...data, level, status } as CustomerFormData);
    }
</script>

{#snippet extras()}
    <FormSelect
        label="客户等级"
        name="level"
        options={levelOptions}
        value={level}
        disabled={loading}
        onchange={(v) => level = v as 'VIP' | 'NORMAL' | 'TEMP'}
    />

    <FormSelect
        label="状态"
        name="status"
        options={statusOptions}
        value={status}
        disabled={loading}
        onchange={(v) => status = v as 'ACTIVE' | 'INACTIVE'}
    />
{/snippet}

<PartyForm
    onSubmit={handlePartySubmit}
    {onCancel}
    initialData={cleanInitial}
    schema={customerSchema}
    {submitLabel}
    {loading}
    showIsActive={false}
    {extras}
/>

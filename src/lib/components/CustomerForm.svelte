<script lang="ts">
    import PartyForm from '$lib/components/partner/PartyForm.svelte';
    import { customerSchema, type CustomerFormData } from '$lib/schemas';
    import { FormSelect } from '$lib/components/ui';
    import { CurrencySelect } from '$lib/components/ui';

    interface Props {
        onSubmit: (data: CustomerFormData) => void;
        onCancel: () => void;
        onDelete?: () => void;
        initialData?: Partial<CustomerFormData>;
        submitLabel?: string;
        deleteLabel?: string;
        loading?: boolean;
    }
    
    let { 
        onSubmit, 
        onCancel, 
        onDelete,
        initialData = {},
        submitLabel = '保存',
        deleteLabel = '删除客户',
        loading = false 
    }: Props = $props();

    // extras state
    let level: 'VIP' | 'NORMAL' | 'TEMP' = $state('NORMAL');
    let status: 'ACTIVE' | 'INACTIVE' = $state('ACTIVE');
    let currency: string = $state('USD');
    
    // 当 initialData 变化时更新状态
    $effect(() => {
        level = initialData.level || 'NORMAL';
        status = initialData.status || 'ACTIVE';
        currency = initialData.currency || 'USD';
    });

    // initialData without extras for PartyForm
    const cleanInitial: Partial<CustomerFormData> = $derived({ ...initialData });
    $effect(() => {
        delete cleanInitial.level;
        delete cleanInitial.status;
        delete cleanInitial.currency;
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

    function handlePartySubmit(data: Record<string, unknown>) {
        onSubmit({ ...data, level, status, currency } as CustomerFormData);
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

    <div>
        <label for="customer-currency" class="block text-sm font-medium text-gray-700 mb-1">货币</label>
        <CurrencySelect id="customer-currency" value={currency} onchange={(v) => currency = v} />
    </div>
{/snippet}

<PartyForm
    onSubmit={handlePartySubmit}
    {onCancel}
    {onDelete}
    initialData={cleanInitial}
    schema={customerSchema}
    {submitLabel}
    {deleteLabel}
    {loading}
    showIsActive={false}
    {extras}
/>

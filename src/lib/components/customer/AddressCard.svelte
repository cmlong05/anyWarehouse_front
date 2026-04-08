<script lang="ts">
    import type { CustomerAddress } from '$lib';

    interface InfoRow {
        label: string;
        value?: string;
        className: string;
    }

    interface Props {
        addr: CustomerAddress;
        onSetDefault: (addr: CustomerAddress) => void;
        onEdit: (addr: CustomerAddress) => void;
        onDelete: (id: number) => void;
    }

    let { addr, onSetDefault, onEdit, onDelete }: Props = $props();

    function formatAddress(address: CustomerAddress): string {
        return [
            address.country,
            address.province,
            address.city,
            address.district,
            address.detail_address,
            address.detail_address2,
        ]
            .filter(Boolean)
            .join(' ');
    }

    const contactParts = $derived.by(() => [addr.contact_name, addr.phone, addr.mobile].filter(Boolean));

    const infoRows = $derived.by<InfoRow[]>(() => [
        { label: '', value: addr.email, className: 'text-gray-400' },
        { label: '税号', value: addr.tax_number, className: 'text-gray-400' },
        { label: '', value: formatAddress(addr), className: 'text-gray-700' },
        { label: '邮编', value: addr.postal_code, className: 'text-gray-400' },
        { label: '备注', value: addr.remark, className: 'text-gray-500' },
    ]);
</script>

<div class="border rounded-lg p-3 {addr.is_default ? 'border-green-300 bg-green-50/30' : 'border-gray-200 bg-white'}">
    <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2 flex-wrap">
            {#if addr.is_default}
                <span class="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">默认</span>
            {/if}
            {#if addr.status === 'INACTIVE'}
                <span class="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">停用</span>
            {/if}
        </div>
        <div class="flex items-center gap-2 shrink-0">
            {#if !addr.is_default}
                <button onclick={() => onSetDefault(addr)} class="text-xs text-blue-500 hover:text-blue-700">设为默认</button>
            {/if}
            <button onclick={() => onEdit(addr)} class="text-xs text-gray-500 hover:text-gray-700">编辑</button>
            <button onclick={() => onDelete(addr.id)} class="text-xs text-red-400 hover:text-red-600">删除</button>
        </div>
    </div>

    <div class="mt-1.5 space-y-0.5 text-xs text-gray-600">
        {#if contactParts.length > 0}
            <div class="flex items-center gap-2">
                {#each contactParts as part, index}
                    <span class={index === 0 ? '' : 'text-gray-400'}>{part}</span>
                {/each}
            </div>
        {/if}

        {#each infoRows as row}
            {#if row.value}
                <div class={row.className}>{row.label ? `${row.label}：${row.value}` : row.value}</div>
            {/if}
        {/each}
    </div>
</div>

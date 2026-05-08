<script lang="ts">
    import type { CustomerAddress } from '$lib';
    import { formatAddressLocationLine, formatAddressPostalLine } from '$lib/utils';

    interface Props {
        addr: CustomerAddress;
        onSetDefault: (addr: CustomerAddress) => void;
        onEdit: (addr: CustomerAddress) => void;
        onDelete: (id: number) => void;
    }

    let { addr, onSetDefault, onEdit, onDelete }: Props = $props();

    const contactName = $derived.by(() => addr.contact_name || '');
    const contactPhoneLine = $derived.by(() => [addr.phone, addr.mobile].filter(Boolean).join(' / '));

    const locationLine = $derived.by(() => formatAddressLocationLine(addr));
    const postalLine = $derived.by(() => formatAddressPostalLine(addr));

    const detailAddressLines = $derived.by(() => [addr.detail_address, addr.detail_address2].filter(Boolean));
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
        {#if addr.company}
            <div class="text-gray-700 font-medium">{addr.company}</div>
        {/if}

        {#if contactName}
            <div class="text-gray-700">{contactName}</div>
        {/if}

        {#if contactPhoneLine}
            <div class="text-gray-500">{contactPhoneLine}</div>
        {/if}

        {#if addr.email}
            <div class="text-gray-400">{addr.email}</div>
        {/if}

        {#each detailAddressLines as line}
            <div class="text-gray-700">{line}</div>
        {/each}

        {#if locationLine}
            <div class="text-gray-700">{locationLine}</div>
        {/if}

        {#if postalLine}
            <div class="text-gray-700">{postalLine}</div>
        {/if}

        {#if addr.tax_number}
            <div class="text-gray-400">税号：{addr.tax_number}</div>
        {/if}

        {#if addr.remark}
            <div class="text-gray-500">备注：{addr.remark}</div>
        {/if}
    </div>
</div>

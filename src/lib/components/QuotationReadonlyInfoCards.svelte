<script lang="ts">
    interface Props {
        partnerLabel: string;
        partnerCode?: string | null;
        partnerName?: string | null;
        partnerId?: number | null;
        itemLabel?: string;
        itemSku?: string | null;
        itemName?: string | null;
        itemNameEn?: string | null;
        itemId?: number | null;
        itemIsVariant?: boolean;
    }

    let {
        partnerLabel,
        partnerCode = null,
        partnerName = null,
        partnerId = null,
        itemLabel = '物品',
        itemSku = null,
        itemName = null,
        itemNameEn = null,
        itemId = null,
        itemIsVariant = false,
    }: Props = $props();
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <span class="block text-sm font-medium text-gray-700 mb-2">{partnerLabel}</span>
    {#if partnerCode || partnerName}
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            {#if partnerCode}
                <div class="text-sm font-semibold text-gray-900">{partnerCode}</div>
            {/if}
            {#if partnerName}
                <div class="text-sm text-gray-700 mt-0.5">{partnerName}</div>
            {/if}
        </div>
    {:else if partnerId}
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-sm text-gray-700">{partnerLabel} ID: {partnerId}</div>
        </div>
    {:else}
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-sm text-gray-500">未关联{partnerLabel}</div>
        </div>
    {/if}
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <span class="block text-sm font-medium text-gray-700 mb-2">{itemLabel}</span>
    {#if itemSku || itemName}
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-semibold text-gray-900">{itemSku || '-'}</span>
                {#if itemIsVariant}
                    <span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">变体</span>
                {/if}
            </div>
            {#if itemName}
                <div class="text-sm text-gray-700">{itemName}</div>
            {/if}
            {#if itemNameEn}
                <div class="text-xs text-gray-500 mt-0.5">{itemNameEn}</div>
            {/if}
        </div>
    {:else if itemId}
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-sm text-gray-700">物品 ID: {itemId}</div>
        </div>
    {:else}
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-sm text-gray-500">未关联物品</div>
        </div>
    {/if}
</div>

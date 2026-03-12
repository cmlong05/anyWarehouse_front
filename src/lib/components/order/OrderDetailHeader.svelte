<script lang="ts">
    import type { StatusConfig, StatusTransition } from '$lib/composables/useOrderDetail.svelte';

    interface Labels {
        backToList?: string;
        copyOrder?: string;
        edit?: string;
        delete?: string;
    }

    interface Props {
        title: string;
        orderNumber: string;
        status: string;
        statusMap: Record<string, StatusConfig>;
        transitions: StatusTransition[];
        updating?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
        labels?: Labels;
        onBack: () => void;
        onEdit?: () => void;
        onDelete?: () => void;
        onCopy?: () => void;
        onStatusChange: (status: string) => void;
    }
    
    let {
        title,
        orderNumber,
        status,
        statusMap,
        transitions,
        updating = false,
        canEdit = false,
        canDelete = false,
        labels = {},
        onBack,
        onEdit,
        onDelete,
        onCopy,
        onStatusChange,
    }: Props = $props();

    const defaultLabels: Labels = {
        backToList: '← 返回列表',
        copyOrder: '📋 复制订单',
        edit: '编辑',
        delete: '删除',
    };

    const l = { ...defaultLabels, ...labels };
</script>

<div class="flex justify-between items-center mb-6 max-md:flex-col max-md:gap-4 max-md:items-start">
    <div class="flex items-center gap-4">
        <button class="bg-transparent text-blue-600 px-2 py-1 rounded cursor-pointer transition-all duration-150 hover:opacity-80" onclick={onBack}>{l.backToList}</button>
        <h1 class="m-0 text-2xl">{title}</h1>
    </div>
    <div class="flex gap-2">
        {#if onCopy}
            <button class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-500 text-white hover:bg-gray-600" onclick={onCopy}>{l.copyOrder}</button>
        {/if}
        {#if canEdit && onEdit}
            <button class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-500 text-white hover:bg-gray-600" onclick={onEdit}>{l.edit}</button>
        {/if}
        {#if canDelete && onDelete}
            <button class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700" onclick={onDelete}>{l.delete}</button>
        {/if}
    </div>
</div>

<div class="bg-white rounded-lg p-6 mb-6 shadow-sm">
    <div class="flex justify-between items-center max-md:flex-col max-md:gap-4 max-md:items-start">
        <div class="flex items-center gap-3">
            <span class="font-mono text-xl font-semibold">{orderNumber}</span>
            <span class="inline-block px-3 py-1.5 rounded text-sm font-medium {statusMap[status]?.class || ''}">
                {statusMap[status]?.label || status}
            </span>
        </div>
        <div class="flex gap-2 flex-wrap">
            {#if transitions.length > 0}
                {#each transitions as transition}
                    <button
                        class="px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed {transition.value === 'cancelled' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}"
                        onclick={() => onStatusChange(transition.value)}
                        disabled={updating}
                    >
                        {transition.label}
                    </button>
                {/each}
            {/if}
        </div>
    </div>
</div>

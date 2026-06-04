<!-- 订单详情标题区 -->
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
        showMeta?: boolean;
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
        showMeta = true,
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

    const l = $derived({ ...defaultLabels, ...labels });

    const forwardTransitions = $derived(transitions.filter(t => !t.rollback));
</script>

<div class="mb-4 border-b border-slate-200 pb-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div class="flex items-center gap-3">
                <button
                    type="button"
                    class="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                    onclick={onBack}
                >
                    {l.backToList}
                </button>
                <h1 class="m-0 text-2xl font-bold text-slate-900">{title}</h1>
            </div>
            {#if showMeta}
                <div class="flex flex-wrap items-center gap-2 pl-1">
                    <span class="font-mono text-xs tracking-wide text-slate-500">#{orderNumber}</span>
                    <span class="inline-block rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide {statusMap[status]?.class || ''}">
                        {statusMap[status]?.label || status}
                    </span>
                </div>
            {/if}
        </div>

        <div class="flex flex-shrink-0 flex-col items-end gap-2">
            <!-- 正向操作按钮 -->
            <div class="flex flex-wrap items-center justify-end gap-2">
                {#each forwardTransitions as transition}
                    <button
                        class="inline-flex h-8 items-center rounded-md border px-2 text-xs font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 {transition.value === 'cancelled' ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100'}"
                        onclick={() => onStatusChange(transition.value)}
                        disabled={updating}
                    >
                        {transition.label}
                    </button>
                {/each}

                {#if onCopy}
                    <button
                        type="button"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-800"
                        onclick={onCopy}
                        title={l.copyOrder}
                        aria-label={l.copyOrder}
                    >
                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <rect x="9" y="9" width="11" height="11" rx="2" stroke-width="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke-width="2" stroke-linecap="round"></path>
                        </svg>
                    </button>
                {/if}

                {#if canEdit && onEdit}
                    <button
                        type="button"
                        class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100"
                        onclick={onEdit}
                    >
                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z" />
                        </svg>
                        {l.edit}
                    </button>
                {/if}

                {#if canDelete && onDelete}
                    <button
                        type="button"
                        class="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                        onclick={onDelete}
                    >
                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12M9 7v12m6-12v12M5 7l1-2h12l1 2M9 5h6" />
                        </svg>
                        {l.delete}
                    </button>
                {/if}
            </div>


        </div>
    </div>
</div>

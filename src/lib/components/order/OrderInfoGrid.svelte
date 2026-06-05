<!-- 订单信息网格 -->
<!--
被依赖：
- `lib/components/OrderForm.svelte`
- `lib/components/order/index.ts`
-->
<script lang="ts">
    // OrderInfoGrid is a reusable display component for rendering
    // a list of order metadata items in a compact info-card layout.
    // It supports formatted values, priority badges, optional links,
    // and separators between item groups.
    import type { Snippet } from 'svelte';
    import { PRIORITY_MAP } from '$lib/composables/useOrderDetail.svelte';

    interface PriorityMap {
        label: string;
        class: string;
    }

    interface InfoItem {
        label: string;
        value: string | number | null | undefined;
        format?: 'date' | 'priority' | 'default';
        href?: string;
        linkClass?: string;
        separator?: boolean;
    }

    interface Props {
        title: string;
        items: InfoItem[];
        priorityMap?: Record<string, PriorityMap>;
        actions?: Snippet;
    }
    
    let { title, items, priorityMap = PRIORITY_MAP, actions }: Props = $props();

    function formatValue(item: InfoItem): string {
        if (item.value === undefined || item.value === null || item.value === '') return '-';
        if (item.format === 'priority') {
            return priorityMap[String(item.value)]?.label || String(item.value);
        }
        return String(item.value);
    }

    function getPriorityClass(value: string | number | null | undefined): string {
        const key = priorityMap[String(value)]?.class || '';
        switch (key) {
            case 'priority-low': return 'bg-gray-100 text-gray-600';
            case 'priority-normal': return 'bg-blue-100 text-blue-800';
            case 'priority-high': return 'bg-yellow-100 text-yellow-800';
            case 'priority-urgent': return 'bg-red-500 text-white font-semibold';
            default: return 'bg-gray-100 text-gray-600';
        }
    }
</script>

<div class="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
    <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-gray-800">{title}</h2>
        {#if actions}
            <div class="flex gap-2">
                {@render actions()}
            </div>
        {/if}
    </div>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        {#each items as item}
            {#if item.separator}
                <div class="col-span-full"></div>
            {:else}
            <div class="flex flex-col">
                <span class="text-sm text-gray-500 mb-1">{item.label}</span>
                {#if item.format === 'priority'}
                    <span class="inline-block w-fit px-3 py-1 rounded text-sm font-medium {getPriorityClass(item.value)}">
                        {formatValue(item)}
                    </span>
                {:else if item.href}
                    <a href={item.href} class={item.linkClass || 'font-medium text-gray-900'}>
                        {formatValue(item)}
                    </a>
                {:else}
                    <span class="font-medium text-gray-900">{formatValue(item)}</span>
                {/if}
            </div>
            {/if}
        {/each}
    </div>
</div>
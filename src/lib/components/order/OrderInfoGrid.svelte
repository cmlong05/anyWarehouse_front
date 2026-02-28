<script lang="ts">
    import { PRIORITY_MAP } from '$lib/composables/useOrderDetail.svelte';

    interface InfoItem {
        label: string;
        value: string | number | null | undefined;
        format?: 'date' | 'priority' | 'default';
    }

    interface Props {
        title: string;
        items: InfoItem[];
    }
    
    let { title, items }: Props = $props();

    function formatValue(item: InfoItem): string {
        if (item.value === undefined || item.value === null || item.value === '') return '-';
        if (item.format === 'priority') {
            return PRIORITY_MAP[String(item.value)]?.label || String(item.value);
        }
        return String(item.value);
    }

    function getPriorityClass(value: string | number | null | undefined): string {
        return PRIORITY_MAP[String(value)]?.class || '';
    }
</script>

<div class="info-section">
    <h2>{title}</h2>
    <div class="info-grid">
        {#each items as item}
            <div class="info-item">
                <span class="label">{item.label}</span>
                {#if item.format === 'priority'}
                    <span class="priority-badge {getPriorityClass(item.value)}">
                        {formatValue(item)}
                    </span>
                {:else}
                    <span class="value">{formatValue(item)}</span>
                {/if}
            </div>
        {/each}
    </div>
</div>

<style>
    .info-section {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .info-section h2 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #333;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
    }

    .info-item .label {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.25rem;
    }

    .info-item .value {
        font-weight: 500;
        color: #333;
    }

    .priority-badge {
        display: inline-block;
        padding: 0.375rem 0.75rem;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 500;
        width: fit-content;
    }

    .priority-low { background: #e9ecef; color: #495057; }
    .priority-normal { background: #d1ecf1; color: #0c5460; }
    .priority-high { background: #fff3cd; color: #856404; }
    .priority-urgent { background: #dc3545; color: white; font-weight: 600; }
</style>

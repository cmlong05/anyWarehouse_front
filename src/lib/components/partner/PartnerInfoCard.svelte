<script lang="ts">
    interface InfoItem {
        label: string;
        value: string;
        isCode?: boolean;
    }
    
    interface Props {
        title: string;
        items: InfoItem[];
        fullWidth?: boolean;
    }
    
    let { title, items, fullWidth = false }: Props = $props();
</script>

<div class="info-card" class:full-width={fullWidth}>
    <h3>{title}</h3>
    <div class="info-list">
        {#each items as item}
            <div class="info-item">
                <span class="label">{item.label}</span>
                <span class="value" class:code={item.isCode}>{item.value || '-'}</span>
            </div>
        {/each}
    </div>
</div>

<style>
    .info-card {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .info-card.full-width {
        grid-column: 1 / -1;
    }
    
    .info-card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #374151;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .info-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .info-item .label {
        color: #6b7280;
        font-size: 0.875rem;
        flex-shrink: 0;
    }
    
    .info-item .value {
        color: #1f2937;
        text-align: right;
        word-break: break-word;
    }
    
    .info-item .value.code {
        font-family: monospace;
        color: #6b7280;
    }
</style>

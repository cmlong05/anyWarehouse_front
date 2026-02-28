<script lang="ts">
    import { safeParseFloat } from '$lib/utils';

    interface AmountItem {
        label: string;
        value: string | number | undefined;
        isNegative?: boolean;
        isTotal?: boolean;
        prefix?: string;
    }

    interface Props {
        items: AmountItem[];
    }
    
    let { items }: Props = $props();

    function formatValue(item: AmountItem): string {
        const prefix = item.prefix || '¥';
        const value = safeParseFloat(item.value);
        const sign = item.isNegative ? '-' : '';
        return `${sign}${prefix}${value.toFixed(2)}`;
    }
</script>

<div class="info-section">
    <h2>金额信息</h2>
    <div class="amount-grid">
        {#each items as item}
            <div class="amount-item" class:total={item.isTotal}>
                <span class="label">{item.label}</span>
                <span class="value">{formatValue(item)}</span>
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

    .amount-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
    }

    .amount-item {
        display: flex;
        flex-direction: column;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 4px;
    }

    .amount-item .label {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.25rem;
    }

    .amount-item .value {
        font-weight: 500;
        font-size: 1rem;
    }

    .amount-item.total {
        background: #e7f3ff;
    }

    .amount-item.total .value {
        color: #007bff;
        font-size: 1.25rem;
    }
</style>

<script lang="ts">
    import type { WhereUsedItem } from '$lib';

    interface Props {
        items: WhereUsedItem[];
    }
    
    let { items }: Props = $props();
</script>

{#if items.length === 0}
    <div class="empty-state">该物品暂未被其他产品使用</div>
{:else}
    <div class="where-used-list">
        <p class="hint">该物品被以下产品用作组件:</p>
        {#each items as item}
            <div class="where-used-item">
                <a href="/item/{item.item_id}" class="item-link">
                    {item.sku} - {item.name}
                </a>
                <span class="storage-qty" class:zero={item.total_storage === 0} class:low={item.total_storage > 0 && item.total_storage < 10}>
                    {item.total_storage}
                </span>
            </div>
        {/each}
    </div>
{/if}

<style>
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    .where-used-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .hint {
        color: #666;
        margin-bottom: 1rem;
    }

    .where-used-item {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .item-link {
        color: #1976d2;
        text-decoration: none;
        font-weight: 500;
    }

    .item-link:hover {
        text-decoration: underline;
    }

    .storage-qty {
        background: #e8f5e9;
        color: #2e7d32;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .storage-qty.zero {
        background: #ffebee;
        color: #c62828;
    }

    .storage-qty.low {
        background: #fff3e0;
        color: #ef6c00;
    }

    @media (max-width: 768px) {
        .where-used-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style>

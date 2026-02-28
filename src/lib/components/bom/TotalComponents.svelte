<script lang="ts">
    import type { TotalComponentItem } from '$lib';

    interface Props {
        items: TotalComponentItem[];
        parentSKU: string;
    }
    
    let { items, parentSKU }: Props = $props();
</script>

{#if items.length === 0}
    <div class="empty-state">暂无物料汇总数据</div>
{:else}
    <div class="total-components">
        <p class="hint">生产 1 个 {parentSKU} 需要的所有底层物料:</p>
        <table class="data-table">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>名称</th>
                    <th>数量</th>
                </tr>
            </thead>
            <tbody>
                {#each items as item}
                    <tr>
                        <td><a href="/item/{item.item_id}">{item.sku}</a></td>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
        <div class="calc-hint">
            <p>💡 提示: 如需计算生产 N 个 {parentSKU} 的物料需求，将上表数量乘以 N 即可</p>
        </div>
    </div>
{/if}

<style>
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    .total-components {
        background: white;
        padding: 1rem;
        border-radius: 6px;
    }

    .hint {
        color: #666;
        margin-bottom: 1rem;
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 6px;
        overflow: hidden;
    }

    .data-table th,
    .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #dee2e6;
    }

    .data-table th {
        background: #f8f9fa;
        font-weight: 600;
    }

    .data-table a {
        color: #1976d2;
        text-decoration: none;
    }

    .data-table a:hover {
        text-decoration: underline;
    }

    .calc-hint {
        background: #e3f2fd;
        padding: 1rem;
        border-radius: 6px;
        margin-top: 1rem;
    }

    .calc-hint p {
        margin: 0;
        color: #1976d2;
    }
</style>

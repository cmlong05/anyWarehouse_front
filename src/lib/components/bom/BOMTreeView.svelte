<script lang="ts">
    import type { BOMTreeNode } from '$lib';
    import type { MaxProducibleResult } from '$lib/composables/useBOMManager.svelte';

    interface Props {
        nodes: BOMTreeNode[];
        itemSKU: string;
        calculating: boolean;
        result: MaxProducibleResult | null;
        onCalculate: () => void;
    }
    
    import BOMTreeView from './BOMTreeView.svelte';
    
    let { nodes, itemSKU, calculating, result, onCalculate }: Props = $props();

    // 递归计算样式缩进
    function getIndentStyle(level: number): string {
        return `margin-left: ${level * 20}px`;
    }
</script>

{#if nodes.length === 0}
    <div class="empty-state">暂无BOM树结构</div>
{:else}
    <div class="bom-tree-calc">
        <div class="calc-section">
            <button 
                class="btn btn-primary btn-sm" 
                onclick={onCalculate}
                disabled={calculating}
            >
                {calculating ? '计算中...' : '计算可组装数量'}
            </button>
            
            {#if result}
                <div class="calc-result-inline">
                    <span class="max-producible">
                        可组装: <span class="highlight">{result.max_producible}</span> 个
                    </span>
                    {#if result.limiting_factor}
                        <span class="limiting-factor">
                            (受限: <a href="/item/{result.limiting_factor.item_id}" class="limiter-link">{result.limiting_factor.sku}</a>
                            - 库存{result.limiting_factor.available} / 需要{result.limiting_factor.required})
                        </span>
                    {/if}
                </div>
            {/if}
        </div>
        
        <div class="bom-tree">
            {#each nodes as node}
                {#if node.item.SKU !== itemSKU}
                    <div class="tree-level">
                        <div class="tree-node">
                            <span class="node-name">{node.item.SKU} - {node.item.name}</span>
                            <span class="node-qty">× {node.quantity} <span class="stock">(库存: {node.total_storage})</span></span>
                        </div>
                        {#if node.children?.length}
                            <div class="tree-children">
                                {#each node.children as child}
                                    <BOMTreeView nodes={[child]} itemSKU={itemSKU} {calculating} {result} {onCalculate} />
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
    </div>
{/if}

<style>
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    .bom-tree-calc {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .calc-section {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .calc-result-inline {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .max-producible {
        font-size: 1.1rem;
        font-weight: 500;
    }

    .max-producible .highlight {
        color: #4caf50;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .limiting-factor {
        font-size: 0.875rem;
        color: #666;
    }

    .limiter-link {
        color: #1976d2;
        text-decoration: none;
        font-weight: 500;
    }

    .limiter-link:hover {
        text-decoration: underline;
    }

    .bom-tree {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #dee2e6;
    }

    .tree-level {
        margin-bottom: 0.25rem;
    }

    .tree-node {
        padding: 0.5rem;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .tree-node:hover {
        background: #f5f5f5;
    }

    .tree-children {
        margin-left: 1.5rem;
        border-left: 2px solid #e0e0e0;
        padding-left: 0.5rem;
    }

    .node-name {
        font-weight: 500;
    }

    .node-qty {
        background: #e3f2fd;
        color: #1976d2;
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .node-qty .stock {
        color: #666;
        font-size: 0.75rem;
        font-weight: normal;
        margin-left: 0.25rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-primary {
        background: #1976d2;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: #1565c0;
    }

    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
    }
</style>

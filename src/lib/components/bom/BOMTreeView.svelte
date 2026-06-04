<!-- BOM树视图 -->
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
    <div class="text-center p-8 text-gray-500">暂无BOM树结构</div>
{:else}
    <div class="flex flex-col gap-4">
        <div class="bg-gray-50 p-4 rounded-md border border-gray-200 flex flex-col gap-3">
            <button 
                class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded transition-all duration-200 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed w-fit" 
                onclick={onCalculate}
                disabled={calculating}
            >
                {calculating ? '计算中...' : '计算可组装数量'}
            </button>
            
            {#if result}
                <div class="inline-flex items-center gap-3 flex-wrap">
                    <span class="text-lg font-medium">
                        可组装: <span class="text-green-500 text-2xl font-bold">{result.max_producible}</span> 个
                    </span>
                    {#if result.limiting_factor}
                        <span class="text-sm text-gray-600">
                            (受限: <a href="/item/{result.limiting_factor.item_id}" class="text-blue-600 font-medium hover:underline">{result.limiting_factor.sku}</a>
                            - 库存{result.limiting_factor.available} / 需要{result.limiting_factor.required})
                        </span>
                    {/if}
                </div>
            {/if}
        </div>
        
        <div class="bg-white p-4 rounded-md border border-gray-200">
            {#each nodes as node}
                {#if node.item.SKU !== itemSKU}
                    <div class="mb-1">
                        <div class="p-2 rounded flex justify-between items-center hover:bg-gray-50">
                            <span class="font-medium">{node.item.SKU} - {node.item.name}</span>
                            <span class="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-sm font-medium">× {node.quantity} <span class="text-gray-600 text-xs font-normal ml-1">(库存: {node.total_storage})</span></span>
                        </div>
                        {#if node.children?.length}
                            <div class="ml-6 border-l-2 border-gray-200 pl-2">
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
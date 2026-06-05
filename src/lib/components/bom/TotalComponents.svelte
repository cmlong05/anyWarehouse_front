<!-- 总组件数 -->
<!--
被依赖：
- `lib/components/ItemComponentManager.svelte`
- `lib/components/bom/index.ts`
-->
<script lang="ts">
    import type { TotalComponentItem } from '$lib';

    interface Props {
        items: TotalComponentItem[];
        parentSKU: string;
    }
    
    let { items, parentSKU }: Props = $props();
</script>

{#if items.length === 0}
    <div class="text-center p-8 text-gray-500">暂无物料汇总数据</div>
{:else}
    <div class="bg-white p-4 rounded-md">
        <p class="text-gray-600 mb-4">生产 1 个 {parentSKU} 需要的所有底层物料:</p>
        <table class="w-full border-collapse bg-white rounded-md overflow-hidden">
            <thead>
                <tr>
                    <th class="p-3 text-left border-b border-gray-200 bg-gray-50 font-semibold">SKU</th>
                    <th class="p-3 text-left border-b border-gray-200 bg-gray-50 font-semibold">名称</th>
                    <th class="p-3 text-left border-b border-gray-200 bg-gray-50 font-semibold">数量</th>
                </tr>
            </thead>
            <tbody>
                {#each items as item}
                    <tr>
                        <td class="p-3 text-left border-b border-gray-200"><a href="/item/{item.item_id}" class="text-blue-600 hover:underline">{item.sku}</a></td>
                        <td class="p-3 text-left border-b border-gray-200">{item.name}</td>
                        <td class="p-3 text-left border-b border-gray-200">{item.quantity}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
        <div class="bg-blue-50 p-4 rounded-md mt-4">
            <p class="text-blue-600">💡 提示: 如需计算生产 N 个 {parentSKU} 的物料需求，将上表数量乘以 N 即可</p>
        </div>
    </div>
{/if}
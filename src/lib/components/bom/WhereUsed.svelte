<!-- 使用位置 -->
<!--
被依赖：
- `lib/components/item/ItemComponentManager.svelte`
- `lib/components/bom/index.ts`
-->
<script lang="ts">
    import type { WhereUsedItem } from '$lib';

    interface Props {
        items: WhereUsedItem[];
    }
    
    let { items }: Props = $props();
</script>

{#if items.length === 0}
    <div class="text-center p-8 text-gray-500">该物品暂未被其他产品使用</div>
{:else}
    <div class="flex flex-col gap-3">
        <p class="text-gray-600 mb-4">该物品被以下产品用作组件:</p>
        {#each items as item}
            <div class="bg-white p-4 rounded-md border border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <a href="/item/{item.item_id}" class="text-blue-600 hover:underline font-medium">
                    {item.sku} - {item.name}
                </a>
                <span class="px-2 py-1 rounded text-sm font-medium"
                    class:bg-green-50={item.total_storage > 10}
                    class:text-green-700={item.total_storage > 10}
                    class:bg-red-50={item.total_storage === 0}
                    class:text-red-700={item.total_storage === 0}
                    class:bg-orange-50={item.total_storage > 0 && item.total_storage < 10}
                    class:text-orange-700={item.total_storage > 0 && item.total_storage < 10}
                >
                    {item.total_storage}
                </span>
            </div>
        {/each}
    </div>
{/if}
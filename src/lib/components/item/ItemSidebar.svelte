<script lang="ts">
    import type { CategoryData } from '$lib';

    interface Props {
        categories: CategoryData[];
        currentSKU: string;
    }

    let { categories, currentSKU }: Props = $props();
</script>

<aside class="lg:w-64 flex-shrink-0 lg:sticky lg:top-4 max-h-[calc(100vh-1rem)] overflow-y-auto space-y-4 pr-1">
    {#each categories as category}
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 sticky top-0">
                <a
                    href="/item/category/{category.category.id}"
                    class="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                    {category.category.name}
                </a>
            </div>

            <ul class="divide-y divide-gray-100">
                {#each category.items as cateItem}
                    <li>
                        {#if cateItem.SKU === currentSKU}
                            <div class="px-4 py-3 bg-blue-50 border-l-4 border-blue-500">
                                <div class="font-mono text-sm font-medium text-blue-700">{cateItem.SKU}</div>
                                <div class="text-sm text-blue-900 mt-0.5 line-clamp-2">{cateItem.name}</div>
                            </div>
                        {:else}
                            <a
                                href="/item/{cateItem.id}"
                                class="block px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 border-transparent"
                            >
                                <div class="font-mono text-sm text-blue-600">{cateItem.SKU}</div>
                                <div class="text-sm text-gray-700 mt-0.5 line-clamp-2">{cateItem.name}</div>
                            </a>
                        {/if}
                    </li>
                {/each}
            </ul>
        </div>
    {/each}
</aside>

<script lang="ts">
    import { goto } from '$app/navigation';
    import type { CategoryData } from '$lib';
    import ChevronDown from 'lucide-svelte/icons/chevron-down';
    import ChevronRight from 'lucide-svelte/icons/chevron-right';

    interface Props {
        categories: CategoryData[];
        currentSKU: string;
    }

    let { categories, currentSKU }: Props = $props();
    let collapsed = $state<Set<number>>(new Set());

    function navigateToItem(itemId: number, event: MouseEvent) {
        event.preventDefault();
        goto(`/item/${itemId}`, { noScroll: true });
    }

    function toggleCategory(categoryId: number, event: MouseEvent | KeyboardEvent) {
        event.preventDefault();
        const next = new Set(collapsed);
        if (next.has(categoryId)) {
            next.delete(categoryId);
        } else {
            next.add(categoryId);
        }
        collapsed = next;
    }

    function handleHeaderKeydown(categoryId: number, event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            toggleCategory(categoryId, event);
        }
    }
</script>

<aside class="lg:w-64 flex-shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-1rem)] lg:overflow-y-auto space-y-4 pr-1">
    {#each categories as category}
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
            <div
                class="group px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-t-xl shadow-sm sticky top-0 flex items-center justify-between gap-3 cursor-pointer"
                role="button"
                tabindex="0"
                title="同分类物品"
                onclick={(e) => toggleCategory(category.category.id, e)}
                onkeydown={(e) => handleHeaderKeydown(category.category.id, e)}
            >
                <span class="flex items-center gap-2">
                    <span class="font-semibold tracking-wide text-gray-900 transition-colors">
                        {category.category.name}
                    </span>
                    <span class="text-xs text-gray-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        同分类物品
                    </span>
                </span>
                <button
                    type="button"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-slate-100 transition-colors"
                    aria-label={collapsed.has(category.category.id) ? '展开分类' : '折叠分类'}
                    onclick={(e) => {
                        e.stopPropagation();
                        toggleCategory(category.category.id, e);
                    }}
                >
                    {#if collapsed.has(category.category.id)}
                        <ChevronRight class="w-4 h-4" />
                    {:else}
                        <ChevronDown class="w-4 h-4" />
                    {/if}
                </button>
            </div>

            <ul class="divide-y divide-gray-100" class:hidden={collapsed.has(category.category.id)}>
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
                                onclick={(e) => navigateToItem(cateItem.id, e)}
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

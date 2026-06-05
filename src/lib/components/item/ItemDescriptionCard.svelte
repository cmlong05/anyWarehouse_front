<!-- 物料描述卡片 -->
<!--
被依赖：
- `routes/item/[slug]/+page.svelte`
-->
<script lang="ts">
    interface Props {
        description?: string | null;
    }

    let {
        description = '',
    }: Props = $props();

    let descriptionExpanded = $state(false);

    const isDescriptionCollapsible = $derived((description?.length ?? 0) > 100);

    function handleDescriptionAreaClick() {
        if (!isDescriptionCollapsible) {
            return;
        }

        if (typeof window !== 'undefined') {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
                return;
            }
        }

        descriptionExpanded = !descriptionExpanded;
    }
</script>

{#if description}
    <div class="bg-white rounded-xl rounded-t-none shadow-sm border border-gray-200 overflow-hidden mb-4">
        {#if isDescriptionCollapsible}
            <div
                class="px-6 py-4 cursor-pointer select-text"
                role="button"
                tabindex="0"
                aria-expanded={descriptionExpanded}
                onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDescriptionAreaClick();
                    }
                }}
                onclick={handleDescriptionAreaClick}
            >
                <div class="relative">
                    <p
                        class="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300 {descriptionExpanded ? '' : 'line-clamp-3 pr-16'}"
                    >
                        {description}
                    </p>
                    {#if !descriptionExpanded && isDescriptionCollapsible}
                        <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
                        <span class="pointer-events-none absolute bottom-0 right-0 z-10 inline-flex items-center gap-0.5 bg-white/95 pl-2 text-xs text-gray-500">
                            更多...
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    {/if}
                </div>
                {#if isDescriptionCollapsible && descriptionExpanded}
                    <div class="flex justify-end mt-1">
                        <span class="text-xs flex items-center gap-0.5 text-gray-500 hover:text-gray-700">
                            收起
                            <svg
                                class="w-3 h-3 transition-transform duration-200 {descriptionExpanded ? 'rotate-180' : ''}"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="px-6 py-4">
                <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {description}
                </p>
            </div>
        {/if}
    </div>
{/if}
<script lang="ts">
    import type { CategoryData } from '$lib';
    let { data } = $props<{ category_details: CategoryData }>();
</script>

<svelte:head>
    <title>分类 {data.category_details.category.name}</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-3">
    <!-- 面包屑导航 -->
    <nav class="flex items-center gap-2 text-sm text-gray-500 mb-3">
        {#each data.category_details.ancestors as ancestor}
            <a href="/item/category/{ancestor.id}" class="hover:text-blue-600 transition-colors">{ancestor.name}</a>
            <span>/</span>
        {/each}
        <span class="text-gray-900 font-medium">{data.category_details.category.name}</span>
        <a 
            href="/item/category/{data.category_details.category.id}/edit" 
            class="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
            title="编辑"
            aria-label="编辑分类"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        </a>
    </nav>

    <!-- 三栏布局 -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- 左侧：物品列表 -->
        <div class="lg:col-span-2 space-y-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[70vh]">
                <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <h2 class="text-lg font-semibold text-gray-900">物品</h2>
                    <a 
                        href="/item/add?category={data.category_details.category.id}" 
                        class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        添加
                    </a>
                </div>
                <div class="divide-y divide-gray-100 overflow-y-auto">
                    {#each data.category_details.items as { id, SKU, name }}
                        <a href="/item/{id}" class="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group">
                            <span class="font-mono text-sm font-medium text-blue-600 group-hover:text-blue-700">{SKU}</span>
                            <span class="text-gray-700 text-sm">{name}</span>
                        </a>
                    {:else}
                        <div class="px-4 py-8 text-center text-gray-400">
                            暂无物品
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- 中间：子分类 -->
        <div class="space-y-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[70vh]">
                <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <h2 class="text-lg font-semibold text-gray-900">子分类</h2>
                    <a 
                        href="/item/category/add?parent={data.category_details.category.id}" 
                        class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        添加
                    </a>
                </div>
                <div class="divide-y divide-gray-100 overflow-y-auto">
                    {#each data.category_details.descendants as child}
                        <a href="/item/category/{child.id}" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                            {child.name}
                        </a>
                    {:else}
                        <div class="px-4 py-6 text-center text-sm text-gray-400">
                            暂无子分类
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- 右侧：相邻分类 -->
        <div class="space-y-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[70vh]">
                <div class="px-4 py-3 border-b border-gray-200 shrink-0">
                    <h2 class="text-lg font-semibold text-gray-900">相邻分类</h2>
                </div>
                <div class="divide-y divide-gray-100 overflow-y-auto">
                    {#each data.category_details.siblings as sibling}
                        {#if sibling.id == data.category_details.category.id}
                            <div class="px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50">
                                {sibling.name}
                            </div>
                        {:else}
                            <a href="/item/category/{sibling.id}" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                                {sibling.name}
                            </a>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>

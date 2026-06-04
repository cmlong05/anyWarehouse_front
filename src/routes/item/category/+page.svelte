<!-- 物料分类列表页 -->
<script lang="ts">
    import type { Category } from '$lib';
    import { Folder, FolderOpen, Plus, ChevronRight, Tag } from 'lucide-svelte';
    
    let { data } = $props<{ categories: Category[] }>();

    // 构建分类树结构
    function buildCategoryTree(categories: Category[]): Category[] {
        const categoryMap = new Map<number, Category & { children?: Category[] }>();
        const roots: Category[] = [];
        
        // 首先创建映射
        categories.forEach(cat => {
            categoryMap.set(cat.id, { ...cat, children: [] });
        });
        
        // 构建树结构
        categories.forEach(cat => {
            const node = categoryMap.get(cat.id)!;
            if (cat.parent && categoryMap.has(cat.parent)) {
                const parent = categoryMap.get(cat.parent)!;
                if (!parent.children) parent.children = [];
                parent.children.push(node);
            } else {
                roots.push(node);
            }
        });
        
        return roots;
    }

    // 获取顶级分类
    const topCategories = $derived(data.categories.filter((c: Category) => !c.parent));
    
    // 获取子分类
    function getChildren(parentId: number): Category[] {
        return data.categories.filter((c: Category) => c.parent === parentId);
    }

    // 统计分类下的物品数量（如果有的话）
    function getItemCount(categoryId: number): number {
        // 这里可以扩展为实际的物品统计
        return 0;
    }
</script>

<svelte:head>
    <title>分类管理 | 所有分类</title>
</svelte:head>

<div class="min-h-screen bg-gray-50/50">
    <!-- 页面头部 -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-blue-50 rounded-lg">
                        <FolderOpen class="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 class="text-xl font-semibold text-gray-900">分类管理</h1>
                        <p class="text-sm text-gray-500">共 {data.categories.length} 个分类</p>
                    </div>
                </div>
                <a 
                    href="/item/category/add" 
                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow"
                >
                    <Plus class="w-4 h-4" />
                    添加分类
                </a>
            </div>
        </div>
    </div>

    <!-- 主内容区 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {#if data.categories.length > 0}
            <!-- 分类网格 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {#each topCategories as category}
                    {@const children = getChildren(category.id)}
                    {@const hasChildren = children.length > 0}
                    
                    <a 
                        href="/item/category/{category.id}"
                        class="group block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    >
                        <!-- 卡片头部 -->
                        <div class="p-5">
                            <div class="flex items-start justify-between mb-3">
                                <div class="p-2.5 rounded-lg {hasChildren ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}">
                                    {#if hasChildren}
                                        <FolderOpen class="w-5 h-5" />
                                    {:else}
                                        <Folder class="w-5 h-5" />
                                    {/if}
                                </div>
                                <span class="text-xs font-medium text-gray-400">#{category.id}</span>
                            </div>
                            
                            <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                {category.name}
                            </h3>
                            
                            {#if category.description}
                                <p class="text-sm text-gray-500 line-clamp-2 mb-3">
                                    {category.description}
                                </p>
                            {:else}
                                <p class="text-sm text-gray-400 italic mb-3">暂无描述</p>
                            {/if}
                            
                            <!-- 子分类预览 -->
                            {#if hasChildren}
                                <div class="flex items-center gap-1.5 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                                    <Tag class="w-3.5 h-3.5 text-gray-400" />
                                    <span>{children.length} 个子分类</span>
                                    <ChevronRight class="w-4 h-4 ml-auto text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                
                                <!-- 子分类标签 -->
                                <div class="flex flex-wrap gap-1.5 mt-2">
                                    {#each children.slice(0, 3) as child}
                                        <span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            {child.name}
                                        </span>
                                    {/each}
                                    {#if children.length > 3}
                                        <span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                            +{children.length - 3}
                                        </span>
                                    {/if}
                                </div>
                            {:else}
                                <div class="flex items-center gap-1.5 text-sm text-gray-400 mt-4 pt-4 border-t border-gray-100">
                                    <ChevronRight class="w-4 h-4 ml-auto text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            {/if}
                        </div>
                    </a>
                {/each}
                
                <!-- 添加卡片 -->
                <a 
                    href="/item/category/add"
                    class="group flex flex-col items-center justify-center min-h-[200px] rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200"
                >
                    <div class="p-3 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors mb-3">
                        <Plus class="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                    </div>
                    <span class="text-sm font-medium text-gray-500 group-hover:text-blue-600">添加新分类</span>
                </a>
            </div>
            
            <!-- 层级视图（可选折叠） -->
            {#if topCategories.length > 0}
                <div class="mt-12">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FolderOpen class="w-5 h-5 text-gray-400" />
                        层级视图
                    </h2>
                    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {#each topCategories as category, i}
                            {@const children = getChildren(category.id)}
                            <div class="{i !== 0 ? 'border-t border-gray-100' : ''}">
                                <a 
                                    href="/item/category/{category.id}"
                                    class="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div class="p-1.5 rounded bg-blue-50 text-blue-600">
                                        <Folder class="w-4 h-4" />
                                    </div>
                                    <div class="flex-1">
                                        <span class="font-medium text-gray-900">{category.name}</span>
                                        {#if category.description}
                                            <span class="text-sm text-gray-500 ml-2">— {category.description}</span>
                                        {/if}
                                    </div>
                                    {#if children.length > 0}
                                        <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                            {children.length} 子分类
                                        </span>
                                    {/if}
                                    <ChevronRight class="w-4 h-4 text-gray-400" />
                                </a>
                                
                                <!-- 子分类列表 -->
                                {#if children.length > 0}
                                    <div class="bg-gray-50/50">
                                        {#each children as child, j}
                                            <a 
                                                href="/item/category/{child.id}"
                                                class="flex items-center gap-3 px-5 py-3 pl-12 hover:bg-gray-100 transition-colors {j !== children.length - 1 ? 'border-b border-gray-100' : ''}"
                                            >
                                                <div class="w-px h-4 bg-gray-300 ml-2"></div>
                                                <div class="p-1 rounded bg-gray-100 text-gray-500">
                                                    <Folder class="w-3.5 h-3.5" />
                                                </div>
                                                <span class="text-sm text-gray-700">{child.name}</span>
                                                {#if child.description}
                                                    <span class="text-xs text-gray-400 ml-2">{child.description}</span>
                                                {/if}
                                            </a>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        {:else}
            <!-- 空状态 -->
            <div class="flex flex-col items-center justify-center py-16 px-4">
                <div class="p-4 bg-gray-100 rounded-full mb-4">
                    <FolderOpen class="w-12 h-12 text-gray-400" />
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">暂无分类</h3>
                <p class="text-gray-500 text-center max-w-sm mb-6">
                    还没有创建任何分类。添加第一个分类来组织你的物品吧。
                </p>
                <a 
                    href="/item/category/add"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus class="w-5 h-5" />
                    添加第一个分类
                </a>
            </div>
        {/if}
    </div>
</div>
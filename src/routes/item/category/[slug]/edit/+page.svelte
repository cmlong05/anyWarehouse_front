<!-- 编辑分类 -->
<script lang="ts">
    import CategoryForm from '$lib/components/CategoryForm.svelte';
    import type { Category, CategoryData } from '$lib';

    let { data } = $props<{ 
        data: {
            categoryData: CategoryData;
            categories: Category[];
        }
    }>();

    // 获取父分类ID：ancestors数组中的最后一个就是直接父分类
    const parentId = data.categoryData.ancestors.length > 0 
        ? data.categoryData.ancestors[data.categoryData.ancestors.length - 1].id 
        : null;
</script>

<svelte:head>
    <title>编辑分类 - {data.categoryData.category.name}</title>
</svelte:head>

<div class="page-header">
    <h2>编辑分类</h2>
    <p>分类：<strong>{data.categoryData.category.name}</strong></p>
</div>

<CategoryForm 
    mode="edit"
    initialData={{
        id: data.categoryData.category.id,
        name: data.categoryData.category.name,
        parent: parentId,
        top_category: data.categoryData.category.top_category
    }}
    categories={data.categories}
/>

<style>
    .page-header {
        margin-bottom: 2rem;
        padding: 1rem 0;
        border-bottom: 1px solid #eee;
    }
    
    .page-header h2 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }
    
    .page-header p {
        margin: 0;
        color: #666;
        font-size: 0.95rem;
    }
</style>
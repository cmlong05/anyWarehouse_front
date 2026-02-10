<!-- 添加分类 -->
<script lang="ts">
    import CategoryForm from '$lib/components/CategoryForm.svelte';
    import type { Category } from '$lib';

    let { data } = $props<{ 
        data: {
            categories: Category[];
            parentCategory?: Category;
        }
    }>();
</script>

<svelte:head>
    <title>{data.parentCategory ? `添加子分类 - ${data.parentCategory.name}` : '添加分类'}</title>
</svelte:head>

<div class="page-header">
    <h2>{data.parentCategory ? '添加子分类' : '添加分类'}</h2>
    {#if data.parentCategory}
        <p>父分类：<strong>{data.parentCategory.name}</strong></p>
    {:else}
        <p>创建新的分类</p>
    {/if}
</div>

<CategoryForm 
    mode="add"
    initialData={data.parentCategory ? {
        name: '',
        parent: data.parentCategory.id,
        top_category: false
    } : undefined}
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
<!-- 添加分类 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { PageContainer, PageHeader } from '$lib/components/layout';
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

<PageContainer>
    <PageHeader 
        title={data.parentCategory ? '添加子分类' : '添加分类'}
        subtitle={data.parentCategory ? `父分类：${data.parentCategory.name}` : '创建新的分类'}
    />

    <CategoryForm 
        mode="add"
        initialData={data.parentCategory ? {
            name: '',
            parent: data.parentCategory.id,
            top_category: false
        } : undefined}
        categories={data.categories}
    />
</PageContainer>
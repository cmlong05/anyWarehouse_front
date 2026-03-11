<!-- 编辑分类 -->
<script lang="ts">
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import CategoryForm from '$lib/components/CategoryForm.svelte';
    import type { Category, CategoryData } from '$lib';

    let { data } = $props<{ 
        data: {
            categoryData: CategoryData;
            categories: Category[];
        }
    }>();

    // 获取父分类ID：ancestors数组中的最后一个就是直接父分类
    const parentId = $derived(data.categoryData.ancestors.length > 0 
        ? data.categoryData.ancestors[data.categoryData.ancestors.length - 1].id 
        : null);
</script>

<svelte:head>
    <title>编辑分类 - {data?.categoryData?.category?.name ?? ''}</title>
</svelte:head>

<PageContainer>
    <PageHeader 
        title="编辑分类"
        subtitle={`分类：${data.categoryData.category.name}`}
    />

    {@const initialData = {
        id: data?.categoryData?.category?.id,
        name: data?.categoryData?.category?.name ?? '',
        parent: parentId,
        top_category: data?.categoryData?.category?.top_category ?? false
    }}
    <CategoryForm 
        mode="edit"
        {initialData}
        categories={data?.categories ?? []}
    />
</PageContainer>

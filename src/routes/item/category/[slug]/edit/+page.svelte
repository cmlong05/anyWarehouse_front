<!-- 编辑分类 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import { CategoryForm } from '$lib/components';
    import type { Category, CategoryData } from '$lib';
    import { itemAPI } from '$lib/api';
    import { getErrorMessage } from '$lib/utils/errors';
    import { goto } from '$app/navigation';

    let { data } = $props<{ 
        data: {
            categoryData: CategoryData;
            categories: Category[];
            emptyCheckData: { is_empty: boolean; item_count: number; children_count: number } | null;
        }
    }>();

    // 获取父分类ID：ancestors数组中的最后一个就是直接父分类
    const parentId = $derived(data.categoryData.ancestors.length > 0 
        ? data.categoryData.ancestors[data.categoryData.ancestors.length - 1].id 
        : null);

    async function handleDelete(categoryId: number) {
        try {
            await itemAPI.deleteCategory(categoryId);
            await goto('/item/category');
        } catch (error) {
            alert(`删除失败: ${getErrorMessage(error, '未知错误')}`);
        }
    }
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
        emptyCheckData={data?.emptyCheckData ?? null}
        onDelete={handleDelete}
    />
</PageContainer>
<!-- 添加商品 -->
<script lang="ts">
    import ItemForm from '$lib/components/ItemForm.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import type { Category } from '$lib';

    let { data } = $props<{ 
        data: {
            categories: Category[];
            defaultCategoryId?: number | null;
        }
    }>();

    // 如果有默认分类，找到对应的分类名称用于显示
    const defaultCategory = $derived(data.defaultCategoryId 
        ? data.categories.find((cat: Category) => cat.id === data.defaultCategoryId)
        : null);
</script>

<svelte:head>
    <title>添加商品{defaultCategory ? ` - ${defaultCategory.name}` : ''}</title>
</svelte:head>

<PageContainer maxWidth="md">
    <PageHeader 
        title="添加商品"
        subtitle={defaultCategory 
            ? `默认分类：${defaultCategory.name}`
            : '创建新的商品信息'}
    />
    
    <ItemForm 
        mode="add"
        initialData={data.defaultCategoryId ? {
            SKU: '',
            name: '',
            SKU_zite: '',
            SKU_A: '',
            description: '',
            image: '',
            weight: '',
            p_volume: 0,
            s_volume: 0,
            b_Price: '',
            currency: '',
            in_fee: null,
            barcode: '',
            category: [data.defaultCategoryId]
        } : undefined}
        categories={data.categories}
    />
</PageContainer>

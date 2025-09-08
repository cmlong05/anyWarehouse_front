<!-- 添加商品 -->
<script lang="ts">
    import ItemForm from '$lib/components/ItemForm.svelte';
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

<div class="page-header">
    <h2>添加商品</h2>
    {#if defaultCategory}
        <p>默认分类：<strong>{defaultCategory.name}</strong></p>
    {:else}
        <p>创建新的商品信息</p>
    {/if}
</div>

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
    }
</style>

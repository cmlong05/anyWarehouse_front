<!-- 编辑商品 -->
<script lang="ts">
    import ItemForm from '$lib/components/ItemForm.svelte';
    import type { Category, ItemSet } from '$lib';
    import { goto } from '$app/navigation';
    import { config } from '$lib/config';

    let { data } = $props<{ 
        data: {
            itemData: ItemSet;
            categories: Category[];
        }
    }>();

    async function handleDelete(itemId: number) {
        const response = await fetch(`${config.API_BASE_URL}/product/api/item/${itemId}/`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('删除失败');
        }

        // 删除成功后跳转到商品列表页面
        goto('/item');
    }
</script>

<svelte:head>
    <title>编辑商品 - {data.itemData.item.name}</title>
</svelte:head>

<div class="page-header">
    <h2>编辑商品</h2>
    <p>商品：<strong>{data.itemData.item.name}</strong> ({data.itemData.item.SKU})</p>
</div>

<ItemForm 
    mode="edit"
    initialData={{
        id: data.itemData.item.id,
        SKU: data.itemData.item.SKU,
        name: data.itemData.item.name,
        SKU_zite: data.itemData.item.SKU_zite,
        SKU_A: data.itemData.item.SKU_A,
        description: data.itemData.item.description,
        image: data.itemData.item.image,
        weight: data.itemData.item.weight,
        p_volume: data.itemData.item.p_volume,
        s_volume: data.itemData.item.s_volume,
        b_Price: data.itemData.item.b_Price,
        currency: data.itemData.item.currency,
        in_fee: data.itemData.item.in_fee,
        barcode: data.itemData.item.barcode,
        category: data.itemData.item.category
    }}
    categories={data.categories}
    onDelete={handleDelete}
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

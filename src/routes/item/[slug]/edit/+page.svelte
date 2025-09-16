<!-- 编辑商品 -->
<script lang="ts">
    import ItemForm from '$lib/components/ItemForm.svelte';
    import DeleteNavigationModal from '$lib/components/DeleteNavigationModal.svelte';
    import type { Category, ItemSet } from '$lib';
    import { goto } from '$app/navigation';
    import { config } from '$lib/config';

    let { data } = $props<{ 
        data: {
            itemData: ItemSet;
            categories: Category[];
        }
    }>();

    let showDeleteModal = $state(false);
    let deletedItemName = $state('');
    let deletedItemCategories = $state<Category[]>([]);

    async function handleDelete(itemId: number) {
        console.log('删除函数被调用, itemId:', itemId);
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/api/item/${itemId}/`, {
                method: 'DELETE',
            });

            console.log('删除请求响应:', response.status, response.ok);

            if (!response.ok) {
                throw new Error('删除失败');
            }

            // 删除成功后，收集信息并显示选择弹框
            deletedItemName = data.itemData.item.name;
            // 从itemData.categories中提取分类信息
            deletedItemCategories = data.itemData.categories.map(cat => cat.category);
            console.log('设置弹框状态:', {
                deletedItemName,
                deletedItemCategories,
                showDeleteModal: true
            });
            showDeleteModal = true;
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败，请稍后重试');
        }
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

<!-- 删除后的导航选择弹框 -->
<DeleteNavigationModal 
    bind:isOpen={showDeleteModal}
    itemName={deletedItemName}
    itemCategories={deletedItemCategories}
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

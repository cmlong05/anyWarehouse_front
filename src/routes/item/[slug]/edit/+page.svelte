<!-- 编辑品项 -->
<script lang="ts">
    import { goto } from '$app/navigation';
    import ItemForm from '$lib/components/ItemForm.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import type { Category, ItemSet } from '$lib';
    import { config } from '$lib/config';

    let { data } = $props<{ 
        data: {
            itemData: ItemSet;
            categories: Category[];
        }
    }>();

    let showDeleteModal = $state(false);
    let deleteLoading = $state(false);
    let error = $state('');

    async function handleDelete() {
        if (!data.itemData.item.id) return;
        
        deleteLoading = true;
        error = '';
        
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/item/${data.itemData.item.id}/`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('删除失败');
            }

            // 删除成功后跳转到物品所在分类（取第一个分类），如果没有则跳转到物品列表
            const firstCategory = data.itemData.categories?.[0]?.category;
            if (firstCategory) {
                goto(`/item/category/${firstCategory.id}`);
            } else {
                goto('/item');
            }
        } catch (err) {
            console.error('删除失败:', err);
            error = err instanceof Error ? err.message : '删除失败，请稍后重试';
            deleteLoading = false;
            showDeleteModal = false;
        }
    }
</script>

<svelte:head>
    <title>编辑品项 - {data.itemData.item.name}</title>
</svelte:head>

<div class="page-header">
    <h2>编辑品项</h2>
    <p>品项：<strong>{data.itemData.item.name}</strong> ({data.itemData.item.SKU})</p>
</div>

{#if error}
    <div class="error-alert" role="alert">
        {error}
    </div>
{/if}

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
    onShowDeleteModal={() => showDeleteModal = true}
/>

<!-- 删除确认弹框 -->
<ConfirmModal 
    isOpen={showDeleteModal}
    title="删除商品"
    message="确定要删除以下商品吗？此操作不可撤销。"
    itemName={data.itemData.item.name}
    confirmText="删除"
    cancelText="取消"
    loading={deleteLoading}
    onConfirm={handleDelete}
    onCancel={() => showDeleteModal = false}
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
    
    .error-alert {
        background-color: #fee2e2;
        border: 1px solid #fecaca;
        color: #991b1b;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
    }
</style>

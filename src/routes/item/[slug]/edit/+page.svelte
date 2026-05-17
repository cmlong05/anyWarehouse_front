<!-- 编辑品项 -->
<script lang="ts">
	import { logger } from '$lib/logger';
    import { goto } from '$app/navigation';
    import { PageContainer, PageHeader } from '$lib/components/layout';
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
                let message = '删除失败';
                try {
                    const errData = await response.json();
                    message = errData.detail || errData.message || message;
                } catch {
                    // ignore parse error
                }
                throw new Error(message);
            }

            // 删除成功后跳转到物品所在分类（取第一个分类），如果没有则跳转到物品列表
            const firstCategory = data.itemData.categories?.[0]?.category;
            if (firstCategory) {
                goto(`/item/category/${firstCategory.id}`);
            } else {
                goto('/item');
            }
        } catch (err) {
            logger.error('删除失败:', err);
            error = err instanceof Error ? err.message : '删除失败，请稍后重试';
            deleteLoading = false;
            showDeleteModal = false;
        }
    }
</script>

<svelte:head>
    <title>编辑品项 - {data.itemData.item.name}</title>
</svelte:head>

<PageContainer>
    <PageHeader 
        title="编辑品项"
        subtitle={`品项：${data.itemData.item.name} (${data.itemData.item.SKU})`}
    />

    {#if error}
        <div class="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4" role="alert">
            {error}
        </div>
    {/if}

    <ItemForm 
        mode="edit"
        initialData={{
            id: data.itemData.item.id,
            SKU: data.itemData.item.SKU,
            name: data.itemData.item.name,
            name_en: data.itemData.item.name_en,
            item_status: data.itemData.item.item_status,
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
            category: data.itemData.item.category,
            is_variant_template: data.itemData.item.is_variant_template
        }}
        categories={data.categories}
        onShowDeleteModal={() => showDeleteModal = true}
    />
</PageContainer>

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

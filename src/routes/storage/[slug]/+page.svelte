<script lang="ts">
    import StorageForm from '$lib/components/StorageForm.svelte';
    import type { StorageStandard, ContainerBriefID } from '$lib';
    import { goto } from '$app/navigation';
    import { config } from '$lib/config';

    let { data } = $props<{ 
        data: {
            storageDetail: StorageStandard & { itemSKU?: string }; 
            containers: ContainerBriefID[];
        }
    }>();

    async function handleDelete(storageId: number) {
        const response = await fetch(`${config.API_BASE_URL}/warehouse/api/storage/${storageId}/`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('删除失败');
        }

        // 删除成功后跳转到物品详情页
        goto(`/item/${data.storageDetail.item}`);
    }
</script>

<svelte:head>
    <title>编辑存储 - ID: {data.storageDetail.id}</title>
</svelte:head>

<div class="page-header">
    <h2>编辑存储</h2>
</div>

<StorageForm 
    mode="edit"
    initialData={{
        id: data.storageDetail.id,
        item: data.storageDetail.item,
        itemSKU: data.storageDetail.itemSKU,
        container: data.storageDetail.container,
        quantity: data.storageDetail.quantity,
        text: data.storageDetail.text,
        sample: data.storageDetail.sample
    }}
    containers={data.containers}
    onDelete={handleDelete}
/>
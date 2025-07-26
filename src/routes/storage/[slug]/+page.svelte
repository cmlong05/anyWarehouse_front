<script lang="ts">
    import StorageForm from '$lib/components/StorageForm.svelte';
    import type { Storagestandard, ContainerBriefID } from '$lib';

    let { data } = $props<{ 
        data: {
            storageDetail: Storagestandard & { itemSKU?: string }; 
            containers: ContainerBriefID[];
        }
    }>();
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
/>
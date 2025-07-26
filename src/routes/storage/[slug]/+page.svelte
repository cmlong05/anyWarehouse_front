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
    <p>修改存储记录的信息</p>
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

<style>
    .page-header {
        margin-bottom: 2rem;
    }

    .page-header h2 {
        margin: 0 0 0.5rem 0;
    }

    .page-header p {
        color: var(--fg-2);
        margin: 0;
    }
</style>
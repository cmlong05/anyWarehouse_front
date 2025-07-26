<script lang="ts">
    import StorageForm from '$lib/components/StorageForm.svelte';
    import type { ContainerBriefID } from '$lib';

    let { data } = $props<{ 
        data: {
            item: string; 
            itemSKU: string;
            containers: ContainerBriefID[];
        }
    }>();
</script>

<svelte:head>
    <title>添加存储 - 物品: {data.itemSKU}</title>
</svelte:head>

<div class="page-header">
    <h2>添加存储</h2>
    <p>为物品 <strong>{data.itemSKU}</strong> 创建新的存储记录</p>
</div>

<StorageForm 
    mode="add"
    itemId={data.item}
    itemSKU={data.itemSKU}
    containers={data.containers}
/>
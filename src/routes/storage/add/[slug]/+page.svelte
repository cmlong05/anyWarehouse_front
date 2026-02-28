<script lang="ts">
    import StorageForm from '$lib/components/StorageForm.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
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

<PageContainer maxWidth="md">
    <PageHeader 
        title="添加存储"
        subtitle="为物品 {data.itemSKU} 创建新的存储记录"
    />
    
    <StorageForm 
        mode="add"
        itemId={data.item}
        itemSKU={data.itemSKU}
        containers={data.containers}
    />
</PageContainer>

<!-- 新增库存页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import StorageForm from '$lib/components/StorageForm.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import type { ContainerBriefID } from '$lib';

    let { data } = $props<{ 
        data: {
            item: string; 
            itemName: string;
            itemSKU: string;
            containers: ContainerBriefID[];
        }
    }>();
</script>

<svelte:head>
    <title>新建库存位置 - 物品: {data.itemName || data.itemSKU}</title>
</svelte:head>

<PageContainer maxWidth="md">
    <PageHeader 
        title="新建库存位置"
        subtitle="为物品 {data.itemName || data.itemSKU} 创建新的存储记录"
    />
    
    <StorageForm 
        mode="add"
        itemId={data.item}
        itemSKU={data.itemSKU}
        containers={data.containers}
    />
</PageContainer>
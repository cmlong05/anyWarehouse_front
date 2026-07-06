<!-- 库存详情页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import { StorageForm } from '$lib/components';
    import type { StorageStandard, ContainerBriefID } from '$lib';
    import { goto } from '$app/navigation';
    import { apiClient } from '$lib/api';

    let { data } = $props<{ 
        data: {
            storageDetail: StorageStandard & { itemSKU?: string }; 
            containers: ContainerBriefID[];
        }
    }>();

    async function handleDelete(storageId: number) {
        await apiClient.deleteNoContent(`/warehouse/storage/${storageId}/`);
        goto(`/item/${data.storageDetail.item}`);
    }
</script>

<svelte:head>
    <title>编辑存储 - ID: {data.storageDetail.id}</title>
</svelte:head>

<PageContainer>
    <PageHeader title="编辑存储" />

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
</PageContainer>
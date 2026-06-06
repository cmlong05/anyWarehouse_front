<!-- 库存列表页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import { StorageForm } from '$lib/components';
    import type { ContainerBriefID } from '$lib';

    let { data } = $props<{ 
        data: {
            containers: ContainerBriefID[];
        }
    }>();
</script>

<svelte:head>
    <title>新建存储</title>
</svelte:head>

<PageContainer>
    <PageHeader 
        title="新建存储"
        subtitle="为物品创建新的存储记录"
    />

    <StorageForm 
        mode="add"
        containers={data.containers}
    />
</PageContainer>
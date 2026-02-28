<!-- 添加容器 -->
<script lang="ts">
    import ContainerForm from '$lib/components/ContainerForm.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import type { Container, ContainerBriefID } from '$lib';

    let { data } = $props<{ 
        data: {
            containers: ContainerBriefID[];
            parentContainer?: Container;
        }
    }>();
</script>

<svelte:head>
    <title>{data.parentContainer ? `添加子容器 - ${data.parentContainer.fastCode}` : '添加容器'}</title>
</svelte:head>

<PageContainer maxWidth="md">
    <PageHeader 
        title={data.parentContainer ? '添加子容器' : '添加容器'}
        subtitle={data.parentContainer 
            ? `父容器：${data.parentContainer.fastCode} - ${data.parentContainer.mark}`
            : '创建新的存储容器'}
    />
    
    <ContainerForm 
        mode="add"
        initialData={data.parentContainer ? {
            fastCode: '',
            barcode: '',
            mark: '',
            volume: 0,
            zz_volume: 0,
            zz_weight: 0,
            parent: data.parentContainer.id
        } : undefined}
        containers={data.containers}
    />
</PageContainer>

<!-- 添加容器 -->
<script lang="ts">
    import ContainerForm from '$lib/components/ContainerForm.svelte';
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

<div class="page-header">
    <h2>{data.parentContainer ? '添加子容器' : '添加容器'}</h2>
    {#if data.parentContainer}
        <p>父容器：<strong>{data.parentContainer.fastCode}</strong> - {data.parentContainer.mark}</p>
    {:else}
        <p>创建新的存储容器</p>
    {/if}
</div>

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

<style>
    .page-header {
        margin-bottom: 2rem;
        padding: 1rem 0;
        border-bottom: 1px solid #eee;
    }
    
    .page-header h2 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }
    
    .page-header p {
        margin: 0;
        color: #666;
        font-size: 0.95rem;
    }
</style>
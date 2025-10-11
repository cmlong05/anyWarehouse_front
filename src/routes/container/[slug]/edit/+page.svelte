<!-- 编辑容器 -->
<script lang="ts">
    import ContainerForm from '$lib/components/ContainerForm.svelte';
    import type { Container, ContainerBriefID } from '$lib';
    import { goto } from '$app/navigation';
    import { config } from '$lib/config';

    let { data } = $props<{ 
        data: {
            container: Container;
            containers: ContainerBriefID[];
        }
    }>();

    async function handleDelete(containerId: number) {
        const response = await fetch(`${config.API_BASE_URL}/warehouse/container/${data.container.fastCode}/`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('删除失败');
        }

        // 删除成功后跳转到父容器页面或首页
        if (data.container.parent) {
            goto(`/container/${data.container.parent}`);
        } else {
            goto('/');
        }
    }
</script>

<svelte:head>
    <title>编辑容器 - {data.container.fastCode}</title>
</svelte:head>

<div class="page-header">
    <h2>编辑容器</h2>
</div>

<ContainerForm 
    mode="edit"
    initialData={{
        id: data.container.id,
        fastCode: data.container.fastCode,
        barcode: data.container.barcode,
        mark: data.container.mark,
        volume: data.container.volume,
        zz_volume: data.container.zz_volume,
        zz_weight: data.container.zz_weight,
        a_volume: data.container.a_volume,
        total_weight: data.container.total_weight,
        parent: data.container.parent
    }}
    containers={data.containers}
    onDelete={handleDelete}
/>
<script lang="ts">
    import StorageForm from '$lib/components/StorageForm.svelte';
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

<div class="page-header">
    <h2>新建存储</h2>
    <p>为物品创建新的存储记录</p>
</div>

<StorageForm 
    mode="add"
    containers={data.containers}
/>
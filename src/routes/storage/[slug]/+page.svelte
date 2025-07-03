<script lang="ts">
    import type { Storagestandard } from '$lib';
    let { data } = $props<{ storageDetail: Storagestandard }>();
</script>

<svelte:head>
    <title>{data.storageDetail.id}</title>
</svelte:head>

<main>
    <h1>{data.storageDetail.id}</h1>
</main>

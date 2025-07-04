<script lang="ts">
    import type { Storagestandard } from '$lib';
    let { data } = $props<{ storageDetail: Storagestandard }>();
</script>

<svelte:head>
    <title>存储 {data.storageDetail.fastCode}</title>
</svelte:head>

<main>
    <!-- 直接以foam的形式展示，设置开关按钮，开启的关闭编辑模式 -->
    <h1>{data.storageDetail.id}</h1>
    <p>{data.storageDetail.item}</p>
    <p>{data.storageDetail.container}</p>
    <p>{data.storageDetail.quantity}</p>
</main>

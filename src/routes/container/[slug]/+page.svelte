<script lang="ts">
    import type { ContainerResponse } from '$lib';
    let { data } = $props<{ containerRes: ContainerResponse }>();

    console.log('data.containerRes:', data.containerRes);
</script>

<!-- 导航格 -->
<div class="navigation">
    <h2>导航格</h2>
    {#each data.containerRes.ancestors as ancestor, i}
        <a href="/container/{ancestor.fastCode}">{ancestor.fastCode}</a>
        {#if i < data.containerRes.ancestors.length - 1}
            <span>|</span>
        {/if}
    {/each}
</div>

<!-- 主内容 -->
<div class="main-content">
    <h2>子容器</h2>
    {#each data.containerRes.descendants as descendant}
        <div>
            <!-- 添加链接 -->
            <p>
                <a href={`/container/${descendant.fastCode}`} data-sveltekit-reload>
                    {descendant.fastCode}
                </a>
                标记: {descendant.mark}
            </p>
        </div>
    {/each}

    <h2>存储信息</h2>
    {#each data.containerRes.storages as storage}
        <div>
            <p>SKU: {storage.item_SKU}</p>
            <p>名称: {storage.item_name}</p>
            <p>数量: {storage.quantity}</p>
        </div>
    {/each}
</div>

<!-- 侧栏 -->
<div class="sidebar">
    <h2>兄弟容器</h2>
    {#each data.containerRes.siblings as sibling}
        <div>
            <p>快速代码: {sibling.fastCode}</p>
            <p>标记: {sibling.mark}</p>
        </div>
    {/each}
</div>

<style>
    .navigation {
        margin-bottom: 20px;
    }

    .main-content {
        float: left;
        width: 70%;
    }

    .sidebar {
        float: right;
        width: 25%;
    }
</style>
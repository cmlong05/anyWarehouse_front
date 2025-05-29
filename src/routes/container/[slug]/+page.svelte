<script lang="ts">
    import type { ContainerResponse } from '$lib';
    let { data } = $props<{ containerRes: ContainerResponse }>();
</script>

<!-- 导航格 -->
<div class="navigation">
    <h2>导航格</h2>
    {#each data.containerRes.ancestors as ancestor, i}
        <a href="/container/{ancestor.fastCode}">{ancestor.fastCode}</a>
        {#if i < data.containerRes.ancestors.length - 1}
            <span> &gt;&thinsp; </span>
        {/if}
    {/each}
</div>

<!-- 主内容 -->
<div class="main-content">

    <h2>本容器</h2>
    <p><strong>编号：{data.containerRes.container.fastCode}</strong></p>
    <p>{data.containerRes.container.mark}</p>
    <p>条形码：{data.containerRes.container.barcode}</p>
    <div style="display: flex; align-items: center; gap: 1em; margin: 1em 0;">
        <span>
            容量剩余：
            <strong>{data.containerRes.container.a_volume}</strong>
            /
            <strong>{data.containerRes.container.volume}</strong>
        </span>
        <meter
            value={data.containerRes.container.a_volume}
            min="0"
            max={data.containerRes.container.volume}
            style="
                display: block;
                width: {Math.max(100, data.containerRes.container.volume / 100)}px; 
                <!-- 需要调整 -->
                height: {Math.max(1.5, 66666/ 10000)}em;"
        ></meter>
    </div>



    <h2>子容器</h2>
    {#each data.containerRes.descendants as descendant}
        <div>
            <p>
                <a href={`/container/${descendant.fastCode}`}>
                    {descendant.fastCode}
                </a>
                标记: {descendant.mark}
            </p>
        </div>
    {/each}

    <h2>存储信息</h2>
    {#if data.containerRes.storages.length === 0}
        <p>暂无存储信息。</p>
    {:else}
        {#each data.containerRes.storages as storage}
            <div>
                <p>{storage.quantity} *
                    <a href={`/items/${storage.item_id}`}>{storage.item_SKU}
                    </a> {storage.item_name}
                </p>
            </div>
        {/each}
    {/if}
</div>

<!-- 侧栏 -->
<div class="sidebar">
    <h2>相邻</h2>
    {#each data.containerRes.siblings as sibling}
        <div>
            <p><a href={`/container/${sibling.fastCode}`} >
                    {sibling.fastCode}
                </a>
                {sibling.mark}
            </p>
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
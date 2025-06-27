<script lang="ts">
    import type { ContainerResponse } from '$lib';
    let { data } = $props<{ containerRes: ContainerResponse }>();
</script>

<!-- 导航格 -->
<nav class="navigation">
    <span>导航：</span>
    {#each data.containerRes.ancestors as ancestor, i}
        <a href="/container/{ancestor.fastCode}">{ancestor.fastCode}</a>
        {#if i < data.containerRes.ancestors.length}
            <span> &gt;&thinsp; </span>
        {/if}
    {/each}
    <span>{data.containerRes.container.fastCode}</span>
</nav>

<!-- 主内容 -->
<div class="div-left-70">
    <div class="div-full ">
        <p style="align-items: center; gap: 1em; margin:0;">
            <span>
                容量情况：<strong>{data.containerRes.container.a_volume} / {data.containerRes.container.volume}</strong>
            </span>
            <meter
            value={data.containerRes.container.a_volume}
            min="0"
            max={data.containerRes.container.volume}
            aria-valuetext="75%"

            style="
                display: block;
                max-width: 100%;
                width: calc(min(100%, {Math.max(100, data.containerRes.container.volume / 100)}px)); 
                height: 1.5em;
                box-sizing: border-box;
                "
            ></meter>
        </p>
    </div>
    <div class="div-full">
        <p><strong>{data.containerRes.container.fastCode}</strong> {data.containerRes.container.mark}</p>
        <p>条形码：{data.containerRes.container.barcode}</p>
    </div>
    <div class="div-full">
        <ul>
            <h3>子容器</h3>
            {#each data.containerRes.descendants as descendant}
                <li>
                    <a href={`/container/${descendant.fastCode}`}>
                        {descendant.fastCode}
                    </a>
                    -- {descendant.mark} -- <meter value={descendant.available_volume} max={descendant.base_volume}></meter>
                </li>
            {/each}
        </ul>
    </div>
    <div class="div-full">
        <ul>
            <h3>存储信息</h3>
            {#if data.containerRes.storages.length === 0}
                <p>无存储</p>
            {:else}
                {#each data.containerRes.storages as storage}
                    <li>
                        <span class="width26">
                            {storage.quantity}
                        </span> *
                        <a href={`/item/${storage.item_id}`}>{storage.item_SKU}
                        </a>  - {storage.item_name}
                    </li>
                {/each}
            {/if}
        </ul>
    </div>
</div>

<!-- 侧栏 -->
<div class="div-right-25">
    <h3>相邻</h3>
    {#each data.containerRes.siblings as sibling}
        <ul>
            <li>
                {#if sibling.fastCode == data.containerRes.container.fastCode}
                    <strong>{sibling.fastCode}</strong>
                {:else}
                    <a href={`/container/${sibling.fastCode}`} >
                        {sibling.fastCode}
                    </a>
                {/if}
            </li>
        </ul>

    {/each}
</div>

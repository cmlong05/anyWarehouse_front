<script lang="ts">
    // 修改导入的类型名
    import type { CategoryData } from '$lib';
    let { data } = $props<{ category_details: CategoryData }>();
</script>


<!-- 导航格 -->
<div class="navigation">
    <span>导航：</span>
    {#each data.category_details.ancestors as ancestor, i}
        <a href="/category/{ancestor.id}">{ancestor.name}</a>
        {#if i < data.category_details.ancestors.length }
            <span> &gt;&thinsp; </span>
        {/if}
    {/each}
    <span>{data.category_details.category.name} </span>
</div>

<div class="main-content">
    <h2>子分类</h2>
    <ul>
        {#each data.category_details.descendants as child} 
            <li><a href={`/category/${child.id}`} >{child.name}</a></li>
        {/each}
    </ul>
</div>

<div class="main-content">
    <h2>物品</h2>
    <ul>
        {#each data.category_details.items as { id, SKU, name }}
            <li><a href={`/items/${id}`}>{SKU}</a> {name} </li>
        {/each}
    </ul>
</div>

<!-- 侧栏 -->
<div class="sidebar">
    <h2>相邻分类</h2>
    {#each data.category_details.siblings as sibling}
        <div>
            <p><a href={`/category/${sibling.id}`} >
                    {sibling.name}
                </a></p>
        </div>
    {/each}
</div>

<mcfile name="+page.svelte" path="e:\anyWarehouse_front\src\routes\categories\[slug]\+page.svelte"></mcfile>
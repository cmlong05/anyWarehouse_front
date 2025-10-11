<script lang="ts">
    // 修改导入的类型名
    import type { CategoryData } from '$lib';
    let { data } = $props<{ category_details: CategoryData }>();
</script>

<svelte:head>
    <title>分类 {data.category_details.category.name}</title>
</svelte:head>

<!-- 导航格 -->
<nav class="navigation">
    <span>导航：</span>
    {#each data.category_details.ancestors as ancestor, i}
        <a href="/category/{ancestor.id}">{ancestor.name}</a>
        {#if i < data.category_details.ancestors.length }
            <span> &gt;&thinsp; </span>
        {/if}
    {/each}
    <span>{data.category_details.category.name}</span>
    <span> • </span>
    <a href="/category/{data.category_details.category.id}/edit" class="edit-link">编辑</a>
</nav>

<!-- 主内容 -->
<div class="div-left-70">
    <div class="div-left-70">
        <ul>
            <div class="section-header">
                <h3>物品</h3>
                <a href="/item/add?category={data.category_details.category.id}" class="edit-link">添加物品</a>
            </div>
            {#each data.category_details.items as { id, SKU, name }}
                <li><a href={`/item/${id}`}>{SKU}</a> {name} </li>
            {/each}
        </ul>
    </div>
    <div class="div-right-25">
        <ul>
            <div class="section-header">
                <h3>子分类</h3>
                <a href="/category/add?parent={data.category_details.category.id}" class="edit-link">添加</a>
            </div>
            {#each data.category_details.descendants as child} 
                <li><a href={`/category/${child.id}`} >{child.name}</a></li>
            {/each}
        </ul>
    </div>
</div>

<!-- 侧栏 -->
<div class="div-right-25">
    <h3>相邻分类</h3>
    {#each data.category_details.siblings as sibling}
        <div>
            <p>
                {#if sibling.id == data.category_details.category.id}
                    <strong>{sibling.name}</strong>
                {:else}
                    <a href={`/category/${sibling.id}`} >
                        {sibling.name}
                    </a>
                {/if}
            </p>
        </div>
    {/each}
</div>

<style>
    .section-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .section-header h3 {
        margin: 0;
        color: #333;
    }

    @media (max-width: 768px) {
        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style>

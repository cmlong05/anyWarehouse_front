<script lang="ts">
    import type { ItemSet } from '$lib';
    import { API_BASE_URL } from '$lib/config';
    let { data } = $props<{ itemDetail: ItemSet }>();
</script>

<!-- 导航格 -->

{#each data.itemDetail.categories as category}
    <nav class="navigation">
        {#each category.ancestors as ancestor, i}
            <a href="/category/{ancestor.id}">{ancestor.name}</a>
            {#if i < category.ancestors.length}
                <span> &gt;&thinsp; </span>
            {/if}
        {/each}
        <a href="/category/{category.category.id}">{category.category.name} </a> 
    </nav>
{/each}    


<!-- 主内容 -->
<div class="div-left-70">
    <div class="image-container">
        <img 
            src={data.itemDetail.item.image ? `${API_BASE_URL}${data.itemDetail.item.image.trim()}` : ''} 
            style="max-width: 100%; height: auto; max-height: 400px;" 
            alt={data.itemDetail.item.name} 
            loading="lazy" 
        />
    </div>
    <div class="div-right">
        <p>{data.itemDetail.item.name}</p>
        <p><strong>SKU:</strong> {data.itemDetail.item.SKU}</p>
        <p><strong>重量:</strong> {data.itemDetail.item.weight} 克</p>
        <p><strong>体积 (S):</strong> {data.itemDetail.item.s_volume} 立方厘米</p>
        <p><strong>价格:</strong> {data.itemDetail.item.b_Price} {data.itemDetail.item.currency || '货币单位未知'}</p>
        <p><strong>组件:</strong> {data.itemDetail.item.components.length > 0 ? data.itemDetail.item.components.join(', ') : '无组件'}</p>
        <div class="div-full">
            <p><strong>存储:</strong></p>
            {#if data.itemDetail.storages.length === 0}
                <p>无库存</p>
            {:else}
                <ul>
                    {#each data.itemDetail.storages as storage}
                        <li>
                            <a href={`/container/${storage.container_fastCode}`}>{storage.container_fastCode}
                            </a> -- {storage.quantity} -- {storage.mark}
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>    
    </div>
    <div class="div-full">
        <p><strong>详情:</strong></p>
        <p class = "text-p">{data.itemDetail.item.description || ''}</p>
    </div>
</div>

<div class="div-right-25">
    {#each data.itemDetail.categories as category}
        <ul>
            <nav class="navside navigation"><a href="/category/{category.category.id}">{category.category.name}</a></nav>
            {#each category.items as cateItem}
                <div>
                    {#if cateItem.SKU == data.itemDetail.item.SKU}
                        <li> <strong>{cateItem.SKU}</strong> {cateItem.name}</li>
                    {:else}
                        <li><a href="/item/{cateItem.id}"> {cateItem.SKU}</a> {cateItem.name}</li>
                    {/if}
                </div>
            {/each}
        </ul>
    {/each}
</div>


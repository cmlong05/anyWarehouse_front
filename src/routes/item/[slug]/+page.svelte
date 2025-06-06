<script lang="ts">
    import type { ItemSet } from '$lib';
    import { API_BASE_URL } from '$lib/config';
    let { data } = $props<{ itemDetail: ItemSet }>();
</script>

<!-- 导航格 -->
<div class="navigation">
    {#each data.itemDetail.categories as category}
        {#each category.ancestors as ancestor, i}
            <a href="/category/{ancestor.id}">{ancestor.name}</a>
            {#if i < category.ancestors.length}
                <span> &gt;&thinsp; </span>
            {/if}
        {/each}
    <a href="/category/{category.category.id}">{category.category.name} </a> <br>
    {/each}    
</div>

<!-- 主内容 -->
<div class="main-content">
    <div class="image-container">
        <img 
            src={data.itemDetail.item.image ? `${API_BASE_URL}${data.itemDetail.item.image.trim()}` : ''} 
            style="max-width: 100%; height: auto; max-height: 400px;" 
            alt={data.itemDetail.item.name} 
            loading="lazy" 
        />
    </div>
    <div class="attribute-container">
        <p>{data.itemDetail.item.name}</p>
        <p><strong>SKU:</strong> {data.itemDetail.item.SKU}</p>
        <p><strong>重量:</strong> {data.itemDetail.item.weight} 克</p>
        <p><strong>体积 (S):</strong> {data.itemDetail.item.s_volume} 立方厘米</p>
        <p><strong>价格:</strong> {data.itemDetail.item.b_Price} {data.itemDetail.item.currency || '货币单位未知'}</p>
        <p><strong>组件:</strong> {data.itemDetail.item.components.length > 0 ? data.itemDetail.item.components.join(', ') : '无组件'}</p>
    </div>
    <div class="detail-description">
        <p class = "text-p">{data.itemDetail.item.description || '无描述'}</p>
    </div>
</div>

<div class="sidebar">
    <h3>同级物品</h3>
    {#each data.itemDetail.categories as category}
        <div>
            <p><strong>{category.name}</strong></p>
            {#each category.items as cateItem}
                <div>
                    {#if cateItem.SKU == data.itemDetail.item.SKU}
                        <p> <strong>{cateItem.SKU}</strong> {cateItem.name}</p>
                    {:else}
                        <p><a href="/item/{cateItem.id}"> {cateItem.SKU}</a> {cateItem.name}</p>
                    {/if}
                </div>
            {/each}
        </div>
    {/each}
</div>


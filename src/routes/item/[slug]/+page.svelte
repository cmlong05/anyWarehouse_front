<script lang="ts">
    import type { ItemSet } from '$lib';
    import { API_BASE_URL } from '$lib/config';
    let { data } = $props<{ itemDetail: ItemSet }>();
</script>

<!-- 导航格 -->
<div class="navigation">
    <span>导航：</span>
    {#each data.itemDetail.categories as category}
        {#each category.ancestors as ancestor, i}
            <a href="/container/{ancestor.id}">{ancestor.name}</a>
            {#if i < category.ancestors.length}
                <span> &gt;&thinsp; </span>
            {/if}
        {/each}
    {/each}    
    <span></span>
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
    <div class="info-container">
        <p>{data.itemDetail.item.name}</p>
        <p><strong>SKU:</strong> {data.itemDetail.item.SKU}</p>
        <p class = "text-p">{data.itemDetail.item.description || '无描述'}</p>
        <p><strong>重量:</strong> {data.itemDetail.item.weight} 克</p>
        <p><strong>体积 (S):</strong> {data.itemDetail.item.s_volume} 立方厘米</p>
        <p><strong>价格:</strong> {data.itemDetail.item.b_Price} {data.itemDetail.item.currency || '货币单位未知'}</p>
        <p><strong>分类:</strong> {data.itemDetail.item.category.join(', ')}</p>
        <p><strong>组件:</strong> {data.itemDetail.item.components.length > 0 ? data.itemDetail.item.components.join(', ') : '无组件'}</p>
    </div>
</div>

<div class="sidebar">
    <h2>同级物品</h2>
    {#each data.itemDetail.categories as category}
        <div>
            <p><strong>{category.name}</strong></p>
            {#each category.items as cateItem}
                <div>
                    <!-- 考虑此处是否可以优化 -->
                    {#if cateItem.SKU != data.itemDetail.item.SKU}
                        <p><a href="/item/{cateItem.id}"> {cateItem.SKU}</a> {cateItem.name}</p>
                    {/if}
                </div>
            {/each}
        </div>
    {/each}
</div>


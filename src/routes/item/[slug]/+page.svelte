<script lang="ts">
    import type { Item, CategoryData } from '$lib';
    let { data } = $props<{ item: Item; categoryItemsArray: CategoryData[] }>();
</script>

<!-- 导航格 -->
<div class="navigation">

</div>

<!-- 主内容 -->
<div class="main-content">
        <div class="item-details">
        <div>
            <h1>{data.item.name}</h1>
            <p></p>
        </div>
        <div>
            <div class="item-container">
                <div class="image-container">
                    <img 
                        src={data.item.image ? data.item.image.trim() : ''} 
                        style="max-width: 100%; height: auto; max-height: 400px;" 
                        alt={data.item.name} 
                        loading="lazy" 
                    />
                </div>
                <div class="info-container">
                    <p><strong>SKU:</strong> {data.item.SKU}</p>
                    <p class = "text-p">{data.item.description || '无描述'}</p>
                    <p><strong>重量:</strong> {data.item.weight} 克</p>
                    <p><strong>体积 (P):</strong> {data.item.p_volume} 立方厘米</p>
                    <p><strong>体积 (S):</strong> {data.item.s_volume} 立方厘米</p>
                    <p><strong>价格:</strong> {data.item.b_Price} {data.item.currency || '货币单位未知'}</p>
                    <p><strong>添加日期:</strong> {data.item.date_added}</p>
                    <p><strong>分类:</strong> {data.item.category.join(', ')}</p>
                    <p><strong>组件:</strong> {data.item.components.length > 0 ? data.item.components.join(', ') : '无组件'}</p>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="sidebar">
    <h2>同级物品</h2>
    {#each data.categoryItemsArray as category}
        <div>
            <p><strong>{category.name}</strong></p>
            {#each category.items as cateItem}
                <div>
                    <!-- 考虑此处是否可以优化 -->
                    {#if cateItem.SKU != data.item.SKU}
                        <p><a href="/items/{cateItem.id}"> {cateItem.SKU}</a> {cateItem.name}</p>
                    {/if}
                </div>
            {/each}
        </div>
    {/each}
</div>


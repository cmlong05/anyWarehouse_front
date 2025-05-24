<script lang="ts">
    import type { Item } from '$lib';
    let { data } = $props<{ item: Item; siblingItems: Item[] }>();
</script>

<style>
    .main-container {
        display: flex;
        gap: 20px;
    }
    .item-details {
        flex: 1;
    }
    .sibling-items {
        flex: 0 0 30%;
    }
    .item-container {
        display: flex;
        gap: 20px;
    }
    .image-container {
        flex: 0 0 30%;
    }
    .info-container {
        flex: 1;
    }
</style>

{#if data.item}
    <div class="main-container">
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
                        <p><strong>描述:</strong> {data.item.description || '无描述'}</p>
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
        <div class="sibling-items">
            <h2>同级物品</h2>
            {#each data.siblingItems as siblingItem}
                <div>
                    <p><strong>SKU:</strong> {siblingItem.SKU}</p>
                    <p><strong>名称:</strong> {siblingItem.name}</p>
                </div>
            {/each}
        </div>
    </div>
{:else}
    <p>暂无商品数据</p>
{/if}
<script lang="ts">
    import type { Item } from '$lib';
    let { data } = $props<{ item: Item }>();
</script>

{#if data.item}
    <div>
        <h1>{data.item.name}</h1>
        <div style="float: left; width: 30%; padding-right: 20px;">
            <img src={data.item.image.trim()} style="max-width: 100%; height: auto;" alt={data.item.name} />
        </div>
        <div>
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
{:else}
    <p>暂无商品数据</p>
{/if}
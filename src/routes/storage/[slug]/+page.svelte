<script lang="ts">
    import type { Storagestandard } from '$lib';
    let { data } = $props<{ storageDetail: Storagestandard }>();
</script>

<svelte:head>
    <title>存储 {data.storageDetail.fastCode}</title>
</svelte:head>

<main>
    <!-- 直接以form的形式展示 -->
    <form>
        <span>id: {data.storageDetail.id}</span>
        <label>
            名称
            <input type="text" value={data.storageDetail.item} />
        </label>
        <label>
            位置
            <input type="text" value={data.storageDetail.container} />
        </label>
        <label>
            数量
            <input type="text" value={data.storageDetail.quantity} />
        </label>
        <label>
            备注
            <input type="text" value={data.storageDetail.text} />
        </label>
        <label>
            样品
            <input type="checkbox" value={data.storageDetail.sample} />
        </label>

        <div style="display: flex; gap: 10px;">
            <button>提交修改</button>
            <button>取消修改</button>
            <button>删除</button>
        </div>
    </form>

</main>

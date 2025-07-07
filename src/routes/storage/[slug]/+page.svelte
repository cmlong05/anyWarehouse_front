<script lang="ts">
    import type { Storagestandard } from '$lib';
    let { data } = $props<{ storageDetail: Storagestandard }>();
</script>

<svelte:head>
    <title>存储 {data.storageDetail.fastCode}</title>
</svelte:head>

<main>
    <!-- 直接以form的形式展示 -->
    <form method="POST">
        <span>id: {data.storageDetail.id}</span>
        <label>
            名称
            <input type="text" name="item" value={data.storageDetail.item} required />
        </label>
        <label>
            位置
            <input type="text" name="container" value={data.storageDetail.container} required />
        </label>
        <label>
            数量
            <input type="text" name="quantity" value={data.storageDetail.quantity} required />
        </label>
        <label>
            备注
            <input type="text" name="text" value={data.storageDetail.text} />
        </label>
        <label>
            样品
            <input type="checkbox" name="sample" checked={data.storageDetail.sample} />
        </label>

        <div style="display: flex; gap: 10px;">
            <button type="submit">提交修改</button>
            <button
                onclick={async (event) => {
                    const button = event.target as HTMLButtonElement;
                    button.disabled = true;
                    window.history.back();
                }}>取消修改</button>
            <button>删除存储</button>
        </div>
    </form>

</main>

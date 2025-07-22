<script lang="ts">
    import type { Storagestandard, ContainerBriefID } from '$lib';
    import Svelecte from 'svelecte';

    let { data } = $props<{ storageDetail: Storagestandard, ContainerBriefDetails: ContainerBriefID[] }>();

    // 转换为 Svelecte 需要的格式
    const selectItems = data.ContainerBriefDetails.map((item: ContainerBriefID) => ({
        value: item.id,
        label: item.fastCode
    }));
</script>

<svelte:head>
    <title>存储 {data.storageDetail.fastCode}</title>
</svelte:head>

<main>
    <!-- 直接以form的形式展示 -->
    <form method="POST">
        <span>存储id: {data.storageDetail.id}</span>
        <label>
            名称
            <select name="item">
                <option value={data.storageDetail.item}>{data.storageDetail.item}</option>
            </select>
        </label>
        <label>
            位置
            <Svelecte
                name="container"
                options={selectItems}
                value={data.storageDetail.container}
                required
            />
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
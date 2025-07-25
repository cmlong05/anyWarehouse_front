<script lang="ts">
    import type { ContainerBriefID } from '$lib';
    import Svelecte from 'svelecte';
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';

    let { data } = $props<{ item: string, ContainerBriefDetails: ContainerBriefID[] }>();

    // 转换为 Svelecte 需要的格式
    const selectItems = data.ContainerBriefDetails.map((item: ContainerBriefID) => ({
        value: item.id,
        label: item.fastCode
    }));

    // 表单数据初始值
    let formData = {
        item: data.item,
        container: '',
        quantity: '',
        text: '',
        sample: false
    };

    // 添加表单处理函数
    function handleSubmit() {
        return async ({ result }: { result: { type: string } }) => {
            if (result.type === 'success') {
                // 提交成功后返回到 item 页面
                await goto(`/item/${data.item}`);
            }
        };
    }
</script>

<svelte:head>
    <title>添加存储 - {data.item}</title>
</svelte:head>

<main>
    <form 
        method="POST" 
        use:enhance={handleSubmit}
    >
        <label>
            名称
            <input type="text" name="item" value={formData.item} readonly />
        </label>

        <label>
            位置
            <Svelecte
                name="container"
                options={selectItems}
                value={formData.container}
                required
            />
        </label>

        <label>
            数量
            <input type="text" name="quantity" bind:value={formData.quantity} required />
        </label>

        <label>
            备注
            <input type="text" name="text" bind:value={formData.text} />
        </label>

        <label>
            样品
            <input type="checkbox" name="sample" bind:checked={formData.sample} />
        </label>

        <div>
            <button type="submit">添加存储</button>
            <button
                onclick={async (event) => {
                    const button = event.target as HTMLButtonElement;
                    button.disabled = true;
                    window.history.back();
                }}>取消</button>
        </div>
    </form>
</main>

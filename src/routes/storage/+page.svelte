<script lang="ts">
    
</script>

<svelte:head>
    <title>新建存储</title>
</svelte:head>

<main>
    <form method="POST">
        <label>
            名称
            <input type="text" name="item" required />
        </label>
        <label>
            位置
            <input type="text" name="container"required />
        </label>
        <label>
            数量
            <input type="text" name="quantity" required />
        </label>
        <label>
            备注
            <input type="text" name="text" />
        </label>
        <label>
            样品
            <input type="checkbox" name="sample" />
        </label>

        <div style="display: flex; gap: 10px;">
            <button type="submit">提交</button>
            <button
                onclick={async (event) => {
                    const button = event.target as HTMLButtonElement;
                    button.disabled = true;
                    window.history.back();
                }}>取消</button>
        </div>
    </form>

</main>

<script lang="ts">
    export let data;

    // 为 data 定义类型，假设 container 是一个对象，可根据实际情况调整
    type DataWithContainer = {
        container: any;
    };

    const { container } = data as DataWithContainer;
</script>

{#if container}
    <!-- 导航格 -->
    <div class="navigation">
        <h2>导航格</h2>
        {#each container.ancestors as ancestor}
            <span>{ancestor}</span>
        {/each}
    </div>

    <!-- 主内容 -->
    <div class="main-content">
        <h2>子容器</h2>
        {#each container.descendants as descendant}
            <div>
                <p>快速代码: {descendant.fastCode}</p>
                <p>标记: {descendant.mark}</p>
            </div>
        {/each}

        <h2>存储信息</h2>
        {#each container.storages as storage}
            <div>
                <p>SKU: {storage.item_SKU}</p>
                <p>名称: {storage.item_name}</p>
                <p>数量: {storage.quantity}</p>
            </div>
        {/each}
    </div>

    <!-- 侧栏 -->
    <div class="sidebar">
        <h2>兄弟容器</h2>
        {#each container.siblings as sibling}
            <div>
                <p>快速代码: {sibling.fastCode}</p>
                <p>标记: {sibling.mark}</p>
            </div>
        {/each}
    </div>
{:else}
    <p>加载容器数据时出错，请稍后重试。</p>
{/if}

<style>
    .navigation {
        margin-bottom: 20px;
    }

    .main-content {
        float: left;
        width: 70%;
    }

    .sidebar {
        float: right;
        width: 25%;
    }
</style>
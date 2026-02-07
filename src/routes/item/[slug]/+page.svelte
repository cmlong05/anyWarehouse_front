<script lang="ts">
    import type { ItemSet } from '$lib';
    import { config } from '$lib/config';
    import ItemComponentManager from '$lib/components/ItemComponentManager.svelte';

    let { data } = $props<{ data: { itemDetail: ItemSet } }>();
    let inputRefs: (HTMLInputElement | null)[] = [];

    const handleStorage = async (event: Event, storage: any, inputElement: HTMLInputElement) => {
        event.preventDefault();
        
        const quantity = parseInt(inputElement.value);
        if (isNaN(quantity) || quantity <= 0) {
            alert('请输入有效的出库数量');
            return;
        }
        if (quantity > storage.quantity) {
            alert('出库数量不能超过库存数量');
            return;
        }

        try {
            const newQuantity = storage.quantity - quantity;
            const response = await fetch(`${config.API_BASE_URL}/warehouse/storage/${storage.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quantity: newQuantity
                }),
            });

            if (response.ok) {
                // 更新本地数据
                const updatedStorage = await response.json();
                // 找到并更新对应的存储记录
                const index = data.itemDetail.storages.findIndex((s: typeof storage) => s.id === storage.id);
                if (index !== -1) {
                    data.itemDetail.storages[index] = {
                        ...data.itemDetail.storages[index],
                        ...updatedStorage
                    };
                }
                // 重置输入框
                inputElement.value = '1';
                // 强制更新数据
                data = { ...data };
            } else {
                alert('出库失败，请稍后重试');
            }
        } catch (error) {
            console.error('出库错误:', error);
            alert('网络错误，请检查网络连接');
        }
    };
</script>

<svelte:head>
    <title>{data.itemDetail.item.name}</title>
</svelte:head>

<!-- 导航格 -->
{#each data.itemDetail.categories as category}
    <nav class="navigation">
        {#each category.ancestors as ancestor, i}
            <a href="/category/{ancestor.id}">{ancestor.name}</a>
            {#if i < category.ancestors.length}
                <span> &gt;&thinsp; </span>
            {/if}
        {/each}
        <a href="/category/{category.category.id}">{category.category.name} </a> 
    </nav>
{/each}

<!-- 主内容 -->
<div class="content-wrapper">
<div class="div-left-70">
    <div class="image-container">
        <img 
            src={data.itemDetail.item.image ? data.itemDetail.item.image.trim() : ''} 
            style="max-width: 100%; height: auto; max-height: 400px;" 
            alt={data.itemDetail.item.name} 
            loading="lazy" 
        />
    </div>
    <div class="div-right">
        <h2>{data.itemDetail.item.name}</h2>
        <p><strong>SKU:</strong> {data.itemDetail.item.SKU}
            <a href="/item/{data.itemDetail.item.id}/edit" class="edit-link">编辑</a>
        </p>
        <p><strong>重量:</strong> {data.itemDetail.item.weight} 克</p>
        <p><strong>体积 (S):</strong> {data.itemDetail.item.s_volume} 立方厘米</p>
        <p><strong>价格:</strong> {data.itemDetail.item.b_Price} {data.itemDetail.item.currency || '货币单位未知'}</p>
        <div class="div-full">
            <p><strong>存储:</strong>
                <a href="/storage/add/{data.itemDetail.item.id}">添加</a>
            </p>
            <div>
                {#if data.itemDetail.storages.length > 0}
                    <ul>
                        {#each data.itemDetail.storages as storage, idx (storage.id)}
                            <li>
                                <a href={`/container/${storage.container_fastCode}`}>{storage.container_fastCode}
                                </a> -- 
                                <a title="{storage.mark}" href="/storage/{storage.id}" style="{storage.mark ? 'background-color: pink; padding-left: 8px; padding-right: 8px;' : 'background-color: beige; padding-left: 8px; padding-right: 8px;'}">{storage.quantity} </a>  
                                --
                                <input
                                    type="number"
                                    value="1"
                                    style="width: 4em;"
                                    bind:this={inputRefs[idx]}
                                />
                                <button
                                    onclick={(e) => {
                                        const input = inputRefs[idx];
                                        if (input) handleStorage(e, storage, input);
                                    }}
                                >出库</button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>    
    </div>
    <div class="div-full">
        <p><strong>详情:</strong></p>
        <p class = "text-p">{data.itemDetail.item.description || ''}</p>
    </div>

    <!-- BOM 组件管理 -->
    <div class="div-full">
        <ItemComponentManager 
            itemId={data.itemDetail.item.id}
            itemSKU={data.itemDetail.item.SKU}
            itemName={data.itemDetail.item.name}
        />
    </div>
</div>

<div class="div-right-25">
    {#each data.itemDetail.categories as category}
        <ul>
            <nav class="navside navigation"><a href="/category/{category.category.id}">{category.category.name}</a></nav>
            {#each category.items as cateItem}
                <div>
                    {#if cateItem.SKU == data.itemDetail.item.SKU}
                        <li> <strong>{cateItem.SKU}</strong> {cateItem.name}</li>
                    {:else}
                        <li><a href="/item/{cateItem.id}"> {cateItem.SKU}</a> {cateItem.name}</li>
                    {/if}
                </div>
            {/each}
        </ul>
    {/each}
</div>
</div>

<style>
    /* 让 sidebar 顶部与左侧内容对齐 */
    .div-right-25 {
        margin-top: 0;
    }
    .content-wrapper {
        display: flex;
        align-items: flex-start;
        gap: 2rem;
    }

    .div-right h2 {
        font-weight: bold;
    }
</style>
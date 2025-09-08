<script lang="ts">
    import type { ItemSet } from '$lib';
    import { config } from '$lib/config';
    import { invalidate } from '$app/navigation';
    
    let { data } = $props<{ itemDetail: ItemSet }>();
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
            const response = await fetch(`${config.API_BASE_URL}/warehouse/api/storage/${storage.id}/`, {
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

<!-- 页面操作 -->
<div class="page-actions">
    <h1>{data.itemDetail.item.name}</h1>
    <div class="actions">
        <a href="/item/{data.itemDetail.item.id}/edit" class="btn btn-primary">编辑商品</a>
    </div>
</div>


<!-- 主内容 -->
<div class="div-left-70">
    <div class="image-container">
        <img 
            src={data.itemDetail.item.image ? `${config.API_BASE_URL}${data.itemDetail.item.image.trim()}` : ''} 
            style="max-width: 100%; height: auto; max-height: 400px;" 
            alt={data.itemDetail.item.name} 
            loading="lazy" 
        />
    </div>
    <div class="div-right">
        <p><strong>SKU:</strong> {data.itemDetail.item.SKU}</p>
        <p><strong>重量:</strong> {data.itemDetail.item.weight} 克</p>
        <p><strong>体积 (S):</strong> {data.itemDetail.item.s_volume} 立方厘米</p>
        <p><strong>价格:</strong> {data.itemDetail.item.b_Price} {data.itemDetail.item.currency || '货币单位未知'}</p>
        <p><strong>组件:</strong> {data.itemDetail.item.components.length > 0 ? data.itemDetail.item.components.join(', ') : '无组件'}</p>
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

<style>
    .page-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 1rem 0 2rem 0;
        padding: 1rem 0;
        border-bottom: 1px solid #eee;
    }

    .page-actions h1 {
        margin: 0;
        color: #333;
        font-size: 1.8rem;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: background-color 0.15s ease-in-out;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-primary:hover {
        background-color: #0056b3;
    }

    @media (max-width: 768px) {
        .page-actions {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .page-actions h1 {
            font-size: 1.5rem;
        }
    }
</style>
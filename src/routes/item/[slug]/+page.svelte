<script lang="ts">
    import type { ItemSet, QuotationBrief } from '$lib';
    import { config } from '$lib/config';
    import ItemComponentManager from '$lib/components/ItemComponentManager.svelte';
    import { NumberStepper } from '$lib/components/ui';

    let { data } = $props<{ 
        data: { 
            itemDetail: ItemSet;
            quotations: QuotationBrief[];
            bestPrice: { price: string; supplier: string; quotation_id: number } | null;
        } 
    }>();
    
    function formatPrice(price: string): string {
        return parseFloat(price).toFixed(2);
    }
    let quantityValues = $state<Record<number, number>>({});

    const handleStorage = async (event: Event, storage: any) => {
        event.preventDefault();
        
        const quantity = quantityValues[storage.id] ?? 1;
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
                quantityValues[storage.id] = 1;
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
    
    // 初始化出库数量默认值
    $effect(() => {
        if (data.itemDetail?.storages) {
            data.itemDetail.storages.forEach((storage: any) => {
                if (quantityValues[storage.id] === undefined) {
                    quantityValues[storage.id] = 1;
                }
            });
        }
    });
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
                                <NumberStepper
                                    bind:value={quantityValues[storage.id]}
                                    min={1}
                                    max={storage.quantity}
                                    step={1}
                                    size="sm"
                                />
                                <button
                                    onclick={(e) => handleStorage(e, storage)}
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
    
    <!-- 供应商报价 -->
    <div class="div-full quotations-section">
        <h3>供应商报价</h3>
        {#if data.quotations.length === 0}
            <p class="empty">暂无报价</p>
            <a href="/supplier/quotation/add?item_id={data.itemDetail.item.id}" class="btn btn-primary">添加报价</a>
        {:else}
            {#if data.bestPrice}
                <p class="best-price">
                    最优价格: <strong>{formatPrice(data.bestPrice.price)}</strong> 
                    来自 {data.bestPrice.supplier}
                </p>
            {/if}
            <table class="quotations-table">
                <thead>
                    <tr>
                        <th>供应商</th>
                        <th>单价</th>
                        <th>货币</th>
                        <th>MOQ</th>
                        <th>首选</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.quotations as quotation}
                        <tr>
                            <td>
                                <a href="/supplier/{quotation.supplier}">{quotation.supplier_name}</a>
                            </td>
                            <td class="numeric">{formatPrice(quotation.price)}</td>
                            <td>{quotation.currency}</td>
                            <td>{quotation.min_quantity}</td>
                            <td>
                                {#if quotation.is_preferred}
                                    <span class="preferred-badge">★ 首选</span>
                                {:else}
                                    <span class="muted">-</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            <a href="/supplier/quotation/add?item_id={data.itemDetail.item.id}" class="btn btn-primary btn-sm">添加报价</a>
        {/if}
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
    
    .quotations-section {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f9fafb;
        border-radius: 0.5rem;
    }
    
    .quotations-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #374151;
    }
    
    .best-price {
        color: #059669;
        margin-bottom: 1rem;
    }
    
    .quotations-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }
    
    .quotations-table th,
    .quotations-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .quotations-table th {
        font-weight: 600;
        color: #374151;
        background: #f3f4f6;
    }
    
    .numeric {
        text-align: right;
        font-family: monospace;
    }
    
    .preferred-badge {
        background: #fef3c7;
        color: #d97706;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .muted {
        color: #9ca3af;
    }
    
    .empty {
        color: #6b7280;
        margin-bottom: 1rem;
    }
    
    .btn {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.9rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
    }
    
    .btn-primary {
        background: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover {
        background: #2563eb;
    }
    
    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.85rem;
    }
</style>
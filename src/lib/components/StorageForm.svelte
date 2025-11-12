<script lang="ts">
    import type { ContainerBriefID } from '$lib';
    import Svelecte from 'svelecte';
    import { config } from '$lib/config';
    import { goto } from '$app/navigation';

    interface Props {
        mode: 'add' | 'edit';
        initialData?: {
            id?: number;
            item: string | number;
            itemSKU?: string; // 添加 SKU 显示
            container: string | number;
            quantity: string | number;
            text: string;
            sample: boolean;
        };
        containers: ContainerBriefID[];
        itemId?: string;
        itemSKU?: string; // 添加模式下的 SKU
        onCancel?: () => void;
        onDelete?: (storageId: number) => Promise<void>;
    }

    let { mode, initialData, containers, itemId, itemSKU, onCancel, onDelete }: Props = $props();
    
    // 转换为 Svelecte 需要的格式
    const selectItems = $derived(containers.map((item: ContainerBriefID) => ({
        value: item.id,
        label: item.fastCode
    })));

    // 表单数据 - 修复：安全访问 initialData 属性
    let formData = $state({
        item: initialData?.item || itemId || '',
        container: initialData?.container || '',
        quantity: initialData?.quantity || '',
        text: initialData?.text || '',
        sample: initialData?.sample || false
    });

    // 获取显示用的物品标识 - 修复：安全访问 initialData 属性
    const displayItem = mode === 'edit' 
        ? (initialData?.itemSKU || initialData?.item || '') 
        : (itemSKU || itemId || '');

    // 提交表单
    async function handleSubmit(event: Event) {
        event.preventDefault();
        
        const submitData = {
            item: Number(formData.item),
            container: Number(formData.container),
            quantity: Number(formData.quantity),
            text: formData.text || '',
            sample: formData.sample
        };

        try {
            let response;
            if (mode === 'add') {
                // 添加新存储
                response = await fetch(`${config.API_BASE_URL}/warehouse/storage/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submitData),
                });
            } else {
                // 更新现有存储
                response = await fetch(`${config.API_BASE_URL}/warehouse/storage/${initialData?.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submitData),
                });
            }

            if (response.ok) {
                // 成功后跳转回物品页面
                await goto(`/item/${submitData.item}`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`${mode === 'add' ? '创建' : '更新'}存储失败: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert(`网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    // 取消操作
    function handleCancel() {
        if (onCancel) {
            onCancel();
        } else {
            window.history.back();
        }
    }

    // 删除操作：在 iOS Safari 上，必须在用户手势的同步回调内调用 confirm
    // 避免在 async 函数中（或 confirm 之前有任何 await/微任务）调用导致弹窗被系统拦截
    function handleDeleteClick() {
        if (!initialData?.id || !onDelete) return;

        const confirmed = confirm('确定要删除这个存储记录吗？这个操作不可撤销。');
        if (!confirmed) return;

        // 将异步删除逻辑放到 confirm 之后执行，保持 confirm 在同步用户手势内触发
        Promise.resolve(onDelete(initialData.id)).catch((error) => {
            alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
        });
    }
</script>

<form onsubmit={handleSubmit}>
    {#if mode === 'edit' && initialData?.id}
        <div class="storage-id">
            存储ID: {initialData.id}
        </div>
    {/if}

    <label>
        物品
        {#if mode === 'edit'}
            <input type="text" value={displayItem} disabled />
            <!-- 隐藏字段确保 item ID 被提交 -->
            <input type="hidden" name="item" value={formData.item} />
        {:else}
            <input type="text" value={displayItem} readonly />
            <input type="hidden" name="item" value={formData.item} />
        {/if}
    </label>

    <label>
        存储位置
        <Svelecte
            name="container"
            options={selectItems}
            bind:value={formData.container}
            searchProps={{ fields: ['label'] }}
            required
        />
    </label>

    <label>
        数量
        <input type="number" name="quantity" bind:value={formData.quantity} required min="1" />
    </label>

    <label>
        备注
        <input type="text" name="text" bind:value={formData.text} />
    </label>

    <label>
        样品
        <input type="checkbox" name="sample" bind:checked={formData.sample} />
    </label>

    <div class="form-actions">
        <button type="submit">
            {mode === 'add' ? '添加存储' : '保存修改'}
        </button>
        <button type="button" onclick={handleCancel}>
            取消
        </button>
        {#if mode === 'edit' && onDelete}
            <button type="button" class="danger" onclick={handleDeleteClick}>
                删除存储
            </button>
        {/if}
    </div>
</form>
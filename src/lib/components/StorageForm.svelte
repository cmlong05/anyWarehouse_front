<script lang="ts">
    import type { ContainerBriefID } from '$lib';
    import Svelecte from 'svelecte';
    import { enhance } from '$app/forms';

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

    let {
        mode,
        initialData = {
            item: '',
            container: '',
            quantity: '',
            text: '',
            sample: false
        },
        containers,
        itemId,
        itemSKU,
        onCancel,
        onDelete
    }: Props = $props();

    // 转换为 Svelecte 需要的格式
    const selectItems = containers.map((item: ContainerBriefID) => ({
        value: item.id,
        label: item.fastCode
    }));

    // 表单数据
    let formData = $state({
        item: initialData.item || itemId || '',
        container: initialData.container || '',
        quantity: initialData.quantity || '',
        text: initialData.text || '',
        sample: initialData.sample || false
    });

    // 获取显示用的物品标识
    const displayItem = mode === 'edit' 
        ? (initialData.itemSKU || initialData.item) 
        : (itemSKU || itemId);

    // 取消操作
    function handleCancel() {
        if (onCancel) {
            onCancel();
        } else {
            window.history.back();
        }
    }

    // 删除操作
    async function handleDelete() {
        if (!initialData.id || !onDelete) return;
        
        const confirmed = confirm('确定要删除这个存储记录吗？这个操作不可撤销。');
        if (!confirmed) return;

        try {
            await onDelete(initialData.id);
        } catch (error) {
            alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
        }
    }
</script>

<form method="POST" use:enhance>
    {#if mode === 'edit' && initialData.id}
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
            <button type="button" class="danger" onclick={handleDelete}>
                删除存储
            </button>
        {/if}
    </div>
</form>
<script lang="ts">
    import type { ContainerBriefID } from '$lib';
    import { apiClient } from '$lib/api';
    import Svelecte from 'svelecte';
    import { goto } from '$app/navigation';
    import { FormInput } from '$lib/components/ui';

    interface Props {
        mode: 'add' | 'edit';
        initialData?: {
            id?: number;
            item: string | number;
            itemSKU?: string;
            container: string | number;
            quantity: string | number;
            text: string;
            sample: boolean;
        };
        containers: ContainerBriefID[];
        itemId?: string;
        itemSKU?: string;
        onCancel?: () => void;
        onDelete?: (storageId: number) => Promise<void>;
    }

    let { mode, initialData, containers, itemId, itemSKU, onCancel, onDelete }: Props = $props();
    
    const selectItems = $derived(containers.map((item: ContainerBriefID) => ({
        value: item.id,
        label: item.fastCode
    })));

    let formData = $state({
        item: '',
        container: '',
        quantity: '',
        text: '',
        sample: false
    });
    
    // 当 initialData 或 itemId/itemSKU 变化时更新表单数据
    $effect(() => {
        formData.item = String(initialData?.item || itemId || '');
        formData.container = String(initialData?.container || '');
        formData.quantity = String(initialData?.quantity || '');
        formData.text = initialData?.text || '';
        formData.sample = initialData?.sample || false;
    });

    const displayItem = $derived(mode === 'edit' 
        ? (initialData?.itemSKU || initialData?.item || '') 
        : (itemSKU || itemId || ''));

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
            if (mode === 'add') {
                await apiClient.post('/warehouse/storage/', submitData);
            } else {
                await apiClient.patch(`/warehouse/storage/${initialData?.id}/`, submitData);
            }
            await goto(`/item/${submitData.item}`);
        } catch (error: any) {
            alert(`${mode === 'add' ? '创建' : '更新'}存储失败: ${error?.message || '未知错误'}`);
        }
    }

    function handleCancel() {
        onCancel ? onCancel() : window.history.back();
    }

    function handleDeleteClick() {
        if (!initialData?.id || !onDelete) return;
        if (!confirm('确定要删除这个存储记录吗？这个操作不可撤销。')) return;
        Promise.resolve(onDelete(initialData.id)).catch(e => alert('删除失败：' + (e instanceof Error ? e.message : '未知错误')));
    }
</script>

<form onsubmit={handleSubmit}>
    {#if mode === 'edit' && initialData?.id}
        <div class="storage-id">存储ID: {initialData.id}</div>
    {/if}

    <div class="form-field">
        <label for="storage-item">物品</label>
        <input id="storage-item" type="text" value={displayItem} disabled class="readonly-input" />
        <input type="hidden" name="item" value={formData.item} />
    </div>

    <div class="form-field">
        <label for="storage-container">存储位置 <span class="required">*</span></label>
        <Svelecte
            inputId="storage-container"
            name="container"
            options={selectItems}
            bind:value={formData.container}
            searchProps={{ fields: ['label'] }}
            required
        />
    </div>

    <FormInput
        label="数量"
        name="quantity"
        type="number"
        value={formData.quantity}
        required
        min={1}
        oninput={(v) => formData.quantity = v}
    />

    <FormInput
        label="备注"
        name="text"
        value={formData.text}
        placeholder="可选"
        oninput={(v) => formData.text = v}
    />

    <div class="form-field checkbox-field">
        <label class="checkbox-label">
            <input type="checkbox" name="sample" bind:checked={formData.sample} />
            <span>样品（不计入库存）</span>
        </label>
    </div>

    <div class="form-actions">
        <button type="submit" class="btn btn-primary">{mode === 'add' ? '添加存储' : '保存修改'}</button>
        <button type="button" class="btn btn-secondary" onclick={handleCancel}>取消</button>
        {#if mode === 'edit' && onDelete}
            <button type="button" class="btn btn-danger" onclick={handleDeleteClick}>删除存储</button>
        {/if}
    </div>
</form>

<style>
    form { max-width: 500px; margin: 0 auto; }
    form :global(.form-field) { margin-bottom: 1rem; }
    
    .form-field label { display: block; margin-bottom: 0.25rem; font-weight: bold; color: #374151; }
    .required { color: #dc2626; }
    
    .readonly-input {
        width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;
        background-color: #f3f4f6; color: #6b7280; box-sizing: border-box;
    }
    
    .checkbox-field { display: flex; align-items: center; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: normal; }
    .checkbox-label input { width: 1.2rem; height: 1.2rem; }
    
    .form-actions { display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap; }
    
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem; font-weight: 500; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.9; }
    .btn-primary { background-color: #007bff; color: white; }
    .btn-secondary { background-color: #6c757d; color: white; }
    .btn-danger { background-color: #dc3545; color: white; }
    
    .storage-id { background-color: #f8f9fa; padding: 0.5rem; border-radius: 0.375rem; margin-bottom: 1rem; font-weight: bold; color: #6c757d; }
    
    @media (max-width: 768px) {
        .form-actions { flex-direction: column; }
        .btn { width: 100%; }
    }
</style>

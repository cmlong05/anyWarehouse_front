<!-- 库存表单 -->
<!--
被依赖：
- `routes/storage/+page.svelte`
- `routes/storage/[slug]/+page.svelte`
- `routes/storage/add/[slug]/+page.svelte`
-->
<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors';
    import { buildContainerRelationSearchOptions } from '$lib/utils';
    import type { ContainerBriefID } from '$lib';
    import { apiClient } from '$lib/api';
    import Svelecte from 'svelecte';
    import { goto } from '$app/navigation';
    import { FormInput, NumberStepper } from '$lib/components/ui';

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
    
    const selectItems = $derived(buildContainerRelationSearchOptions(containers));

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
        } catch (error) {
            alert(`${mode === 'add' ? '创建' : '更新'}存储失败: ${getErrorMessage(error, '未知错误')}`);
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

<form onsubmit={handleSubmit} class="max-w-xl mx-auto">
    {#if mode === 'edit' && initialData?.id}
        <div class="bg-gray-100 p-2 rounded-md mb-4 font-bold text-gray-500">存储ID: {initialData.id}</div>
    {/if}

    <div class="mb-4">
        <label for="storage-item" class="block mb-1 font-bold text-gray-700">物品</label>
        <input id="storage-item" type="text" value={displayItem} disabled class="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 box-border" />
        <input type="hidden" name="item" value={formData.item} />
    </div>

    <div class="mb-4">
        <label for="storage-container" class="block mb-1 font-bold text-gray-700">存储位置 <span class="text-red-600">*</span></label>
        <Svelecte
            inputId="storage-container"
            name="container"
            options={selectItems}
            bind:value={formData.container}
            searchProps={{ fields: ['label', 'searchText'] }}
            required
        />
    </div>

    <div class="mb-4">
        <label for="quantity" class="block mb-1 font-bold text-gray-700">数量 <span class="text-red-600">*</span></label>
        <NumberStepper
            id="quantity"
            value={formData.quantity === '' ? undefined : Number(formData.quantity)}
            min={1}
            step={1}
            decimalPlaces={0}
            onchange={(v) => formData.quantity = String(v ?? 1)}
        />
    </div>

    <FormInput
        label="备注"
        name="text"
        value={formData.text}
        placeholder="可选"
        oninput={(v) => formData.text = v}
    />

    <div class="flex items-center mb-4">
        <label class="flex items-center gap-2 cursor-pointer font-normal">
            <input type="checkbox" name="sample" bind:checked={formData.sample} class="w-5 h-5" />
            <span>样品（不计入库存）</span>
        </label>
    </div>

    <div class="flex flex-col md:flex-row gap-4 mt-8 flex-wrap">
        <button type="submit" class="px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-opacity duration-150 bg-blue-600 text-white hover:opacity-90 w-full md:w-auto">{mode === 'add' ? '添加存储' : '保存修改'}</button>
        <button type="button" class="px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-opacity duration-150 bg-gray-500 text-white hover:opacity-90 w-full md:w-auto" onclick={handleCancel}>取消</button>
        {#if mode === 'edit' && onDelete}
            <button type="button" class="px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-opacity duration-150 bg-red-600 text-white hover:opacity-90 w-full md:w-auto" onclick={handleDeleteClick}>删除存储</button>
        {/if}
    </div>
</form>
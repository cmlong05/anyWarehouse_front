<!-- 分类新增/编辑共用表单：负责收集分类信息、提交到分类 API，并在成功后跳转到分类详情页。 -->
<!--
被依赖：
- `routes/item/category/[slug]/edit/+page.svelte`
- `routes/item/category/add/+page.svelte`
-->
<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors';
    import { buildCategoryRelationSearchOptions } from '$lib/utils';
    import type { Category } from '$lib';
    import { apiClient } from '$lib/api';
    import Svelecte from 'svelecte';
    import { goto } from '$app/navigation';
    import { FormInput } from '$lib/components/ui';

    interface Props {
        mode: 'add' | 'edit';
        initialData?: {
            id?: number;
            name: string;
            parent?: number | null;
            top_category?: boolean;
        };
        categories?: Category[];
        onCancel?: () => void;
        onDelete?: (categoryId: number) => Promise<void>;
    }

    let {
        mode,
        initialData = { name: '', parent: null, top_category: false },
        categories = [],
        onCancel,
        onDelete
    }: Props = $props();

    const selectItems = $derived(
        buildCategoryRelationSearchOptions(
            categories.filter((item: Category) => mode === 'add' || item.id !== initialData.id)
        )
    );

    let formData = $state({
        name: '',
        parent: null as number | null,
        top_category: false
    });
    
    // 当 initialData 变化时更新表单数据
    $effect(() => {
        formData.name = initialData?.name || '';
        formData.parent = initialData?.parent || null;
        formData.top_category = initialData?.top_category || false;
    });

    async function handleSubmit(event: Event) {
        event.preventDefault();

        const submitData = {
            name: formData.name,
            parent: formData.parent ? Number(formData.parent) : null,
            top_category: formData.top_category
        };

        try {
            let result: Category;
            if (mode === 'add') {
                result = await apiClient.post<Category>('/product/category/', submitData);
            } else {
                result = await apiClient.patch<Category>(`/product/category/${initialData?.id}/`, submitData);
            }

            // 添加/编辑成功后跳转到分类详情页
            await goto(`/item/category/${result.id}`);
        } catch (error) {
            alert(`${mode === 'add' ? '创建' : '更新'}分类失败: ${getErrorMessage(error, '未知错误')}`);
        }
    }

    function handleCancel() {
        onCancel ? onCancel() : window.history.back();
    }

    function handleDelete() {
        if (!initialData.id || !onDelete) return;
        if (!confirm('确定要删除这个分类吗？')) return;
        Promise.resolve(onDelete(initialData.id)).catch(e => alert('删除失败：' + (e instanceof Error ? e.message : '未知错误')));
    }
</script>

<form onsubmit={handleSubmit} class="max-w-xl mx-auto">
    {#if mode === 'edit' && initialData.id}
        <div class="bg-gray-100 p-2 rounded-md mb-4 font-bold text-gray-500">分类ID: {initialData.id}</div>
    {/if}
    
    <FormInput
        label="分类名称"
        name="name"
        value={formData.name}
        placeholder="输入分类名称"
        required
        oninput={(v) => formData.name = v}
    />

    {#if categories.length > 0}
        <div class="mb-4">
            <label for="parent-category" class="block mb-1 font-bold text-gray-700">父分类</label>
            <Svelecte
                inputId="parent-category"
                options={selectItems}
                bind:value={formData.parent}
                placeholder="选择父分类（可选）"
                clearable
                searchable={true}
                searchProps={{ fields: ['label', 'searchText'] }}
                class="svelecte-control"
            />
        </div>
    {/if}

    <div class="flex items-center gap-2 mb-4">
        <label class="flex items-center gap-2 cursor-pointer font-normal">
            <input type="checkbox" bind:checked={formData.top_category} class="w-5 h-5" />
            <span>顶级分类</span>
        </label>
    </div>

    <div class="flex flex-col md:flex-row gap-4 mt-8 flex-wrap">
        <button type="submit" class="px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-opacity duration-150 bg-blue-600 text-white hover:opacity-90 w-full md:w-auto">{mode === 'add' ? '添加分类' : '保存修改'}</button>
        <button type="button" class="px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-opacity duration-150 bg-gray-500 text-white hover:opacity-90 w-full md:w-auto" onclick={handleCancel}>取消</button>
        {#if mode === 'edit' && onDelete}
            <button type="button" class="px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-opacity duration-150 bg-red-600 text-white hover:opacity-90 w-full md:w-auto" onclick={handleDelete}>删除分类</button>
        {/if}
    </div>
</form>
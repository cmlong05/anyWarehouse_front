<script lang="ts">
    import type { Category } from '$lib';
    import Svelecte from 'svelecte';
    import { config } from '$lib/config';
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

    const selectItems = categories
        .filter((item: Category) => mode === 'add' || item.id !== initialData.id)
        .map((item: Category) => ({ value: item.id, label: item.name }));

    let formData = $state({
        name: initialData?.name || '',
        parent: initialData?.parent || null,
        top_category: initialData?.top_category || false
    });

    async function handleSubmit(event: Event) {
        event.preventDefault();

        const submitData = {
            name: formData.name,
            parent: formData.parent ? Number(formData.parent) : null,
            top_category: formData.top_category
        };

        try {
            let response;
            const url = `${config.API_BASE_URL}/product/category/`;
            if (mode === 'add') {
                response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitData) });
            } else {
                response = await fetch(`${url}${initialData?.id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitData) });
            }

            if (response.ok) {
                const result = await response.json();
                // 添加成功后返回分类列表，编辑成功后留在当前页面
                if (mode === 'add') {
                    await goto('/item/category');
                } else {
                    await goto(`/item/category/${result.id || initialData?.id}`);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`${mode === 'add' ? '创建' : '更新'}分类失败: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            alert(`网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
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

<form onsubmit={handleSubmit}>
    {#if mode === 'edit' && initialData.id}
        <div class="category-id">分类ID: {initialData.id}</div>
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
        <div class="form-field">
            <label for="parent-category">父分类</label>
            <Svelecte
                inputId="parent-category"
                options={selectItems}
                bind:value={formData.parent}
                placeholder="选择父分类（可选）"
                clearable
            />
        </div>
    {/if}

    <div class="form-field checkbox-field">
        <label class="checkbox-label">
            <input type="checkbox" bind:checked={formData.top_category} />
            <span>顶级分类</span>
        </label>
    </div>

    <div class="form-actions">
        <button type="submit" class="btn btn-primary">{mode === 'add' ? '添加分类' : '保存修改'}</button>
        <button type="button" class="btn btn-secondary" onclick={handleCancel}>取消</button>
        {#if mode === 'edit' && onDelete}
            <button type="button" class="btn btn-danger" onclick={handleDelete}>删除分类</button>
        {/if}
    </div>
</form>

<style>
    form { max-width: 500px; margin: 0 auto; }
    form :global(.form-field) { margin-bottom: 1rem; }
    
    .form-field label { display: block; margin-bottom: 0.25rem; font-weight: bold; color: #374151; }
    
    .checkbox-field { display: flex; align-items: center; gap: 0.5rem; }
    
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: normal; }
    .checkbox-label input { width: 1.2rem; height: 1.2rem; }
    
    .form-actions { display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap; }
    
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 1rem; font-weight: 500; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.9; }
    .btn-primary { background-color: #007bff; color: white; }
    .btn-secondary { background-color: #6c757d; color: white; }
    .btn-danger { background-color: #dc3545; color: white; }
    
    .category-id { background-color: #f8f9fa; padding: 0.5rem; border-radius: 0.375rem; margin-bottom: 1rem; font-weight: bold; color: #6c757d; }
    
    @media (max-width: 768px) {
        .form-actions { flex-direction: column; }
        .btn { width: 100%; }
    }
</style>

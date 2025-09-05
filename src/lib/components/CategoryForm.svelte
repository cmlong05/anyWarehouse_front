<script lang="ts">

    import { enhance } from '$app/forms';
    import type { Category } from '$lib';
    import Svelecte from 'svelecte';

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
        initialData = {
            name: '',
            parent: null,
            top_category: false
        },
        categories = [],
        onCancel,
        onDelete
    }: Props = $props();

    // 转换为 Svelecte 需要的格式，在编辑模式下过滤掉当前分类
    const selectItems = categories
        .filter((item: Category) => mode === 'add' || item.id !== initialData.id)
        .map((item: Category) => ({
            value: item.id,
            label: item.name
        }));

    // 表单数据
    let formData = $state({
        name: initialData.name || '',
        parent: initialData.parent || null,
        top_category: initialData.top_category || false
    });

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
        
        const confirmed = confirm('确定要删除这个分类吗？这个操作将同时删除所有子分类，且不可撤销。');
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
        <div class="category-id">
            分类ID: {initialData.id}
        </div>
    {/if}
    
    <label>
        分类名称
        <input 
            type="text" 
            name="name" 
            bind:value={formData.name} 
            required 
            placeholder="输入分类名称"
        />
    </label>

    {#if categories.length > 0}
        <label>
            父分类
            <Svelecte
                name="parent"
                options={selectItems}
                bind:value={formData.parent}
                searchProps={{ fields: ['label'] }}
                placeholder="选择父分类（可选，留空为顶级分类）"
                clearable
            />
        </label>
    {/if}

    <label>
        <input 
            type="checkbox" 
            name="top_category" 
            bind:checked={formData.top_category}
        />
        顶级分类
    </label>

    <div class="form-actions">
        <button type="submit">
            {mode === 'add' ? '添加分类' : '保存修改'}
        </button>
        <button type="button" onclick={handleCancel}>
            取消
        </button>
        {#if mode === 'edit' && onDelete}
            <button type="button" class="danger" onclick={handleDelete}>
                删除分类
            </button>
        {/if}
    </div>
</form>

<style>
    form {
        max-width: 500px;
        margin: 0 auto;
    }

    label {
        display: block;
        margin-bottom: 1rem;
        font-weight: bold;
    }

    input[type="text"] {
        display: block;
        width: 100%;
        padding: 0.5rem;
        margin-top: 0.25rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
    }

    input[type="checkbox"] {
        margin-right: 0.5rem;
    }

    .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
    }

    button[type="submit"] {
        background-color: #007bff;
        color: white;
    }

    button[type="button"] {
        background-color: #6c757d;
        color: white;
    }

    button.danger {
        background-color: #dc3545 !important;
    }

    button:hover {
        opacity: 0.9;
    }

    .category-id {
        background-color: #f8f9fa;
        padding: 0.5rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-weight: bold;
        color: #6c757d;
    }
</style>
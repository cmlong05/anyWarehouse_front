<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ContainerBriefID } from '$lib';
    import Svelecte from 'svelecte';

    interface Props {
        mode: 'add' | 'edit';
        initialData?: {
            id?: number;
            fastCode: string;
            barcode?: string | null;
            mark: string;
            volume: number;
            a_volume?: number;
            total_weight?: number;
            parent?: number | null;
        };
        containers?: ContainerBriefID[];
        onCancel?: () => void;
        onDelete?: (containerId: number) => Promise<void>;
    }

    let {
        mode,
        initialData = {
            fastCode: '',
            barcode: '',
            mark: '',
            volume: 0,
            a_volume: 0,
            total_weight: 0,
            parent: null
        },
        containers = [],
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
        fastCode: initialData.fastCode || '',
        barcode: initialData.barcode || '',
        mark: initialData.mark || '',
        volume: initialData.volume || 0,
        a_volume: initialData.a_volume || 0,
        total_weight: initialData.total_weight || 0,
        parent: initialData.parent || null
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
        
        const confirmed = confirm('确定要删除这个容器吗？这个操作将同时删除所有子容器和存储记录，且不可撤销。');
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
        <div class="container-id">
            容器ID: {initialData.id}
        </div>
    {/if}

    <label>
        快速代码
        <input 
            type="text" 
            name="fastCode" 
            bind:value={formData.fastCode} 
            required 
            placeholder="例如: A1-01"
        />
    </label>

    <label>
        条形码
        <input 
            type="text" 
            name="barcode" 
            bind:value={formData.barcode}
            placeholder="扫描或输入条形码"
        />
    </label>

    <label>
        标记/备注
        <input 
            type="text" 
            name="mark" 
            bind:value={formData.mark}
            placeholder="容器描述或标记"
        />
    </label>

    <label>
        容量
        <input 
            type="number" 
            name="volume" 
            bind:value={formData.volume} 
            required 
            min="1" 
            placeholder="容器容量"
        />
    </label>

    <!-- 隐藏字段，保持现有值 -->
    <input type="hidden" name="a_volume" value={formData.a_volume} />
    <input type="hidden" name="total_weight" value={formData.total_weight} />

    {#if containers.length > 0}
        <label>
            父容器
            <Svelecte
                name="parent"
                options={selectItems}
                bind:value={formData.parent}
                searchProps={{ fields: ['label'] }}
                placeholder="选择父容器（可选）"
                clearable
            />
        </label>
    {/if}

    <div class="form-actions">
        <button type="submit">
            {mode === 'add' ? '添加容器' : '保存修改'}
        </button>
        <button type="button" onclick={handleCancel}>
            取消
        </button>
        {#if mode === 'edit' && onDelete}
            <button type="button" class="danger" onclick={handleDelete}>
                删除容器
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

    input {
        display: block;
        width: 100%;
        padding: 0.5rem;
        margin-top: 0.25rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
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

    .container-id {
        background-color: #f8f9fa;
        padding: 0.5rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-weight: bold;
        color: #6c757d;
    }
</style>
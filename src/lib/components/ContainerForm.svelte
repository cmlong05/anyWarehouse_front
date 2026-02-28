<script lang="ts">
    import type { ContainerBriefID } from '$lib';
    import Svelecte from 'svelecte';
    import { config } from '$lib/config';
    import { goto } from '$app/navigation';
    import { FormInput } from '$lib/components/ui';

    interface Props {
        mode: 'add' | 'edit';
        initialData?: {
            id?: number;
            fastCode: string;
            barcode?: string | null;
            mark: string;
            volume: number;
            zz_volume?: number;
            zz_weight?: number;
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
            zz_volume: 0,
            zz_weight: 0,
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
        value: item.fastCode,
        label: item.fastCode
    }));

    const getParentFastCode = (parentId: number | null | undefined): string | null => {
        if (!parentId) return null;
        const parentContainer = containers.find((c: ContainerBriefID) => c.id === parentId);
        return parentContainer ? parentContainer.fastCode : null;
    };

    let formData = $state({
        fastCode: initialData.fastCode || '',
        barcode: initialData.barcode || '',
        mark: initialData.mark || '',
        volume: initialData.volume || 0,
        zz_volume: initialData.zz_volume || 0,
        zz_weight: initialData.zz_weight || 0,
        a_volume: initialData.a_volume || 0,
        total_weight: initialData.total_weight || 0,
        parent: getParentFastCode(initialData.parent)
    });

    const getParentId = (parentFastCode: string | null): number | null => {
        if (!parentFastCode) return null;
        const parentContainer = containers.find((c: ContainerBriefID) => c.fastCode === parentFastCode);
        return parentContainer ? parentContainer.id : null;
    };

    async function handleSubmit(event: Event) {
        event.preventDefault();
        
        const submitData = {
            fastCode: formData.fastCode,
            barcode: formData.barcode || null,
            mark: formData.mark,
            volume: Number(formData.volume),
            zz_volume: Number(formData.zz_volume),
            zz_weight: Number(formData.zz_weight),
            a_volume: Number(formData.a_volume),
            total_weight: Number(formData.total_weight),
            parent: getParentId(formData.parent)
        };

        try {
            let response;
            if (mode === 'add') {
                response = await fetch(`${config.API_BASE_URL}/warehouse/container/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submitData),
                });
            } else {
                response = await fetch(`${config.API_BASE_URL}/warehouse/container/${initialData?.fastCode}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submitData),
                });
            }

            if (response.ok) {
                const result = await response.json();
                await goto(`/container/${result.fastCode || submitData.fastCode}`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`${mode === 'add' ? '创建' : '更新'}容器失败: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert(`网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    function handleCancel() {
        if (onCancel) {
            onCancel();
        } else {
            window.history.back();
        }
    }

    function handleDelete() {
        if (!initialData.id || !onDelete) return;
        
        const confirmed = confirm('确定要删除这个容器吗？这个操作将同时删除所有子容器和存储记录，且不可撤销。');
        if (!confirmed) return;

        Promise.resolve(onDelete(initialData.id)).catch((error) => {
            alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
        });
    }
</script>

<form onsubmit={handleSubmit}>
    {#if mode === 'edit' && initialData.id}
        <div class="container-id">
            容器ID: {initialData.id}
        </div>
    {/if}
    
    {#if containers.length > 0}
        <div class="form-field">
            <label>父容器</label>
            {#if mode === 'add' && formData.parent}
                <input 
                    type="text" 
                    value={formData.parent}
                    disabled
                    class="readonly-input"
                />
            {:else}
                <Svelecte
                    options={selectItems}
                    bind:value={formData.parent}
                    searchProps={{ fields: ['label'] }}
                    placeholder="选择父容器（可选）"
                    clearable
                />
            {/if}
        </div>
    {/if}
    
    <FormInput
        label="快速代码"
        name="fastCode"
        value={formData.fastCode}
        placeholder="例如: A1-01"
        required
        oninput={(v) => formData.fastCode = v}
    />

    <FormInput
        label="条形码"
        name="barcode"
        value={formData.barcode}
        placeholder="扫描或输入条形码"
        oninput={(v) => formData.barcode = v}
    />

    <FormInput
        label="标记/备注"
        name="mark"
        value={formData.mark}
        placeholder="容器描述或标记"
        oninput={(v) => formData.mark = v}
    />

    <FormInput
        label="总容量"
        name="volume"
        type="number"
        value={formData.volume}
        required
        min={1}
        placeholder="容器总容量"
        oninput={(v) => formData.volume = Number(v)}
    />

    <FormInput
        label="自占体积"
        name="zz_volume"
        type="number"
        value={formData.zz_volume}
        min={0}
        step={0.01}
        placeholder="容器自身占用的体积"
        oninput={(v) => formData.zz_volume = Number(v)}
    />

    <FormInput
        label="箱体自重"
        name="zz_weight"
        type="number"
        value={formData.zz_weight}
        min={0}
        step={0.01}
        placeholder="容器自身重量"
        oninput={(v) => formData.zz_weight = Number(v)}
    />

    <div class="form-actions">
        <button type="submit" class="btn btn-primary">
            {mode === 'add' ? '添加容器' : '保存修改'}
        </button>
        <button type="button" class="btn btn-secondary" onclick={handleCancel}>
            取消
        </button>
        {#if mode === 'edit' && onDelete}
            <button type="button" class="btn btn-danger" onclick={handleDelete}>
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

    form :global(.form-field) {
        margin-bottom: 1rem;
    }

    .form-field label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: bold;
        color: #374151;
    }

    .readonly-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        background-color: #f3f4f6;
        color: #6b7280;
        box-sizing: border-box;
    }

    .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
        flex-wrap: wrap;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: opacity 0.15s ease;
    }

    .btn:hover {
        opacity: 0.9;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-danger {
        background-color: #dc3545;
        color: white;
    }

    .container-id {
        background-color: #f8f9fa;
        padding: 0.5rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
        font-weight: bold;
        color: #6c757d;
    }

    @media (max-width: 768px) {
        .form-actions {
            flex-direction: column;
        }
        
        .btn {
            width: 100%;
        }
    }
</style>

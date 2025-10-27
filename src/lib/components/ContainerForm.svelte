<script lang="ts">
    import type { ContainerBriefID } from '$lib';
    import Svelecte from 'svelecte';
    import { config } from '$lib/config';
    import { goto } from '$app/navigation';

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
        value: item.id,
        label: item.fastCode
    }));

    // 表单数据
    let formData = $state({
        fastCode: initialData.fastCode || '',
        barcode: initialData.barcode || '',
        mark: initialData.mark || '',
        volume: initialData.volume || 0,
        zz_volume: initialData.zz_volume || 0,
        zz_weight: initialData.zz_weight || 0,
        a_volume: initialData.a_volume || 0,
        total_weight: initialData.total_weight || 0,
        parent: initialData.parent || null
    });

    // 提交表单
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
            parent: formData.parent ? Number(formData.parent) : null
        };

        try {
            let response;
            if (mode === 'add') {
                // 添加新容器
                response = await fetch(`${config.API_BASE_URL}/warehouse/container/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submitData),
                });
            } else {
                // 更新现有容器
                response = await fetch(`${config.API_BASE_URL}/warehouse/container/${initialData?.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submitData),
                });
            }

            if (response.ok) {
                const result = await response.json();
                // 成功后跳转到容器页面
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

<form onsubmit={handleSubmit}>
    {#if mode === 'edit' && initialData.id}
        <div class="container-id">
            容器ID: {initialData.id}
        </div>
    {/if}
    {#if containers.length > 0}
        <label>
            父容器
            {#if mode === 'add' && initialData.parent}
                <!-- 添加模式下如果有默认父容器，显示为只读 -->
                {@const parentContainer = containers.find(c => c.id === initialData.parent)}
                <input 
                    type="text" 
                    value={parentContainer ? parentContainer.fastCode : '未知容器'} 
                    disabled
                    style="background-color: #f8f9fa; color: #6c757d;"
                />
            {:else}
                <!-- 编辑模式或无默认父容器时，显示选择器 -->
                <Svelecte
                    options={selectItems}
                    bind:value={formData.parent}
                    searchProps={{ fields: ['label'] }}
                    placeholder="选择父容器（可选）"
                    clearable
                />
            {/if}
        </label>
    {/if}
    <label>
        快速代码
        <input 
            type="text" 
            bind:value={formData.fastCode} 
            required 
            placeholder="例如: A1-01"
        />
    </label>

    <label>
        条形码
        <input 
            type="text" 
            bind:value={formData.barcode}
            placeholder="扫描或输入条形码"
        />
    </label>

    <label>
        标记/备注
        <input 
            type="text" 
            bind:value={formData.mark}
            placeholder="容器描述或标记"
        />
    </label>

    <label>
        总容量
        <input 
            type="number" 
            bind:value={formData.volume} 
            required 
            min="1" 
            placeholder="容器总容量"
        />
    </label>

    <label>
        自占体积
        <input 
            type="number" 
            bind:value={formData.zz_volume}
            min="0"
            step="0.01"
            placeholder="容器自身占用的体积"
        />
    </label>

    <label>
        箱体自重
        <input 
            type="number" 
            bind:value={formData.zz_weight}
            min="0"
            step="0.01"
            placeholder="容器自身重量"
        />
    </label>

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
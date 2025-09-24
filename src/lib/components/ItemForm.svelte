<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import type { Category } from '$lib';
    import Svelecte from 'svelecte';

    interface Props {
        mode: 'add' | 'edit';
        initialData?: {
            id?: number;
            SKU: string;
            name: string;
            SKU_zite?: string;
            SKU_A?: string;
            description?: string;
            image?: string;
            weight?: string;
            p_volume?: number;
            s_volume?: number;
            b_Price?: string;
            currency?: string;
            in_fee?: number | null;
            barcode?: string;
            category?: number[];
        };
        categories?: Category[];
        onCancel?: () => void;
        onDelete?: (itemId: number) => Promise<void>;
    }

    let {
        mode,
        initialData = {
            SKU: '',
            name: '',
            SKU_zite: '',
            SKU_A: '',
            description: '',
            image: '',
            weight: '',
            p_volume: 0,
            s_volume: 0,
            b_Price: '',
            currency: '',
            in_fee: null,
            barcode: '',
            category: []
        },
        categories = [],
        onCancel,
        onDelete
    }: Props = $props();

    // 转换为 Svelecte 需要的格式
    const selectItems = categories.map((item: Category) => ({
        value: item.id,
        label: item.name
    }));

    // 表单数据
    let formData = $state({
        SKU: initialData?.SKU || '',
        name: initialData?.name || '',
        SKU_zite: initialData?.SKU_zite || '',
        SKU_A: initialData?.SKU_A || '',
        description: initialData?.description || '',
        image: initialData?.image || '',
        weight: initialData?.weight || '',
        p_volume: initialData?.p_volume || 0,
        s_volume: initialData?.s_volume || 0,
        b_Price: initialData?.b_Price || '',
        currency: initialData?.currency || '',
        in_fee: initialData?.in_fee || null,
        barcode: initialData?.barcode || '',
        category: initialData?.category || []
    });

    // 取消操作
    function handleCancel() {
        if (onCancel) {
            onCancel();
        } else {
            history.back();
        }
    }

    // 删除操作
    async function handleDelete() {
        if (!initialData?.id || !onDelete) return;
        
        if (confirm('确定要删除这个商品吗？此操作不可撤销。')) {
            try {
                deleteLoading = true;
                await onDelete(initialData.id);
            } catch (error) {
                console.error('删除操作失败:', error);
                alert('删除失败，请稍后重试');
            } finally {
                deleteLoading = false;
            }
        }
    }

    let deleteLoading = $state(false);
    let formLoading = $state(false);
</script>

<form 
    method="POST" 
    use:enhance={() => {
        formLoading = true;
        return async ({ result }) => {
            
            if (result.type === 'redirect') {
                formLoading = false;
                // 使用 SvelteKit 的 goto 进行客户端导航
                await goto(result.location);
                return;
            } else if (result.type === 'success') {
                formLoading = false;
            } else if (result.type === 'failure') {
                console.error('提交失败:', result.data);
                alert(`提交失败: ${result.data?.error || '未知错误'}`);
                formLoading = false;
            } else if (result.type === 'error') {
                console.error('提交错误:', result.error);
                alert(`提交错误: ${result.error?.message || '未知错误'}`);
                formLoading = false;
            }
        };
    }}
>
    <div class="form-grid">
        <!-- 基本信息 -->
        <div class="form-section">
            <h3>基本信息</h3>
            
            <div class="field-group inline-field">
                <label for="SKU">SKU <span class="required">*</span></label>
                <input 
                    type="text" 
                    id="SKU" 
                    name="SKU" 
                    bind:value={formData.SKU}
                    required 
                    maxlength="50"
                    placeholder="商品唯一标识码"
                />
            </div>

            <div class="field-group">
                <label for="name">商品名称 <span class="required">*</span></label>
                <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    bind:value={formData.name}
                    required 
                    maxlength="200"
                    placeholder="商品名称"
                />
            </div>

            <div class="field-group">
                <label for="description">描述</label>
                <textarea 
                    id="description" 
                    name="description" 
                    bind:value={formData.description}
                    maxlength="1000"
                    rows="3"
                    placeholder="商品描述信息"
                ></textarea>
            </div>
        </div>

        <!-- SKU扩展信息 -->
        <div class="form-section">
            <h3>SKU扩展信息</h3>
            
            <div class="field-group inline-field">
                <label for="SKU_zite">SKU子码</label>
                <input 
                    type="text" 
                    id="SKU_zite" 
                    name="SKU_zite" 
                    bind:value={formData.SKU_zite}
                    maxlength="50"
                    placeholder="SKU子码"
                />
            </div>

            <div class="field-group inline-field">
                <label for="SKU_A">SKU A码</label>
                <input 
                    type="text" 
                    id="SKU_A" 
                    name="SKU_A" 
                    bind:value={formData.SKU_A}
                    maxlength="50"
                    placeholder="SKU A码"
                />
            </div>

            <div class="field-group">
                <label for="barcode">条形码</label>
                <input 
                    type="text" 
                    id="barcode" 
                    name="barcode" 
                    bind:value={formData.barcode}
                    maxlength="100"
                    placeholder="商品条形码"
                />
            </div>
        </div>

        <!-- 物理属性 -->
        <div class="form-section">
            <h3>物理属性</h3>
            
            <div class="field-group inline-field">
                <label for="weight">重量</label>
                <input 
                    type="text" 
                    id="weight" 
                    name="weight" 
                    bind:value={formData.weight}
                    maxlength="20"
                    placeholder="重量（含单位）"
                />
            </div>

            <div class="field-row">
                <div class="field-group">
                    <label for="p_volume">包装体积</label>
                    <input 
                        type="number" 
                        id="p_volume" 
                        name="p_volume" 
                        bind:value={formData.p_volume}
                        min="0"
                        max="999999"
                        step="0.01"
                        placeholder="0"
                    />
                </div>

                <div class="field-group">
                    <label for="s_volume">存储体积</label>
                    <input 
                        type="number" 
                        id="s_volume" 
                        name="s_volume" 
                        bind:value={formData.s_volume}
                        min="0"
                        max="999999"
                        step="0.01"
                        placeholder="0"
                    />
                </div>
            </div>
        </div>

        <!-- 价格信息 -->
        <div class="form-section">
            <h3>价格信息</h3>
            
            <div class="field-row">
                <div class="field-group">
                    <label for="b_Price">价格</label>
                    <input 
                        type="text" 
                        id="b_Price" 
                        name="b_Price" 
                        bind:value={formData.b_Price}
                        maxlength="20"
                        placeholder="商品价格"
                    />
                </div>

                <div class="field-group">
                    <label for="currency">货币</label>
                    <input 
                        type="text" 
                        id="currency" 
                        name="currency" 
                        bind:value={formData.currency}
                        maxlength="10"
                        placeholder="如：CNY, USD"
                    />
                </div>
            </div>

            <div class="field-group inline-field">
                <label for="in_fee">入库费用</label>
                <input 
                    type="number" 
                    id="in_fee" 
                    name="in_fee" 
                    bind:value={formData.in_fee}
                    min="0"
                    max="999999"
                    step="0.01"
                    placeholder="入库费用"
                />
            </div>
        </div>

        <!-- 其他信息 -->
        <div class="form-section">
            <h3>其他信息</h3>
            
            <div class="field-group">
                <label for="image">图片链接</label>
                <input 
                    type="url" 
                    id="image" 
                    name="image" 
                    bind:value={formData.image}
                    maxlength="500"
                    placeholder="商品图片URL"
                />
            </div>

            <div class="field-group">
                <label for="category">分类</label>
                <Svelecte 
                    options={selectItems}
                    multiple={true}
                    bind:value={formData.category}
                    placeholder="选择商品分类..."
                    class="svelecte-control"
                />
                <!-- 隐藏字段确保分类数据正确提交 -->
                {#each formData.category as categoryId}
                    <input type="hidden" name="category" value={categoryId} />
                {/each}
            </div>
        </div>
    </div>

    <!-- 隐藏字段 -->
    {#if mode === 'edit' && initialData?.id}
        <input type="hidden" name="id" value={initialData.id} />
    {/if}

    <!-- 按钮区域 -->
    <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick={handleCancel}>
            取消
        </button>
        
        <button type="submit" class="btn btn-primary" disabled={formLoading}>
            {formLoading ? '处理中...' : mode === 'add' ? '添加商品' : '更新商品'}
        </button>
        
        {#if mode === 'edit' && onDelete && initialData?.id}
            <button 
                type="button" 
                class="btn btn-danger" 
                onclick={handleDelete}
                disabled={deleteLoading}
            >
                {deleteLoading ? '删除中...' : '删除商品'}
            </button>
        {/if}
    </div>
</form>

<style>
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .form-section {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }

    .form-section h3 {
        margin: 0 0 1rem 0;
        color: #495057;
        font-size: 1.1rem;
        font-weight: 600;
        border-bottom: 2px solid #dee2e6;
        padding-bottom: 0.5rem;
    }

    .field-group {
        margin-bottom: 1rem;
    }

    .inline-field {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .inline-field label {
        margin-bottom: 0;
        min-width: 80px;
        flex-shrink: 0;
    }

    .inline-field input {
        flex: 1;
    }

    .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .field-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #495057;
    }

    .required {
        color: #dc3545;
    }

    .field-group input,
    .field-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }

    .field-group input:focus,
    .field-group textarea:focus {
        outline: none;
        border-color: #80bdff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .field-group textarea {
        resize: vertical;
    }

    :global(.svelecte-control) {
        border: 1px solid #ced4da !important;
        border-radius: 4px !important;
    }

    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding-top: 2rem;
        border-top: 1px solid #e9ecef;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        text-decoration: none;
        display: inline-block;
        text-align: center;
    }

    .btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #0056b3;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: #545b62;
    }

    .btn-danger {
        background-color: #dc3545;
        color: white;
    }

    .btn-danger:hover:not(:disabled) {
        background-color: #c82333;
    }

    @media (max-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .field-row {
            grid-template-columns: 1fr;
        }

        .inline-field {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .inline-field label {
            min-width: auto;
        }

        .form-actions {
            flex-direction: column;
        }

        .btn {
            width: 100%;
        }
    }
</style>

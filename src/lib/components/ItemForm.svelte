<script lang="ts">
    import { goto } from '$app/navigation';
    import type { Category } from '$lib';
    import { config } from '$lib/config';
    import Svelecte from 'svelecte';
    import { FormInput } from '$lib/components/ui';

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
        onShowDeleteModal?: () => void;
    }

    let {
        mode,
        initialData = { SKU: '', name: '', SKU_zite: '', SKU_A: '', description: '', image: '', weight: '', p_volume: 0, s_volume: 0, b_Price: '', currency: '', in_fee: null, barcode: '', category: [] },
        categories = [],
        onCancel,
        onShowDeleteModal
    }: Props = $props();

    const selectItems = categories.map((item: Category) => ({ value: item.id, label: item.name }));

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

    let formLoading = $state(false);
    let imageError = $state(false);
    let selectedFile = $state<File | null>(null);
    let previewUrl = $state<string>('');
    let imageUrlInput = $state<string>('');

    const displayImageUrl = $derived(() => {
        if (previewUrl) return previewUrl;
        if (imageUrlInput) return imageUrlInput.startsWith('http') ? imageUrlInput : imageUrlInput;
        if (formData.image) return formData.image.startsWith('http') ? formData.image : formData.image;
        return '';
    });

    $effect(() => {
        if (formData.image && !imageUrlInput && !selectedFile) {
            imageUrlInput = formData.image.startsWith('http') ? formData.image : formData.image;
        }
    });

    $effect(() => {
        if (imageUrlInput && !selectedFile) {
            formData.image = imageUrlInput;
            previewUrl = '';
        }
    });

    function handleCancel() {
        onCancel ? onCancel() : history.back();
    }

    function handleDeleteClick() {
        if (!initialData?.id) return;
        onShowDeleteModal?.();
    }

    function handleImageUpload(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('请选择图片文件'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('图片文件不能超过5MB'); return; }
        
        selectedFile = file;
        imageError = false;
        const reader = new FileReader();
        reader.onload = (e) => { if (e.target?.result) { previewUrl = e.target.result as string; formData.image = ''; imageUrlInput = ''; } };
        reader.readAsDataURL(file);
    }

    function clearImage() {
        formData.image = ''; imageUrlInput = ''; selectedFile = null; previewUrl = ''; imageError = false;
        const fileInput = document.getElementById('imageFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }

    function handleImageError() { imageError = true; }

    async function handleSubmit(event: Event) {
        event.preventDefault();
        formLoading = true;
        try {
            const form = event.target as HTMLFormElement;
            const submitData = new FormData(form);
            if (selectedFile) submitData.set('image', selectedFile);
            
            const apiUrl = mode === 'edit' && initialData?.id 
                ? `${config.API_BASE_URL}/product/item/${initialData.id}/`
                : `${config.API_BASE_URL}/product/item/`;

            const response = await fetch(apiUrl, { method: mode === 'edit' ? 'PATCH' : 'POST', body: submitData });
            if (response.ok) {
                const data = await response.json();
                alert(mode === 'edit' ? '更新成功！' : '添加成功！');
                await goto(`/item/${mode === 'edit' ? initialData?.id : data.id}`);
            } else {
                const error = await response.text();
                alert(`提交失败: ${error || '未知错误'}`);
            }
        } catch (error) {
            alert(`提交错误: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            formLoading = false;
        }
    }
</script>

<form method="POST" enctype="multipart/form-data" onsubmit={handleSubmit}>
    <div class="form-grid">
        <!-- 基本信息 -->
        <div class="form-section">
            <h3>基本信息</h3>
            <FormInput label="SKU" name="SKU" required value={formData.SKU} placeholder="商品唯一标识码" maxlength={50} oninput={(v) => formData.SKU = v} />
            <FormInput label="商品名称" name="name" required value={formData.name} placeholder="商品名称" maxlength={200} oninput={(v) => formData.name = v} />
        </div>

        <!-- SKU扩展信息 -->
        <div class="form-section">
            <h3>SKU扩展信息</h3>
            <FormInput label="SKU子码" name="SKU_zite" value={formData.SKU_zite || ''} placeholder="SKU子码" maxlength={50} oninput={(v) => formData.SKU_zite = v} />
            <FormInput label="SKU A码" name="SKU_A" value={formData.SKU_A || ''} placeholder="SKU A码" maxlength={50} oninput={(v) => formData.SKU_A = v} />
            <FormInput label="条形码" name="barcode" value={formData.barcode || ''} placeholder="商品条形码" maxlength={100} oninput={(v) => formData.barcode = v} />
        </div>

        <!-- 物理属性 -->
        <div class="form-section">
            <h3>物理属性</h3>
            <FormInput label="重量" name="weight" value={formData.weight || ''} placeholder="重量（含单位）" maxlength={20} oninput={(v) => formData.weight = v} />
            <div class="field-row">
                <FormInput label="包装体积" name="p_volume" type="number" value={formData.p_volume} min={0} step={0.01} placeholder="0" oninput={(v) => formData.p_volume = Number(v)} />
                <FormInput label="存储体积" name="s_volume" type="number" value={formData.s_volume} min={0} step={0.01} placeholder="0" oninput={(v) => formData.s_volume = Number(v)} />
            </div>
        </div>

        <!-- 价格信息 -->
        <div class="form-section">
            <h3>价格信息</h3>
            <div class="field-row">
                <FormInput label="价格" name="b_Price" value={formData.b_Price || ''} placeholder="商品价格" maxlength={20} oninput={(v) => formData.b_Price = v} />
                <FormInput label="货币" name="currency" value={formData.currency || ''} placeholder="如：CNY, USD" maxlength={10} oninput={(v) => formData.currency = v} />
            </div>
            <FormInput label="入库费用" name="in_fee" type="number" value={formData.in_fee ?? ''} min={0} step={0.01} placeholder="入库费用" oninput={(v) => formData.in_fee = v ? Number(v) : null} />
        </div>

        <!-- 其他信息 -->
        <div class="form-section">
            <h3>其他信息</h3>
            <div class="field-group">
                <label>商品图片</label>
                <div class="image-upload-section">
                    <div class="image-preview-container">
                        {#if displayImageUrl()}
                            <img src={displayImageUrl()} alt="商品图片预览" class="image-preview" onerror={handleImageError} />
                            {#if imageError}<div class="image-placeholder"><span>图片加载失败</span></div>{/if}
                        {:else}
                            <div class="image-placeholder"><span>暂无图片</span></div>
                        {/if}
                    </div>
                    <div class="image-controls">
                        <input type="file" id="imageFile" accept="image/*" style="display: none;" onchange={handleImageUpload} />
                        <button type="button" class="btn btn-outline" onclick={() => document.getElementById('imageFile')?.click()}>选择图片</button>
                        {#if displayImageUrl()}<button type="button" class="btn btn-danger-outline" onclick={clearImage}>清除图片</button>{/if}
                    </div>
                </div>
                <div class="url-input-full-width">
                    <input type="text" id="imageUrl" bind:value={imageUrlInput} maxlength={500} placeholder="或输入图片URL" class="url-input-full" readonly={mode === 'edit'} />
                </div>
            </div>
            <div class="field-group">
                <label>分类</label>
                <Svelecte options={selectItems} multiple={true} bind:value={formData.category} placeholder="选择商品分类..." class="svelecte-control" />
                {#each formData.category as categoryId}<input type="hidden" name="category" value={categoryId} />{/each}
            </div>
        </div>

        <!-- 商品描述 -->
        <div class="form-section description-section">
            <h3>商品描述</h3>
            <div class="field-group">
                <textarea id="description" name="description" bind:value={formData.description} rows={8} placeholder="商品描述信息" class="description-textarea"></textarea>
            </div>
        </div>
    </div>

    {#if mode === 'edit' && initialData?.id}<input type="hidden" name="id" value={initialData.id} />{/if}

    <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick={handleCancel}>取消</button>
        <button type="submit" class="btn btn-primary" disabled={formLoading}>{formLoading ? '处理中...' : mode === 'add' ? '添加商品' : '更新'}</button>
        {#if mode === 'edit' && onShowDeleteModal && initialData?.id}<button type="button" class="btn btn-danger" onclick={handleDeleteClick}>删除</button>{/if}
    </div>
</form>

<style>
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 0.5rem; }
    .form-section { background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1px solid #e9ecef; }
    .form-section h3 { margin: 0 0 0.5rem 0; color: #495057; font-size: 1.1rem; font-weight: 600; border-bottom: 2px solid #dee2e6; padding-bottom: 0.25rem; }
    .description-section { grid-column: 1 / -1; }
    .description-textarea { min-height: 80px; font-family: inherit; line-height: 1.5; width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; resize: vertical; }
    .field-group { margin-bottom: 0.5rem; }
    .field-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #495057; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field-row :global(.form-field) { margin: 0; }
    :global(.svelecte-control) { border: 1px solid #ced4da !important; border-radius: 4px !important; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.75rem; margin-top: 0.5rem; border-top: 1px solid #e9ecef; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: all 0.15s ease-in-out; }
    .btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .btn-primary { background-color: #007bff; color: white; }
    .btn-primary:hover:not(:disabled) { background-color: #0056b3; }
    .btn-secondary { background-color: #6c757d; color: white; }
    .btn-secondary:hover:not(:disabled) { background-color: #545b62; }
    .btn-danger { background-color: #dc3545; color: white; }
    .btn-danger:hover:not(:disabled) { background-color: #c82333; }
    .btn-outline { background-color: transparent; color: #007bff; border: 1px solid #007bff; }
    .btn-outline:hover:not(:disabled) { background-color: #007bff; color: white; }
    .btn-danger-outline { background-color: transparent; color: #dc3545; border: 1px solid #dc3545; }
    .btn-danger-outline:hover:not(:disabled) { background-color: #dc3545; color: white; }
    .image-upload-section { display: flex; gap: 1rem; align-items: flex-start; }
    .image-preview-container { flex-shrink: 0; width: 120px; height: 120px; border: 2px dashed #dee2e6; border-radius: 8px; overflow: hidden; background-color: #f8f9fa; }
    .image-preview { width: 100%; height: 100%; object-fit: cover; display: block; }
    .image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #6c757d; font-size: 0.875rem; text-align: center; }
    .image-controls { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
    .url-input-full-width { margin-top: 1rem; width: 100%; }
    .url-input-full { width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; font-size: 1rem; box-sizing: border-box; background-color: #f8f9fa; }
    .url-input-full:focus { outline: none; border-color: #80bdff; box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25); background-color: #ffffff; }
    .url-input-full[readonly] { background-color: #e9ecef; cursor: not-allowed; }
    @media (max-width: 768px) {
        .form-grid { grid-template-columns: 1fr; gap: 0.75rem; }
        .field-row { grid-template-columns: 1fr; }
        .form-actions { flex-direction: column; }
        .btn { width: 100%; }
        .image-upload-section { flex-direction: column; align-items: stretch; }
        .image-preview-container { width: 100%; height: 200px; max-width: 300px; align-self: center; }
    }
</style>

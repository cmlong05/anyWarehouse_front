<script lang="ts">
    import { goto } from '$app/navigation';
    import type { Category } from '$lib';
    import { config } from '$lib/config';
    import Svelecte from 'svelecte';
    import { FormInput, NumberStepper } from '$lib/components/ui';

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
            image_path?: string;  // 复制时共用图片的路径
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
        currency: initialData?.currency || 'CNY',
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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <!-- 基本信息 -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">基本信息</h3>
            <FormInput label="SKU" name="SKU" required value={formData.SKU} placeholder="商品唯一标识码" maxlength={50} oninput={(v) => formData.SKU = v} />
            <FormInput label="商品名称" name="name" required value={formData.name} placeholder="商品名称" maxlength={200} oninput={(v) => formData.name = v} />
        </div>

        <!-- SKU扩展信息 -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">SKU扩展信息</h3>
            <FormInput label="SKU子码" name="SKU_zite" value={formData.SKU_zite || ''} placeholder="SKU子码" maxlength={50} oninput={(v) => formData.SKU_zite = v} />
            <FormInput label="SKU A码" name="SKU_A" value={formData.SKU_A || ''} placeholder="SKU A码" maxlength={50} oninput={(v) => formData.SKU_A = v} />
            <FormInput label="条形码" name="barcode" value={formData.barcode || ''} placeholder="商品条形码" maxlength={100} oninput={(v) => formData.barcode = v} />
        </div>

        <!-- 物理属性 -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">物理属性</h3>
            <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium text-gray-700">重量:</span>
                <NumberStepper value={parseFloat(formData.weight) || 0} min={0} step={0.01} size="sm" onchange={(v) => formData.weight = (v ?? 0).toFixed(2)} />
                <input type="hidden" name="weight" value={formData.weight} />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700">包装体积:</span>
                    <NumberStepper value={formData.p_volume} min={0} step={0.01} size="sm" onchange={(v) => formData.p_volume = v ?? 0} />
                    <input type="hidden" name="p_volume" value={formData.p_volume} />
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700">存储体积:</span>
                    <NumberStepper value={formData.s_volume} min={0} step={0.01} size="sm" onchange={(v) => formData.s_volume = v ?? 0} />
                    <input type="hidden" name="s_volume" value={formData.s_volume} />
                </div>
            </div>
        </div>

        <!-- 价格信息 -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">价格信息</h3>
            <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium text-gray-700">价格:</span>
                <NumberStepper value={parseFloat(formData.b_Price) || 0} min={0} step={0.01} size="sm" onchange={(v) => formData.b_Price = (v ?? 0).toFixed(2)} />
                <input type="hidden" name="b_Price" value={formData.b_Price} />
                <div class="w-20"><Svelecte options={[{value:'CNY',label:'CNY'},{value:'USD',label:'USD'},{value:'EUR',label:'EUR'}]} bind:value={formData.currency} class="svelecte-control" /></div>
                <input type="hidden" name="currency" value={formData.currency} />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700">入库费用:</span>
                    <NumberStepper value={formData.in_fee ?? 0} min={0} step={0.01} size="sm" onchange={(v) => formData.in_fee = v ?? null} />
                    <input type="hidden" name="in_fee" value={formData.in_fee ?? ''} />
                </div>
            </div>
        </div>

        <!-- 其他信息 -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">其他信息</h3>
            <div class="mb-3">
                <label for="imageUrl" class="block text-sm font-medium text-gray-700 mb-1">商品图片</label>
                <div class="flex gap-4 items-start">
                    <div class="w-[120px] h-[120px] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        {#if displayImageUrl()}
                            <img src={displayImageUrl()} alt="商品图片预览" class="w-full h-full object-cover" onerror={handleImageError} />
                            {#if imageError}<div class="w-full h-full flex items-center justify-center text-gray-500 text-sm text-center px-1"><span>图片加载失败</span></div>{/if}
                        {:else}
                            <div class="w-full h-full flex items-center justify-center text-gray-500 text-sm text-center px-1"><span>暂无图片</span></div>
                        {/if}
                    </div>
                    <div class="flex flex-col gap-2 flex-1">
                        <input type="file" id="imageFile" accept="image/*" class="hidden" onchange={handleImageUpload} />
                        <button type="button" class="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors" onclick={() => document.getElementById('imageFile')?.click()}>选择图片</button>
                        {#if displayImageUrl()}<button type="button" class="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors" onclick={clearImage}>清除图片</button>{/if}
                    </div>
                </div>
                <div class="mt-3">
                    <input type="text" id="imageUrl" bind:value={imageUrlInput} maxlength={500} placeholder="或输入图片URL" class="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 focus:border-blue-400 focus:bg-white focus:outline-none" readonly={mode === 'edit'} />
                </div>
            </div>
            <div class="mb-2">
                <label for="category-select" class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <Svelecte inputId="category-select" options={selectItems} multiple={true} bind:value={formData.category} placeholder="选择商品分类..." class="svelecte-control" />
                {#each formData.category as categoryId}<input type="hidden" name="category" value={categoryId} />{/each}
            </div>
        </div>

        <!-- 商品描述 -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 md:col-span-2">
            <h3 class="text-lg font-semibold text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">商品描述</h3>
            <textarea id="description" name="description" bind:value={formData.description} rows={8} placeholder="商品描述信息" class="w-full px-3 py-2 border border-gray-300 rounded resize-y min-h-[80px] focus:border-blue-400 focus:outline-none"></textarea>
        </div>
    </div>

    {#if mode === 'edit' && initialData?.id}<input type="hidden" name="id" value={initialData.id} />{/if}
    {#if initialData?.image_path}<input type="hidden" name="image_path" value={initialData.image_path} />{/if}

    <div class="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-200">
        <button type="button" class="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors" onclick={handleCancel}>取消</button>
        <button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-65" disabled={formLoading}>{formLoading ? '处理中...' : mode === 'add' ? '添加商品' : '更新'}</button>
        {#if mode === 'edit' && onShowDeleteModal && initialData?.id}<button type="button" class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors" onclick={handleDeleteClick}>删除</button>{/if}
    </div>
</form>

<style>
    :global(.svelecte-control) { border: 1px solid #ced4da !important; border-radius: 4px !important; }
</style>

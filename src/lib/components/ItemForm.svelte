<!-- 物料表单 -->
<!--
被依赖：
- `routes/item/[slug]/edit/+page.svelte`
- `routes/item/add/+page.svelte`
-->
<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors';
    import { goto } from '$app/navigation';
    import type { Category } from '$lib';
    import { apiClient } from '$lib/api';
    import { buildCategoryRelationSearchOptions } from '$lib/utils';
    import Svelecte from 'svelecte';
    import { FormInput, NumberStepper } from '$lib/components/ui';

    interface Props {
        mode: 'add' | 'edit';
        initialData?: {
            id?: number;
            SKU: string;
            name: string;
            name_en?: string;
            item_status?: 'normal' | 'clearance' | 'discontinued';
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
            is_variant_template?: boolean;
            is_variant?: boolean;
            parent_variant_info?: {
                variant_id: number;
                parent_item_id: number;
                parent_sku: string;
                parent_name: string;
                sku_suffix: string;
                attributes: { id: number; attribute_code: string; attribute_name: string; name: string; color_hex?: string | null }[];
            } | null;
        };
        categories?: Category[];
        onCancel?: () => void;
        onDelete?: (itemId: number) => Promise<void>;
        onShowDeleteModal?: () => void;
    }

    let {
        mode,
        initialData = { SKU: '', name: '', name_en: '', item_status: 'normal', SKU_zite: '', SKU_A: '', description: '', image: '', weight: '', p_volume: 0, s_volume: 0, b_Price: '', currency: '', in_fee: null, barcode: '', category: [], is_variant_template: false },
        categories = [],
        onCancel,
        onShowDeleteModal
    }: Props = $props();

    const selectItems = $derived(buildCategoryRelationSearchOptions(categories));

    let formData = $state({
        SKU: '',
        name: '',
        name_en: '',
        item_status: 'normal' as 'normal' | 'clearance' | 'discontinued',
        SKU_zite: '',
        SKU_A: '',
        description: '',
        image: '',
        weight: '',
        p_volume: 0,
        s_volume: 0,
        b_Price: '',
        currency: 'CNY',
        in_fee: null as number | null,
        barcode: '',
        category: [] as number[],
        is_variant_template: false
    });
    
    // 标记是否已经初始化，避免重复设置
    let initialized = $state(false);
    
    // 当 initialData 变化时更新表单数据（仅在未初始化时执行一次）
    // 修复：使用 untrack 避免循环依赖，只在 initialData 变化时执行
    $effect(() => {
        // 只在 mode 或 initialData 变化时执行初始化
        if (!initialized && initialData) {
            formData.SKU = initialData?.SKU || '';
            formData.name = initialData?.name || '';
            formData.name_en = initialData?.name_en || '';
            formData.item_status = initialData?.item_status || 'normal';
            formData.SKU_zite = initialData?.SKU_zite || '';
            formData.SKU_A = initialData?.SKU_A || '';
            formData.description = initialData?.description || '';
            formData.image = initialData?.image || '';
            formData.weight = initialData?.weight || '';
            formData.p_volume = initialData?.p_volume || 0;
            formData.s_volume = initialData?.s_volume || 0;
            formData.b_Price = initialData?.b_Price || '';
            formData.currency = initialData?.currency || 'CNY';
            formData.in_fee = initialData?.in_fee || null;
            formData.barcode = initialData?.barcode || '';
            formData.category = initialData?.category || [];
            formData.is_variant_template = initialData?.is_variant_template || false;
            initialized = true;
        }
    });

    let formLoading = $state(false);
    let imageError = $state(false);
    let selectedFile = $state<File | null>(null);
    let previewUrl = $state<string>('');
    let imageUrlInput = $state<string>('');

    // 变体属性编辑
    type AttrOption = { id: number; value: string; code: string; color_hex: string | null };
    type AttrDef = { name: string; values: AttrOption[] };
    let editingVariant = $state(false);
    let availableAttrs = $state<Record<string, AttrDef>>({});
    let selectedValues = $state<Record<string, number | null>>({});
    let variantEditLoading = $state(false);
    let variantEditError = $state<string | null>(null);

    async function startEditVariant() {
        const pvi = initialData?.parent_variant_info;
        if (!pvi) return;
        editingVariant = true;
        variantEditError = null;
        try {
            const resp = await apiClient.get<{ variant_summary?: { attributes?: Record<string, AttrDef> } }>(`/product/item/${pvi.parent_item_id}/variants/`);
            availableAttrs = resp.variant_summary?.attributes ?? {};
            const selected: Record<string, number | null> = {};
            for (const code of Object.keys(availableAttrs)) {
                const current = pvi.attributes.find(a => a.attribute_code === code);
                selected[code] = current?.id ?? null;
            }
            selectedValues = selected;
        } catch {
            variantEditError = '加载属性选项失败';
        }
    }

    async function saveVariantEdit() {
        const pvi = initialData?.parent_variant_info;
        if (!pvi) return;
        variantEditLoading = true;
        variantEditError = null;
        try {
            const ids = Object.values(selectedValues).filter((v): v is number => v !== null);
            await apiClient.put<unknown>(`/product/variants/${pvi.variant_id}/`, { attribute_value_ids: ids });
            editingVariant = false;
            window.location.reload();
        } catch (e) {
            variantEditError = getErrorMessage(e);
        } finally {
            variantEditLoading = false;
        }
    }

    // 修复：displayImageUrl 应该是值而不是函数
    const displayImageUrl = $derived((() => {
        if (previewUrl) return previewUrl;
        if (imageUrlInput) return imageUrlInput.startsWith('http') ? imageUrlInput : imageUrlInput;
        if (formData.image) return formData.image.startsWith('http') ? formData.image : formData.image;
        return '';
    })());

    // 当 formData.image 变化时更新 imageUrlInput
    $effect(() => {
        const img = formData.image;
        if (img && !imageUrlInput && !selectedFile) {
            imageUrlInput = img.startsWith('http') ? img : img;
        }
    });

    // 当 imageUrlInput 变化时更新 formData.image
    $effect(() => {
        const url = imageUrlInput;
        if (url && !selectedFile) {
            formData.image = url;
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
            // 从 formData 构建 submitData，过滤空值
            const submitData = new FormData();
            
            // 必填字段
            submitData.set('SKU', formData.SKU);
            submitData.set('name', formData.name);
            
            // 可选字符串字段：空字符串不提交
            const optionalStringFields = ['SKU_zite', 'SKU_A', 'description', 'barcode', 'currency', 'name_en', 'item_status'] as const;
            for (const field of optionalStringFields) {
                const value = formData[field];
                if (value && String(value).trim() !== '') {
                    submitData.set(field, String(value));
                }
            }
            
            // 数值字段：空字符串或 null 不提交，让后端用默认值
            const numericFields = ['weight', 'b_Price', 'in_fee'] as const;
            for (const field of numericFields) {
                const value = formData[field];
                if (value !== '' && value !== null && value !== undefined && String(value).trim() !== '') {
                    submitData.set(field, String(value));
                }
            }
            
            // 整数字段（体积）：0 是有效值，要提交
            submitData.set('p_volume', String(formData.p_volume ?? 0));
            submitData.set('s_volume', String(formData.s_volume ?? 0));
            
            // 分类数组
            for (const categoryId of formData.category) {
                submitData.append('category', String(categoryId));
            }
            
            // 变体母版标记（始终提交，否则取消勾选时后端无法感知变更）
            submitData.set('is_variant_template', formData.is_variant_template ? 'true' : 'false');
            
            // 图片处理
            if (selectedFile) {
                submitData.set('image', selectedFile);
            } else if (initialData?.image_path && !formData.image) {
                // 复制模式：共用原图
                submitData.set('image_path', initialData.image_path);
            }
            
            let result: { id: number };
            if (mode === 'edit' && initialData?.id) {
                result = await apiClient.patch<{ id: number }>(`/product/item/${initialData.id}/`, submitData, true);
            } else {
                result = await apiClient.post<{ id: number }>('/product/item/', submitData, true);
            }

            alert(mode === 'edit' ? '更新成功！' : '添加成功！');
            await goto(`/item/${mode === 'edit' ? initialData?.id : result.id}`);
        } catch (error) {
            alert(`提交失败: ${getErrorMessage(error, '未知错误')}`);
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
            <FormInput label="商品名称" name="name" required value={formData.name} placeholder="商品名称（中文）" maxlength={200} oninput={(v) => formData.name = v} />
            <FormInput label="商品名称 (英文)" name="name_en" value={formData.name_en || ''} placeholder="Product Name (English), 可选" maxlength={200} oninput={(v) => formData.name_en = v} />
            <div class="mb-2">
                <label for="item_status" class="block text-sm font-medium text-gray-700 mb-1">商品状态</label>
                <select
                    id="item_status"
                    bind:value={formData.item_status}
                    class="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:border-blue-400 focus:outline-none"
                >
                    <option value="normal">正常</option>
                    <option value="clearance">清仓</option>
                    <option value="discontinued">停售</option>
                </select>
            </div>
            
            <!-- 变体子项信息横幅 -->
            {#if initialData?.is_variant && initialData.parent_variant_info}
                {@const pvi = initialData.parent_variant_info}
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <div class="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
                        <!-- 标题行 -->
                        <div class="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5">
                            <span>⬡</span>
                            <span class="uppercase tracking-wide">变体子项</span>
                        </div>
                        <!-- 母版信息行 -->
                        <div class="text-gray-700 mb-2">
                            所属母版：
                            <a href="/item/{pvi.parent_item_id}" class="font-mono font-medium text-gray-900 hover:underline">{pvi.parent_sku}</a>
                            <span class="ml-1 text-gray-600">{pvi.parent_name}</span>
                        </div>
                        <!-- 当前属性行 + 编辑按钮 -->
                        {#if !editingVariant}
                            <div class="flex flex-wrap items-center gap-1.5 mb-1">
                                {#each pvi.attributes as attr}
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-300 rounded-full text-xs text-gray-600">
                                        {#if attr.color_hex}
                                            <span class="inline-block w-2.5 h-2.5 rounded-full border border-gray-300" style="background:{attr.color_hex}"></span>
                                        {/if}
                                        {attr.attribute_name}：{attr.name}
                                    </span>
                                {/each}
                                <button type="button" onclick={startEditVariant}
                                    class="text-xs px-2 py-0.5 border border-gray-300 text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
                                    编辑…
                                </button>
                            </div>
                        {/if}
                        <!-- 编辑属性展开区 -->
                        {#if editingVariant}
                            <div class="mt-1 space-y-2 mb-2">
                                {#each Object.entries(availableAttrs) as [code, attr]}
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs text-gray-500 w-14 shrink-0">{attr.name}</span>
                                        <select
                                            class="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                                            value={selectedValues[code] ?? ''}
                                            onchange={(e) => { selectedValues[code] = parseInt((e.target as HTMLSelectElement).value) || null; }}
                                        >
                                            <option value="">-- 请选择 --</option>
                                            {#each attr.values as v}
                                                <option value={v.id}>{v.value}</option>
                                            {/each}
                                        </select>
                                    </div>
                                {/each}
                                {#if variantEditError}
                                    <p class="text-xs text-red-600">{variantEditError}</p>
                                {/if}
                                <div class="flex gap-2 pt-1">
                                    <button type="button" onclick={saveVariantEdit} disabled={variantEditLoading}
                                        class="text-xs px-3 py-1 bg-gray-700 text-white rounded-md hover:bg-gray-900 disabled:opacity-50">
                                        {variantEditLoading ? '保存中…' : '保存'}
                                    </button>
                                    <button type="button" onclick={() => { editingVariant = false; }}
                                        class="text-xs px-3 py-1 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100">
                                        取消
                                    </button>
                                </div>
                            </div>
                        {/if}

                    </div>
                </div>
            {:else}
                <!-- 变体母版选项（非变体子项才显示） -->
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            bind:checked={formData.is_variant_template}
                            class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span class="text-sm font-medium text-gray-700">作为变体母版</span>
                    </label>
                    <p class="text-xs text-gray-500 mt-1 ml-6">
                        标记为母版后，可为该商品创建多个变体（如不同颜色、尺寸）
                    </p>
                </div>
            {/if}
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
                <NumberStepper value={parseFloat(formData.weight) || 0} min={0} step={1} size="sm" decimalPlaces={0} onchange={(v) => formData.weight = String(v ?? 0)} />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700">包装体积:</span>
                    <NumberStepper value={formData.p_volume} min={0} step={1} size="sm" decimalPlaces={0} onchange={(v) => formData.p_volume = v ?? 0} />
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700">存储体积:</span>
                    <NumberStepper value={formData.s_volume} min={0} step={1} size="sm" decimalPlaces={0} onchange={(v) => formData.s_volume = v ?? 0} />
                </div>
            </div>
        </div>

        <!-- 价格信息 -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">价格信息</h3>
            <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium text-gray-700">价格:</span>
                <NumberStepper value={parseFloat(formData.b_Price) || 0} min={0} step={0.01} size="sm" onchange={(v) => formData.b_Price = (v ?? 0).toFixed(2)} />
                <div class="relative w-20 shrink-0">
                    <select
                        bind:value={formData.currency}
                        class="h-[29px] w-full appearance-none rounded-sm border border-gray-300 bg-white pl-2 pr-6 text-xs leading-none text-gray-700 outline-none transition-colors hover:border-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        aria-label="货币"
                    >
                        <option value="CNY">CNY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                    </select>
                    <svg
                        class="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path d="M6 8l4 4 4-4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700">入库费用:</span>
                    <NumberStepper value={formData.in_fee ?? 0} min={0} step={0.01} size="sm" onchange={(v) => formData.in_fee = v ?? null} />
                </div>
            </div>
        </div>

        <!-- 其他信息 -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">其他信息</h3>
            <div class="mb-3">
                <div class="flex items-center justify-between mb-2">
                    <label for="imageUrl" class="text-sm font-medium text-gray-700">商品图片</label>
                    <div class="flex gap-2">
                        <input type="file" id="imageFile" accept="image/*" class="hidden" onchange={handleImageUpload} />
                        <button type="button" class="px-2 py-1 text-xs border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors" onclick={() => document.getElementById('imageFile')?.click()}>选择</button>
                        {#if displayImageUrl}<button type="button" class="px-2 py-1 text-xs border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors" onclick={clearImage}>清除</button>{/if}
                    </div>
                </div>
                <div class="w-full h-[200px] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 mb-2">
                    {#if displayImageUrl}
                        <img src={displayImageUrl} alt="商品图片预览" class="w-full h-full object-cover" onerror={handleImageError} />
                        {#if imageError}<div class="w-full h-full flex items-center justify-center text-gray-500 text-sm text-center px-1"><span>图片加载失败</span></div>{/if}
                    {:else}
                        <div class="w-full h-full flex items-center justify-center text-gray-500 text-sm text-center px-1"><span>暂无图片</span></div>
                    {/if}
                </div>
                <div>
                    <input type="text" id="imageUrl" bind:value={imageUrlInput} maxlength={500} placeholder="或输入图片URL" class="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 focus:border-blue-400 focus:bg-white focus:outline-none" readonly={mode === 'edit'} />
                </div>
            </div>
            <div class="mb-2">
                <label for="category-select" class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <Svelecte
                    inputId="category-select"
                    options={selectItems}
                    multiple={true}
                    bind:value={formData.category}
                    placeholder="选择商品分类..."
                    searchProps={mode === 'edit' ? { fields: ['label', 'searchText'], skipSort: true } : { fields: ['label'], skipSort: true }}
                    class="svelecte-control"
                />
                
            </div>
        </div>

        <!-- 商品描述 -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 md:col-span-2">
            <h3 class="text-lg font-semibold text-gray-700 border-b-2 border-gray-300 pb-1 mb-3">商品描述</h3>
            <textarea id="description" name="description" bind:value={formData.description} rows={8} placeholder="商品描述信息" class="w-full px-3 py-2 border border-gray-300 rounded resize-y min-h-[80px] focus:border-blue-400 focus:outline-none"></textarea>
            <div class="text-right text-xs text-gray-400 mt-1">{(formData.description || '').length} 字符</div>
        </div>
    </div>

    

    <div class="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-200">
        <button type="button" class="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors" onclick={handleCancel}>取消</button>
        <button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-65" disabled={formLoading}>{formLoading ? '处理中...' : mode === 'add' ? '添加商品' : '更新'}</button>
        {#if mode === 'edit' && onShowDeleteModal && initialData?.id}<button type="button" class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors" onclick={handleDeleteClick}>删除</button>{/if}
    </div>
</form>

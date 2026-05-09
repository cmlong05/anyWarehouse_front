<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors';
	import { logger } from '$lib/logger';
    import type { ContainerBriefID } from '$lib';
    import { apiClient } from '$lib/api';
    import Svelecte from 'svelecte';
    import { goto } from '$app/navigation';
    import { FormInput, NumberStepper } from '$lib/components/ui';

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
    const selectItems = $derived(containers.map((item: ContainerBriefID) => ({
        value: item.fastCode,
        label: item.fastCode
    })));

    const getParentFastCode = (parentId: number | null | undefined): string | null => {
        if (!parentId) return null;
        const parentContainer = containers.find((c: ContainerBriefID) => c.id === parentId);
        return parentContainer ? parentContainer.fastCode : null;
    };

    let formData = $state({
        fastCode: '',
        barcode: '',
        mark: '',
        volume: 0,
        zz_volume: 0,
        zz_weight: 0,
        a_volume: 0,
        total_weight: 0,
        parent: null as string | null
    });

    function generateBarcode() {
        const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    }
    
    // 当 initialData 变化时更新表单数据
    $effect(() => {
        formData.fastCode = initialData.fastCode || '';
        formData.mark = initialData.mark || '';
        formData.volume = initialData.volume || 0;
        formData.zz_volume = initialData.zz_volume || 0;
        formData.zz_weight = initialData.zz_weight || 0;
        formData.a_volume = initialData.a_volume || 0;
        formData.total_weight = initialData.total_weight || 0;
        formData.parent = getParentFastCode(initialData.parent);

        // Compute barcode without reading formData.barcode (avoids effect cycle)
        const initialBarcode = initialData.barcode || '';
        formData.barcode = (mode === 'add' && !initialBarcode) ? generateBarcode() : initialBarcode;
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
            let result: { fastCode: string };
            if (mode === 'add') {
                result = await apiClient.post<{ fastCode: string }>('/warehouse/container/', submitData);
            } else {
                result = await apiClient.patch<{ fastCode: string }>(`/warehouse/container/${initialData?.fastCode}/`, submitData);
            }
            await goto(`/container/${result.fastCode || submitData.fastCode}`);
        } catch (error) {
            logger.error('Submit error:', error);
            alert(`${mode === 'add' ? '创建' : '更新'}容器失败: ${getErrorMessage(error, '未知错误')}`);
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

<form onsubmit={handleSubmit} class="max-w-xl mx-auto">
    {#if mode === 'edit' && initialData.id}
        <div class="bg-gray-100 p-2 rounded-md mb-4 font-bold text-gray-500">
            容器ID: {initialData.id}
        </div>
    {/if}
    
    {#if containers.length > 0}
        <div class="mb-4">
            <label for="parent" class="block mb-1 font-bold text-gray-700">父容器</label>
            {#if mode === 'add' && formData.parent}
                <input 
                    type="text" 
                    value={formData.parent}
                    disabled
                    class="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 box-border"
                />
            {:else}
                <Svelecte
                    inputId="parent"
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
        required
        oninput={(v) => formData.barcode = v}
    />

    <FormInput
        label="标记/备注"
        name="mark"
        value={formData.mark}
        placeholder="容器描述或标记"
        oninput={(v) => formData.mark = v}
    />

    <div class="mb-4">
        <label for="volume" class="block mb-1 font-bold text-gray-700">总容量</label>
        <NumberStepper
            id="volume"
            name="volume"
            value={formData.volume}
            min={1}
            step={1}
            decimalPlaces={0}
            size="sm"
            onchange={(v) => formData.volume = v ?? 0}
        />
    </div>

    <div class="mb-4">
        <label for="zz_volume" class="block mb-1 font-bold text-gray-700">自占体积</label>
        <NumberStepper
            id="zz_volume"
            name="zz_volume"
            value={formData.zz_volume}
            min={0}
            step={1}
            decimalPlaces={0}
            size="sm"
            onchange={(v) => formData.zz_volume = v ?? 0}
        />
    </div>

    <div class="mb-4">
        <label for="zz_weight" class="block mb-1 font-bold text-gray-700">箱体自重</label>
        <NumberStepper
            id="zz_weight"
            name="zz_weight"
            value={formData.zz_weight}
            min={0}
            step={1}
            decimalPlaces={0}
            size="sm"
            onchange={(v) => formData.zz_weight = v ?? 0}
        />
    </div>

    <div class="flex flex-col md:flex-row gap-4 mt-8 flex-wrap">
        <button type="submit" class="px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-opacity duration-150 bg-blue-600 text-white hover:opacity-90 w-full md:w-auto">
            {mode === 'add' ? '添加容器' : '保存修改'}
        </button>
        <button type="button" class="px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-opacity duration-150 bg-gray-500 text-white hover:opacity-90 w-full md:w-auto" onclick={handleCancel}>
            取消
        </button>
        {#if mode === 'edit' && onDelete}
            <button type="button" class="px-6 py-3 rounded-md cursor-pointer text-base font-medium transition-opacity duration-150 bg-red-600 text-white hover:opacity-90 w-full md:w-auto" onclick={handleDelete}>
                删除容器
            </button>
        {/if}
    </div>
</form>

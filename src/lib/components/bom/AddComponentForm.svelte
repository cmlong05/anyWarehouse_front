<!-- 新增BOM组件表单 -->
<!--
被依赖：
- `lib/components/item/ItemComponentManager.svelte`
- `lib/components/bom/index.ts`
-->
<script lang="ts">
    import Svelecte from 'svelecte';
    import { config } from '$lib/config';
    import type { ComponentFormData } from '$lib/composables/useBOMManager.svelte';
    import { NumberStepper } from '$lib/components/ui';

    interface Props {
        itemId: number;
        itemSKU: string;
        show: boolean;
        loading: boolean;
        showToggle?: boolean;
        onAdd: (childItemId: number, data: ComponentFormData) => Promise<void>;
        onToggle: () => void;
        onFilter: (results: unknown) => { value: number; label: string }[];
    }
    
    let {
        itemId,
        itemSKU,
        show,
        loading,
        showToggle = true,
        onAdd,
        onToggle,
        onFilter
    }: Props = $props();

    let selectedChildItemId = $state<number | null>(null);
    let formData = $state<ComponentFormData>({ quantity: 1, order: 0, note: '' });

    const itemSearchUrl = $derived(`${config.API_BASE_URL}/product/item/search?q=[query]`);

    async function handleSubmit() {
        if (!selectedChildItemId) return;
        await onAdd(selectedChildItemId, formData);
        // 重置表单
        selectedChildItemId = null;
        formData = { quantity: 1, order: 0, note: '' };
    }
</script>

{#if showToggle}
    <div class="mb-4">
        <button class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded transition-all duration-200 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600" onclick={onToggle}>
            {show ? '取消' : '添加组件'}
        </button>
    </div>
{/if}

{#if show}
    <div class="bg-white p-4 rounded-md mb-4 border border-gray-200">
        <h4 class="mb-4 text-gray-700 font-medium">添加组件到 {itemSKU}</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="mb-4 col-span-full">
                <label for="child-item" class="block mb-2 font-medium text-gray-600">搜索子物品:</label>
                <Svelecte
                    inputId="child-item"
                    bind:value={selectedChildItemId}
                    valueAsObject={false}
                    placeholder="输入SKU或名称搜索..."
                    searchable={true}
                    clearable={true}
                    minQuery={1}
                    fetch={itemSearchUrl}
                    fetchCallback={onFilter}
                    valueField="value"
                    labelField="label"
                    closeAfterSelect={true}
                    resetOnSelect={true}
                />
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="mb-4">
                <label for="comp-quantity" class="block mb-2 font-medium text-gray-600">数量:</label>
                <NumberStepper
                    id="comp-quantity"
                    value={formData.quantity}
                    min={1}
                    max={999999}
                    step={1}
                    decimalPlaces={0}
                    onchange={(v) => formData.quantity = v ?? 1}
                />
            </div>
            <div class="mb-4">
                <label for="comp-order" class="block mb-2 font-medium text-gray-600">排序:</label>
                <NumberStepper
                    id="comp-order"
                    value={formData.order}
                    min={0}
                    max={9999}
                    step={1}
                    decimalPlaces={0}
                    onchange={(v) => formData.order = v ?? 0}
                />
            </div>
        </div>

        <div class="mb-4">
            <label for="comp-note" class="block mb-2 font-medium text-gray-600">备注:</label>
            <input type="text" id="comp-note" bind:value={formData.note} maxlength="500" placeholder="可选：添加备注信息" class="w-full p-2 border border-gray-300 rounded" />
        </div>

        <div class="flex justify-end gap-2">
            <button class="px-4 py-2 text-sm bg-blue-600 text-white rounded transition-all duration-200 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600" onclick={handleSubmit} disabled={!selectedChildItemId || loading}>
                {loading ? '添加中...' : '确认添加'}
            </button>
        </div>
    </div>
{/if}
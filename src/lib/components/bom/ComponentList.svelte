<!-- 组件列表 -->
<script lang="ts">
    import type { ComponentDetail } from '$lib';
    import type { ComponentFormData } from '$lib/composables/useBOMManager.svelte';
    import { NumberStepper } from '$lib/components/ui';

    interface Props {
        components: ComponentDetail[];
        onUpdate: (id: number, data: ComponentFormData) => Promise<void>;
        onDelete: (id: number) => void;
    }
    
    let { components, onUpdate, onDelete }: Props = $props();

    // 编辑状态
    let editingId = $state<number | null>(null);
    let editData = $state<ComponentFormData>({ quantity: 1, order: 0, note: '' });

    function startEdit(component: ComponentDetail) {
        editingId = component.id;
        editData = {
            quantity: component.quantity,
            order: component.order,
            note: component.note || ''
        };
    }

    function cancelEdit() {
        editingId = null;
    }

    async function saveEdit(id: number) {
        await onUpdate(id, editData);
        editingId = null;
    }
</script>

{#if components.length === 0}
    <div class="text-center p-8 text-gray-500">暂无组件，请点击"添加组件"按钮添加</div>
{:else}
    <div class="flex flex-col gap-3">
        {#each components as component}
            {#if editingId === component.id}
                <div class="bg-orange-50 p-4 rounded-md border border-gray-200 flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                    <div class="w-full">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="mb-3">
                                <label for="edit-quantity-{component.id}" class="block mb-1 text-sm text-gray-600">数量:</label>
                                <NumberStepper
                                    id="edit-quantity-{component.id}"
                                    value={editData.quantity}
                                    min={1}
                                    max={999999}
                                    step={1}
                                    decimalPlaces={0}
                                    onchange={(v) => editData.quantity = v ?? 1}
                                />
                            </div>
                            <div class="mb-3">
                                <label for="edit-order-{component.id}" class="block mb-1 text-sm text-gray-600">排序:</label>
                                <NumberStepper
                                    id="edit-order-{component.id}"
                                    value={editData.order}
                                    min={0}
                                    max={9999}
                                    step={1}
                                    decimalPlaces={0}
                                    onchange={(v) => editData.order = v ?? 0}
                                />
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="block mb-1 text-sm text-gray-600">备注: <input type="text" bind:value={editData.note} maxlength="500" class="w-full p-2 border border-gray-300 rounded" /></label>
                        </div>
                        <div class="flex gap-2 mt-2">
                            <button class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded transition-all duration-200 hover:bg-blue-700" onclick={() => saveEdit(component.id)}>保存</button>
                            <button class="px-3 py-1.5 text-sm bg-gray-500 text-white rounded transition-all duration-200 hover:bg-gray-600" onclick={cancelEdit}>取消</button>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="bg-white p-4 rounded-md border border-gray-200 flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <a href="/item/{component.child_item}" class="font-medium text-blue-600 hover:underline">
                                {component.child_item_detail.SKU} - {component.child_item_detail.name}
                            </a>
                            <span class="bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">× {component.quantity}</span>
                        </div>
                        {#if component.note}
                            <div class="text-gray-600 text-sm mt-1">备注: {component.note}</div>
                        {/if}
                        <div class="text-gray-400 text-xs mt-1 flex gap-4">
                            <span>库存: {component.child_item_storage}</span>
                            {#if component.child_item_detail.weight}
                                <span>重量: {component.child_item_detail.weight}</span>
                            {/if}
                        </div>
                    </div>
                    <div class="flex gap-2 w-full md:w-auto justify-end">
                        <button class="px-3 py-1.5 text-sm bg-gray-500 text-white rounded transition-all duration-200 hover:bg-gray-600" onclick={() => startEdit(component)}>编辑</button>
                        <button class="px-3 py-1.5 text-sm bg-red-500 text-white rounded transition-all duration-200 hover:bg-red-600" onclick={() => onDelete(component.id)}>删除</button>
                    </div>
                </div>
            {/if}
        {/each}
    </div>
{/if}

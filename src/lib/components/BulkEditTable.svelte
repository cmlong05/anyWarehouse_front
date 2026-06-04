<!-- 批量编辑表格 -->
<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors';
    import type { ApiClient } from '$lib/api/client';
    import NumberStepper from '$lib/components/ui/NumberStepper.svelte';
    import CurrencySelect from '$lib/components/ui/CurrencySelect.svelte';

    interface Item {
        id: number;
        SKU: string;
        name: string;
        name_en?: string;
        description?: string;
        b_Price?: string | number | null;
        currency?: string;
        weight?: string | number;
        [key: string]: unknown;
    }

    interface BulkEditTableProps {
        isOpen?: boolean;
        selectedItems: Item[];
        apiClient: ApiClient;
        onclose?: () => void;
        onsuccess?: () => void;
    }

    let { isOpen = false, selectedItems = [], apiClient, onclose, onsuccess }: BulkEditTableProps = $props();

    // plain object，Svelte 5 $state 能正确代理
    let editingData: Record<string, Record<string, any>> = $state({});
    let modifiedCount = $state(0);
    let isSubmitting = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');
    let editingCell: {itemId: number; field: string} | null = $state(null);

    const editableFields = [
        { key: 'name', label: '中文名', type: 'text' },
        { key: 'name_en', label: '英文名', type: 'text' },
        { key: 'b_Price', label: '价格', type: 'number', decimalPlaces: 2 },
        { key: 'currency', label: '币种', type: 'currency' },
        { key: 'weight', label: '重量(g)', type: 'number', decimalPlaces: 0 }
    ];

    function closeModal() {
        editingData = {};
        modifiedCount = 0;
        editingCell = null;
        errorMessage = '';
        successMessage = '';
        onclose?.();
    }

    function getDisplayValue(item: Item, field: string): string {
        const key = String(item.id);
        if (editingData[key] && field in editingData[key]) {
            return String(editingData[key][field] ?? '');
        }
        return String(item[field] ?? '');
    }

    function commitCell(itemId: number, field: string, inputEl: HTMLInputElement) {
        const value = inputEl.value;
        const key = String(itemId);
        const item = selectedItems.find(i => i.id === itemId);
        const original = String(item?.[field] ?? '');

        if (value !== original) {
            if (!editingData[key]) {
                editingData[key] = {};
            }
            editingData[key][field] = value === '' ? null : value;
        }
        modifiedCount = Object.keys(editingData).length;
        editingCell = null;
    }

    function commitNumberCell(itemId: number, field: string, newValue: number | null | undefined) {
        const key = String(itemId);
        const item = selectedItems.find(i => i.id === itemId);
        const original = item?.[field] ?? null;
        const normalizedNew = newValue ?? null;
        const normalizedOld = original !== null && original !== '' ? Number(original) : null;

        if (normalizedNew !== normalizedOld) {
            if (!editingData[key]) editingData[key] = {};
            editingData[key][field] = normalizedNew;
        }
        modifiedCount = Object.keys(editingData).length;
    }

    function isModified(itemId: number, field: string): boolean {
        const key = String(itemId);
        return !!(editingData[key] && field in editingData[key]);
    }

    async function handleSubmit() {
        if (modifiedCount === 0) {
            errorMessage = '没有修改任何字段';
            return;
        }

        const updates = Object.entries(editingData).map(([id, changes]) => ({
            id: Number(id),
            ...changes
        }));

        isSubmitting = true;
        errorMessage = '';
        successMessage = '';

        try {
            const response = await apiClient.post('/product/item/bulk_update_items/', {
                updates
            }) as { success: boolean; updated_count: number; failed_items?: unknown[]; error?: string };

            if (response.success) {
                const msg = `成功更新 ${response.updated_count} 个物品`;
                successMessage = msg;
                setTimeout(() => {
                    onsuccess?.();
                    closeModal();
                }, 800);
            } else {
                errorMessage = response.error || '更新失败';
            }
        } catch (err) {
            errorMessage = getErrorMessage(err, '请求失败，请检查网络连接');
        } finally {
            isSubmitting = false;
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
         onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div class="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col"
             onclick={(e) => e.stopPropagation()}>
            <!-- 标题栏 -->
            <div class="shrink-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">批量编辑物品</h2>
                    <p class="text-sm text-gray-500 mt-1">
                        已选 {selectedItems.length} 个物品，已修改 <span class="font-medium text-blue-600">{modifiedCount}</span> 个物品
                    </p>
                </div>
                <button
                    class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    onclick={closeModal}
                    disabled={isSubmitting}
                >✕</button>
            </div>

            <!-- 表格内容区（可滚动） -->
            <div class="flex-1 overflow-auto p-6">
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">SKU</th>
                                {#each editableFields as field}
                                    <th class="px-4 py-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap min-w-28">
                                        {field.label}
                                    </th>
                                {/each}
                            </tr>
                        </thead>
                        <tbody>
                            {#each selectedItems as item (item.id)}
                                <tr class="border-b border-gray-100 hover:bg-gray-50/50">
                                    <td class="px-4 py-2.5 text-sm font-mono text-blue-600 whitespace-nowrap">
                                        {item.SKU}
                                    </td>

                                    {#each editableFields as field (field.key)}
                                        {@const editing = editingCell?.itemId === item.id && editingCell?.field === field.key}
                                        {@const modified = isModified(item.id, field.key)}
                                        <td
                                            class="px-4 py-1 text-sm {field.type === 'number' || field.type === 'currency' ? '' : 'cursor-pointer'} {modified ? 'bg-blue-50' : ''}"
                                            onclick={() => { if (field.type !== 'number' && field.type !== 'currency' && !editing) editingCell = {itemId: item.id, field: field.key}; }}
                                        >
                                            {#if field.type === 'number'}
                                                <NumberStepper
                                                    value={(() => {
                                                        const key = String(item.id);
                                                        const v = (editingData[key] && field.key in editingData[key])
                                                            ? editingData[key][field.key]
                                                            : item[field.key];
                                                        return v !== null && v !== undefined && v !== '' ? Number(v) : null;
                                                    })()}
                                                    decimalPlaces={field.decimalPlaces ?? 2}
                                                    step={1}
                                                    size="sm"
                                                    onchange={(v) => commitNumberCell(item.id, field.key, v)}
                                                />
                                            {:else if field.type === 'currency'}
                                                <CurrencySelect
                                                    value={(() => {
                                                        const key = String(item.id);
                                                        return (editingData[key] && field.key in editingData[key])
                                                            ? editingData[key][field.key]
                                                            : (item[field.key] || 'CNY');
                                                    })()}
                                                    onchange={(v) => {
                                                        const key = String(item.id);
                                                        const original = item[field.key] || 'CNY';
                                                        if (v !== original) {
                                                            if (!editingData[key]) editingData[key] = {};
                                                            editingData[key][field.key] = v;
                                                        }
                                                        modifiedCount = Object.keys(editingData).length;
                                                    }}
                                                />
                                            {:else if editing}
                                                <!-- svelte-ignore a11y_autofocus -->
                                                <input
                                                    type="text"
                                                    value={getDisplayValue(item, field.key)}
                                                    onblur={(e) => commitCell(item.id, field.key, e.target as HTMLInputElement)}
                                                    onkeydown={(e) => {
                                                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                                        if (e.key === 'Escape') { editingCell = null; }
                                                    }}
                                                    class="w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    autofocus
                                                />
                                            {:else}
                                                <span class="block py-1 {modified ? 'text-blue-700 font-medium' : 'text-gray-700'}">
                                                    {getDisplayValue(item, field.key) || '-'}
                                                </span>
                                            {/if}
                                        </td>
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                {#if errorMessage}
                    <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {errorMessage}
                    </div>
                {/if}

                {#if successMessage}
                    <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                        {successMessage}
                    </div>
                {/if}
            </div>

            <!-- 操作栏 -->
            <div class="shrink-0 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <p class="text-sm text-gray-500">
                    提示：单击单元格编辑，Enter 确认，Esc 取消
                </p>
                <div class="flex items-center gap-3">
                    <button
                        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        onclick={closeModal}
                        disabled={isSubmitting}
                    >
                        取消
                    </button>
                    <button
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        onclick={handleSubmit}
                        disabled={isSubmitting || modifiedCount === 0}
                    >
                        {#if isSubmitting}
                            保存中...
                        {:else}
                            确认保存 {#if modifiedCount > 0}({modifiedCount}){/if}
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

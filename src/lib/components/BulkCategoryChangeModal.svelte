<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors';
    import type { Category } from '$lib';
    import type { ApiClient } from '$lib/api/client';
    import Svelecte from 'svelecte';

    interface SelectedItem {
        id: number;
        SKU: string;
        name: string;
    }

    interface BulkCategoryChangeModalProps {
        isOpen?: boolean;
        currentCategoryId: number;
        currentCategoryName: string;
        selectedItems: SelectedItem[];
        apiClient: ApiClient;
        onclose?: () => void;
        onsuccess?: () => void;
    }

    type ChangeMode = 'move' | 'add';

    interface BulkChangeResponse {
        success: boolean;
        processed_count: number;
        added_count: number;
        removed_count: number;
        changed_item_ids: number[];
        skipped_items: Array<{ id: number; reason: string }>;
        error?: string;
    }

    let {
        isOpen = false,
        currentCategoryId,
        currentCategoryName,
        selectedItems,
        apiClient,
        onclose,
        onsuccess,
    }: BulkCategoryChangeModalProps = $props();

    let categories = $state<Category[]>([]);
    let selectedTargetCategoryId = $state<number | null>(null);
    let mode = $state<ChangeMode>('move');
    let isLoadingCategories = $state(false);
    let isSubmitting = $state(false);
    let errorMessage = $state('');
    let hasLoadedCategories = $state(false);
    let changedItems = $state<SelectedItem[]>([]);
    let skippedItemsDetail = $state<Array<{ id: number; SKU?: string; name?: string; reason: string }>>([]);
    let resultSourceName = $state('');
    let resultTargetName = $state('');
    let resultSourceId = $state<number | null>(null);
    let resultTargetId = $state<number | null>(null);
    let resultMode = $state<ChangeMode>('move');

    const availableCategories = $derived(
        categories.filter((category) => category.id !== currentCategoryId)
    );

    const categoryOptions = $derived(
        availableCategories.map((category) => ({
            value: category.id,
            label: formatCategoryName(category),
        }))
    );

    function closeModal() {
        selectedTargetCategoryId = null;
        mode = 'move';
        isSubmitting = false;
        errorMessage = '';
        changedItems = [];
        skippedItemsDetail = [];
        resultSourceName = '';
        resultTargetName = '';
        resultSourceId = null;
        resultTargetId = null;
        onclose?.();
    }

    function formatCategoryName(category: Category): string {
        const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(Math.max(category.level, 0));
        return `${indent}${category.name}`;
    }

    async function loadCategories() {
        if (isLoadingCategories || hasLoadedCategories) {
            return;
        }

        isLoadingCategories = true;
        errorMessage = '';

        try {
            const response = await apiClient.get<Category[]>('/product/category/');
            categories = response;
            hasLoadedCategories = true;
        } catch (err) {
            errorMessage = getErrorMessage(err, '分类加载失败');
        } finally {
            isLoadingCategories = false;
        }
    }

    $effect(() => {
        if (isOpen) {
            loadCategories();
        }
    });

    async function handleSubmit() {
        if (selectedTargetCategoryId === null) {
            errorMessage = '请选择目标分类';
            return;
        }

        if (selectedItems.length === 0) {
            errorMessage = '请先选择物品';
            return;
        }

        // 快照提交时的选择，防止父页面刷新后丢失映射关系
        const itemMap = new Map(selectedItems.map((item) => [item.id, item]));
        const itemIds = Array.from(itemMap.keys());
        const targetCategory = categories.find((c) => c.id === selectedTargetCategoryId);
        const submittedSourceName = currentCategoryName;
        const submittedTargetName = targetCategory?.name ?? `#${selectedTargetCategoryId}`;
        const submittedMode = mode;

        isSubmitting = true;
        errorMessage = '';
        changedItems = [];
        skippedItemsDetail = [];
        resultSourceName = '';
        resultTargetName = '';
        resultSourceId = null;
        resultTargetId = null;

        try {
            const response = await apiClient.post<BulkChangeResponse>('/product/item/bulk_change_category/', {
                item_ids: itemIds,
                source_category_id: currentCategoryId,
                target_category_id: selectedTargetCategoryId,
                mode,
            });

            if (!response.success) {
                errorMessage = response.error || '分类调整失败';
                return;
            }

            changedItems = (response.changed_item_ids ?? [])
                .map((id) => itemMap.get(id))
                .filter((item): item is SelectedItem => item !== undefined);
            skippedItemsDetail = (response.skipped_items ?? []).map((skip) => {
                const detail = itemMap.get(skip.id);
                return {
                    id: skip.id,
                    SKU: detail?.SKU,
                    name: detail?.name,
                    reason: skip.reason,
                };
            });

            const skippedCount = skippedItemsDetail.length;
            const processed = response.processed_count;

            if (processed === 0) {
                errorMessage = skippedCount > 0
                    ? `未处理任何物品，跳过 ${skippedCount} 个（可能不在当前分类下）`
                    : '未处理任何物品';
                return;
            }

            resultSourceName = submittedSourceName;
            resultTargetName = submittedTargetName;
            resultSourceId = currentCategoryId;
            resultTargetId = selectedTargetCategoryId;
            resultMode = submittedMode;

            // 不自动关闭弹窗，仅后台刷新页面数据，让操作人员看完结果后手动关闭
            onsuccess?.();
        } catch (err) {
            errorMessage = getErrorMessage(err, '请求失败，请检查网络连接');
        } finally {
            isSubmitting = false;
        }
    }

    function skipReasonText(reason: string): string {
        if (reason === 'item_not_found') return '物品不存在';
        if (reason === 'not_in_source_category') return '不在当前分类下';
        return reason;
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
         onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
             onclick={(e) => e.stopPropagation()}>
            <div class="shrink-0 border-b border-gray-200 px-6 py-4">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-900">批量调整分类</h2>
                        <p class="mt-1 text-sm text-gray-500">
                            当前分类：<span class="font-medium text-gray-700">{currentCategoryName}</span>
                        </p>
                        <p class="mt-1 text-sm text-gray-500">已选 {selectedItems.length} 个物品</p>
                    </div>
                    <button
                        class="text-2xl leading-none text-gray-400 hover:text-gray-600"
                        onclick={closeModal}
                        disabled={isSubmitting}
                    >✕</button>
                </div>
            </div>

            <div class="flex-1 space-y-5 overflow-auto px-6 py-5">
                {#if resultTargetId !== null && changedItems.length > 0}
                    <div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        {#if resultMode === 'move'}
                            已将 <span class="font-medium">{changedItems.length}</span> 个物品从 「{resultSourceName}」 转移到
                            <a href="/item/category/{resultTargetId}" target="_blank" rel="noopener" class="font-medium text-blue-700 underline hover:text-blue-900">「{resultTargetName}」</a>
                        {:else}
                            已为 <span class="font-medium">{changedItems.length}</span> 个物品添加分类
                            <a href="/item/category/{resultTargetId}" target="_blank" rel="noopener" class="font-medium text-blue-700 underline hover:text-blue-900">「{resultTargetName}」</a>
                        {/if}
                    </div>
                {/if}

                <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {#if mode === 'move'}
                        只会移除物品与当前分类的关系，并添加到目标分类。其他已有分类关系保持不变。
                    {:else}
                        只会为所选物品新增目标分类，不会移除当前分类，也不会影响其他已有分类。
                    {/if}
                </div>

                <div>
                    <p class="mb-2 text-sm font-medium text-gray-700">操作方式</p>
                    <div class="flex items-center gap-6">
                        <label class="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="radio"
                                name="bulk-category-mode"
                                value="move"
                                bind:group={mode}
                                disabled={isSubmitting}
                                class="accent-blue-600"
                            />
                            <span class="text-sm text-gray-700">转移分类</span>
                        </label>
                        <label class="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="radio"
                                name="bulk-category-mode"
                                value="add"
                                bind:group={mode}
                                disabled={isSubmitting}
                                class="accent-blue-600"
                            />
                            <span class="text-sm text-gray-700">添加分类</span>
                        </label>
                    </div>
                </div>

                <div>
                    <p class="mb-2 text-sm font-medium text-gray-700">目标分类</p>
                    <Svelecte
                        options={categoryOptions}
                        bind:value={selectedTargetCategoryId}
                        placeholder={isLoadingCategories ? '分类加载中...' : '请选择目标分类'}
                        clearable={true}
                        searchable={true}
                        disabled={isSubmitting || isLoadingCategories}
                        class="svelecte-control"
                    />
                </div>

                {#if errorMessage}
                    <div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                {/if}

                {#if changedItems.length > 0}
                    <div class="rounded border border-gray-200">
                        <div class="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                            已修改物品 ({changedItems.length})
                        </div>
                        <ul class="max-h-48 divide-y divide-gray-100 overflow-auto">
                            {#each changedItems as item (item.id)}
                                <li>
                                    <a
                                        href="/item/{item.id}"
                                        target="_blank"
                                        rel="noopener"
                                        class="flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-50"
                                    >
                                        <span class="font-mono text-purple-600">{item.SKU}</span>
                                        <span class="text-gray-700">{item.name}</span>
                                    </a>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                {#if skippedItemsDetail.length > 0}
                    <div class="rounded border border-amber-200">
                        <div class="border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                            跳过物品 ({skippedItemsDetail.length})
                        </div>
                        <ul class="max-h-40 divide-y divide-gray-100 overflow-auto">
                            {#each skippedItemsDetail as item (item.id)}
                                <li class="flex items-center gap-3 px-3 py-2 text-sm">
                                    {#if item.SKU}
                                        <a
                                            href="/item/{item.id}"
                                            target="_blank"
                                            rel="noopener"
                                            class="font-mono text-purple-600 hover:underline"
                                        >{item.SKU}</a>
                                        <span class="text-gray-700">{item.name}</span>
                                    {:else}
                                        <span class="text-gray-500">#{item.id}</span>
                                    {/if}
                                    <span class="ml-auto text-xs text-amber-700">{skipReasonText(item.reason)}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>

            <div class="flex shrink-0 items-center justify-between border-t border-gray-200 px-6 py-4">
                <p class="text-sm text-gray-500">
                    提交后会按当前分类上下文处理，不会覆盖物品的全部分类列表。
                </p>
                <div class="flex items-center gap-3">
                    <button
                        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        onclick={closeModal}
                        disabled={isSubmitting}
                    >
                        取消
                    </button>
                    <button
                        class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onclick={handleSubmit}
                        disabled={isSubmitting || selectedTargetCategoryId === null || selectedItems.length === 0}
                    >
                        {#if isSubmitting}
                            提交中...
                        {:else}
                            确认
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
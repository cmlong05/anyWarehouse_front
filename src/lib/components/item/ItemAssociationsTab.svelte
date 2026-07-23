<!-- 关联物品标签页 -->
<!--
被依赖：
- `routes/item/[slug]/+page.svelte`
-->
<script lang="ts">
    import { untrack } from 'svelte';
    import Svelecte from 'svelecte';
    import { config } from '$lib/config';
    import { itemAPI } from '$lib/api';
    import type { ItemAssociationBrief } from '$lib/api/product';
    import type { BaseItem } from '$lib';
    import { getErrorMessage } from '$lib/utils/errors';
    import { ConfirmModal } from '$lib/components';
    import Plus from 'lucide-svelte/icons/plus';

    let {
        itemId,
        initialItems = [],
        count = $bindable(0),
    }: {
        itemId: number;
        initialItems?: ItemAssociationBrief[];
        count?: number;
    } = $props();

    let associatedItems = $state<ItemAssociationBrief[]>(untrack(() => initialItems));
    let showSearch = $state(false);
    let adding = $state(false);
    let removing = $state(false);
    let pendingRemoveId = $state<number | null>(null);
    let pendingRemoveItem = $state<ItemAssociationBrief | null>(null);

    let selectedId = $state<number | null>(null);

    const itemSearchUrl = $derived(`${config.API_BASE_URL}/product/item/search?q=[query]`);

    $effect(() => {
        if (selectedId !== null) {
            handleAdd(selectedId);
            selectedId = null;
        }
    });

    $effect(() => {
        count = associatedItems.length;
    });

    function filterResults(json: unknown): { value: number; label: string }[] {
        const results = Array.isArray(json)
            ? json
            : ((json as { results?: BaseItem[] })?.results || []);
        return results
            .filter((r: BaseItem) => r.id !== itemId)
            .map((r: BaseItem) => ({ value: r.id, label: `${r.SKU} - ${r.name}` }));
    }

    function toggleSearch() {
        showSearch = !showSearch;
    }

    async function handleAdd(childItemId: number | null) {
        if (!childItemId) return;
        adding = true;
        try {
            await itemAPI.addAssociations(itemId, [childItemId]);
            const all = await itemAPI.getAssociations(itemId);
            associatedItems = all;
        } catch (err) {
            alert(getErrorMessage(err, '添加失败'));
        } finally {
            adding = false;
        }
    }

    function confirmRemove(item: ItemAssociationBrief) {
        pendingRemoveId = item.id;
        pendingRemoveItem = item;
    }

    async function handleConfirmRemove() {
        if (!pendingRemoveId) return;
        removing = true;
        try {
            await itemAPI.removeAssociations(itemId, [pendingRemoveId]);
            associatedItems = associatedItems.filter((a) => a.id !== pendingRemoveId);
        } catch (err) {
            alert(getErrorMessage(err, '移除失败'));
        } finally {
            removing = false;
            pendingRemoveId = null;
            pendingRemoveItem = null;
        }
    }

    function cancelRemove() {
        pendingRemoveId = null;
        pendingRemoveItem = null;
    }
</script>

<div class="space-y-5">
    <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">关联物品</h2>
        <button
            type="button"
            onclick={toggleSearch}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
            <Plus class="h-4 w-4" />
            {showSearch ? '取消' : '添加关联'}
        </button>
    </div>

    {#if showSearch}
        <div class="bg-white p-4 rounded-md border border-gray-200">
            <label for="assoc-item" class="block mb-2 font-medium text-gray-600">搜索物品:</label>
            <Svelecte
                inputId="assoc-item"
                bind:value={selectedId}
                valueAsObject={false}
                placeholder="输入SKU或名称搜索..."
                searchable={true}
                clearable={true}
                minQuery={1}
                fetch={itemSearchUrl}
                fetchCallback={filterResults}
                valueField="value"
                labelField="label"
                closeAfterSelect={true}
                resetOnSelect={true}
                disabled={adding}
            />
        </div>
    {/if}

    {#if associatedItems.length > 0}
        <div class="space-y-2">
            {#each associatedItems as item (item.id)}
                <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <a href="/item/{item.id}" class="flex-1 min-w-0 hover:text-blue-600 transition-colors">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium font-mono text-gray-700">{item.SKU}</span>
                            <span class="text-sm text-gray-600 truncate">{item.name}</span>
                            <span class="text-xs text-gray-400 ml-auto shrink-0">库存: {item.total_storage}</span>
                        </div>
                    </a>
                    <button
                        type="button"
                        onclick={() => confirmRemove(item)}
                        class="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="移除"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            {/each}
        </div>
    {:else}
        <div class="text-center py-8 bg-gray-50 rounded-lg text-gray-400 text-sm">
            暂无关联物品，点击右上角"添加关联"按钮来添加。
        </div>
    {/if}
</div>

<ConfirmModal
    isOpen={pendingRemoveId !== null}
    title="确认移除关联"
    message="确定要移除此物品关联吗？"
    itemName={pendingRemoveItem ? `${pendingRemoveItem.SKU} - ${pendingRemoveItem.name}` : ''}
    confirmText="移除"
    loading={removing}
    onConfirm={handleConfirmRemove}
    onCancel={cancelRemove}
/>

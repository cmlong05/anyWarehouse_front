<script lang="ts">
    import { useBOMManager, type ComponentFormData } from '$lib/composables/useBOMManager.svelte';
    import { BOMTabs, ComponentList, BOMTreeView, TotalComponents, WhereUsed, AddComponentForm } from '$lib/components/bom';
    import { getErrorMessage } from '$lib/utils/errors';
    import type { BaseItem } from '$lib';

    interface Props {
        itemId: number;
        itemSKU: string;
        itemName: string;
    }

    let { itemId, itemSKU, itemName }: Props = $props();

    // 使用BOM管理逻辑 - 使用 $derived 包裹以响应 props 变化
    const bom = $derived(useBOMManager(itemId, itemSKU));

    // 本地状态
    let activeTab = $state<'components' | 'tree' | 'total' | 'whereUsed'>('components');
    let showAddForm = $state(false);

    // 处理添加组件
    async function handleAdd(childItemId: number, data: ComponentFormData) {
        try {
            await bom.addComponent(childItemId, data);
            showAddForm = false;
        } catch (err) {
            alert(getErrorMessage(err));
        }
    }

    // 处理更新组件
    async function handleUpdate(id: number, data: ComponentFormData) {
        try {
            await bom.updateComponent(id, data);
        } catch (err) {
            alert(getErrorMessage(err));
        }
    }

    // 处理删除组件
    async function handleDelete(id: number) {
        if (!confirm('确定要删除这个组件关系吗？')) return;
        try {
            await bom.deleteComponent(id);
        } catch (err) {
            alert(getErrorMessage(err));
        }
    }

    // 处理搜索结果过滤
    function handleFilter(json: unknown) {
        const results = Array.isArray(json) ? json : ((json as { results?: BaseItem[] })?.results || []);
        return bom.filterSearchResults(results);
    }

    // 监听 itemId 变化，自动重新加载数据
    $effect(() => {
        if (itemId) {
            bom.loadData();
        }
    });
</script>

<div class="border-t-2 border-gray-200 py-6 mt-6">
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
        <h3 class="text-gray-800 font-semibold text-lg">BOM 物料清单管理</h3>
        <AddComponentForm
            {itemId}
            {itemSKU}
            show={showAddForm}
            loading={false}
            onAdd={handleAdd}
            onToggle={() => showAddForm = !showAddForm}
            onFilter={handleFilter}
        />
    </div>

    {#if bom.error}
        <div class="bg-red-50 text-red-800 p-3 rounded mb-4">{bom.error}</div>
    {/if}

    <!-- 标签页 -->
    <BOMTabs
        {activeTab}
        componentsCount={bom.components.length}
        whereUsedCount={bom.whereUsed.length}
        onChange={(tab) => activeTab = tab}
    />

    <!-- 标签页内容 -->
    <div class="min-h-[200px]">
        {#if bom.loading}
            <div class="text-center p-8 text-gray-500">加载中...</div>
        {:else}
            {#if activeTab === 'components'}
                <ComponentList
                    components={bom.sortedComponents}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            {/if}

            {#if activeTab === 'tree'}
                <BOMTreeView
                    nodes={bom.bomTree}
                    {itemSKU}
                    calculating={bom.calculatingMax}
                    result={bom.maxProducibleResult}
                    onCalculate={bom.calculateMaxProducible}
                />
            {/if}

            {#if activeTab === 'total'}
                <TotalComponents items={bom.totalComponents} parentSKU={itemSKU} />
            {/if}

            {#if activeTab === 'whereUsed'}
                <WhereUsed items={bom.whereUsed} />
            {/if}
        {/if}
    </div>
</div>

<script lang="ts">
    import { useBOMManager, type ComponentFormData } from '$lib/composables/useBOMManager.svelte';
    import { BOMTabs, ComponentList, BOMTreeView, TotalComponents, WhereUsed, AddComponentForm } from '$lib/components/bom';
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
        } catch (err: any) {
            alert(err.message);
        }
    }

    // 处理更新组件
    async function handleUpdate(id: number, data: ComponentFormData) {
        try {
            await bom.updateComponent(id, data);
        } catch (err: any) {
            alert(err.message);
        }
    }

    // 处理删除组件
    async function handleDelete(id: number) {
        if (!confirm('确定要删除这个组件关系吗？')) return;
        try {
            await bom.deleteComponent(id);
        } catch (err: any) {
            alert(err.message);
        }
    }

    // 处理搜索结果过滤
    function handleFilter(results: (BaseItem & { id: number })[]) {
        return bom.filterSearchResults(results);
    }

    // 监听 itemId 变化，自动重新加载数据
    $effect(() => {
        if (itemId) {
            bom.loadData();
        }
    });
</script>

<div class="component-manager">
    <div class="manager-header">
        <h3>BOM 物料清单管理</h3>
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
        <div class="error-message">{bom.error}</div>
    {/if}

    <!-- 标签页 -->
    <BOMTabs
        {activeTab}
        componentsCount={bom.components.length}
        whereUsedCount={bom.whereUsed.length}
        onChange={(tab) => activeTab = tab}
    />

    <!-- 标签页内容 -->
    <div class="tab-content">
        {#if bom.loading}
            <div class="loading">加载中...</div>
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

<style>
    .component-manager {
        border-top: 2px solid #dee2e6;
        padding: 1.5rem 0;
        margin-top: 1.5rem;
    }

    .manager-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .manager-header h3 {
        margin: 0;
        color: #333;
    }

    .error-message {
        background: #f8d7da;
        color: #721c24;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .tab-content {
        min-height: 200px;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    @media (max-width: 768px) {
        .manager-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
        }
    }
</style>

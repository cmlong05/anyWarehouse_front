<script lang="ts">
    import { componentAPI, itemBOMAPI } from '$lib/api';
    import type { ComponentDetail, BOMTreeNode, TotalComponentItem, WhereUsedItem, BaseItem } from '$lib';
    import { config } from '$lib/config';

    interface Props {
        itemId: number;
        itemSKU: string;
        itemName: string;
    }

    let { itemId, itemSKU, itemName }: Props = $props();

    // 状态管理
    let components = $state<ComponentDetail[]>([]);
    let whereUsed = $state<WhereUsedItem[]>([]);
    let bomTree = $state<BOMTreeNode[]>([]);
    let totalComponents = $state<TotalComponentItem[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let activeTab = $state<'components' | 'tree' | 'total' | 'whereUsed'>('components');

    // 排序后的组件列表（避免在模板中直接修改 state）
    let sortedComponents = $derived([...components].sort((a, b) => a.order - b.order));

    // 添加组件表单
    let showAddForm = $state(false);
    let searchQuery = $state('');
    let searchResults = $state<(BaseItem & { id: number; weight?: string })[]>([]);
    let selectedChildItem = $state<BaseItem & { id: number; weight?: string } | null>(null);
    let newComponentQuantity = $state(1);
    let newComponentOrder = $state(0);
    let newComponentNote = $state('');
    let addingComponent = $state(false);
    let searchLoading = $state(false);

    // 编辑组件
    let editingComponent = $state<ComponentDetail | null>(null);
    let editQuantity = $state(1);
    let editOrder = $state(0);
    let editNote = $state('');

    // 加载数据
    async function loadData() {
        loading = true;
        error = null;
        try {
            const [comps, whereUsedRes, treeRes, totalRes] = await Promise.all([
                componentAPI.getByParent(itemId),
                itemBOMAPI.getWhereUsed(itemId),
                itemBOMAPI.getBOMTree(itemId, 10),
                itemBOMAPI.getTotalComponents(itemId)
            ]);
            components = comps;
            whereUsed = whereUsedRes.used_in;
            bomTree = treeRes.bom_tree;
            totalComponents = totalRes.total_components;
        } catch (err) {
            error = err instanceof Error ? err.message : '加载数据失败';
            console.error('加载BOM数据失败:', err);
        } finally {
            loading = false;
        }
    }

    // 搜索物品
    async function searchItems() {
        if (!searchQuery.trim()) {
            searchResults = [];
            return;
        }
        searchLoading = true;
        try {
            const response = await fetch(`${config.API_BASE_URL}/product/item/search?q=${encodeURIComponent(searchQuery)}`);
            if (response.ok) {
                const data = await response.json();
                // 过滤掉当前物品自身（不能自引用）
                searchResults = data.results.filter((item: BaseItem & { id: number }) => item.id !== itemId);
            }
        } catch (err) {
            console.error('搜索失败:', err);
        } finally {
            searchLoading = false;
        }
    }

    // 添加组件
    async function addComponent() {
        if (!selectedChildItem) return;
        addingComponent = true;
        try {
            await componentAPI.create({
                parent_item: itemId,
                child_item: selectedChildItem.id,
                quantity: newComponentQuantity,
                order: newComponentOrder,
                note: newComponentNote
            });
            // 重置表单
            selectedChildItem = null;
            searchQuery = '';
            searchResults = [];
            newComponentQuantity = 1;
            newComponentOrder = 0;
            newComponentNote = '';
            showAddForm = false;
            // 重新加载数据
            await loadData();
        } catch (err: any) {
            const message = err?.message || '添加失败';
            if (message.includes('circular')) {
                alert('添加失败：不能创建循环依赖（子物品不能是父物品的父级）');
            } else {
                alert(`添加失败: ${message}`);
            }
        } finally {
            addingComponent = false;
        }
    }

    // 更新组件
    async function updateComponent() {
        if (!editingComponent) return;
        try {
            await componentAPI.patch(editingComponent.id, {
                quantity: editQuantity,
                order: editOrder,
                note: editNote
            });
            editingComponent = null;
            await loadData();
        } catch (err) {
            alert('更新失败，请重试');
        }
    }

    // 删除组件
    async function deleteComponent(componentId: number) {
        if (!confirm('确定要删除这个组件关系吗？')) return;
        try {
            await componentAPI.delete(componentId);
            await loadData();
        } catch (err: any) {
            console.error('删除组件失败:', err);
            alert(`删除失败: ${err?.message || '请检查网络连接'}`);
        }
    }

    // 开始编辑
    function startEdit(component: ComponentDetail) {
        editingComponent = component;
        editQuantity = component.quantity;
        editOrder = component.order;
        editNote = component.note;
    }

    // 监听 itemId 变化，自动重新加载数据
    $effect(() => {
        if (itemId) {
            loadData();
        }
    });
</script>

<!-- 递归 BOM 树节点组件 -->
{#snippet TreeNode(node: BOMTreeNode, level: number)}
    <div class="tree-level" style="margin-left: {level * 20}px">
        <div class="tree-node">
            <span class="node-name">{node.item.SKU} - {node.item.name}</span>
            <span class="node-qty">× {node.quantity}</span>
        </div>
        {#if node.children && node.children.length > 0}
            <div class="tree-children">
                {#each node.children as child}
                    {@render TreeNode(child, level + 1)}
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

<div class="component-manager">
    <div class="manager-header">
        <h3>BOM 物料清单管理</h3>
        <button class="btn btn-primary btn-sm" onclick={() => showAddForm = !showAddForm}>
            {showAddForm ? '取消' : '添加组件'}
        </button>
    </div>

    {#if error}
        <div class="error-message">{error}</div>
    {/if}

    {#if showAddForm}
        <div class="add-form">
            <h4>添加组件到 {itemSKU}</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="search-child-item">搜索子物品:</label>
                    <div class="search-box">
                        <input
                            type="text"
                            id="search-child-item"
                            bind:value={searchQuery}
                            placeholder="输入SKU或名称搜索..."
                            onkeydown={(e) => e.key === 'Enter' && searchItems()}
                        />
                        <button class="btn btn-secondary btn-sm" onclick={searchItems} disabled={searchLoading}>
                            {searchLoading ? '搜索中...' : '搜索'}
                        </button>
                    </div>
                    {#if searchResults.length > 0}
                        <div class="search-results">
                            {#each searchResults as item}
                                <button
                                    type="button"
                                    class="search-result-item"
                                    class:selected={selectedChildItem?.id === item.id}
                                    onclick={() => selectedChildItem = item}
                                >
                                    <span class="item-sku">{item.SKU}</span>
                                    <span class="item-name">{item.name}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            {#if selectedChildItem}
                <div class="selected-item">
                    <p>已选择: <strong>{selectedChildItem.SKU}</strong> - {selectedChildItem.name}</p>
                </div>
            {/if}

            <div class="form-row">
                <div class="form-group">
                    <label for="comp-quantity">数量:</label>
                    <input
                        type="number"
                        id="comp-quantity"
                        bind:value={newComponentQuantity}
                        min="1"
                        max="999999"
                    />
                </div>
                <div class="form-group">
                    <label for="comp-order">排序:</label>
                    <input
                        type="number"
                        id="comp-order"
                        bind:value={newComponentOrder}
                        min="0"
                        max="9999"
                    />
                </div>
            </div>

            <div class="form-group">
                <label for="comp-note">备注:</label>
                <input
                    type="text"
                    id="comp-note"
                    bind:value={newComponentNote}
                    maxlength="500"
                    placeholder="可选：添加备注信息"
                />
            </div>

            <div class="form-actions">
                <button
                    class="btn btn-primary"
                    onclick={addComponent}
                    disabled={!selectedChildItem || addingComponent}
                >
                    {addingComponent ? '添加中...' : '确认添加'}
                </button>
            </div>
        </div>
    {/if}

    <!-- 标签页 -->
    <div class="tabs">
        <button
            class="tab-btn"
            class:active={activeTab === 'components'}
            onclick={() => activeTab = 'components'}
        >
            组件列表 ({components.length})
        </button>
        <button
            class="tab-btn"
            class:active={activeTab === 'tree'}
            onclick={() => activeTab = 'tree'}
        >
            BOM树
        </button>
        <button
            class="tab-btn"
            class:active={activeTab === 'total'}
            onclick={() => activeTab = 'total'}
        >
            物料汇总
        </button>
        <button
            class="tab-btn"
            class:active={activeTab === 'whereUsed'}
            onclick={() => activeTab = 'whereUsed'}
        >
            被用于 ({whereUsed.length})
        </button>
    </div>

    <!-- 标签页内容 -->
    <div class="tab-content">
        {#if loading}
            <div class="loading">加载中...</div>
        {:else}
            <!-- 组件列表 -->
            {#if activeTab === 'components'}
                {#if components.length === 0}
                    <div class="empty-state">暂无组件，请点击"添加组件"按钮添加</div>
                {:else}
                    <div class="components-list">
                        {#each sortedComponents as component}
                            {#if editingComponent?.id === component.id}
                                <div class="component-item editing">
                                    <div class="edit-form">
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="edit-quantity-{component.id}">数量:</label>
                                                <input
                                                    type="number"
                                                    id="edit-quantity-{component.id}"
                                                    bind:value={editQuantity}
                                                    min="1"
                                                    max="999999"
                                                />
                                            </div>
                                            <div class="form-group">
                                                <label for="edit-order-{component.id}">排序:</label>
                                                <input
                                                    type="number"
                                                    id="edit-order-{component.id}"
                                                    bind:value={editOrder}
                                                    min="0"
                                                    max="9999"
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label for="edit-note-{component.id}">备注:</label>
                                            <input type="text" id="edit-note-{component.id}" bind:value={editNote} maxlength="500" />
                                        </div>
                                        <div class="edit-actions">
                                            <button class="btn btn-primary btn-sm" onclick={updateComponent}>保存</button>
                                            <button class="btn btn-secondary btn-sm" onclick={() => editingComponent = null}>取消</button>
                                        </div>
                                    </div>
                                </div>
                            {:else}
                                <div class="component-item">
                                    <div class="component-info">
                                        <div class="component-header">
                                            <a href="/item/{component.child_item}" class="component-name">
                                                {component.child_item_detail.SKU} - {component.child_item_detail.name}
                                            </a>
                                            <span class="component-quantity">× {component.quantity}</span>
                                        </div>
                                        {#if component.note}
                                            <div class="component-note">备注: {component.note}</div>
                                        {/if}
                                        <div class="component-meta">
                                            <span>排序: {component.order}</span>
                                            {#if component.child_item_detail.weight}
                                                <span>重量: {component.child_item_detail.weight}</span>
                                            {/if}
                                        </div>
                                    </div>
                                    <div class="component-actions">
                                        <button class="btn btn-secondary btn-sm" onclick={() => startEdit(component)}>编辑</button>
                                        <button class="btn btn-danger btn-sm" onclick={() => deleteComponent(component.id)}>删除</button>
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    </div>
                {/if}
            {/if}

            <!-- BOM树 -->
            {#if activeTab === 'tree'}
                {#if bomTree.length === 0}
                    <div class="empty-state">暂无BOM树结构</div>
                {:else}
                    <div class="bom-tree">
                        {#each bomTree as node}
                            {@render TreeNode(node, 0)}
                        {/each}
                    </div>
                {/if}
            {/if}

            <!-- 物料汇总 -->
            {#if activeTab === 'total'}
                {#if totalComponents.length === 0}
                    <div class="empty-state">暂无物料汇总数据</div>
                {:else}
                    <div class="total-components">
                        <p class="hint">生产 1 个 {itemSKU} 需要的所有底层物料:</p>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>名称</th>
                                    <th>数量</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each totalComponents as item}
                                    <tr>
                                        <td><a href="/item/{item.item_id}">{item.sku}</a></td>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                        <div class="calc-hint">
                            <p>💡 提示: 如需计算生产 N 个 {itemSKU} 的物料需求，将上表数量乘以 N 即可</p>
                        </div>
                    </div>
                {/if}
            {/if}

            <!-- 被用于 -->
            {#if activeTab === 'whereUsed'}
                {#if whereUsed.length === 0}
                    <div class="empty-state">该物品暂未被其他产品使用</div>
                {:else}
                    <div class="where-used-list">
                        <p class="hint">该物品被以下产品用作组件:</p>
                        {#each whereUsed as item}
                            <div class="where-used-item">
                                <a href="/item/{item.item_id}" class="item-link">
                                    {item.sku} - {item.name}
                                </a>
                                <span class="usage-qty">每个产品使用 {item.quantity} 个</span>
                                <span class="storage-qty" class:zero={item.total_storage === 0} class:low={item.total_storage > 0 && item.total_storage < 10}>
                                    库存: {item.total_storage}
                                </span>
                            </div>
                        {/each}
                    </div>
                {/if}
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

    .add-form {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        border: 1px solid #dee2e6;
    }

    .add-form h4 {
        margin: 0 0 1rem 0;
        color: #495057;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #495057;
    }

    .form-group input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
    }

    .search-box {
        display: flex;
        gap: 0.5rem;
    }

    .search-box input {
        flex: 1;
    }

    .search-results {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        margin-top: 0.5rem;
    }

    .search-result-item {
        width: 100%;
        padding: 0.5rem;
        cursor: pointer;
        border: none;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        gap: 0.5rem;
        background: none;
        text-align: left;
        font: inherit;
    }

    .search-result-item:hover,
    .search-result-item.selected {
        background: #e3f2fd;
    }

    .item-sku {
        font-weight: bold;
        color: #1976d2;
    }

    .item-name {
        color: #666;
    }

    .selected-item {
        background: #e8f5e9;
        padding: 0.5rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid #dee2e6;
        margin-bottom: 1rem;
    }

    .tab-btn {
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        cursor: pointer;
        color: #6c757d;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s;
    }

    .tab-btn:hover {
        color: #495057;
    }

    .tab-btn.active {
        color: #1976d2;
        border-bottom-color: #1976d2;
        font-weight: 500;
    }

    .tab-content {
        min-height: 200px;
    }

    .loading,
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    .components-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .component-item {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .component-item.editing {
        background: #fff3e0;
    }

    .component-info {
        flex: 1;
    }

    .component-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
    }

    .component-name {
        font-weight: 500;
        color: #1976d2;
        text-decoration: none;
    }

    .component-name:hover {
        text-decoration: underline;
    }

    .component-quantity {
        background: #e3f2fd;
        color: #1976d2;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: bold;
    }

    .component-note {
        color: #666;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }

    .component-meta {
        color: #999;
        font-size: 0.75rem;
        margin-top: 0.25rem;
        display: flex;
        gap: 1rem;
    }

    .component-actions {
        display: flex;
        gap: 0.5rem;
    }

    .edit-form {
        width: 100%;
    }

    .edit-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .bom-tree {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #dee2e6;
    }

    .tree-level {
        margin-bottom: 0.25rem;
    }

    .tree-node {
        padding: 0.5rem;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .tree-node:hover {
        background: #f5f5f5;
    }

    .tree-children {
        margin-left: 1.5rem;
        border-left: 2px solid #e0e0e0;
        padding-left: 0.5rem;
    }

    .node-name {
        font-weight: 500;
    }

    .node-qty {
        background: #e3f2fd;
        color: #1976d2;
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 6px;
        overflow: hidden;
    }

    .data-table th,
    .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #dee2e6;
    }

    .data-table th {
        background: #f8f9fa;
        font-weight: 600;
    }

    .data-table a {
        color: #1976d2;
        text-decoration: none;
    }

    .data-table a:hover {
        text-decoration: underline;
    }

    .hint {
        color: #666;
        margin-bottom: 1rem;
    }

    .calc-hint {
        background: #e3f2fd;
        padding: 1rem;
        border-radius: 6px;
        margin-top: 1rem;
    }

    .calc-hint p {
        margin: 0;
        color: #1976d2;
    }

    .where-used-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .where-used-item {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .item-link {
        color: #1976d2;
        text-decoration: none;
        font-weight: 500;
    }

    .item-link:hover {
        text-decoration: underline;
    }

    .usage-qty {
        background: #f3e5f5;
        color: #7b1fa2;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .storage-qty {
        background: #e8f5e9;
        color: #2e7d32;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .storage-qty.zero {
        background: #ffebee;
        color: #c62828;
    }

    .storage-qty.low {
        background: #fff3e0;
        color: #ef6c00;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-block;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-primary {
        background: #1976d2;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: #1565c0;
    }

    .btn-secondary {
        background: #6c757d;
        color: white;
    }

    .btn-secondary:hover:not(:disabled) {
        background: #545b62;
    }

    .btn-danger {
        background: #dc3545;
        color: white;
    }

    .btn-danger:hover:not(:disabled) {
        background: #c82333;
    }

    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
    }

    @media (max-width: 768px) {
        .form-row {
            grid-template-columns: 1fr;
        }

        .component-item {
            flex-direction: column;
            gap: 0.75rem;
        }

        .component-actions {
            width: 100%;
            justify-content: flex-end;
        }

        .tabs {
            flex-wrap: wrap;
        }

        .tab-btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
        }

        .where-used-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style>

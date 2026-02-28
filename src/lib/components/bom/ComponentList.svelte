<script lang="ts">
    import type { ComponentDetail } from '$lib';
    import type { ComponentFormData } from '$lib/composables/useBOMManager.svelte';

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
    <div class="empty-state">暂无组件，请点击"添加组件"按钮添加</div>
{:else}
    <div class="components-list">
        {#each components as component}
            {#if editingId === component.id}
                <div class="component-item editing">
                    <div class="edit-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>数量:</label>
                                <input type="number" bind:value={editData.quantity} min="1" max="999999" />
                            </div>
                            <div class="form-group">
                                <label>排序:</label>
                                <input type="number" bind:value={editData.order} min="0" max="9999" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>备注:</label>
                            <input type="text" bind:value={editData.note} maxlength="500" />
                        </div>
                        <div class="edit-actions">
                            <button class="btn btn-primary btn-sm" onclick={() => saveEdit(component.id)}>保存</button>
                            <button class="btn btn-secondary btn-sm" onclick={cancelEdit}>取消</button>
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
                            <span>库存: {component.child_item_storage}</span>
                            {#if component.child_item_detail.weight}
                                <span>重量: {component.child_item_detail.weight}</span>
                            {/if}
                        </div>
                    </div>
                    <div class="component-actions">
                        <button class="btn btn-secondary btn-sm" onclick={() => startEdit(component)}>编辑</button>
                        <button class="btn btn-danger btn-sm" onclick={() => onDelete(component.id)}>删除</button>
                    </div>
                </div>
            {/if}
        {/each}
    </div>
{/if}

<style>
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

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .form-group {
        margin-bottom: 0.75rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.875rem;
        color: #666;
    }

    .form-group input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
    }

    .edit-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary {
        background: #1976d2;
        color: white;
    }

    .btn-primary:hover {
        background: #1565c0;
    }

    .btn-secondary {
        background: #6c757d;
        color: white;
    }

    .btn-secondary:hover {
        background: #545b62;
    }

    .btn-danger {
        background: #dc3545;
        color: white;
    }

    .btn-danger:hover {
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
    }
</style>

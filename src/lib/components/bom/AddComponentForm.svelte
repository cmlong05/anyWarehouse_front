<script lang="ts">
    import Svelecte from 'svelecte';
    import { config } from '$lib/config';
    import type { BaseItem } from '$lib';
    import type { ComponentFormData } from '$lib/composables/useBOMManager.svelte';

    interface Props {
        itemId: number;
        itemSKU: string;
        show: boolean;
        loading: boolean;
        onAdd: (childItemId: number, data: ComponentFormData) => Promise<void>;
        onToggle: () => void;
        onFilter: (results: (BaseItem & { id: number })[]) => { value: number; label: string }[];
    }
    
    let { itemId, itemSKU, show, loading, onAdd, onToggle, onFilter }: Props = $props();

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

<div class="form-header">
    <button class="btn btn-primary btn-sm" onclick={onToggle}>
        {show ? '取消' : '添加组件'}
    </button>
</div>

{#if show}
    <div class="add-form">
        <h4>添加组件到 {itemSKU}</h4>
        <div class="form-row">
            <div class="form-group full-width">
                <label for="child-item">搜索子物品:</label>
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

        <div class="form-row">
            <div class="form-group">
                <label for="comp-quantity">数量:</label>
                <input type="number" id="comp-quantity" bind:value={formData.quantity} min="1" max="999999" />
            </div>
            <div class="form-group">
                <label for="comp-order">排序:</label>
                <input type="number" id="comp-order" bind:value={formData.order} min="0" max="9999" />
            </div>
        </div>

        <div class="form-group">
            <label for="comp-note">备注:</label>
            <input type="text" id="comp-note" bind:value={formData.note} maxlength="500" placeholder="可选：添加备注信息" />
        </div>

        <div class="form-actions">
            <button class="btn btn-primary" onclick={handleSubmit} disabled={!selectedChildItemId || loading}>
                {loading ? '添加中...' : '确认添加'}
            </button>
        </div>
    </div>
{/if}

<style>
    .form-header {
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

    .form-group.full-width {
        grid-column: 1 / -1;
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

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
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

    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
    }

    @media (max-width: 768px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }
</style>

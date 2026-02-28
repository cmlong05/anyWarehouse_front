<script lang="ts">
    import type { StatusConfig, StatusTransition } from '$lib/composables/useOrderDetail.svelte';

    interface Props {
        title: string;
        orderNumber: string;
        status: string;
        statusMap: Record<string, StatusConfig>;
        transitions: StatusTransition[];
        updating?: boolean;
        canEdit?: boolean;
        canDelete?: boolean;
        onBack: () => void;
        onEdit?: () => void;
        onDelete?: () => void;
        onCopy?: () => void;
        onStatusChange: (status: string) => void;
    }
    
    let {
        title,
        orderNumber,
        status,
        statusMap,
        transitions,
        updating = false,
        canEdit = false,
        canDelete = false,
        onBack,
        onEdit,
        onDelete,
        onCopy,
        onStatusChange,
    }: Props = $props();
</script>

<div class="page-header">
    <div class="header-left">
        <button class="btn btn-text" onclick={onBack}>← 返回列表</button>
        <h1>{title}</h1>
    </div>
    <div class="header-actions">
        {#if onCopy}
            <button class="btn btn-secondary" onclick={onCopy}>📋 复制订单</button>
        {/if}
        {#if canEdit && onEdit}
            <button class="btn btn-secondary" onclick={onEdit}>编辑</button>
        {/if}
        {#if canDelete && onDelete}
            <button class="btn btn-danger" onclick={onDelete}>删除</button>
        {/if}
    </div>
</div>

<div class="summary-card">
    <div class="summary-header">
        <div class="order-info">
            <span class="order-number">{orderNumber}</span>
            <span class="status-badge {statusMap[status]?.class || ''}">
                {statusMap[status]?.label || status}
            </span>
        </div>
        <div class="summary-actions">
            {#if transitions.length > 0}
                {#each transitions as transition}
                    <button
                        class="btn btn-small {transition.value === 'cancelled' ? 'btn-danger' : 'btn-primary'}"
                        onclick={() => onStatusChange(transition.value)}
                        disabled={updating}
                    >
                        {transition.label}
                    </button>
                {/each}
            {/if}
        </div>
    </div>
</div>

<style>
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .header-left h1 {
        margin: 0;
        font-size: 1.5rem;
    }

    .header-actions {
        display: flex;
        gap: 0.5rem;
    }

    .summary-card {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .order-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .order-number {
        font-family: monospace;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .summary-actions {
        display: flex;
        gap: 0.5rem;
    }

    .status-badge {
        display: inline-block;
        padding: 0.375rem 0.75rem;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .status-draft { background: #e9ecef; color: #495057; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-approved { background: #d1ecf1; color: #0c5460; }
    .status-confirmed, .status-ordered { background: #cce5ff; color: #004085; }
    .status-partial { background: #d4edda; color: #155724; }
    .status-shipped, .status-received { background: #28a745; color: white; }
    .status-delivered { background: #155724; color: white; }
    .status-cancelled { background: #f8d7da; color: #721c24; }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-text {
        background: none;
        color: #007bff;
        padding: 0.25rem 0.5rem;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #0056b3;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: #545b62;
    }

    .btn-danger {
        background-color: #dc3545;
        color: white;
    }

    .btn-danger:hover:not(:disabled) {
        background-color: #c82333;
    }

    .btn-small {
        padding: 0.375rem 0.75rem;
        font-size: 0.85rem;
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }

        .summary-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }

        .summary-actions {
            flex-wrap: wrap;
        }
    }
</style>

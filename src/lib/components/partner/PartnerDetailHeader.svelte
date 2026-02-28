<script lang="ts">
    interface Props {
        name: string;
        level: string;
        status: string;
        isEditing: boolean;
        levelLabel: string;
        statusLabel: string;
        onEdit: () => void;
        onCancel: () => void;
        onDelete: () => void;
    }
    
    let { name, level, status, isEditing, levelLabel, statusLabel, onEdit, onCancel, onDelete }: Props = $props();
</script>

<div class="page-header">
    {#if isEditing}
        <h1>编辑</h1>
        <button class="btn btn-secondary" onclick={onCancel}>取消编辑</button>
    {:else}
        <div class="header-left">
            <h1>{name}</h1>
            <span class="level-badge {level.toLowerCase()}">{levelLabel}</span>
            <span class="status-badge {status.toLowerCase()}">{statusLabel}</span>
        </div>
        <div class="header-actions">
            <button class="btn btn-secondary" onclick={onEdit}>编辑</button>
            <button class="btn btn-danger" onclick={onDelete}>删除</button>
        </div>
    {/if}
</div>

<style>
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }
    
    .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        color: #1f2937;
    }
    
    .header-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .level-badge, .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .level-badge.vip, .level-badge.a { background-color: #fef3c7; color: #92400e; }
    .level-badge.normal, .level-badge.b { background-color: #dbeafe; color: #1e40af; }
    .level-badge.temp, .level-badge.c { background-color: #f3f4f6; color: #4b5563; }
    
    .status-badge.active { background-color: #d1fae5; color: #065f46; }
    .status-badge.inactive { background-color: #fee2e2; color: #991b1b; }
    
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }
    
    .btn-secondary { background-color: #6b7280; color: white; }
    .btn-secondary:hover { background-color: #4b5563; }
    .btn-danger { background-color: #dc2626; color: white; }
    .btn-danger:hover { background-color: #b91c1c; }
    
    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        .header-actions { width: 100%; }
        .header-actions .btn { flex: 1; }
    }
</style>

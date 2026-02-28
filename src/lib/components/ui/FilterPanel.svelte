<script lang="ts">
    /**
     * 通用筛选面板组件
     */
    import type { Snippet } from 'svelte';
    
    interface Props {
        children: Snippet;
        onApply?: () => void;
        onReset?: () => void;
        applyText?: string;
        resetText?: string;
        showActions?: boolean;
    }
    
    let {
        children,
        onApply,
        onReset,
        applyText = '应用筛选',
        resetText = '重置',
        showActions = true
    }: Props = $props();
</script>

<div class="filter-panel">
    <div class="filter-content">
        {@render children()}
    </div>
    
    {#if showActions}
        <div class="filter-actions">
            {#if onReset}
                <button class="btn btn-secondary" onclick={onReset}>
                    {resetText}
                </button>
            {/if}
            {#if onApply}
                <button class="btn btn-primary" onclick={onApply}>
                    {applyText}
                </button>
            {/if}
        </div>
    {/if}
</div>

<style>
    .filter-panel {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
    }
    
    .filter-content {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .filter-content :global(.filter-row) {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        width: 100%;
    }
    
    .filter-content :global(.filter-group) {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 120px;
        flex: 1;
    }
    
    .filter-content :global(.filter-group label) {
        font-size: 0.8rem;
        color: #6b7280;
    }
    
    .filter-content :global(.filter-group input),
    .filter-content :global(.filter-group select) {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background: white;
    }
    
    .filter-content :global(.filter-group input:focus),
    .filter-content :global(.filter-group select:focus) {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .filter-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }
    
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .btn-primary {
        background: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover {
        background: #2563eb;
    }
    
    .btn-secondary {
        background: white;
        color: #4b5563;
        border: 1px solid #d1d5db;
    }
    
    .btn-secondary:hover {
        background: #f3f4f6;
    }
    
    @media (max-width: 768px) {
        .filter-content :global(.filter-row) {
            flex-direction: column;
        }
        
        .filter-content :global(.filter-group) {
            width: 100%;
        }
        
        .filter-actions {
            flex-direction: column;
        }
        
        .filter-actions .btn {
            width: 100%;
        }
    }
</style>

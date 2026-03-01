<script lang="ts">
    import type { Snippet } from 'svelte';
    
    interface Props {
        availableTitle?: string;
        availableSubtitle?: string;
        selectedTitle?: string;
        selectedSubtitle?: string;
        availableEmptyText?: string;
        selectedEmptyText?: string;
        showAvailable?: boolean;
        showSelected?: boolean;
        available?: Snippet;
        selected?: Snippet;
    }
    
    let {
        availableTitle = '📋 可选项目',
        availableSubtitle = '',
        selectedTitle = '📦 已选项目',
        selectedSubtitle = '',
        availableEmptyText = '所有项目已添加',
        selectedEmptyText = '点击左侧"添加"按钮选择项目',
        showAvailable = true,
        showSelected = true,
        available,
        selected
    }: Props = $props();
</script>

<div class="dual-selection-panel">
    {#if showAvailable}
        <div class="column available-column">
            <h4 class="column-title">
                <span>{availableTitle}</span>
                {#if availableSubtitle}
                    <span class="subtitle">{availableSubtitle}</span>
                {/if}
            </h4>
            <div class="column-content">
                {#if available}
                    {@render available()}
                {:else}
                    <div class="empty-state">
                        <p>{availableEmptyText}</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
    
    {#if showSelected}
        <div class="column selected-column">
            <h4 class="column-title">
                <span>{selectedTitle}</span>
                {#if selectedSubtitle}
                    <span class="subtitle">{selectedSubtitle}</span>
                {/if}
            </h4>
            <div class="column-content">
                {#if selected}
                    {@render selected()}
                {:else}
                    <div class="empty-state">
                        <p>{selectedEmptyText}</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .dual-selection-panel {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    
    @media (max-width: 1024px) {
        .dual-selection-panel { grid-template-columns: 1fr; }
    }
    
    .column {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid #e9ecef;
    }
    
    .column-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .column-title .subtitle {
        font-size: 0.75rem;
        font-weight: normal;
        color: #6b7280;
    }
    
    .column-content {
        min-height: 200px;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #9ca3af;
        font-size: 0.875rem;
    }
    
    /* 表格基础样式 */
    :global(.data-table) {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }
    
    :global(.data-table th),
    :global(.data-table td) {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    :global(.data-table th) {
        background: #f3f4f6;
        font-weight: 600;
        color: #374151;
        font-size: 0.75rem;
        text-transform: uppercase;
    }
    
    :global(.data-table tbody tr:hover) {
        background: #f9fafb;
    }
    
    /* 工具栏 */
    :global(.table-actions) {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    :global(.btn-text) {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        color: #1976d2;
        background: none;
        border: none;
        cursor: pointer;
    }
    
    :global(.btn-text:hover) {
        text-decoration: underline;
    }
    
    /* 按钮 */
    :global(.btn-add) {
        padding: 0.25rem 0.75rem;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: background 0.15s;
    }
    
    :global(.btn-add:hover) {
        background: #1565c0;
    }
    
    :global(.btn-remove) {
        padding: 0.25rem 0.5rem;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
    }
    
    /* 文本工具类 */
    :global(.font-mono) { font-family: monospace; }
    :global(.text-xs) { font-size: 0.75rem; }
    :global(.text-error) { color: #dc2626; }
    :global(.text-right) { text-align: right; }
    :global(.text-center) { text-align: center; }
</style>

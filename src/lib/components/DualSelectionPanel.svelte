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

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {#if showAvailable}
        <div class="bg-white rounded-lg p-4 border border-gray-200">
            <h4 class="flex justify-between items-center m-0 mb-4 text-base font-semibold text-gray-700 pb-3 border-b border-gray-200">
                <span>{availableTitle}</span>
                {#if availableSubtitle}
                    <span class="text-xs font-normal text-gray-500">{availableSubtitle}</span>
                {/if}
            </h4>
            <div class="min-h-[200px]">
                {#if available}
                    {@render available()}
                {:else}
                    <div class="text-center p-12 text-gray-400 text-sm">
                        <p>{availableEmptyText}</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
    
    {#if showSelected}
        <div class="bg-white rounded-lg p-4 border border-gray-200">
            <h4 class="flex justify-between items-center m-0 mb-4 text-base font-semibold text-gray-700 pb-3 border-b border-gray-200">
                <span>{selectedTitle}</span>
                {#if selectedSubtitle}
                    <span class="text-xs font-normal text-gray-500">{selectedSubtitle}</span>
                {/if}
            </h4>
            <div class="min-h-[200px]">
                {#if selected}
                    {@render selected()}
                {:else}
                    <div class="text-center p-12 text-gray-400 text-sm">
                        <p>{selectedEmptyText}</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
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

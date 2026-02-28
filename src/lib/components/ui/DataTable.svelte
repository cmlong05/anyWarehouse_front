<script lang="ts">
    /**
     * 通用数据表格组件
     */
    import type { Snippet } from 'svelte';
    
    interface Column {
        key: string;
        title: string;
        width?: string;
        align?: 'left' | 'center' | 'right';
        sortable?: boolean;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type T = any;
    
    interface Props {
        // 数据
        data: T[];
        columns: Column[];
        
        // 状态
        loading?: boolean;
        emptyText?: string;
        
        // 交互
        clickable?: boolean;
        onRowClick?: (item: T) => void;
        
        // 自定义渲染
        cellRender?: Snippet<[{ item: T; column: Column; value: unknown }]>;
        
        // 样式
        class?: string;
        zebra?: boolean;
        bordered?: boolean;
    }
    
    let {
        data = [],
        columns,
        loading = false,
        emptyText = '暂无数据',
        clickable = false,
        onRowClick,
        cellRender,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class: className = '',
        zebra = true,
        bordered = true
    }: Props = $props();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getValue(item: any, key: string): unknown {
        return key.split('.').reduce((obj: unknown, k) => (obj as Record<string, unknown>)?.[k], item as unknown);
    }
    
    function handleRowClick(item: T) {
        if (clickable && onRowClick) {
            onRowClick(item);
        }
    }
</script>

<div class="data-table-container {className}" class:bordered>
    <table class="data-table" class:zebra class:clickable>
        <thead>
            <tr>
                {#each columns as column}
                    <th 
                        class="align-{column.align || 'left'}"
                        style:width={column.width}
                    >
                        {column.title}
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#if loading}
                <tr class="loading-row">
                    <td colspan={columns.length}>
                        <div class="loading-cell">
                            <span class="spinner"></span>
                            <span>加载中...</span>
                        </div>
                    </td>
                </tr>
            {:else if data.length === 0}
                <tr class="empty-row">
                    <td colspan={columns.length}>
                        <div class="empty-cell">
                            {emptyText}
                        </div>
                    </td>
                </tr>
            {:else}
                {#each data as item}
                    <tr 
                        class:clickable
                        onclick={() => handleRowClick(item)}
                    >
                        {#each columns as column}
                            <td class="align-{column.align || 'left'}">
                                {#if cellRender}
                                    {@render cellRender({ item, column, value: getValue(item, column.key) })}
                                {:else}
                                    {getValue(item, column.key) ?? '-'}
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {/each}
            {/if}
        </tbody>
    </table>
</div>

<style>
    .data-table-container {
        overflow-x: auto;
        background: white;
        border-radius: 0.5rem;
    }
    
    .data-table-container.bordered {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }
    
    .data-table th,
    .data-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .data-table th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
        white-space: nowrap;
    }
    
    .data-table tbody tr {
        transition: background 0.15s;
    }
    
    .data-table.zebra tbody tr:nth-child(even) {
        background: #f9fafb;
    }
    
    .data-table tbody tr:hover {
        background: #f3f4f6;
    }
    
    .data-table.clickable tbody tr {
        cursor: pointer;
    }
    
    .align-left { text-align: left; }
    .align-center { text-align: center; }
    .align-right { text-align: right; }
    
    .loading-row,
    .empty-row {
        text-align: center;
    }
    
    .loading-cell,
    .empty-cell {
        padding: 3rem;
        color: #6b7280;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    
    .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    @media (max-width: 768px) {
        .data-table {
            font-size: 0.8rem;
        }
        
        .data-table th,
        .data-table td {
            padding: 0.5rem 0.75rem;
        }
    }
</style>

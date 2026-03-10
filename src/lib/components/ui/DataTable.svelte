
<script lang="ts">
    /**
     * 通用数据表格组件（使用 TailwindCSS）
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
        cellRender?: Snippet<[{ item: T; column: Column; value: unknown }]>
        headerCellRender?: Snippet<[{ column: Column }]>
        
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
        headerCellRender,
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
    
    function getContainerClasses() {
        return [
            'overflow-x-auto',
            'bg-white',
            'rounded-md',
            className,
            bordered ? 'shadow' : ''
        ].filter(Boolean).join(' ');
    }

    function getTableClasses() {
        return [
            'w-full',
            'border-collapse',
            'text-sm',
            clickable ? 'cursor-pointer' : ''
        ].filter(Boolean).join(' ');
    }
</script>

<div class={getContainerClasses()}>
    <table class={getTableClasses()}>
        <thead>
            <tr>
                {#each columns as column}
                    <th
                        class={
                            [
                                'px-4',
                                'py-3',
                                'whitespace-nowrap',
                                'text-gray-700',
                                'font-semibold',
                                column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                            ].join(' ')
                        }
                        style:width={column.width}
                    >
                        {#if headerCellRender}
                            {@render headerCellRender({ column })}
                        {:else}
                            {column.title}
                        {/if}
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody class={zebra ? 'odd:bg-white even:bg-gray-50' : ''}>
            {#if loading}
                <tr>
                    <td colspan={columns.length}>
                        <div class="py-12 text-gray-500 flex flex-col items-center gap-2">
                            <span class="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></span>
                            <span>加载中...</span>
                        </div>
                    </td>
                </tr>
            {:else if data.length === 0}
                <tr>
                    <td colspan={columns.length}>
                        <div class="py-12 text-gray-500 flex flex-col items-center gap-2">
                            {emptyText}
                        </div>
                    </td>
                </tr>
            {:else}
                {#each data as item}
                    <tr
                        class="hover:bg-gray-100"
                        onclick={() => handleRowClick(item)}
                    >
                        {#each columns as column}
                            <td
                                class={
                                    [
                                        'px-4',
                                        'py-3',
                                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                                    ].join(' ')
                                }
                            >
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


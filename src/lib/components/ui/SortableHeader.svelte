<script lang="ts">
    export interface Props {
        title: string;
        columnKey: string;
        sortable?: boolean;
        sortKey?: string;
        sortDirection?: 'asc' | 'desc';
        onSort?: (key: string) => void;
        align?: 'left' | 'center' | 'right';
        headerClass?: string;
        width?: string;
    }

    let {
        title,
        columnKey,
        sortable = false,
        sortKey,
        sortDirection = 'asc',
        onSort,
        align = 'left',
        headerClass = '',
        width
    }: Props = $props();

    function getIndicator(): string {
        return sortKey === columnKey ? (sortDirection === 'asc' ? '▲' : '▼') : '↕';
    }

    function handleClick() {
        if (sortable && onSort) {
            onSort(columnKey);
        }
    }
</script>

<th
    class={[
        'p-3',
        'whitespace-nowrap',
        'text-gray-700',
        'font-semibold',
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
        sortable && onSort ? 'cursor-pointer' : '',
        headerClass
    ].join(' ')}
    style:width={width}
    onclick={handleClick}
>
    <div class="flex items-center gap-1">
        <span>{title}</span>
        {#if sortable && onSort}
            <span class="text-xs text-gray-500">{getIndicator()}</span>
        {/if}
    </div>
</th>

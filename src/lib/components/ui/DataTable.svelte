<!-- 数据表格 -->
<!--
被依赖：
- `lib/components/item/AttributeManager.svelte`
- `lib/components/forms/CategoryForm.svelte`
- `lib/components/forms/ContainerForm.svelte`
- `lib/components/forms/CustomerForm.svelte`
- `lib/components/forms/ItemForm.svelte`
- `lib/components/order/OrderForm.svelte`
- `lib/components/forms/PackageForm.svelte`
- `lib/components/quotation/QuotationLinesTable.svelte`
- `lib/components/quotation/QuotationPriceCard.svelte`
- `lib/components/forms/StorageForm.svelte`
- `lib/components/forms/SupplierForm.svelte`
- `lib/components/item/VariantCreator.svelte`
- `lib/components/item/VariantQuotationManager.svelte`
- `lib/components/bom/AddComponentForm.svelte`
- `lib/components/bom/ComponentList.svelte`
- `lib/components/item/ItemInventoryTab.svelte`
- `lib/components/item/TransferConfirmModal.svelte`
- `lib/components/order/OrderFormItemsSection.svelte`
- `lib/components/order/OrderItemsTable.svelte`
- `lib/components/order/ShipReceiveModal.svelte`
- `lib/components/partner/PartyForm.svelte`
- `lib/components/partner/QuotationsSection.svelte`
- `lib/components/shipment-form/PlanItemsList.svelte`
- `lib/components/ui/index.ts`
- `lib/index.ts`
- `routes/container/[slug]/+page.svelte`
- `routes/customer/+page.svelte`
- `routes/customer/package/+page.svelte`
- `routes/customer/sales-order/+page.svelte`
- `routes/customer/shipment/+page.svelte`
- `routes/item/+page.svelte`
- `routes/supplier/+page.svelte`
- `routes/supplier/purchase-order/+page.svelte`
-->
<script lang="ts">
    /**
     * 通用数据表格组件（使用 TailwindCSS）
     */
    import type { Snippet } from 'svelte';
    import SortableHeader from './SortableHeader.svelte';
    
    interface Column {
        key: string;
        title: string;
        width?: string;
        align?: 'left' | 'center' | 'right';
        sortable?: boolean;
        /** 额外的单元格 class，用于调整列间间距 */
        cellClass?: string;
        /** 额外的表头 class */
        headerClass?: string;
        /** 点击该列单元格时不触发行级 onRowClick */
        noClick?: boolean;
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
        onRowMouseEnter?: (item: T) => void;
        onRowMouseLeave?: (item: T) => void;
        onHeaderClick?: (columnKey: string) => void;
        sortKey?: string;
        sortDirection?: 'asc' | 'desc';
        
        // 自定义渲染
        cellRender?: Snippet<[{ item: T; column: Column; value: unknown }]>
        headerCellRender?: Snippet<[{ column: Column }]>
        rowClass?: (item: T) => string;
        
        // 样式
        class?: string;
        wrapperClass?: string;
        tableClass?: string;
        rowHover?: boolean;
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
        onRowMouseEnter,
        onRowMouseLeave,
        onHeaderClick,
        sortKey,
        sortDirection = 'asc',
        cellRender,
        headerCellRender,
        rowClass,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class: className = '',
        wrapperClass,
        tableClass: tableClassName,
        rowHover = true,
        zebra = true,
        bordered = true
    }: Props = $props();
    
    function getValue(item: unknown, key: string): unknown {
        return key.split('.').reduce((obj: unknown, k) => (obj as Record<string, unknown>)?.[k], item);
    }
    
    function handleRowClick(item: T, event: MouseEvent) {
        // 当点击的是行内的 <a>/<button>/<input>/<select>/<textarea> 等可交互元素时，
        // 避免行级 onclick 与链接的 SPA 导航重复触发
        if (event.target instanceof Element && event.target.closest('a, button, input, select, textarea')) {
            return;
        }
        if (clickable && onRowClick) {
            onRowClick(item);
        }
    }
    
    function getContainerClasses() {
        if (wrapperClass) {
            return [wrapperClass, bordered ? 'shadow' : ''].filter(Boolean).join(' ');
        }
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
            tableClassName ?? 'w-full',
            tableClassName ? '' : 'border-collapse text-sm',
            clickable ? 'cursor-pointer' : ''
        ].filter(Boolean).join(' ');
    }
</script>

<div class={getContainerClasses()}>
    <table class={getTableClasses()}>
        <thead>
            <tr>
                {#each columns as column}
                    {#if column.sortable && onHeaderClick}
                        <SortableHeader
                            title={column.title}
                            columnKey={column.key}
                            sortable={true}
                            sortKey={sortKey}
                            sortDirection={sortDirection}
                            align={column.align}
                            width={column.width}
                            headerClass={column.headerClass}
                            onSort={onHeaderClick}
                        />
                    {:else}
                        <th
                            class={
                                [
                                    'p-3',
                                    'text-gray-700',
                                    'font-semibold',
                                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                                    column.headerClass ?? ''
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
                    {/if}
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
                        class={
                            [
                                'hover:bg-gray-100',
                                rowClass ? rowClass(item) : ''
                            ].filter(Boolean).join(' ')
                        }
                        onclick={(e) => handleRowClick(item, e)}
                        onmouseenter={() => onRowMouseEnter?.(item)}
                        onmouseleave={() => onRowMouseLeave?.(item)}
                    >
                        {#each columns as column}
                            <td
                                class={
                                    [
                                        'p-3',
                                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                                        column.cellClass ?? '',
                                        column.noClick ? 'cursor-default' : ''
                                    ].join(' ')
                                }
                                style:width={column.width}
                                onclick={column.noClick ? (e) => e.stopPropagation() : undefined}
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

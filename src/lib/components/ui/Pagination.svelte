<!-- 分页 -->
<!--
被依赖：
- `lib/components/AttributeManager.svelte`
- `lib/components/CategoryForm.svelte`
- `lib/components/ContainerForm.svelte`
- `lib/components/CustomerForm.svelte`
- `lib/components/ItemForm.svelte`
- `lib/components/OrderForm.svelte`
- `lib/components/PackageForm.svelte`
- `lib/components/QuotationLinesTable.svelte`
- `lib/components/QuotationPriceCard.svelte`
- `lib/components/StorageForm.svelte`
- `lib/components/SupplierForm.svelte`
- `lib/components/VariantCreator.svelte`
- `lib/components/VariantQuotationManager.svelte`
- `lib/components/bom/AddComponentForm.svelte`
- `lib/components/bom/ComponentList.svelte`
- `lib/components/item/ItemInventoryTab.svelte`
- `lib/components/item/TransferConfirmModal.svelte`
- `lib/components/order/OrderFormItemsSection.svelte`
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
     * 通用分页组件
     */
    interface Props {
        page: number;
        pageSize?: number;
        totalCount: number;
        totalPages: number;
        disabled?: boolean;
        showInfo?: boolean;
        onPageChange: (page: number) => void;
    }
    
    let {
        page,
        pageSize = 20,
        totalCount,
        totalPages,
        disabled = false,
        showInfo = true,
        onPageChange
    }: Props = $props();
    
    function goToPage(p: number) {
        if (p < 1 || p > totalPages || p === page || disabled) return;
        onPageChange(p);
    }
    
    function getPageNumbers(): number[] {
        const pages: number[] = [];
        const delta = 2;
        
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= page - delta && i <= page + delta)
            ) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== -1) {
                pages.push(-1); // -1 表示省略号
            }
        }
        
        return pages;
    }
</script>

{#if totalPages > 1}
    <div class="flex justify-center items-center gap-1 p-4 flex-wrap">
        <button
            class="min-w-[2rem] h-8 px-2 border border-gray-200 bg-white rounded-md text-sm cursor-pointer transition-all duration-150 ease-in-out flex items-center justify-center font-bold hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={() => goToPage(page - 1)}
            disabled={page === 1 || disabled}
            aria-label="上一页"
        >
            ←
        </button>
        
        {#each getPageNumbers() as p}
            {#if p === -1}
                <span class="text-gray-400 px-2 select-none">...</span>
            {:else}
                <button
                    class="min-w-[2rem] h-8 px-2 border border-gray-200 bg-white rounded-md text-sm cursor-pointer transition-all duration-150 ease-in-out flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    class:bg-blue-500={p === page}
                    class:border-blue-500={p === page}
                    class:text-white={p === page}
                    class:hover:bg-blue-600={p === page}
                    onclick={() => goToPage(p)}
                    disabled={disabled}
                    aria-label="第 {p} 页"
                    aria-current={p === page ? 'page' : undefined}
                >
                    {p}
                </button>
            {/if}
        {/each}
        
        <button
            class="min-w-[2rem] h-8 px-2 border border-gray-200 bg-white rounded-md text-sm cursor-pointer transition-all duration-150 ease-in-out flex items-center justify-center font-bold hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={() => goToPage(page + 1)}
            disabled={page === totalPages || disabled}
            aria-label="下一页"
        >
            →
        </button>
        
        {#if showInfo}
            <span class="ml-4 text-gray-500 text-sm whitespace-nowrap">
                共 {totalCount} 条
            </span>
        {/if}
    </div>
{/if}
<script lang="ts">
    import { NumberStepper } from '$lib/components/ui';
    import Loading from '$lib/components/Loading.svelte';

    interface Quotation {
        id: number;
        sku?: string;
        item_name?: string;
        price?: string;
        currency?: string;
    }
    
    interface Props {
        title: string;
        quotations: Quotation[];
        loading: boolean;
        emptyText: string;
        addHref: string;
        quotationQuantities: Record<number, number | null>;
        onQuantityChange: (id: number, value: number | null) => void;
        onRowClick: (id: number) => void;
        onCreateOrder: () => void;
    }
    
    let { title, quotations, loading, emptyText, addHref, quotationQuantities, onQuantityChange, onRowClick, onCreateOrder }: Props = $props();
</script>

<div class="py-6 border-t border-gray-200">
    <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-2">
            <h2 class="text-xl font-medium text-gray-800">{title}</h2>
            <a 
                href={addHref} 
                class="inline-flex items-center px-3 py-1.5 font-medium text-white bg-green-300 hover:bg-green-400 rounded-md transition-colors shadow-sm"
            >
                添加报价
            </a>
        </div>
        <button 
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
            onclick={onCreateOrder}
        >
            新建订单
        </button>
    </div>
    
    {#if loading}
        <Loading text="加载报价..." />
    {:else if quotations.length === 0}
        <div class="text-center py-12 text-gray-500">
            <p>{emptyText}</p>
        </div>
    {:else}
        <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
                <thead>
                    <tr>
                        <th class="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">SKU</th>
                        <th class="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">物品名称</th>
                        <th class="px-4 py-3 text-right font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">单价</th>
                        <th class="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">货币</th>
                        <th class="px-4 py-3 text-right font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">数量</th>
                    </tr>
                </thead>
                <tbody>
                    {#each quotations as quotation}
                        <tr class="border-b border-gray-200">
                            <td class="px-4 py-3 text-gray-600 cursor-pointer hover:bg-gray-100" onclick={() => onRowClick(quotation.id)}>{quotation.sku || '-'}</td>
                            <td class="px-4 py-3 text-gray-600 cursor-pointer hover:bg-gray-100" onclick={() => onRowClick(quotation.id)}>{quotation.item_name || '-'}</td>
                            <td class="px-4 py-3 text-gray-600 text-right font-mono cursor-pointer hover:bg-gray-100" onclick={() => onRowClick(quotation.id)}>{quotation.price}</td>
                            <td class="px-4 py-3 text-gray-600 cursor-pointer hover:bg-gray-100" onclick={() => onRowClick(quotation.id)}>{quotation.currency}</td>
                            <td class="px-4 py-3 text-right">
                                <NumberStepper
                                    value={quotationQuantities[quotation.id] ?? undefined}
                                    step={1}
                                    decimalPlaces={0}
                                    size="sm"
                                    onchange={(value) => onQuantityChange(quotation.id, value ?? null)}
                                />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="mt-6 flex justify-end">
            <button 
                class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
                onclick={onCreateOrder}
            >
                新建订单
            </button>
        </div>
    {/if}
</div>

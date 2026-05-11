<script lang="ts">
    import type { StorageContainer } from '$lib';
    import { formatDate, formatNumber } from '$lib/utils';
    import { NumberStepper } from '$lib/components/ui';
    import Plus from 'lucide-svelte/icons/plus';

    interface Props {
        isVariantTemplate: boolean;
        inventoryCheckedAt?: string | null;
        inventoryCheckedFlash: boolean;
        isInventoryChecking: boolean;
        storages: StorageContainer[];
        quantityValues: Record<number, number>;
        quantityFlash: Record<number, boolean>;
        quantityDelta: Record<number, number>;
        removingIds: Set<number>;
        onInventoryCheck: () => void;
        onInbound: () => void;
        onOutbound: (storage: StorageContainer) => void;
        onQuantityChange: (storageId: number, quantity: number) => void;
    }

    let {
        isVariantTemplate,
        inventoryCheckedAt = null,
        inventoryCheckedFlash,
        isInventoryChecking,
        storages,
        quantityValues,
        quantityFlash,
        quantityDelta,
        removingIds,
        onInventoryCheck,
        onInbound,
        onOutbound,
        onQuantityChange,
    }: Props = $props();
</script>

<div class="space-y-4">
    {#if !isVariantTemplate}
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-3 flex-wrap">
                <h2 class="text-lg font-semibold text-gray-900">库存分布</h2>
                <span class="text-sm text-gray-500" title="最后盘点时间">
                    {inventoryCheckedAt ? formatDate(inventoryCheckedAt) : '未盘点'}
                </span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md shadow-sm transition-colors {inventoryCheckedFlash ? 'bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}"
                    onclick={onInventoryCheck}
                    disabled={isInventoryChecking}
                >
                    {#if inventoryCheckedFlash}
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                        已盘点
                    {:else}
                        盘点
                    {/if}
                </button>
                <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-sm font-medium text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                    onclick={onInbound}
                >
                    <Plus class="h-4 w-4" />
                    入库
                </button>
            </div>
        </div>
    {/if}

    {#if !isVariantTemplate}
        <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="w-full text-sm min-w-[500px]">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-2 sm:px-4 py-3 text-left font-medium text-gray-700">位置</th>
                        <th class="px-2 sm:px-4 py-3 text-left font-medium text-gray-700">标记</th>
                        <th class="px-2 sm:px-4 py-3 text-right font-medium text-gray-700">数量</th>
                        <th class="px-2 sm:px-4 py-3 text-center font-medium text-gray-700 whitespace-nowrap">出库</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    {#each storages as storage}
                        <tr class="hover:bg-gray-50 transition-opacity duration-[3000ms] {removingIds.has(storage.id) ? 'opacity-0 pointer-events-none' : 'opacity-100'}">
                            <td class="px-2 sm:px-4 py-3">
                                <a href="/container/{storage.container_fastCode}" class="font-medium text-blue-600 hover:underline">
                                    {storage.container_fastCode}
                                </a>
                            </td>
                            <td class="px-2 sm:px-4 py-3">
                                {#if storage.mark}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                        {storage.mark}
                                    </span>
                                {:else}
                                    <span class="text-gray-400">-</span>
                                {/if}
                            </td>
                            <td class="px-2 sm:px-4 py-3 text-right">
                                <a href="/storage/{storage.id}" class="relative inline-flex items-center gap-1 font-medium transition-colors duration-300 {quantityFlash[storage.id] ? 'text-red-500' : 'text-gray-900 hover:text-blue-600'}">
                                    {formatNumber(storage.quantity)}
                                    {#if quantityDelta[storage.id]}
                                        <span class="text-xs font-normal transition-opacity duration-[3000ms] {quantityFlash[storage.id] ? 'opacity-100' : 'opacity-0'} text-red-400">
                                            -{quantityDelta[storage.id]}
                                        </span>
                                    {/if}
                                </a>
                            </td>
                            <td class="px-2 sm:px-4 py-3">
                                <div class="flex items-center justify-center gap-2 sm:gap-6">
                                    <NumberStepper
                                        value={quantityValues[storage.id]}
                                        onchange={(v) => onQuantityChange(storage.id, v ?? 1)}
                                        min={1}
                                        max={storage.quantity}
                                        step={1}
                                        decimalPlaces={0}
                                        size="sm"
                                    />
                                    <button
                                        onclick={() => onOutbound(storage)}
                                        class="px-2 sm:px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
                                    >
                                        出库
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

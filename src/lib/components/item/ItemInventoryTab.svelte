<!-- 物料库存标签页 -->
<!--
被依赖：
- `routes/item/[slug]/+page.svelte`
-->
<script lang="ts">
    import { goto } from '$app/navigation';
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
        transferFlash?: Record<number, number>;
        onInventoryCheck: () => void;
        onInbound: () => void;
        onOutbound: (storage: StorageContainer) => void;
        onQuantityChange: (storageId: number, quantity: number) => void;
        onTransferDrop: (fromStorageId: number, toStorageId: number) => void;
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
        transferFlash = {},
        onInventoryCheck,
        onInbound,
        onOutbound,
        onQuantityChange,
        onTransferDrop = () => {},
    }: Props = $props();

    let dragFromStorageId = $state<number | null>(null);
    let dragOverStorageId = $state<number | null>(null);
    let tooltipVisibleId = $state<number | null>(null);
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;

    function handleRowMouseEnter(storageId: number) {
        hoverTimer = setTimeout(() => { tooltipVisibleId = storageId; }, 3000);
    }

    function handleRowMouseLeave() {
        if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
        tooltipVisibleId = null;
    }

    function handleDragStart(e: DragEvent, storage: StorageContainer) {
        if (storage.quantity <= 0) {
            e.preventDefault();
            return;
        }
        dragFromStorageId = storage.id;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(storage.id));
            e.dataTransfer.setData('application/x-storage-id', String(storage.id));
        }
    }

    function handleDragOver(e: DragEvent, target: StorageContainer) {
        if (dragFromStorageId === null || dragFromStorageId === target.id) return;
        e.preventDefault();
        dragOverStorageId = target.id;
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e: DragEvent, target: StorageContainer) {
        e.preventDefault();
        let fromId = dragFromStorageId;
        if (!fromId && e.dataTransfer) {
            const raw = e.dataTransfer.getData('application/x-storage-id') || e.dataTransfer.getData('text/plain');
            const parsed = Number(raw);
            if (Number.isFinite(parsed)) fromId = parsed;
        }
        dragOverStorageId = null;
        dragFromStorageId = null;
        if (!fromId || fromId === target.id) return;
        onTransferDrop(fromId, target.id);
    }

    function handleDragEnd() {
        dragOverStorageId = null;
        dragFromStorageId = null;
    }
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
                        <tr
                            draggable={storage.quantity > 0 ? 'true' : 'false'}
                            ondragstart={(e) => handleDragStart(e, storage)}
                            ondragover={(e) => handleDragOver(e, storage)}
                            ondrop={(e) => handleDrop(e, storage)}
                            ondragleave={() => {
                                if (dragOverStorageId === storage.id) dragOverStorageId = null;
                            }}
                            ondragend={handleDragEnd}
                            onmouseenter={() => handleRowMouseEnter(storage.id)}
                            onmouseleave={handleRowMouseLeave}
                            class="transition-opacity duration-[3000ms] {removingIds.has(storage.id) ? 'opacity-0 pointer-events-none' : 'opacity-100'} {dragOverStorageId === storage.id ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : 'hover:bg-gray-50'} {dragFromStorageId === storage.id ? 'opacity-60' : ''} {storage.quantity > 0 ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}"
                        >
                            <td class="px-2 sm:px-4 py-3">
                                <a
                                    href="/container/{storage.container_fastCode}"
                                    class="font-medium text-blue-600 hover:underline"
                                    onclick={(e) => {
                                        e.preventDefault();
                                        goto(`/container/${storage.container_fastCode}`, { noScroll: true });
                                    }}
                                >
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
                                <a
                                    href="/storage/{storage.id}"
                                    class="relative inline-flex items-center gap-1 font-medium transition-colors duration-300 {quantityFlash[storage.id] ? 'text-red-500' : 'text-gray-900 hover:text-blue-600'}"
                                    onclick={(e) => {
                                        e.preventDefault();
                                        goto(`/storage/${storage.id}`, { noScroll: true });
                                    }}
                                >
                                    {formatNumber(storage.quantity)}
                                    {#if quantityDelta[storage.id]}
                                        <span class="text-xs font-normal transition-opacity duration-[3000ms] {quantityFlash[storage.id] ? 'opacity-100' : 'opacity-0'} text-red-400">
                                            -{quantityDelta[storage.id]}
                                        </span>
                                    {/if}
                                </a>
                                {#if transferFlash[storage.id]}
                                    <span class="text-xs font-medium text-green-600 transition-opacity duration-[1500ms] opacity-100">+{transferFlash[storage.id]}</span>
                                {/if}
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

    {#if tooltipVisibleId !== null}
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-800/90 text-white text-xs rounded-full px-4 py-2 shadow-lg pointer-events-none">
            拖拽到另一行可移库
        </div>
    {/if}
</div>
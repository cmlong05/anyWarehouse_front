<script lang="ts">
    import Alert from '$lib/components/Alert.svelte';

    interface Item {
        id: number;
        sku: string;
        item_name: string;
        quantity: string | number;
        quantity_shipped?: string | number;
        quantity_received?: string | number;
        quantity_pending?: string | number;
    }

    interface Props {
        show: boolean;
        title: string;
        items: Item[];
        quantities: Record<number, number>;
        notes: string;
        updating: boolean;
        error: string | null;
        type: 'ship' | 'receive';
        onClose: () => void;
        onConfirm: () => void;
        onNotesChange: (value: string) => void;
    }
    
    let {
        show,
        title,
        items,
        quantities,
        notes,
        updating,
        error,
        type,
        onClose,
        onConfirm,
        onNotesChange,
    }: Props = $props();

    function getProcessedQty(item: Item): number {
        return Number(type === 'ship' ? (item.quantity_shipped || 0) : (item.quantity_received || 0));
    }

    function getPendingQty(item: Item): number {
        return Number(item.quantity_pending || 0);
    }

    function getTotalQuantity(): number {
        return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    }
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8" onclick={(e) => e.target === e.currentTarget && onClose()} onkeydown={(e) => e.key === 'Escape' && onClose()} role="presentation" tabindex="-1">
        <div class="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div class="flex justify-between items-center p-4 px-6 border-b border-gray-200">
                <h2 class="m-0 text-xl">{title}</h2>
                <button class="bg-transparent border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-1 leading-none" onclick={onClose}>×</button>
            </div>
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-70px)]">
                {#if error}
                    <Alert error={{message: error}} onDismiss={() => {}} />
                {/if}
                
                <div>
                    <table class="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">SKU</th>
                                <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">物品名称</th>
                                <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">订购数量</th>
                                <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">{type === 'ship' ? '已发货' : '已收货'}</th>
                                <th class="p-3 text-right border-b border-gray-100 bg-gray-50 font-semibold">本次{type === 'ship' ? '发货' : '收货'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each items.filter(i => getPendingQty(i) > 0) as item}
                                <tr>
                                    <td class="p-3 text-left border-b border-gray-100 font-mono">{item.sku}</td>
                                    <td class="p-3 text-left border-b border-gray-100">{item.item_name}</td>
                                    <td class="p-3 text-right border-b border-gray-100">{item.quantity}</td>
                                    <td class="p-3 text-right border-b border-gray-100">{getProcessedQty(item)}</td>
                                    <td class="p-3 text-right border-b border-gray-100">
                                        <input
                                            type="number"
                                            min="0"
                                            max={getPendingQty(item)}
                                            step="1"
                                            bind:value={quantities[item.id]}
                                            class="w-20 p-1.5 border border-gray-300 rounded text-right"
                                        />
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>

                    <div class="mt-4 p-3 bg-blue-50 rounded text-right">
                        <span>本次{type === 'ship' ? '发货' : '收货'}总量: <strong>{getTotalQuantity()}</strong></span>
                    </div>

                    <div class="mt-4">
                        <label for="ship-notes" class="block text-sm text-gray-500 mb-1.5">{type === 'ship' ? '发货' : '收货'}备注</label>
                        <textarea
                            id="ship-notes"
                            value={notes}
                            oninput={(e) => onNotesChange(e.currentTarget.value)}
                            placeholder="输入备注（可选）"
                            rows="2"
                            class="w-full p-2 border border-gray-300 rounded text-sm resize-y"
                        ></textarea>
                    </div>

                    <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-500 text-white hover:bg-gray-600" onclick={onClose} disabled={updating}>取消</button>
                        <button class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700" onclick={onConfirm} disabled={updating || getTotalQuantity() === 0}>
                            {updating ? '处理中...' : `确认${type === 'ship' ? '发货' : '收货'}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

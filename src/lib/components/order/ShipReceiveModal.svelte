<!-- 描述：发货/收货数量确认的模态组件，支持容器分配和数量校验。 -->
<!--
被依赖：
- `lib/components/order/OrderForm.svelte`
- `lib/components/order/index.ts`
-->
<script lang="ts">
    import { Alert } from '$lib/components';
    import Svelecte from 'svelecte';
    import { buildContainerRelationSearchOptions, formatNumber, hasChangedFields, shouldDismissModal } from '$lib/utils';
    import { NumberStepper } from '$lib/components/ui';
    import type { ContainerBriefID } from '$lib';

    interface Item {
        id: number;
        sku: string;
        item_name: string;
        quantity: string | number;
        quantity_processed?: string | number;
        quantity_pending?: string | number;
    }

    interface Props {
        show: boolean;
        title: string;
        items: Item[];
        quantities: Record<number, number>;
        containers?: Record<number, number | null>;
        onContainerChange?: (itemId: number, containerId: number | null) => void;
        availableStorages?: Record<number, any>;
        notes: string;
        updating: boolean;
        error: string | null;
        type: 'ship' | 'receive';
        allContainers?: ContainerBriefID[];
        onClose: () => void;
        onConfirm: () => void;
        onNotesChange: (value: string) => void;
    }
    
    let {
        show,
        title,
        items,
        quantities,
        containers = {},
        onContainerChange = () => {},
        notes,
        updating,
        error,
        type,
        allContainers = [],
        onClose,
        onConfirm,
        onNotesChange,
    }: Props = $props();

    // availableStorages is provided by parent via prop; parent prefetches storages when opening modal

    let initialModalState = $state({
        notes: '',
        quantities: {} as Record<number, number>,
        containers: {} as Record<number, number | null>,
        editableItemIds: [] as number[],
    });
    let hasCapturedSnapshot = $state(false);

    const containerOptions = $derived(buildContainerRelationSearchOptions(allContainers));
    const editableItems = $derived(items.filter((item) => getPendingQty(item) > 0));
    const editableItemIds = $derived(editableItems.map((item) => item.id));

    const isPristine = $derived(
        !hasChangedFields(
            {
                notes,
                quantities,
                containers,
                editableItemIds,
            },
            initialModalState,
            ['notes', 'quantities', 'containers', 'editableItemIds'],
            (currentValue, initialValue, field) => {
                switch (field) {
                    case 'notes':
                        return Object.is(currentValue, initialValue);
                    case 'quantities': {
                        const currentQuantities = currentValue as Record<number, number>;
                        const initialQuantities = initialValue as Record<number, number>;
                        return editableItemIds.every(
                            (itemId) => Number(currentQuantities[itemId] ?? 0) === Number(initialQuantities[itemId] ?? 0)
                        );
                    }
                    case 'containers': {
                        const currentContainers = currentValue as Record<number, number | null>;
                        const initialContainers = initialValue as Record<number, number | null>;
                        return editableItemIds.every(
                            (itemId) => (currentContainers[itemId] ?? null) === (initialContainers[itemId] ?? null)
                        );
                    }
                    case 'editableItemIds': {
                        const currentIds = currentValue as number[];
                        const initialIds = initialValue as number[];
                        return currentIds.length === initialIds.length && currentIds.every((value, index) => value === initialIds[index]);
                    }
                }
            }
        )
    );

    const canDismiss = $derived(isPristine);

    function hasUnassignedReceiveItems(): boolean {
        if (type !== 'receive') return false;
        return items.some(
            (item) => Number(item.quantity_pending || 0) > 0 &&
                      (quantities[item.id] ?? 0) > 0 &&
                      (containers?.[item.id] == null)
        );
    }

    function getProcessedQty(item: Item): number {
        return Number(item.quantity_processed || 0);
    }

    function getPendingQty(item: Item): number {
        return Number(item.quantity_pending || 0);
    }

    function getTotalQuantity(): number {
        return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    }

    function parseContainerId(value: unknown): number | null {
        if (value === null || value === undefined || value === '') return null;

        // Svelecte may emit either primitive values or option objects depending on config.
        if (typeof value === 'object' && value !== null) {
            const candidate = (value as { value?: unknown }).value;
            if (candidate === null || candidate === undefined || candidate === '') return null;
            const parsedFromObject = Number(candidate);
            return Number.isFinite(parsedFromObject) ? parsedFromObject : null;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    $effect(() => {
        if (!show) {
            hasCapturedSnapshot = false;
            return;
        }

        if (!hasCapturedSnapshot) {
            initialModalState = {
                notes,
                quantities: { ...quantities },
                containers: { ...containers },
                editableItemIds: [...editableItems.map((item) => item.id)],
            };
            hasCapturedSnapshot = true;
        }
    });

    function requestCloseModal(force = false) {
        if (force || canDismiss) {
            onClose();
        }
    }

    function handleBackdropClick(event: MouseEvent) {
        if (shouldDismissModal(event, canDismiss)) {
            requestCloseModal();
        }
    }

    function handleModalKeydown(event: KeyboardEvent) {
        if (shouldDismissModal(event, canDismiss)) {
            event.preventDefault();
            requestCloseModal();
        }
    }
</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8" onclick={handleBackdropClick} onkeydown={handleModalKeydown} role="presentation" tabindex="-1">
        <div class="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div class="flex justify-between items-center p-4 px-6 border-b border-gray-200">
                <h2 class="m-0 text-xl">{title}</h2>
                <button class="bg-transparent border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-1 leading-none" onclick={() => requestCloseModal(true)}>×</button>
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
                                {#if type === 'receive'}
                                    <th class="p-3 text-left border-b border-gray-100 bg-gray-50 font-semibold">目标容器</th>
                                {/if}
                            </tr>
                        </thead>
                        <tbody>
                            {#each items.filter(i => getPendingQty(i) > 0) as item}
                                <tr>
                                    <td class="p-3 text-left border-b border-gray-100 font-mono">{item.sku}</td>
                                    <td class="p-3 text-left border-b border-gray-100">{item.item_name}</td>
                                    <td class="p-3 text-right border-b border-gray-100">{formatNumber(item.quantity)}</td>
                                    <td class="p-3 text-right border-b border-gray-100">{formatNumber(getProcessedQty(item))}</td>
                                    <td class="p-3 text-right border-b border-gray-100">
                                        <NumberStepper
                                            value={quantities[item.id] ?? 0}
                                            min={0}
                                            max={getPendingQty(item)}
                                            step={1}
                                            decimalPlaces={0}
                                            size="sm"
                                            onchange={(v) => quantities[item.id] = v ?? 0}
                                        />
                                    </td>
                                    {#if type === 'receive'}
                                        <td class="p-3 text-left border-b border-gray-100">
                                            <Svelecte
                                                options={containerOptions}
                                                value={containers?.[item.id] ?? null}
                                                valueAsObject={false}
                                                emitValues={true}
                                                valueField="value"
                                                labelField="label"
                                                dropdownClass="!left-auto !right-0"
                                                searchProps={{ fields: ['label', 'searchText'] }}
                                                searchable={true}
                                                placeholder="请选择容器"
                                                class="svelecte-control"
                                                onChange={(value: unknown) => onContainerChange(item.id, parseContainerId(value))}
                                            />
                                        </td>
                                    {/if}
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
                        <button class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-500 text-white hover:bg-gray-600" onclick={() => requestCloseModal(true)} disabled={updating}>取消</button>
                        <button class="px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700" onclick={onConfirm} disabled={updating || getTotalQuantity() === 0 || hasUnassignedReceiveItems()}>
                            {updating ? '处理中...' : `确认${type === 'ship' ? '发货' : '收货'}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
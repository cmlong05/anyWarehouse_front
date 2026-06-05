<!-- 新增库存流水页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { getErrorMessage } from '$lib/utils/errors';
    import { goto } from '$app/navigation';
    import { inventoryMovementAPI, type MovementType, type InventoryMovementCreateRequest } from '$lib/api';
    import Alert from '$lib/components/Alert.svelte';
    import Svelecte from 'svelecte';
    import type { ContainerBriefID } from '$lib';

    let { data } = $props<{
        data: {
            containers: ContainerBriefID[];
            initialItemId: string | null;
            initialFromContainerId: string | null;
            initialToContainerId: string | null;
            initialType: string;
        };
    }>();

    const movementTypeOptions = [
        { value: 'inbound', label: '入库 (Inbound)' },
        { value: 'outbound', label: '出库 (Outbound)' },
        { value: 'transfer', label: '移库 (Transfer)' },
    ];

    let movementType = $state<MovementType>('inbound');
    let itemId = $state('');
    let quantity = $state(1);
    let fromContainer = $state<number | string>('');
    let toContainer = $state<number | string>('');

    const containerOptions = $derived(
        (data.containers ?? []).map((c: ContainerBriefID) => ({ value: c.id, label: c.fastCode })),
    );

    $effect(() => {
        if (['inbound', 'outbound', 'transfer'].includes(data.initialType)) {
            movementType = data.initialType as MovementType;
        }
        if (data.initialItemId) itemId = data.initialItemId;
        if (data.initialFromContainerId) fromContainer = Number(data.initialFromContainerId);
        if (data.initialToContainerId) toContainer = Number(data.initialToContainerId);
    });
    let reason = $state('');
    let notes = $state('');
    let createdBy = $state('');

    let submitting = $state(false);
    let error = $state('');

    const showFrom = $derived(movementType === 'outbound' || movementType === 'transfer');
    const showTo = $derived(movementType === 'inbound' || movementType === 'transfer');

    async function submit() {
        if (!itemId) { error = '请填写物品 ID'; return; }
        if (!quantity || quantity <= 0) { error = '数量必须大于 0'; return; }
        if (showFrom && !fromContainer) { error = '请选择来源容器'; return; }
        if (showTo && !toContainer) { error = '请选择目标容器'; return; }
        if (movementType === 'transfer' && fromContainer === toContainer) {
            error = '来源与目标容器不能相同';
            return;
        }

        const payload: InventoryMovementCreateRequest = {
            movement_type: movementType,
            item: Number(itemId),
            quantity: Number(quantity),
            reason,
            notes,
            created_by: createdBy,
        };
        if (showFrom) payload.from_container = Number(fromContainer);
        if (showTo) payload.to_container = Number(toContainer);

        submitting = true;
        error = '';
        try {
            await inventoryMovementAPI.create(payload);
            goto('/storage/movement');
        } catch (err) {
            const detail = (err && typeof err === 'object' && 'detail' in err)
                ? (err as { detail?: unknown }).detail
                : undefined;
            error = detail !== undefined ? JSON.stringify(detail) : getErrorMessage(err, '创建失败');
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:head><title>新建出入库记录</title></svelte:head>

<div class="p-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">新建出入库记录</h1>

    {#if error}
        <Alert error={error} />
    {/if}

    <form
        class="bg-white p-6 border border-gray-200 rounded-lg"
        onsubmit={(e) => { e.preventDefault(); submit(); }}
    >
        <div class="grid grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5 text-sm font-medium">
                类型 <span class="text-red-500">*</span>
                <Svelecte
                    options={movementTypeOptions}
                    bind:value={movementType}
                    clearable={false}
                    class="svelecte-control"
                />
            </label>

            <label class="flex flex-col gap-1.5 text-sm font-medium">
                物品 ID <span class="text-red-500">*</span>
                <input
                    type="number"
                    bind:value={itemId}
                    required
                    class="px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </label>

            <label class="flex flex-col gap-1.5 text-sm font-medium">
                数量 <span class="text-red-500">*</span>
                <input
                    type="number"
                    min="1"
                    bind:value={quantity}
                    required
                    class="px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </label>

            {#if showFrom}
                <label class="flex flex-col gap-1.5 text-sm font-medium">
                    来源容器 <span class="text-red-500">*</span>
                    <Svelecte
                        options={containerOptions}
                        bind:value={fromContainer}
                        placeholder="-- 选择 --"
                        clearable={true}
                        searchProps={{ fields: ['label'] }}
                        class="svelecte-control"
                    />
                </label>
            {/if}

            {#if showTo}
                <label class="flex flex-col gap-1.5 text-sm font-medium">
                    目标容器 <span class="text-red-500">*</span>
                    <Svelecte
                        options={containerOptions}
                        bind:value={toContainer}
                        placeholder="-- 选择 --"
                        clearable={true}
                        searchProps={{ fields: ['label'] }}
                        class="svelecte-control"
                    />
                </label>
            {/if}

            <label class="flex flex-col gap-1.5 text-sm font-medium">
                操作人
                <input
                    type="text"
                    bind:value={createdBy}
                    placeholder="(可选)"
                    class="px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </label>

            <label class="col-span-2 flex flex-col gap-1.5 text-sm font-medium">
                原因
                <input
                    type="text"
                    bind:value={reason}
                    placeholder="如：盘点修正、报废、客户退货等"
                    class="px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </label>

            <label class="col-span-2 flex flex-col gap-1.5 text-sm font-medium">
                备注
                <textarea
                    bind:value={notes}
                    rows="3"
                    class="px-2 py-2 border border-gray-300 rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
            </label>
        </div>

        <div class="flex justify-end gap-3 mt-6">
            <button
                type="button"
                class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md text-sm transition-colors"
                onclick={() => goto('/storage/movement')}
            >
                取消
            </button>
            <button
                type="submit"
                class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={submitting}
            >
                {submitting ? '提交中...' : '提交'}
            </button>
        </div>
    </form>
</div>
<script lang="ts">
    import { goto } from '$app/navigation';
    import { inventoryMovementAPI, type MovementType, type InventoryMovementCreateRequest } from '$lib/api';
    import Alert from '$lib/components/Alert.svelte';
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

    let movementType = $state<MovementType>('inbound');
    let itemId = $state('');
    let quantity = $state(1);
    let fromContainer = $state('');
    let toContainer = $state('');

    $effect(() => {
        if (['inbound', 'outbound', 'transfer'].includes(data.initialType)) {
            movementType = data.initialType as MovementType;
        }
        if (data.initialItemId) itemId = data.initialItemId;
        if (data.initialFromContainerId) fromContainer = data.initialFromContainerId;
        if (data.initialToContainerId) toContainer = data.initialToContainerId;
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
        } catch (err: any) {
            error = err?.message || '创建失败';
            if (err?.detail) error = JSON.stringify(err.detail);
        } finally {
            submitting = false;
        }
    }
</script>

<svelte:head><title>新建出入库记录</title></svelte:head>

<div class="page">
    <h1>新建出入库记录</h1>

    {#if error}
        <Alert error={error} />
    {/if}

    <form class="form" onsubmit={(e) => { e.preventDefault(); submit(); }}>
        <div class="grid">
            <label>
                类型 <span class="req">*</span>
                <select bind:value={movementType}>
                    <option value="inbound">入库 (Inbound)</option>
                    <option value="outbound">出库 (Outbound)</option>
                    <option value="transfer">移库 (Transfer)</option>
                </select>
            </label>

            <label>
                物品 ID <span class="req">*</span>
                <input type="number" bind:value={itemId} required />
            </label>

            <label>
                数量 <span class="req">*</span>
                <input type="number" min="1" bind:value={quantity} required />
            </label>

            {#if showFrom}
                <label>
                    来源容器 <span class="req">*</span>
                    <select bind:value={fromContainer}>
                        <option value="">-- 选择 --</option>
                        {#each data.containers as c (c.id)}
                            <option value={c.id}>{c.fastCode}</option>
                        {/each}
                    </select>
                </label>
            {/if}

            {#if showTo}
                <label>
                    目标容器 <span class="req">*</span>
                    <select bind:value={toContainer}>
                        <option value="">-- 选择 --</option>
                        {#each data.containers as c (c.id)}
                            <option value={c.id}>{c.fastCode}</option>
                        {/each}
                    </select>
                </label>
            {/if}

            <label>
                操作人
                <input type="text" bind:value={createdBy} placeholder="(可选)" />
            </label>

            <label class="full">
                原因
                <input type="text" bind:value={reason} placeholder="如：盘点修正、报废、客户退货等" />
            </label>

            <label class="full">
                备注
                <textarea bind:value={notes} rows="3"></textarea>
            </label>
        </div>

        <div class="actions">
            <button type="button" class="btn-secondary" onclick={() => goto('/storage/movement')}>取消</button>
            <button type="submit" class="btn-primary" disabled={submitting}>
                {submitting ? '提交中...' : '提交'}
            </button>
        </div>
    </form>
</div>

<style>
    .page { padding: 1.5rem; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
    .form { background: white; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .grid label { display: flex; flex-direction: column; gap: 0.375rem; font-size: 0.875rem; font-weight: 500; }
    .full { grid-column: 1 / -1; }
    input, select, textarea { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; }
    textarea { resize: vertical; }
    .req { color: #ef4444; }
    .actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-primary { background: #4f46e5; color: white; padding: 0.5rem 1.25rem; border-radius: 6px; border: none; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #e5e7eb; color: #1f2937; padding: 0.5rem 1.25rem; border-radius: 6px; border: none; cursor: pointer; }
</style>

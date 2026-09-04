<!-- 包装清单页 — 移动端逐项核查包裹商品 -->
<!--
被依赖：ChecklistItemCard, ChecklistProgress, ChecklistToolbar
-->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { packageAPI } from '$lib/api';
    import { getErrorMessage } from '$lib/utils';
    import type { PackageChecklistItem, ChecklistSummary, Package, PackageChecklistAllocation } from '$lib/shipmentTypes';
    import { Alert, Loading } from '$lib/components';
    import ChecklistProgress from './ChecklistProgress.svelte';
    import ChecklistToolbar from './ChecklistToolbar.svelte';
    import ChecklistItemCard from './ChecklistItemCard.svelte';

    let pkg = $state<Package | null>(null);
    let items = $state<PackageChecklistItem[]>([]);
    let loading = $state(true);
    let error = $state('');

    let pkgId = $derived(parseInt(page.params.id || '0'));

    let summary = $derived<ChecklistSummary>({
        total: items.length,
        checked: items.filter(i => {
            const allocs = i.allocations ?? [];
            return allocs.length > 0
                ? allocs.every(a => a.checked)
                : i.checked;
        }).length,
        // 口径与卡片/封箱校验一致：行级实点 = 各库位实点之和（无库位时取行实点）
        discrepancy_count: items.filter(i => {
            const allocs = i.allocations ?? [];
            const actual = allocs.length > 0
                ? allocs.reduce((sum, a) => sum + (a.actual_quantity ?? a.planned_quantity), 0)
                : i.actual_quantity;
            return actual === null || actual !== i.planned_quantity;
        }).length,
    });

    let readonly = $derived(pkg?.status === 'sealed');

    let pendingSaves = new Map<number, Partial<PackageChecklistItem>>();
    let pendingAllocSaves = new Map<number, Partial<PackageChecklistAllocation>>();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let allocDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    function flushSaves() {
        if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
        const entries = Array.from(pendingSaves.entries());
        pendingSaves.clear();
        for (const [itemId, data] of entries) {
            packageAPI.updateChecklistItem(pkgId, itemId, data).catch(() => {});
        }
    }

    function flushAllocSaves() {
        if (allocDebounceTimer) { clearTimeout(allocDebounceTimer); allocDebounceTimer = null; }
        const entries = Array.from(pendingAllocSaves.entries());
        pendingAllocSaves.clear();
        for (const [allocId, data] of entries) {
            // Find which checklist item this allocation belongs to
            for (const item of items) {
                const alloc = item.allocations?.find(a => a.id === allocId);
                if (alloc) {
                    packageAPI.updateChecklistAllocation(pkgId, item.id, allocId, data).catch(() => {});
                    break;
                }
            }
        }
    }

    function scheduleSave(itemId: number, data: Partial<PackageChecklistItem>) {
        pendingSaves.set(itemId, { ...(pendingSaves.get(itemId) || {}), ...data });
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(flushSaves, 500);
    }

    function handleItemChange(item: PackageChecklistItem) {
        items = items.map(i => i.id === item.id ? item : i);
        scheduleSave(item.id, {
            checked: item.checked,
            actual_quantity: item.actual_quantity,
            notes: item.notes,
        });
    }

    function handleAllocChange(alloc: PackageChecklistAllocation) {
        // Update the allocation in-place within the items array
        items = items.map(i => {
            const allocs = i.allocations;
            if (!allocs) return i;
            const updated = allocs.map(a => a.id === alloc.id ? alloc : a);
            return { ...i, allocations: updated };
        });
        pendingAllocSaves.set(alloc.id, {
            checked: alloc.checked,
            actual_quantity: alloc.actual_quantity,
        });
        if (allocDebounceTimer) clearTimeout(allocDebounceTimer);
        allocDebounceTimer = setTimeout(flushAllocSaves, 500);
    }

    async function handleCheckAll() {
        if (readonly) return;
        const updated = items.map(i => {
            const allocs = (i.allocations ?? []).map(a => ({
                ...a, checked: true, actual_quantity: a.planned_quantity
            }));
            return { ...i, checked: true, allocations: allocs };
        });
        items = updated;
        for (const item of updated) {
            scheduleSave(item.id, { checked: true });
            for (const alloc of (item.allocations ?? [])) {
                pendingAllocSaves.set(alloc.id, { checked: true, actual_quantity: alloc.planned_quantity });
            }
        }
        flushSaves();
        flushAllocSaves();
    }

    async function handleUncheckAll() {
        if (readonly) return;
        const updated = items.map(i => {
            const allocs = (i.allocations ?? []).map(a => ({ ...a, checked: false }));
            return { ...i, checked: false, allocations: allocs };
        });
        items = updated;
        for (const item of updated) {
            scheduleSave(item.id, { checked: false });
            for (const alloc of (item.allocations ?? [])) {
                pendingAllocSaves.set(alloc.id, { checked: false });
            }
        }
        flushSaves();
        flushAllocSaves();
    }

    async function loadChecklist() {
        try {
            error = '';
            pkg = await packageAPI.get(pkgId);
            const data = await packageAPI.initChecklist(pkgId);
            items = data;
        } catch (e) {
            error = getErrorMessage(e, '加载核查清单失败');
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadChecklist();
        window.addEventListener('beforeunload', flushSaves);
        return () => window.removeEventListener('beforeunload', flushSaves);
    });

    onDestroy(() => {
        flushSaves();
        flushAllocSaves();
    });
</script>

<svelte:head>
    <title>包装清单 - {pkg?.package_no || '加载中...'} - AnyWarehouse</title>
</svelte:head>

<div class="flex h-dvh flex-col bg-gray-50">
    <!-- Fixed header -->
    <div class="flex-shrink-0 border-b border-gray-200 bg-white">
        <div class="flex items-center gap-3 px-4 h-14">
            <button
                class="inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                onclick={() => goto(`/customer/package/${pkgId}`)}
            >
                ← 返回
            </button>
            <h1 class="text-lg font-bold text-gray-900 truncate">
                包裹 {pkg?.package_no ?? '...'}
            </h1>
            {#if readonly}
                <span class="ml-auto rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">只读</span>
            {/if}
        </div>
        <ChecklistProgress {summary} />
    </div>

    <!-- Messages -->
    {#if error}
        <div class="flex-shrink-0 px-4 pt-3">
            <Alert error={{ message: error }} />
        </div>
    {/if}

    <!-- Scrollable item list -->
    <div class="flex-1 overflow-y-auto px-4 py-3">
        {#if loading}
            <Loading />
        {:else if items.length === 0}
            <div class="flex items-center justify-center py-16 text-gray-400">
                <p>暂无商品</p>
            </div>
        {:else}
            <div class="flex flex-col gap-3 pb-4">
                {#each items as item (item.id)}
                    <ChecklistItemCard {item} {readonly} onchange={handleItemChange} onallocchange={handleAllocChange} />
                {/each}
            </div>
        {/if}
    </div>

    <!-- Fixed bottom toolbar -->
    {#if !loading && items.length > 0}
        <div class="flex-shrink-0">
            <ChecklistToolbar {summary} oncheckall={handleCheckAll} onuncheckall={handleUncheckAll} />
        </div>
    {/if}
</div>

<!-- 包裹详情页 -->
<!--
被依赖：无
-->
<script lang="ts">
	import { logger } from '$lib/logger';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { packageAPI, packageTrackingLegAPI } from '$lib/api';
    import { formatDate, formatNumber, safeParseFloat, getErrorMessage } from '$lib/utils';
    import type { Package, PackageItem, PackageTrackingLeg } from '$lib/shipmentTypes';
	import { Alert, Loading } from '$lib/components';
    import { TrackingLegTimeline } from '$lib/components';
    import { TrackingLegForm } from '$lib/components';

    let pkg = $state<Package | null>(null);
    let loading = $state(true);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleting = $state(false);
    let showLegForm = $state(false);
    let editingLeg = $state<PackageTrackingLeg | null>(null);

    function openLegForm(leg: PackageTrackingLeg | null = null) {
        editingLeg = leg;
        showLegForm = true;
    }

    async function onLegSaved() {
        showLegForm = false;
        editingLeg = null;
        if (pkg) await loadPackage(pkg.id);
    }

    async function deleteLeg(leg: PackageTrackingLeg) {
        if (!confirm(`删除第 ${leg.leg_no} 段物流？`)) return;
        try {
            await packageTrackingLegAPI.delete(leg.id);
            if (pkg) await loadPackage(pkg.id);
        } catch (e) {
            alert(getErrorMessage(e, '删除失败'));
        }
    }

    async function recomputeStatus() {
        if (!pkg) return;
        try {
            const result = await packageAPI.recomputeStatus(pkg.id);
            pkg = {
                ...pkg,
                overall_status: result.overall_status as typeof pkg.overall_status,
                overall_status_display: result.overall_status_display,
                current_leg_no: result.current_leg_no,
            };
        } catch (e) {
            alert(getErrorMessage(e, '重算失败'));
        }
    }

    onMount(async () => {
        const id = page.params.id;
        if (!id) {
            goto('/customer/package');
            return;
        }
        await loadPackage(parseInt(id));
    });

    async function loadPackage(id: number) {
        try {
            loading = true;
            error = '';
            pkg = await packageAPI.get(id);
        } catch (err) {
            error = getErrorMessage(err, '加载包裹详情失败');
            logger.error('Load error:', err);
        } finally {
            loading = false;
        }
    }

    function goBack() {
        goto('/customer/package');
    }

    function goToEdit() {
        goto(`/customer/package/${page.params.id}/edit`);
    }

    function confirmDelete() {
        showDeleteModal = true;
    }

    function cancelDelete() {
        showDeleteModal = false;
    }

    async function executeDelete() {
        if (!pkg) return;
        
        try {
            deleting = true;
            await packageAPI.delete(pkg.id);
            goto('/customer/package');
        } catch (err) {
            error = getErrorMessage(err, '删除失败');
            deleting = false;
            showDeleteModal = false;
        }
    }

    let sealing = $state(false);
    let syncing = $state(false);

    async function toggleSeal() {
        if (!pkg) return;
        try {
            sealing = true;
            error = '';
            if (pkg.status === 'sealed') {
                await packageAPI.unseal(pkg.id);
            } else {
                await packageAPI.seal(pkg.id);
            }
            await loadPackage(pkg.id);
        } catch (err) {
            error = getErrorMessage(err, '操作失败');
        } finally {
            sealing = false;
        }
    }

    async function syncChecklist() {
        if (!pkg) return;
        try {
            syncing = true;
            error = '';
            await packageAPI.syncChecklist(pkg.id);
            await loadPackage(pkg.id);
        } catch (err) {
            error = getErrorMessage(err, '同步失败');
        } finally {
            syncing = false;
        }
    }

    function getLogisticsLabel(status: string): string {
        const map: Record<string, string> = {
            pending: '待揽收',
            collected: '已揽收',
            in_transit: '运输中',
            exception: '异常',
            delivered: '已签收',
            returned: '已退回',
            cancelled: '已作废',
        };
        return map[status] ?? status;
    }

    // 全局键盘事件处理
    $effect(() => {
        if (showDeleteModal) {
            const handler = (e: KeyboardEvent) => {
                if (e.key === 'y' || e.key === 'Y') {
                    e.preventDefault();
                    if (!deleting) executeDelete();
                } else if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    cancelDelete();
                }
            };
            window.addEventListener('keydown', handler);
            return () => window.removeEventListener('keydown', handler);
        }
    });

    // 变体相关
    import type { ItemDetail } from '$lib/shipmentTypes';
    import { 
        isVariantChild, 
        getVariantParentId, 
        getVariantAttributes,
        getVariantParentInfo 
    } from '$lib/utils/variant';
    import { VariantAttributeBadge } from '$lib/components';
	import { LogisticsStatusBadge, PackageStatusBadge, ShipmentStatusBadge } from '$lib/components';
    import ChevronRight from 'lucide-svelte/icons/chevron-right';

    interface PackageItemWithVariant extends PackageItem {
        item_detail?: ItemDetail;
    }

    // 分组类型
    interface GroupedSection {
        type: 'parent' | 'variant' | 'normal';
        item: PackageItemWithVariant;
    }

    // 重新排序和分组包裹明细：母版作为行头，变体子项紧随其后
    function getGroupedSections(items: PackageItemWithVariant[]): GroupedSection[] {
        const result: GroupedSection[] = [];
        const processed = new Set<number>();
        
        // 先找出所有变体子项并按母版分组
        const variantsByParent = new Map<number, PackageItemWithVariant[]>();
        const normalItems: PackageItemWithVariant[] = [];
        
        for (const item of items) {
            if (isVariantChild(item)) {
                const parentId = getVariantParentId(item);
                if (parentId) {
                    if (!variantsByParent.has(parentId)) {
                        variantsByParent.set(parentId, []);
                    }
                    variantsByParent.get(parentId)!.push(item);
                } else {
                    normalItems.push(item);
                }
            } else {
                normalItems.push(item);
            }
        }
        
        // 按原始顺序处理物品
        for (const item of items) {
            if (processed.has(item.id)) continue;
            
            if (isVariantChild(item)) {
                const parentId = getVariantParentId(item);
                if (parentId && variantsByParent.has(parentId)) {
                    const variants = variantsByParent.get(parentId)!;
                    
                    // 插入母版行（使用第一个变体的信息）
                    const firstVariant = variants[0];
                    const parentItemDetail = firstVariant.item_detail;
                    const totalQuantity = variants.reduce((sum, v) => sum + safeParseFloat(v.quantity), 0);
                    result.push({
                        type: 'parent',
                        item: {
                            ...firstVariant,
                            id: parentId,
                            sku: parentItemDetail?.parent_item_sku || '',
                            product_name: parentItemDetail?.parent_item_name || '',
                            quantity: totalQuantity.toString(),
                            order_number: '',
                        } as unknown as PackageItemWithVariant,
                    });
                    
                    // 插入变体子项
                    for (const variant of variants) {
                        result.push({
                            type: 'variant',
                            item: variant,
                        });
                        processed.add(variant.id);
                    }
                }
            } else {
                result.push({ type: 'normal', item });
                processed.add(item.id);
            }
        }
        
        return result;
    }

    // 获取行样式类
    function getRowClass(section: GroupedSection): string {
        if (section.type === 'variant') {
            return 'bg-purple-50/50';
        }
        if (section.type === 'parent') {
            return 'bg-gray-100 font-medium';
        }
        return 'hover:bg-gray-50';
    }

    function getChecklistQtyMap(checklistItems: Package['checklist_items']): Map<number, number | null> {
        const map = new Map<number, number | null>();
        if (!checklistItems) return map;
        for (const cl of checklistItems) {
            if (cl.package_item != null) map.set(cl.package_item, cl.actual_quantity);
        }
        return map;
    }

    function getChecklistAllocQtyMap(checklistItems: Package['checklist_items']): Map<number, number | null> {
        const map = new Map<number, number | null>();
        if (!checklistItems) return map;
        for (const cl of checklistItems) {
            for (const a of cl.allocations ?? []) {
                if (a.package_item_allocation != null) map.set(a.package_item_allocation, a.actual_quantity);
            }
        }
        return map;
    }

    function getItemDetailPath(item: PackageItemWithVariant): string | null {
        if (item.item) {
            return `/item/${item.item}`;
        }
        if (item.item_detail?.parent_item_id) {
            return `/item/${item.item_detail.parent_item_id}`;
        }
        return null;
    }

    function formatCompactNumber(value: string | number | undefined | null, decimals = 3): string {
        const num = safeParseFloat(value, NaN);
        if (Number.isNaN(num)) return '-';
        return formatNumber(num, decimals).replace(/\.0+$|(?<=\.\d*[1-9])0+$/, '');
    }

    function getDisplayWeight(pkg: Package): string {
        const manualWeight = safeParseFloat(pkg.weight, 0);
        return manualWeight > 0 ? `${manualWeight.toFixed(3)} kg` : '-';
    }

    function getDisplayVolume(pkg: Package): string {
        const volume = safeParseFloat(pkg.volume, 0);
        return volume > 0 ? formatCompactNumber(pkg.volume) : '-';
    }

    function getDisplayDimensions(pkg: Package): string {
        return pkg.length && pkg.width && pkg.height
            ? `${pkg.length}×${pkg.width}×${pkg.height} cm`
            : '-';
    }

    let packingListDownloading = $state(false);

    async function downloadPackingList() {
        if (packingListDownloading || !pkg) return;
        packingListDownloading = true;
        try {
            await packageAPI.downloadPackingList(pkg.id, 'en', pkg.package_no);
        } catch (err: unknown) {
            logger.error('装箱单生成失败', err);
            alert('装箱单生成失败，请稍后重试。');
        } finally {
            packingListDownloading = false;
        }
    }
</script>

<svelte:head>
    <title>包裹详情 - {pkg?.package_no || '加载中...'} - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <!-- 顶部头部，与销售订单样式一致 -->
    <div class="mb-4 border-b border-slate-200 pb-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex min-w-0 flex-1 flex-col gap-2">
                <div class="flex items-center gap-3">
                    <button
                        class="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                        onclick={goBack}
                        aria-label="返回"
                    >
                        <span aria-hidden="true" class="mr-1">←</span>返回
                    </button>
                    <h1 class="m-0 text-2xl font-bold text-slate-900">包裹详情</h1>
                </div>
            </div>
            <div class="flex flex-shrink-0 flex-col items-end gap-2">
                <!-- 主要操作按钮 -->
                <div class="flex flex-wrap items-center justify-end gap-2">
                    <button
                        class="inline-flex h-8 items-center rounded-md border px-2 text-xs font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 {pkg?.status === 'sealed' ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'}"
                        onclick={toggleSeal}
                        disabled={sealing}
                    >
                        {#if sealing}
                            <svg class="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        {:else if pkg?.status === 'sealed'}
                            开箱
                        {:else}
                            封箱
                        {/if}
                    </button>
                    {#if pkg?.status !== 'sealed'}
                    <button
                        class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100"
                        onclick={goToEdit}
                    >
                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z" />
                        </svg>
                        编辑
                    </button>
                    {/if}
                    <button
                        class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        onclick={downloadPackingList}
                        disabled={packingListDownloading}
                    >
                        {#if packingListDownloading}
                            <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            生成中...
                        {:else}
                            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 8h6M9 12h6M9 16h4" />
                            </svg>
                            装箱单
                        {/if}
                    </button>
                    {#if pkg?.status !== 'sealed'}
                    <button
                        class="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                        onclick={confirmDelete}
                    >
                        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12M9 7v12m6-12v12M5 7l1-2h12l1 2M9 5h6" />
                        </svg>
                        删除
                    </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    {#if error}
        <Alert error={{ message: error }} />
    {/if}

    {#if loading}
        <Loading />
    {:else if pkg}
        <div class="space-y-6">
            <!-- 基本信息 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold mb-4">基本信息</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <span class="text-gray-500 text-sm">包裹编号</span>
                        <p class="font-medium">{pkg.package_no}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">状态</span>
                        <p>
                            <PackageStatusBadge status={pkg.status} />
                        </p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">序号</span>
                        <p class="font-medium">#{pkg.sequence_no}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">商品种类</span>
                        <p class="font-medium">{pkg.total_items}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">总数量</span>
                        <p class="font-medium">{formatNumber(pkg.total_quantity)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">重量</span>
                        <p class="font-medium">{getDisplayWeight(pkg)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">体积</span>
                        <p class="font-medium">{getDisplayVolume(pkg)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">尺寸</span>
                        <p class="font-medium">{getDisplayDimensions(pkg)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">预估运费</span>
                        <p class="font-medium">{pkg.estimated_shipping_cost ? `¥${formatNumber(pkg.estimated_shipping_cost)}` : '-'}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">运输费用</span>
                        <p class="font-medium">{pkg.shipping_cost ? `¥${formatNumber(pkg.shipping_cost)}` : '-'}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">创建时间</span>
                        <p class="font-medium">{formatDate(pkg.created_at)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">更新时间</span>
                        <p class="font-medium">{formatDate(pkg.updated_at)}</p>
                    </div>
                </div>
                {#if pkg.notes}
                    <div class="mt-4">
                        <span class="text-gray-500 text-sm">备注</span>
                        <p class="mt-1">{pkg.notes}</p>
                    </div>
                {/if}
            </div>

            <!-- 多段物流 -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-lg font-bold">多段物流轨迹</h2>
                        {#if pkg.overall_status_display}
                            <p class="text-sm text-slate-500 mt-1">
                                聚合状态：<span class="font-medium">{pkg.overall_status_display}</span>
                                {#if pkg.current_leg_no}<span class="ml-2 text-xs">(当前第 {pkg.current_leg_no} 段)</span>{/if}
                            </p>
                        {/if}
                    </div>
                    <div class="flex gap-2">
                        <button class="px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
                            onclick={recomputeStatus}>重算状态</button>
                        <button class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            onclick={() => openLegForm(null)}>+ 添加段</button>
                    </div>
                </div>
                <TrackingLegTimeline
                    legs={pkg.tracking_legs ?? []}
                    currentLegNo={pkg.current_leg_no ?? 0}
                />
                {#if (pkg.tracking_legs?.length ?? 0) > 0}
                    <div class="mt-4 flex flex-wrap gap-2">
                        {#each pkg.tracking_legs ?? [] as leg (leg.id)}
                            <div class="flex items-center gap-1 text-xs">
                                <button class="px-2 py-0.5 border rounded hover:bg-slate-50"
                                    onclick={() => openLegForm(leg)}>编辑#{leg.leg_no}</button>
                                <button class="px-2 py-0.5 border rounded text-red-600 hover:bg-red-50"
                                    onclick={() => deleteLeg(leg)}>删除#{leg.leg_no}</button>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- 关联发货单 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold mb-4">关联发货单</h2>
                {#if (pkg.shipments?.length ?? 0) > 0}
                    <div class="space-y-3">
                        {#each (pkg.shipments || []) as shipment}
                            <a
                                href="/customer/shipment/{shipment.id}"
                                class="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all text-gray-900 hover:text-gray-900 no-underline"
                            >
                                <div class="mb-2">
                                    <span class="font-medium text-lg text-gray-900">
                                        {shipment.shipment_no}
                                    </span>
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span class="text-gray-500">状态：</span>
                                        <span class="text-gray-900">
                                            <ShipmentStatusBadge status={shipment.status} />
                                        </span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">客户：</span>
                                        <span class="text-gray-900">{shipment.customer_name || '-'}</span>
                                    </div>
                                </div>
                            </a>
                        {/each}
                    </div>
                {:else}
                    <p class="text-gray-400">未关联发货单</p>
                {/if}
            </div>

            <!-- 包裹明细 -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold">包裹明细</h2>
                    {#if pkg?.status !== 'sealed'}
                    <div class="flex gap-2">
                        <button
                            class="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                            onclick={() => goto(`/customer/package/${pkg?.id}/checklist`)}
                        >
                            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            包装清单
                        </button>
                        {#if (pkg?.checklist_items?.length ?? 0) > 0}
                        <button
                            class="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                            onclick={syncChecklist}
                            disabled={syncing}
                        >
                            {#if syncing}
                                <svg class="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                            {/if}
                            同步清单
                        </button>
                        {/if}
                    </div>
                    {/if}
                </div>
                {#if pkg.items && pkg.items.length > 0}
                    {@const groupedSections = getGroupedSections(pkg.items as PackageItemWithVariant[])}
                    {@const checklistQtyMap = getChecklistQtyMap(pkg.checklist_items)}
                    {@const checklistAllocQtyMap = getChecklistAllocQtyMap(pkg.checklist_items)}
                    <table class="table w-full">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="text-left w-24">SKU</th>
                                <th class="text-left">商品名称</th>
                                <th class="text-left w-48">存储位置</th>
                                <th class="text-right w-16">数量</th>
                                <th class="text-right w-16">分配</th>
                                <th class="text-right w-20">清单</th>
                                <th class="text-right pl-8">关联发货单</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each groupedSections as section}
                                {@const item = section.item}
                                {@const variantAttrs = section.type === 'variant' ? getVariantAttributes(item) : []}
                                {@const allocs = item.allocations && item.allocations.length > 0 ? item.allocations : [{container: null, container_code: null, container_full_path: null, quantity: item.quantity}]}
                                {@const allocCount = allocs.length}
                                {#each allocs as alloc, i}
                                    {@const realAlloc = 'id' in alloc ? alloc : null}
                                    {@const clAllocQty = realAlloc ? checklistAllocQtyMap.get(realAlloc.id) : null}
                                    <tr class={getRowClass(section)}>
                                        {#if i === 0}
                                        <td class="font-mono w-32 {section.type === 'variant' ? 'text-purple-600' : ''}" rowspan={allocCount}>
                                            {#if section.type === 'variant'}
                                                <div class="flex items-center gap-2">
                                                    <ChevronRight class="w-4 h-4 text-purple-400 flex-shrink-0" />
                                                    {#if getItemDetailPath(item)}
                                                        <a href={getItemDetailPath(item)} class="text-blue-600 hover:underline">{item.sku}</a>
                                                    {:else}
                                                        <span>{item.sku}</span>
                                                    {/if}
                                                </div>
                                            {:else}
                                                {#if getItemDetailPath(item)}
                                                    <a href={getItemDetailPath(item)} class="text-blue-600 hover:underline">{item.sku}</a>
                                                {:else}
                                                    {item.sku}
                                                {/if}
                                            {/if}
                                        </td>
                                        <td rowspan={allocCount}>
                                            {#if section.type === 'variant'}
                                                <div class="flex items-center gap-2 pl-4">
                                                    <span>{item.product_name}</span>
                                                    <VariantAttributeBadge attributes={variantAttrs} />
                                                </div>
                                            {:else}
                                                {item.product_name}
                                            {/if}
                                        </td>
                                        {/if}
                                        <td class="text-left text-gray-600">
                                            <div class="text-sm">{alloc.container_full_path || alloc.container_code || '-'}</div>
                                        </td>
                                        {#if i === 0}
                                        <td class="text-right w-20" rowspan={allocCount}>
                                            {formatNumber(item.quantity)}
                                        </td>
                                        {/if}
                                        <td class="text-right w-16 text-sm text-gray-500">
                                            {formatNumber(alloc.quantity)}
                                        </td>
                                        <td class="text-right w-20 text-sm {clAllocQty != null && realAlloc && clAllocQty !== safeParseFloat(String(realAlloc.quantity), 0) ? 'text-orange-600 font-medium' : 'text-gray-500'}">
                                            {clAllocQty != null ? formatNumber(clAllocQty) : '-'}
                                        </td>
                                        {#if i === 0}
                                        <td class="text-sm text-gray-500 pl-8 text-right" rowspan={allocCount}>
                                            {item.shipment_no || '-'}
                                        </td>
                                        {/if}
                                    </tr>
                                {/each}
                            {/each}
                        </tbody>
                    </table>
                {:else}
                    <p class="text-gray-400">暂无明细</p>
                {/if}
            </div>
        </div>
    {:else}
        <p class="text-center text-gray-400 py-8">包裹不存在</p>
    {/if}
</div>

<!-- 删除确认弹窗 -->
{#if showDeleteModal}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" 
         onclick={(e) => { if(e.target === e.currentTarget) cancelDelete(); }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="font-bold text-lg mb-4">确认删除</h3>
            <p class="py-2 text-gray-600">确定要删除包裹 "{pkg?.package_no}" 吗？此操作不可撤销。</p>
            <p class="text-xs text-gray-400 mt-2">按 Y 确认，ESC 或 N 取消</p>
            <div class="flex justify-end gap-3 mt-6">
                <button class="btn btn-ghost" onclick={cancelDelete}>取消 (N)</button>
                <button class="btn btn-error" onclick={executeDelete} disabled={deleting}>
                    {deleting ? '删除中...' : '确认删除 (Y)'}
                </button>
            </div>
        </div>
    </div>
{/if}

{#if showLegForm && pkg}
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div class="px-5 py-3 border-b">
                <h3 class="font-bold text-lg">{editingLeg ? '编辑物流段' : '添加物流段'}</h3>
            </div>
            <div class="p-5">
                <TrackingLegForm
                    packageId={pkg.id}
                    leg={editingLeg}
                    onsaved={onLegSaved}
                    oncancel={() => { showLegForm = false; editingLeg = null; }}
                />
            </div>
        </div>
    </div>
{/if}
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { packageAPI, trackingNumberAPI } from '$lib/api';
    import { formatDate, formatNumber, safeParseFloat } from '$lib/utils';
    import type { Package, PackageItem, TrackingNumberBrief } from '$lib/shipmentTypes';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import PrintPackingList from '$lib/components/shipment/PrintPackingList.svelte';

    let pkg = $state<Package | null>(null);
    let loading = $state(true);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleting = $state(false);

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
        } catch (err: any) {
            error = err.message || '加载包裹详情失败';
            console.error('Load error:', err);
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
        } catch (err: any) {
            error = err.message || '删除失败';
            deleting = false;
            showDeleteModal = false;
        }
    }

    let sealing = $state(false);

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
        } catch (err: any) {
            error = err.message || '操作失败';
        } finally {
            sealing = false;
        }
    }

    // 关联快递单号
    let showTrackingModal = $state(false);
    let trackingModalLoading = $state(false);
    let trackingModalError = $state('');
    let availableTrackingNumbers = $state<TrackingNumberBrief[]>([]);
    let selectedTrackingId = $state<number | null>(null);
    let assigningTracking = $state(false);

    async function openTrackingModal() {
        showTrackingModal = true;
        trackingModalError = '';
        selectedTrackingId = null;
        trackingModalLoading = true;
        try {
            const data = await trackingNumberAPI.listAvailable();
            availableTrackingNumbers = data;
        } catch (err: any) {
            trackingModalError = err.message || '加载快递单号失败';
        } finally {
            trackingModalLoading = false;
        }
    }

    function closeTrackingModal() {
        showTrackingModal = false;
        selectedTrackingId = null;
        trackingModalError = '';
    }

    async function confirmAssignTracking() {
        if (!pkg || selectedTrackingId === null) return;
        try {
            assigningTracking = true;
            trackingModalError = '';
            await packageAPI.assignTracking(pkg.id, selectedTrackingId);
            closeTrackingModal();
            await loadPackage(pkg.id);
        } catch (err: any) {
            trackingModalError = err.message || '关联失败';
        } finally {
            assigningTracking = false;
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
    import VariantAttributeBadge from '$lib/components/VariantAttributeBadge.svelte';
    import LogisticsStatusBadge from '$lib/components/LogisticsStatusBadge.svelte';
    import PackageStatusBadge from '$lib/components/PackageStatusBadge.svelte';
    import ShipmentStatusBadge from '$lib/components/ShipmentStatusBadge.svelte';
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

    function printPackingList() {
        window.print();
    }
</script>

<svelte:head>
    <title>包裹详情 - {pkg?.package_no || '加载中...'} - AnyWarehouse</title>
</svelte:head>

<PrintPackingList {pkg} />

<div class="container mx-auto px-4 py-6 no-print">
    <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
            <button class="btn btn-ghost btn-sm" onclick={goBack} aria-label="返回">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <h1 class="text-2xl font-bold">包裹详情</h1>
        </div>
        <div class="flex gap-2">
            <button
                class="btn {pkg?.status === 'sealed' ? 'btn-warning' : 'btn-success'} btn-outline"
                onclick={toggleSeal}
                disabled={sealing}
            >
                {#if sealing}
                    <span class="loading loading-spinner loading-xs"></span>
                {:else if pkg?.status === 'sealed'}
                    开箱
                {:else}
                    封箱
                {/if}
            </button>
            <button class="btn btn-outline" onclick={goToEdit}>编辑</button>
            <button class="btn btn-secondary btn-outline" onclick={printPackingList}>打印装箱单</button>
            <button class="btn btn-error btn-outline" onclick={confirmDelete}>删除</button>
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

            <!-- 快递信息 -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold">快递信息</h2>
                    {#if pkg.tracking_number_detail}
                        <button
                            class="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                            onclick={openTrackingModal}
                        >更换</button>
                    {:else}
                        <button
                            class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            onclick={openTrackingModal}
                        >关联快递单</button>
                    {/if}
                </div>
                {#if pkg.tracking_number_detail}
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <span class="text-gray-500 text-sm">快递公司</span>
                            <p class="font-medium">{pkg.tracking_number_detail.carrier_name}</p>
                        </div>
                        <div>
                            <span class="text-gray-500 text-sm">快递单号</span>
                            <p class="font-mono font-medium">{pkg.tracking_number_detail.tracking_no}</p>
                        </div>
                        <div>
                            <span class="text-gray-500 text-sm">物流状态</span>
                            <p class="font-medium">
                                <LogisticsStatusBadge status={pkg.tracking_number_detail.logistics_status} />
                            </p>
                        </div>
                    </div>
                {:else}
                    <p class="text-gray-400 text-sm">暂未关联快递单号</p>
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
                <h2 class="text-lg font-bold mb-4">包裹明细</h2>
                {#if pkg.items && pkg.items.length > 0}
                    {@const groupedSections = getGroupedSections(pkg.items as PackageItemWithVariant[])}
                    <table class="table w-full">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="text-left w-32">SKU</th>
                                <th class="text-left">商品名称</th>
                                <th class="text-left w-44">存储位置</th>
                                <th class="text-right w-20">数量</th>
                                <th class="text-right pl-8">关联发货单</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each groupedSections as section}
                                {@const item = section.item}
                                {@const variantAttrs = section.type === 'variant' ? getVariantAttributes(item) : []}
                                <tr class={getRowClass(section)}>
                                    <td class="font-mono w-32 {section.type === 'variant' ? 'text-purple-600' : ''}">
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
                                    <td>
                                        {#if section.type === 'variant'}
                                            <div class="flex items-center gap-2 pl-4">
                                                <span>{item.product_name}</span>
                                                <VariantAttributeBadge attributes={variantAttrs} />
                                            </div>
                                        {:else}
                                            {item.product_name}
                                        {/if}
                                    </td>
                                    <td class="text-left text-gray-600">{item.storage_locations?.join(', ') || '-'}</td>
                                    <td class="text-right w-20">{formatNumber(item.quantity)}</td>
                                    <td class="text-sm text-gray-500 pl-8 text-right">
                                        {item.shipment_no || '-'}
                                    </td>
                                </tr>
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

<!-- 关联快递单号弹窗 -->
{#if showTrackingModal}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
         onclick={(e) => { if (e.target === e.currentTarget) closeTrackingModal(); }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 class="font-bold text-lg">{pkg?.tracking_number_detail ? '更换快递单号' : '关联快递单号'}</h3>
                <button class="text-gray-400 hover:text-gray-600" onclick={closeTrackingModal}>✕</button>
            </div>
            <div class="p-6">
                {#if trackingModalError}
                    <div class="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{trackingModalError}</div>
                {/if}
                {#if trackingModalLoading}
                    <div class="flex justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                {:else if availableTrackingNumbers.length === 0}
                    <p class="text-center text-gray-400 py-6">暂无可用的快递单号</p>
                {:else}
                    <div class="space-y-2 max-h-80 overflow-y-auto">
                        {#each availableTrackingNumbers as tn}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <div
                                class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors {selectedTrackingId === tn.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
                                onclick={() => { selectedTrackingId = tn.id; }}
                                role="option"
                                aria-selected={selectedTrackingId === tn.id}
                                tabindex="0"
                            >
                                <div>
                                    <p class="font-mono font-medium text-sm">{tn.tracking_no}</p>
                                    <p class="text-xs text-gray-500">{tn.carrier_name}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    {#if tn.is_linked}
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-500">已关联包裹</span>
                                    {/if}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                        {getLogisticsLabel(tn.logistics_status)}
                                    </span>
                                    {#if selectedTrackingId === tn.id}
                                        <span class="text-blue-600">✓</span>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
            <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                    class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    onclick={closeTrackingModal}
                >取消</button>
                <button
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onclick={confirmAssignTracking}
                    disabled={selectedTrackingId === null || assigningTracking}
                >
                    {assigningTracking ? '关联中...' : '确认关联'}
                </button>
            </div>
        </div>
    </div>
{/if}

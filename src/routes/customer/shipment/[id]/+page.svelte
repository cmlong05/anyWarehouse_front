<!-- 发货单详情页 -->
<!--
被依赖：无
-->
<script lang="ts">
	import { logger } from '$lib/logger';
    import { page } from '$app/state';
    import { useShipmentDetail, SHIPMENT_ACTIONS } from '$lib/composables/useShipmentDetail.svelte';
    import { formatDate, safeParseFloat, formatNumber } from '$lib/utils';
    import { getCurrencySymbol } from '$lib/utils/formatters';
    import { SHIPMENT_STATUS_CHOICES } from '$lib/shipmentTypes';
    import type { PackageItem, ShipmentItem } from '$lib/shipmentTypes';
    import type { SalesOrder } from '$lib';
    import { salesOrderAPI, shipmentAPI, shipmentItemAPI } from '$lib/api';
    import { getErrorMessage } from '$lib/utils/errors';
	import { ShipmentStatusBadge } from '$lib/components';
	import { Alert, Loading } from '$lib/components';
    import { DeleteConfirmModal, LinkPackageModal } from '$lib/components/shipment';
    import { AddressInfo } from '$lib/components';

    let shipmentId = $derived(parseInt(page.params.id || '0'));
    let skuReferenceDownloading = $state(false);

    // 使用共享逻辑
    const shipmentDetail = useShipmentDetail(() => shipmentId);
    let orderDetail = $state<SalesOrder | null>(null);

    async function loadOrderDetail(orderId: number) {
        try {
            orderDetail = await salesOrderAPI.get(orderId);
        } catch (err) {
            orderDetail = null;
        }
    }

    let lineSyncLoading = $state<Record<number, boolean>>({});
    let lineSyncError = $state<string | null>(null);
    let lineSyncMessage = $state<string | null>(null);
    let rowSyncMessage = $state<string | null>(null);
    let bulkSyncLoading = $state(false);
    let pruneLoading = $state(false);
    let rowPruneLoading = $state<Record<number, boolean>>({});

    type ActionTarget = 'row' | 'batch';

    /**
     * 统一封装发货明细操作：confirm → 重置消息 → 翻转 loading → try/catch/finally → 错误归一化。
     * `target=row` 写入 rowSyncMessage（表底），`batch` 写入 lineSyncMessage（顶部）。
     */
    async function runShipmentAction(opts: {
        confirm?: string;
        target: ActionTarget;
        setLoading: (v: boolean) => void;
        errorFallback: string;
        run: () => Promise<void>;
    }): Promise<void> {
        if (opts.confirm && !confirm(opts.confirm)) return;
        lineSyncError = null;
        if (opts.target === 'row') rowSyncMessage = null;
        else lineSyncMessage = null;
        opts.setLoading(true);
        try {
            await opts.run();
        } catch (err: unknown) {
            lineSyncError = getErrorMessage(err, opts.errorFallback);
        } finally {
            opts.setLoading(false);
        }
    }

    function setRowLoading(map: Record<number, boolean>, id: number, value: boolean) {
        return { ...map, [id]: value };
    }

    function canPruneLine(item: ShipmentItem): boolean {
        const status = shipmentDetail.shipment?.status;
        if (!status || !SYNC_EDITABLE_STATUSES.includes(status)) return false;
        return safeParseFloat(item.quantity_packed || '0') === 0;
    }

    async function pruneShipmentItemRow(item: ShipmentItem) {
        if (rowPruneLoading[item.id]) return;
        const shipmentId = shipmentDetail.shipment?.id;
        if (!shipmentId) return;
        await runShipmentAction({
            confirm: `确认剔除未打包明细：SKU ${item.sku}？`,
            target: 'row',
            errorFallback: '剔除失败，请重试',
            setLoading: v => (rowPruneLoading = setRowLoading(rowPruneLoading, item.id, v)),
            run: async () => {
                const resp = await shipmentAPI.pruneUnpacked(shipmentId, [item.id]);
                shipmentDetail.removeShipmentItems(resp.removed_ids);
                rowSyncMessage = resp.message || `已剔除 SKU ${item.sku}`;
            },
        });
    }

    function hasSyncableLine(): boolean {
        const items = shipmentDetail.shipment?.items;
        if (!items?.length) return false;
        return items.some(canSyncLine);
    }

    function hasUnpackedLine(): boolean {
        const status = shipmentDetail.shipment?.status;
        if (!status || !SYNC_EDITABLE_STATUSES.includes(status)) return false;
        const items = shipmentDetail.shipment?.items;
        if (!items?.length) return false;
        return items.some(it => safeParseFloat(it.quantity_packed || '0') === 0);
    }

    async function syncAllShipmentItems() {
        if (bulkSyncLoading || !shipmentDetail.shipment) return;
        const shipmentId = shipmentDetail.shipment.id;
        await runShipmentAction({
            confirm: '按已封箱包裹同步所有发货明细的计划数量？',
            target: 'batch',
            errorFallback: '同步失败，请重试',
            setLoading: v => (bulkSyncLoading = v),
            run: async () => {
                const resp = await shipmentAPI.syncItems(shipmentId);
                for (const it of resp.items) shipmentDetail.updateShipmentItem(it);
                lineSyncMessage = resp.message || `已同步 ${resp.items.length} 条发货明细`;
            },
        });
    }

    async function pruneUnpackedItems() {
        if (pruneLoading || !shipmentDetail.shipment) return;
        const shipmentId = shipmentDetail.shipment.id;
        const targets = (shipmentDetail.shipment.items || []).filter(
            it => safeParseFloat(it.quantity_packed || '0') === 0,
        );
        if (!targets.length) return;
        const skuList = targets.map(it => it.sku).join('、');
        await runShipmentAction({
            confirm: `将剔除以下未打包的发货明细行（共 ${targets.length} 条）：\n${skuList}\n\n确认继续？`,
            target: 'batch',
            errorFallback: '剔除失败，请重试',
            setLoading: v => (pruneLoading = v),
            run: async () => {
                const resp = await shipmentAPI.pruneUnpacked(shipmentId);
                shipmentDetail.removeShipmentItems(resp.removed_ids);
                lineSyncMessage = resp.message || `已剔除 ${resp.removed_ids.length} 条未打包的发货明细`;
            },
        });
    }

    async function downloadSkuReference() {
        if (skuReferenceDownloading || !shipmentDetail.shipment) return;
        skuReferenceDownloading = true;
        try {
            await shipmentAPI.downloadSkuReference(shipmentDetail.shipment.id, 'zh-CN', shipmentDetail.shipment.shipment_no);
        } catch (err: unknown) {
            logger.error('SKU 对照表生成失败', err);
            alert('SKU 对照表生成失败，请稍后重试。');
        } finally {
            skuReferenceDownloading = false;
        }
    }

    const SYNC_EDITABLE_STATUSES = ['draft', 'confirmed', 'packed', 'synced', 'shipped'];

    function canSyncLine(item: ShipmentItem): boolean {
        const status = shipmentDetail.shipment?.status;
        if (!status || !SYNC_EDITABLE_STATUSES.includes(status)) return false;
        const packed = safeParseFloat(item.quantity_packed || '0');
        const planned = safeParseFloat(item.quantity);
        // 只有在实际打包 > 0 且与计划不一致时才能同步。
        // packed === 0 的行请用“编辑数量”或“删除行”，避免误操作清零。
        return packed > 0 && packed !== planned;
    }

    async function syncShipmentItemRow(item: ShipmentItem) {
        if (lineSyncLoading[item.id]) return;
        await runShipmentAction({
            target: 'row',
            errorFallback: '同步失败，请重试',
            setLoading: v => (lineSyncLoading = setRowLoading(lineSyncLoading, item.id, v)),
            run: async () => {
                const updated = await shipmentItemAPI.sync(item.id);
                shipmentDetail.updateShipmentItem(updated);
                rowSyncMessage = `SKU ${item.sku} 已同步`;
            },
        });
    }

    // 监听ID变化加载数据
    $effect(() => {
        if (shipmentId && !isNaN(shipmentId)) {
            shipmentDetail.loadShipment();
        }
    });

    $effect(() => {
        if (shipmentDetail.shipment?.order) {
            loadOrderDetail(shipmentDetail.shipment.order);
        } else {
            orderDetail = null;
        }
    });

    function getStatusText(status: string) {
        return SHIPMENT_STATUS_CHOICES.find(s => s.value === status)?.label || status;
    }

    // 获取货币符号

    // 按钮变体样式
    function getButtonClass(variant: string): string {
        const base = 'inline-flex h-8 items-center rounded-md border px-2 text-xs font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50';
        switch (variant) {
            case 'error':
                return `${base} border-red-300 bg-red-50 text-red-700 hover:bg-red-100`;
            default:
                return `${base} border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100`;
        }
    }

    // 获取可用的操作按钮
    function getAvailableActions() {
        const status = shipmentDetail.shipment?.status;
        if (!status) return [];
        
        // 创建数组副本，避免修改原配置
        // 同步操作已移至「发货计划明细」区块，顶部不再展示
        const actions = [...(SHIPMENT_ACTIONS[status] || [])].filter(a => a.action !== 'sync');

    // 非草稿状态添加取消按钮（除已发货、已完成和已取消外）
    if (status !== 'draft' && status !== 'shipped' && status !== 'delivered' && status !== 'cancelled') {
        actions.push({ action: 'cancel', label: '取消', variant: 'error', confirmMessage: '确认要取消此发货单？' });
    }

    const pkgCount = shipmentDetail.shipment?.packages?.length || 0;
    if (pkgCount === 0) {
        // 无包裹时不展示“发货”操作按钮
        return actions.filter(a => a.action !== 'ship');
    }

    return actions;
}

    // 执行操作前确认
    async function handleAction(action: string, confirmMessage: string) {
        if (!confirm(confirmMessage)) return;
        await shipmentDetail.executeAction(action);
    }

    // 打印发货单
    function printShipment() {
        window.print();
    }

    // 变体相关
    import { isVariantChild, getVariantParentId, getVariantAttributes } from '$lib/utils/variant';
    import SortableHeader from '$lib/components/ui/SortableHeader.svelte';
    import { toggleSortKey } from '$lib/utils/sort';
    import { VariantAttributeBadge } from '$lib/components';

    // 按母版分组物品
    interface GroupedSection {
        type: 'parent' | 'variant' | 'normal';
        item: ShipmentItem;
    }

    function getGroupedSections(items: ShipmentItem[]): GroupedSection[] {
        const result: GroupedSection[] = [];
        const processed = new Set<number>();
        
        // 先找出所有变体子项并按母版分组
        const variantsByParent = new Map<number, ShipmentItem[]>();
        
        for (const item of items) {
            if (isVariantChild(item)) {
                const parentId = getVariantParentId(item);
                if (parentId) {
                    if (!variantsByParent.has(parentId)) {
                        variantsByParent.set(parentId, []);
                    }
                    variantsByParent.get(parentId)!.push(item);
                }
            }
        }
        
        // 按原始顺序处理物品
        for (const item of items) {
            if (processed.has(item.id)) continue;
            
            if (isVariantChild(item)) {
                const parentId = getVariantParentId(item);
                if (parentId && variantsByParent.has(parentId)) {
                    const variants = variantsByParent.get(parentId)!;
                    
                    // 插入母版行
                    const firstVariant = variants[0];
                    result.push({
                        type: 'parent',
                        item: {
                            ...firstVariant,
                            id: -parentId, // 负数ID避免冲突
                            sku: firstVariant.item_detail?.parent_item_sku || '',
                            product_name: firstVariant.item_detail?.parent_item_name || '',
                            quantity: variants.reduce((sum, v) => sum + safeParseFloat(v.quantity), 0).toString(),
                            quantity_packed: variants.reduce((sum, v) => sum + safeParseFloat(v.quantity_packed ?? 0), 0).toString(),
                        } as ShipmentItem,
                    });
                    
                    // 插入变体子项
                    for (const variant of variants) {
                        result.push({ type: 'variant', item: variant });
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

    function getCurrentStock(section: GroupedSection): number | null {
        if (section.type === 'parent') {
            const parentId = Math.abs(section.item.id);
            const variants = shipmentDetail.shipment?.items?.filter(
                (item) => getVariantParentId(item) === parentId
            ) || [];

            return variants.reduce(
                (sum, item) => sum + (item.item_detail?.total_storage || 0),
                0
            );
        }

        return section.item.item_detail?.total_storage ?? null;
    }

    function isStockInsufficient(currentStock: number | null, pending: number): boolean {
        if (currentStock === null) return false;
        return pending > 0 && currentStock < pending;
    }

    type PlanSortKey = 'sku' | 'product_name' | 'currentStock' | 'quantity' | 'quantity_packed' | 'pending';
    let planSortKey = $state<PlanSortKey>('sku');
    let planSortDir = $state<'asc' | 'desc'>('asc');

    function togglePlanSort(key: PlanSortKey) {
        const next = toggleSortKey(planSortKey, planSortDir, key);
        planSortKey = next.sortKey as PlanSortKey;
        planSortDir = next.sortDirection;
    }

    const sortedSections = $derived.by(() => {
        const items = shipmentDetail.shipment?.items;
        if (!items) return [];
        const sorted = [...items].sort((a, b) => {
            let va: number | string;
            let vb: number | string;
            if (planSortKey === 'currentStock') {
                va = a.item_detail?.total_storage ?? -1;
                vb = b.item_detail?.total_storage ?? -1;
            } else if (planSortKey === 'quantity') {
                va = safeParseFloat(a.quantity);
                vb = safeParseFloat(b.quantity);
            } else if (planSortKey === 'quantity_packed') {
                va = safeParseFloat(a.quantity_packed || 0);
                vb = safeParseFloat(b.quantity_packed || 0);
            } else if (planSortKey === 'pending') {
                va = safeParseFloat(a.quantity) - safeParseFloat(a.quantity_packed || 0);
                vb = safeParseFloat(b.quantity) - safeParseFloat(b.quantity_packed || 0);
            } else {
                va = String((a as unknown as Record<string, unknown>)[planSortKey] ?? '');
                vb = String((b as unknown as Record<string, unknown>)[planSortKey] ?? '');
            }
            if (typeof va === 'number' && typeof vb === 'number') {
                return planSortDir === 'asc' ? va - vb : vb - va;
            }
            return String(va).localeCompare(String(vb), 'zh-CN', { numeric: true, sensitivity: 'base' }) * (planSortDir === 'asc' ? 1 : -1);
        });
        return getGroupedSections(sorted);
    });
</script>

<svelte:head>
    <title>发货详情 - {shipmentDetail.shipment?.shipment_no || '加载中...'} - AnyWarehouse</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
    <div class="max-w-5xl mx-auto mb-4 border-b border-slate-200 pb-4 print:hidden">
        <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex min-w-0 flex-1 flex-col gap-2">
                <div class="flex items-center gap-3">
                    <button
                        type="button"
                        class="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                        onclick={shipmentDetail.goBack}
                    >
                        ← 返回列表
                    </button>
                    <h1 class="m-0 text-2xl font-bold text-slate-900">发货详情</h1>
                </div>
            </div>
            <div class="flex flex-shrink-0 flex-col items-end gap-2">
                <div class="flex flex-wrap items-center justify-end gap-2">
                    {#if shipmentDetail.shipment}
                        {#each getAvailableActions() as act}
                            <button
                                type="button"
                                class={getButtonClass(act.variant)}
                                onclick={() => handleAction(act.action, act.confirmMessage)}
                                disabled={shipmentDetail.actionLoading}
                                title={act.confirmMessage}
                            >
                                {act.label}
                            </button>
                        {/each}
                        <button
                            type="button"
                            class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100"
                            onclick={shipmentDetail.goToEdit}
                        >
                            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            编辑
                        </button>
                        <button
                            type="button"
                            class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100"
                            onclick={printShipment}
                        >
                            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2m2 4H9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z" />
                            </svg>
                            打印
                        </button>
                        <button
                            type="button"
                            class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            onclick={downloadSkuReference}
                            disabled={skuReferenceDownloading}
                        >
                            {#if skuReferenceDownloading}
                                <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                生成中...
                            {:else}
                                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18v13H3z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7l2-4h14l2 4" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h8M8 16h5" />
                                </svg>
                                SKU表
                            {/if}
                        </button>
                        {#if ['draft', 'cancelled'].includes(shipmentDetail.shipment.status)}
                            <button
                                type="button"
                                class="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                                onclick={() => shipmentDetail.showDeleteModal = true}
                            >
                                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12M9 7v12m6-12v12M5 7l1-2h12l1 2M9 5h6" />
                                </svg>
                                删除
                            </button>
                        {/if}
                    {/if}
                </div>
            </div>
        </div>
    </div>

    {#if shipmentDetail.error}
        <Alert error={{ message: shipmentDetail.error }} />
    {/if}

    {#if shipmentDetail.loading}
        <div class="max-w-5xl mx-auto">
            <Loading />
        </div>
    {:else if shipmentDetail.shipment}
        {@const shipment = shipmentDetail.shipment}
        
        <!-- 发货单文档 -->
        <div class="max-w-5xl mx-auto space-y-6 print:max-w-full print:m-0">
            <!-- 基本信息 -->
            <div class="bg-white rounded-lg shadow print:shadow-none print:border print:border-gray-200 p-6">
                <h2 class="text-lg font-bold text-gray-900 mb-4">基本信息</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <span class="text-gray-500 text-sm block">发货批次号</span>
                        <p class="font-medium text-gray-900">{shipment.shipment_no}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm block">状态</span>
                        <p class="mt-1 flex items-center gap-2">
                            <ShipmentStatusBadge status={shipment.status} />
                            {#if shipment.is_synced}
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">已同步</span>
                            {/if}
                        </p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm block">创建时间</span>
                        <p class="font-medium text-gray-900">{formatDate(shipment.created_at)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm block">更新时间</span>
                        <p class="font-medium text-gray-900">{formatDate(shipment.updated_at)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm block">客户</span>
                        <a 
                            href="/customer/{shipment.order_detail?.customer_id}" 
                            class="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            {shipment.order_detail?.customer_name || '-'}
                        </a>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm block">实际运费</span>
                        <p class="font-medium text-gray-900">
                            {shipment.shipping_cost != null && shipment.shipping_cost !== ''
                                ? `${getCurrencySymbol(shipment.order_detail?.currency)}${formatNumber(shipment.shipping_cost, 2)}`
                                : '-'}
                        </p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm block">预估重量</span>
                        <p class="font-medium text-gray-900">
                            {shipment.estimated_weight != null && shipment.estimated_weight !== ''
                                ? `${formatNumber(shipment.estimated_weight, 3)} kg`
                                : '-'}
                        </p>
                    </div>
                </div>
                {#if shipment.notes}
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <span class="text-gray-500 text-sm block">备注</span>
                        <p class="mt-1 text-gray-700">{shipment.notes}</p>
                    </div>
                {/if}
            </div>

            <!-- 关联订单 -->
            <div class="bg-white rounded-lg shadow print:shadow-none print:border print:border-gray-200 p-6">
                <h2 class="text-lg font-bold text-gray-900 mb-4">关联订单</h2>
                {#if shipment.order}
                    <a 
                        href="/customer/sales-order/{shipment.order}" 
                        class="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all"
                    >
                        <div class="mb-2">
                            <span class="font-medium text-lg text-gray-900">
                                {shipment.order_detail?.order_number}
                            </span>
                        </div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><span class="text-gray-500">总金额：</span><span class="text-gray-900">{getCurrencySymbol(shipment.order_detail?.currency)}{shipment.order_detail?.total_amount}</span></div>
                        </div>
                        <div class="mt-4">
                            <AddressInfo
                                title="📤 收货信息"
                                contactPerson={orderDetail?.contact_person ?? shipment.order_detail?.contact_person}
                                contactPhone={orderDetail?.contact_phone ?? shipment.order_detail?.contact_phone}
                                companyName={orderDetail?.company_name}
                                paymentTerms={orderDetail?.payment_terms}
                                shippingAddress={orderDetail?.shipping_address ?? shipment.order_detail?.shipping_address}
                            />
                        </div>
                    </a>
                {:else}
                    <p class="text-gray-400">未关联订单</p>
                {/if}
            </div>

            <!-- 发货计划明细 -->
            <div class="bg-white rounded-lg shadow print:shadow-none print:border print:border-gray-200 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold text-gray-900">发货计划明细</h2>
                    <div class="flex items-center gap-2">
                        {#if hasUnpackedLine()}
                            <button
                                type="button"
                                class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
                                onclick={pruneUnpackedItems}
                                disabled={pruneLoading}
                                title="删除所有未打包（quantity_packed = 0）的发货明细行"
                            >
                                {#if pruneLoading}
                                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    剔除中...
                                {:else}
                                    🧹 剔除未打包行
                                {/if}
                            </button>
                        {/if}
                        {#if hasSyncableLine()}
                            <button
                                type="button"
                                class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
                                onclick={syncAllShipmentItems}
                                disabled={bulkSyncLoading}
                                title="按已封箱包裹同步所有发货明细的计划数量"
                            >
                                {#if bulkSyncLoading}
                                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    同步中...
                                {:else}
                                    🔄 一键同步
                                {/if}
                            </button>
                        {/if}
                    </div>
                </div>
                {#if lineSyncError}
                    <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {lineSyncError}</div>
                {/if}
                {#if lineSyncMessage}
                    <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">✅ {lineSyncMessage}</div>
                {/if}
                {#if shipment.items?.length}
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm border-collapse">
                            <thead>
                                <tr class="bg-gray-50">
                                    <SortableHeader title="SKU" columnKey="sku" sortable sortKey={planSortKey} sortDirection={planSortDir} onSort={(k) => togglePlanSort(k as PlanSortKey)} />
                                    <SortableHeader title="商品名称" columnKey="product_name" sortable sortKey={planSortKey} sortDirection={planSortDir} onSort={(k) => togglePlanSort(k as PlanSortKey)} />
                                    <SortableHeader title="现有库存" columnKey="currentStock" sortable sortKey={planSortKey} sortDirection={planSortDir} onSort={(k) => togglePlanSort(k as PlanSortKey)} align="right" width="6rem" />
                                    <SortableHeader title="计划数量" columnKey="quantity" sortable sortKey={planSortKey} sortDirection={planSortDir} onSort={(k) => togglePlanSort(k as PlanSortKey)} align="right" width="6rem" />
                                    <SortableHeader title="已打包" columnKey="quantity_packed" sortable sortKey={planSortKey} sortDirection={planSortDir} onSort={(k) => togglePlanSort(k as PlanSortKey)} align="right" width="6rem" />
                                    <SortableHeader title="待打包" columnKey="pending" sortable sortKey={planSortKey} sortDirection={planSortDir} onSort={(k) => togglePlanSort(k as PlanSortKey)} align="right" width="6rem" />
                                    <th class="p-3 text-center font-semibold text-gray-700 w-20">状态</th>
                                    <th class="p-3 text-center font-semibold text-gray-700 w-24">操作</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                {#each sortedSections as section}
                                    {@const item = section.item}
                                    {@const qty = safeParseFloat(item.quantity)}
                                    {@const packed = safeParseFloat(item.quantity_packed || 0)}
                                    {@const pending = qty - packed}
                                    {@const currentStock = getCurrentStock(section)}
                                    {@const stockInsufficient = isStockInsufficient(currentStock, pending)}
                                    {@const variantAttrs = section.type === 'variant' ? getVariantAttributes(item) : []}
                                    <tr class="{section.type === 'variant' ? 'bg-purple-50/50' : section.type === 'parent' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'} transition-colors">
                                        <td class="px-3 py-2.5 font-mono text-xs {section.type === 'variant' ? 'text-purple-600' : 'text-gray-600'}">
                                            {#if section.type === 'variant'}
                                                <div class="flex items-center gap-2 pl-4">
                                                    <span>{item.sku}</span>
                                                </div>
                                            {:else}
                                                {item.sku}
                                            {/if}
                                        </td>
                                        <td class="px-3 py-2.5 text-gray-900">
                                            {#if section.type === 'variant'}
                                                <div class="flex flex-col gap-1 pl-4">
                                                    <div class="flex items-center gap-2">
                                                        <span>{item.product_name}</span>
                                                        <VariantAttributeBadge attributes={variantAttrs} />
                                                    </div>
                                                </div>
                                            {:else}
                                                {item.product_name}
                                            {/if}
                                        </td>
                                        <td class="px-3 py-2.5 text-right {stockInsufficient ? 'text-red-600 font-semibold' : currentStock !== null && currentStock > 0 ? 'text-blue-700 font-medium' : 'text-gray-400'}">
                                            {#if currentStock !== null}
                                                {formatNumber(currentStock)}
                                            {:else}
                                                -
                                            {/if}
                                        </td>
                                        <td class="px-3 py-2.5 text-right font-medium text-gray-900">{formatNumber(qty)}</td>
                                        <td class="px-3 py-2.5 text-right {packed > 0 ? 'text-green-600' : 'text-gray-400'}">
                                            {formatNumber(packed)}
                                        </td>
                                        <td class="px-3 py-2.5 text-right {pending > 0 ? 'text-red-600' : 'text-gray-400'}">
                                            {formatNumber(pending)}
                                        </td>
                                        <td class="px-3 py-2.5 text-center">
                                            {#if pending < 0}
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">超额打包</span>
                                            {:else if pending === 0}
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">已打包</span>
                                            {:else if packed > 0}
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">部分打包</span>
                                            {:else}
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">待打包</span>
                                            {/if}
                                        </td>
                                        <td class="px-3 py-2.5 text-center">
                                            {#if section.type !== 'parent' && canSyncLine(item)}
                                                <button
                                                    type="button"
                                                    class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onclick={() => syncShipmentItemRow(item)}
                                                    disabled={lineSyncLoading[item.id]}
                                                    title="按已封箱包裹数量同步此行计划数量"
                                                >
                                                    {#if lineSyncLoading[item.id]}
                                                        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                        </svg>
                                                    {:else}
                                                        🔄 同步
                                                    {/if}
                                                </button>
                                            {:else if section.type !== 'parent' && canPruneLine(item)}
                                                <button
                                                    type="button"
                                                    class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onclick={() => pruneShipmentItemRow(item)}
                                                    disabled={rowPruneLoading[item.id]}
                                                    title="剔除此未打包明细行"
                                                >
                                                    {#if rowPruneLoading[item.id]}
                                                        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                        </svg>
                                                    {:else}
                                                        🧹 剔除
                                                    {/if}
                                                </button>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-4 flex gap-4 text-sm text-gray-600">
                        <span>总计: <strong class="text-gray-900">{shipment.items.length}</strong> 种商品</span>
                        <span>总数量: <strong class="text-gray-900">{formatNumber(shipment.items.reduce((sum, i) => sum + safeParseFloat(i.quantity), 0))}</strong></span>
                    </div>
                    {#if rowSyncMessage}
                        <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">✅ {rowSyncMessage}</div>
                    {/if}
                {:else}
                    <p class="text-gray-400">暂无发货计划明细</p>
                {/if}
            </div>

            <!-- 包裹列表 -->
            <div class="bg-white rounded-lg shadow print:shadow-none print:border print:border-gray-200 p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold text-gray-900">包裹列表</h2>
                    <div class="flex gap-2 print:hidden">
                        <button 
                            class="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            onclick={() => shipmentDetail.openLinkPackageModal()}
                        >
                            关联已有包裹
                        </button>
                        <button 
                            class="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            onclick={() => window.location.href = `/customer/package/add?shipment_id=${shipmentDetail.shipment?.id || ''}`}
                        >
                            新建包裹
                        </button>
                    </div>
                </div>
                
                {#if shipment.packages?.length}
                    <div class="space-y-4">
                        {#each shipment.packages as pkg}
                            <a 
                                href="/customer/package/{pkg.id}" 
                                class="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all"
                            >
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium text-gray-900">{pkg.package_no}</span>
                                        <span class="text-gray-400 text-sm">序号 #{pkg.sequence_no}</span>
                                        {#if pkg.status === 'sealed'}
                                            <span class="text-gray-500">已封箱</span>
                                        {:else}
                                            <span class="text-red-500">待装箱</span>
                                        {/if}
                                    </div>
                                    {#if pkg.final_tracking_no}
                                        <div class="text-right">
                                            <span class="text-sm text-gray-500">{pkg.final_carrier_name}</span>
                                            <p class="font-mono text-sm text-gray-900">{pkg.final_tracking_no}</p>
                                        </div>
                                    {/if}
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div><span class="text-gray-500">重量：</span><span class="text-gray-900">{pkg.weight ? parseFloat(pkg.weight).toFixed(3) : '-'} kg</span></div>
                                    <div><span class="text-gray-500">体积：</span>
                                        <span class="text-gray-900">{pkg.length !== null && pkg.width !== null && pkg.height !== null 
                                            ? `${pkg.length}×${pkg.width}×${pkg.height} cm` : '-'}</span>
                                    </div>
                                    <div><span class="text-gray-500">商品种类：</span><span class="text-gray-900">{pkg.items?.length || 0}</span></div>
                                    <div><span class="text-gray-500">总数量：</span>
                                        <span class="text-gray-900">{formatNumber(pkg.items?.reduce((sum: number, i: PackageItem) => sum + safeParseFloat(i.quantity, 0), 0) || 0)}</span>
                                    </div>
                                </div>
                            </a>
                        {/each}
                    </div>
                {:else}
                    <p class="text-gray-400">暂无包裹</p>
                {/if}
            </div>
        </div>
    {:else}
        <p class="text-center text-gray-400 py-8">发货批次不存在</p>
    {/if}
</div>

<!-- 删除确认弹窗 -->
<DeleteConfirmModal
    show={shipmentDetail.showDeleteModal}
    title="确认删除"
    itemName={shipmentDetail.shipment?.shipment_no || ''}
    deleting={shipmentDetail.deleting}
    onCancel={() => shipmentDetail.showDeleteModal = false}
    onConfirm={shipmentDetail.deleteShipment}
/>

<!-- 关联包裹弹窗 -->
<LinkPackageModal
    show={shipmentDetail.showLinkPackageModal}
    packages={shipmentDetail.availablePackages}
    selectedId={shipmentDetail.selectedPackageId}
    linking={shipmentDetail.linkingPackage}
    onClose={() => { shipmentDetail.showLinkPackageModal = false; shipmentDetail.selectedPackageId = null; }}
    onLink={shipmentDetail.linkPackage}
    onSelect={(id) => shipmentDetail.selectedPackageId = id}
/>

<style>
    /* 隐藏浏览器打印的页眉页脚 */
    @page {
        margin: 0;
    }
    
    @media print {
        /* 隐藏导航栏 */
        :global(nav),
        :global(.sticky) {
            display: none !important;
        }
        
        /* 页面边距 */
        :global(body) {
            margin: 1cm;
        }
        
        /* 链接样式 */
        :global(a) {
            text-decoration: none !important;
            color: inherit !important;
        }
    }
</style>
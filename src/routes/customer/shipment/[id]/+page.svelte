<script lang="ts">
    import { page } from '$app/state';
    import { useShipmentDetail, SHIPMENT_ACTIONS } from '$lib/composables/useShipmentDetail.svelte';
    import { formatDate, safeParseFloat } from '$lib/utils';
    import { SHIPMENT_STATUS_CHOICES } from '$lib/shipmentTypes';
    import type { PackageItem } from '$lib/shipmentTypes';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { DeleteConfirmModal, LinkPackageModal, NewPackageModal } from '$lib/components/shipment';

    // 获取发货单ID
    let shipmentId = $derived(parseInt(page.params.id || '0'));

    // 使用共享逻辑
    const shipmentDetail = useShipmentDetail(() => shipmentId);

    // 监听ID变化加载数据
    $effect(() => {
        if (shipmentId && !isNaN(shipmentId)) {
            shipmentDetail.loadShipment();
        }
    });

    function getStatusText(status: string) {
        return SHIPMENT_STATUS_CHOICES.find(s => s.value === status)?.label || status;
    }

    function getStatusBadgeClass(status: string): string {
        const classes: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-600',
            confirmed: 'bg-blue-100 text-blue-700',
            packed: 'bg-yellow-100 text-yellow-700',
            shipped: 'bg-green-100 text-green-700',
            delivered: 'bg-indigo-100 text-indigo-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return classes[status] || 'bg-gray-100 text-gray-600';
    }

    // 按钮变体样式
    function getButtonClass(variant: string): string {
        const base = 'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed';
        switch (variant) {
            case 'primary':
                return `${base} bg-blue-600 text-white hover:bg-blue-700`;
            case 'outline':
                return `${base} bg-white border border-gray-300 text-gray-700 hover:bg-gray-50`;
            case 'error':
                return `${base} bg-red-600 text-white hover:bg-red-700`;
            default:
                return `${base} bg-gray-100 text-gray-700 hover:bg-gray-200`;
        }
    }

    // 获取可用的操作按钮
    function getAvailableActions() {
        const status = shipmentDetail.shipment?.status;
        if (!status) return [];
        
        // 创建数组副本，避免修改原配置
        const actions = [...(SHIPMENT_ACTIONS[status] || [])];
        
        // 非草稿状态添加取消按钮（除已完成和已取消外）
        if (status !== 'draft' && status !== 'delivered' && status !== 'cancelled') {
            actions.push({ action: 'cancel', label: '取消', variant: 'error', confirmMessage: '确认要取消此发货单？' });
        }
        
        return actions;
    }

    // 执行操作前确认
    async function handleAction(action: string, confirmMessage: string) {
        if (!confirm(confirmMessage)) return;
        await shipmentDetail.executeAction(action);
    }

    // 变体相关辅助函数
    import type { ShipmentItem, ItemDetail } from '$lib/shipmentTypes';

    function isVariantChild(item: ShipmentItem): boolean {
        const val = item.item_detail?.is_variant as boolean | string | number | undefined;
        if (val === true) return true;
        if (typeof val === 'string' && (val as string).toLowerCase() === 'true') return true;
        if (val === 1 || val === '1') return true;
        return false;
    }

    function getVariantParentId(item: ShipmentItem): number | null {
        return item.item_detail?.parent_item_id || null;
    }

    function getVariantAttributesDisplay(item: ShipmentItem): string {
        const attrs = item.item_detail?.variant_attributes;
        if (!attrs || attrs.length === 0) return '';
        return attrs.map(av => av.value).join(' / ');
    }

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
                            quantity_packed: variants.reduce((sum, v) => sum + safeParseFloat(v.quantity_packed), 0).toString(),
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
</script>

<svelte:head>
    <title>发货详情 - {shipmentDetail.shipment?.shipment_no || '加载中...'} - AnyWarehouse</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-6">
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
            <button 
                class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" 
                aria-label="返回" 
                onclick={shipmentDetail.goBack}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <h1 class="text-2xl font-bold text-gray-900">发货详情</h1>
        </div>
        
        {#if shipmentDetail.shipment}
            <div class="flex gap-2 flex-wrap">
                {#each getAvailableActions() as { action, label, variant, confirmMessage }}
                    <button 
                        class={getButtonClass(variant)}
                        onclick={() => handleAction(action, confirmMessage)}
                        disabled={shipmentDetail.actionLoading}
                    >
                        {label}
                    </button>
                {/each}
                
                {#if shipmentDetail.shipment.status === 'draft' || shipmentDetail.shipment.status === 'confirmed'}
                    <button 
                        class="flex items-center p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        onclick={shipmentDetail.goToEdit}
                        aria-label="编辑"
                        title="编辑"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                {/if}
                {#if ['draft', 'cancelled'].includes(shipmentDetail.shipment.status)}
                    <button 
                        class="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-all duration-200"
                        onclick={() => shipmentDetail.showDeleteModal = true}
                    >
                        删除
                    </button>
                {/if}
            </div>
        {/if}
    </div>

    {#if shipmentDetail.error}
        <Alert error={{ message: shipmentDetail.error }} />
    {/if}

    {#if shipmentDetail.loading}
        <Loading />
    {:else if shipmentDetail.shipment}
        {@const shipment = shipmentDetail.shipment}
        
        <div class="space-y-6">
            <!-- 基本信息 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold text-gray-900 mb-4">基本信息</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <span class="text-gray-500 text-sm block">发货批次号</span>
                        <p class="font-medium text-gray-900">{shipment.shipment_no}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm block">状态</span>
                        <p class="mt-1">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusBadgeClass(shipment.status)}">
                                {getStatusText(shipment.status)}
                            </span>
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
                </div>
                {#if shipment.notes}
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <span class="text-gray-500 text-sm block">备注</span>
                        <p class="mt-1 text-gray-700">{shipment.notes}</p>
                    </div>
                {/if}
            </div>

            <!-- 关联订单 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold text-gray-900 mb-4">关联订单</h2>
                {#if shipment.order}
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium text-lg text-gray-900">{shipment.order_detail?.order_number}</span>
                            <a 
                                href="/customer/sales-order/{shipment.order}" 
                                class="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                查看订单
                            </a>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><span class="text-gray-500">客户：</span><span class="text-gray-900">{shipment.order_detail?.customer_name}</span></div>
                            <div><span class="text-gray-500">总金额：</span><span class="text-gray-900">¥{shipment.order_detail?.total_amount}</span></div>
                            <div><span class="text-gray-500">收货人：</span><span class="text-gray-900">{shipment.order_detail?.contact_person || '-'}</span></div>
                            <div><span class="text-gray-500">电话：</span><span class="text-gray-900">{shipment.order_detail?.contact_phone || '-'}</span></div>
                        </div>
                        {#if shipment.order_detail?.shipping_address}
                            <div class="mt-2 text-sm">
                                <span class="text-gray-500">收货地址：</span><span class="text-gray-900">{shipment.order_detail.shipping_address}</span>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <p class="text-gray-400">未关联订单</p>
                {/if}
            </div>

            <!-- 发货计划明细 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold text-gray-900 mb-4">发货计划明细</h2>
                {#if shipment.items?.length}
                    {@const sections = getGroupedSections(shipment.items)}
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm border-collapse">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="text-left px-3 py-2.5 font-medium text-gray-700">SKU</th>
                                    <th class="text-left px-3 py-2.5 font-medium text-gray-700">商品名称</th>
                                    <th class="text-right px-3 py-2.5 font-medium text-gray-700 w-24">计划数量</th>
                                    <th class="text-right px-3 py-2.5 font-medium text-gray-700 w-24">已打包</th>
                                    <th class="text-right px-3 py-2.5 font-medium text-gray-700 w-24">待打包</th>
                                    <th class="text-center px-3 py-2.5 font-medium text-gray-700 w-20">状态</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                {#each sections as section}
                                    {@const item = section.item}
                                    {@const qty = safeParseFloat(item.quantity)}
                                    {@const packed = safeParseFloat(item.quantity_packed, 0)}
                                    {@const pending = qty - packed}
                                    {@const variantAttrs = section.type === 'variant' ? getVariantAttributesDisplay(item) : ''}
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
                                                        {#if variantAttrs}
                                                            <span class="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{variantAttrs}</span>
                                                        {/if}
                                                    </div>
                                                </div>
                                            {:else}
                                                {item.product_name}
                                            {/if}
                                        </td>
                                        <td class="px-3 py-2.5 text-right font-medium text-gray-900">{qty.toFixed(0)}</td>
                                        <td class="px-3 py-2.5 text-right text-green-600">{packed.toFixed(0)}</td>
                                        <td class="px-3 py-2.5 text-right {pending > 0 ? 'text-red-600' : 'text-gray-400'}">
                                            {pending.toFixed(0)}
                                        </td>
                                        <td class="px-3 py-2.5 text-center">
                                            {#if pending === 0}
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">已打包</span>
                                            {:else if packed > 0}
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">部分打包</span>
                                            {:else}
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">待打包</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-4 flex gap-4 text-sm text-gray-600">
                        <span>总计: <strong class="text-gray-900">{shipment.items.length}</strong> 种商品</span>
                        <span>总数量: <strong class="text-gray-900">{shipment.items.reduce((sum, i) => sum + parseFloat(i.quantity), 0).toFixed(0)}</strong></span>
                    </div>
                {:else}
                    <p class="text-gray-400">暂无发货计划明细</p>
                {/if}
            </div>

            <!-- 包裹列表 -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold text-gray-900">包裹列表</h2>
                    <div class="flex gap-2">
                        <button 
                            class="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            onclick={() => shipmentDetail.openLinkPackageModal()}
                        >
                            关联已有包裹
                        </button>
                        <button 
                            class="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            onclick={() => shipmentDetail.openNewPackageModal()}
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
                                    </div>
                                    {#if pkg.tracking_number_detail}
                                        <div class="text-right">
                                            <span class="text-sm text-gray-500">{pkg.tracking_number_detail.carrier_name}</span>
                                            <p class="font-mono text-sm text-gray-900">{pkg.tracking_number_detail.tracking_no}</p>
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
                                        <span class="text-gray-900">{(pkg.items?.reduce((sum: number, i: PackageItem) => sum + safeParseFloat(i.quantity, 0), 0) || 0).toFixed(0)}</span>
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

<!-- 新建包裹弹窗 -->
<NewPackageModal
    show={shipmentDetail.showNewPackageModal}
    shipmentId={shipmentDetail.shipment?.id || 0}
    onClose={() => shipmentDetail.showNewPackageModal = false}
    onSuccess={() => {
        shipmentDetail.showNewPackageModal = false;
        shipmentDetail.loadShipment();
    }}
/>

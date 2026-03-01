<script lang="ts">
    import { page } from '$app/stores';
    import { useShipmentDetail, SHIPMENT_ACTIONS } from '$lib/composables/useShipmentDetail.svelte';
    import { formatDate, safeParseFloat } from '$lib/utils';
    import { SHIPMENT_STATUS_CHOICES } from '$lib/shipmentTypes';
    import type { PackageItem } from '$lib/shipmentTypes';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { DeleteConfirmModal, LinkPackageModal, NewPackageModal } from '$lib/components/shipment';

    // 获取发货单ID
    let shipmentId = $derived(parseInt($page.params.id));

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

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'draft': return 'badge-ghost';
            case 'confirmed': return 'badge-info';
            case 'packed': return 'badge-warning';
            case 'shipped': return 'badge-success';
            case 'delivered': return 'badge-primary';
            case 'cancelled': return 'badge-error';
            default: return '';
        }
    }

    // 获取可用的操作按钮
    function getAvailableActions() {
        const status = shipmentDetail.shipment?.status;
        if (!status) return [];
        
        // 创建数组副本，避免修改原配置
        const actions = [...(SHIPMENT_ACTIONS[status] || [])];
        
        // 添加取消按钮（除已完成和已取消外）
        if (status !== 'delivered' && status !== 'cancelled') {
            actions.push({ action: 'cancel', label: '取消', variant: 'error', confirmMessage: '确认要取消此发货单？' });
        }
        
        return actions;
    }

    // 执行操作前确认
    async function handleAction(action: string, confirmMessage: string) {
        if (!confirm(confirmMessage)) return;
        await shipmentDetail.executeAction(action);
    }
</script>

<svelte:head>
    <title>发货详情 - {shipmentDetail.shipment?.shipment_no || '加载中...'} - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
            <button class="btn btn-ghost btn-sm" aria-label="返回" onclick={shipmentDetail.goBack}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <h1 class="text-2xl font-bold">发货详情</h1>
        </div>
        
        {#if shipmentDetail.shipment}
            <div class="flex gap-2 flex-wrap">
                {#each getAvailableActions() as { action, label, variant, confirmMessage }}
                    <button class="btn btn-{variant}" 
                            onclick={() => handleAction(action, confirmMessage)}
                            disabled={shipmentDetail.actionLoading}>
                        {label}
                    </button>
                {/each}
                
                {#if shipmentDetail.shipment.status === 'draft' || shipmentDetail.shipment.status === 'confirmed'}
                    <button class="btn btn-outline" onclick={shipmentDetail.goToEdit}>编辑</button>
                {/if}
                {#if shipmentDetail.shipment.status !== 'delivered'}
                    <button class="btn btn-error btn-outline" 
                            onclick={() => shipmentDetail.showDeleteModal = true}>删除</button>
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
                <h2 class="text-lg font-bold mb-4">基本信息</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <span class="text-gray-500 text-sm">发货批次号</span>
                        <p class="font-medium">{shipment.shipment_no}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">状态</span>
                        <p><span class="badge {getStatusBadgeClass(shipment.status)}">{getStatusText(shipment.status)}</span></p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">创建时间</span>
                        <p class="font-medium">{formatDate(shipment.created_at)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">更新时间</span>
                        <p class="font-medium">{formatDate(shipment.updated_at)}</p>
                    </div>
                </div>
                {#if shipment.notes}
                    <div class="mt-4">
                        <span class="text-gray-500 text-sm">备注</span>
                        <p class="mt-1">{shipment.notes}</p>
                    </div>
                {/if}
            </div>

            <!-- 关联订单 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold mb-4">关联订单</h2>
                {#if shipment.order}
                    <div class="border rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium text-lg">{shipment.order_detail?.order_number}</span>
                            <a href="/customer/sales-order/{shipment.order}" class="btn btn-sm btn-outline">查看订单</a>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><span class="text-gray-500">客户：</span><span>{shipment.order_detail?.customer_name}</span></div>
                            <div><span class="text-gray-500">总金额：</span><span>¥{shipment.order_detail?.total_amount}</span></div>
                            <div><span class="text-gray-500">收货人：</span><span>{shipment.order_detail?.contact_person || '-'}</span></div>
                            <div><span class="text-gray-500">电话：</span><span>{shipment.order_detail?.contact_phone || '-'}</span></div>
                        </div>
                        {#if shipment.order_detail?.shipping_address}
                            <div class="mt-2 text-sm">
                                <span class="text-gray-500">收货地址：</span><span>{shipment.order_detail.shipping_address}</span>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <p class="text-gray-400">未关联订单</p>
                {/if}
            </div>

            <!-- 发货计划明细 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold mb-4">发货计划明细</h2>
                {#if shipment.items?.length}
                    <div class="overflow-x-auto">
                        <table class="table w-full text-sm">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="text-left px-3 py-2">SKU</th>
                                    <th class="text-left px-3 py-2">商品名称</th>
                                    <th class="text-right px-3 py-2 w-24">计划数量</th>
                                    <th class="text-right px-3 py-2 w-24">已打包</th>
                                    <th class="text-right px-3 py-2 w-24">待打包</th>
                                    <th class="text-center px-3 py-2 w-20">状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each shipment.items as item}
                                    {@const qty = safeParseFloat(item.quantity)}
                                    {@const packed = safeParseFloat(item.quantity_packed, 0)}
                                    {@const pending = qty - packed}
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-3 py-2 font-mono text-xs">{item.sku}</td>
                                        <td class="px-3 py-2">{item.product_name}</td>
                                        <td class="px-3 py-2 text-right font-medium">{qty.toFixed(0)}</td>
                                        <td class="px-3 py-2 text-right text-success">{packed.toFixed(0)}</td>
                                        <td class="px-3 py-2 text-right" class:text-error={pending > 0} class:text-gray-400={pending === 0}>
                                            {pending.toFixed(0)}
                                        </td>
                                        <td class="px-3 py-2 text-center">
                                            {#if pending === 0}
                                                <span class="badge badge-success badge-sm">已打包</span>
                                            {:else if packed > 0}
                                                <span class="badge badge-warning badge-sm">部分打包</span>
                                            {:else}
                                                <span class="badge badge-ghost badge-sm">待打包</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-4 flex gap-4 text-sm text-gray-600">
                        <span>总计: <strong>{shipment.items.length}</strong> 种商品</span>
                        <span>总数量: <strong>{shipment.items.reduce((sum, i) => sum + parseFloat(i.quantity), 0).toFixed(0)}</strong></span>
                    </div>
                {:else}
                    <p class="text-gray-400">暂无发货计划明细</p>
                {/if}
            </div>

            <!-- 包裹列表 -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold">包裹列表</h2>
                    <div class="flex gap-2">
                        <button class="btn btn-outline btn-sm" onclick={() => shipmentDetail.openLinkPackageModal()}>
                            关联已有包裹
                        </button>
                        <button class="btn btn-primary btn-sm" onclick={() => shipmentDetail.openNewPackageModal()}>
                            新建包裹
                        </button>
                    </div>
                </div>
                
                {#if shipment.packages?.length}
                    <div class="space-y-4">
                        {#each shipment.packages as pkg}
                            <a href="/customer/package/{pkg.id}" class="block border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium">{pkg.package_no}</span>
                                        <span class="text-gray-400 text-sm">序号 #{pkg.sequence_no}</span>
                                    </div>
                                    {#if pkg.tracking_number_detail}
                                        <div class="text-right">
                                            <span class="text-sm text-gray-500">{pkg.tracking_number_detail.carrier_name}</span>
                                            <p class="font-mono">{pkg.tracking_number_detail.tracking_no}</p>
                                        </div>
                                    {/if}
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                    <div><span class="text-gray-500">重量：</span><span>{pkg.weight ? parseFloat(pkg.weight).toFixed(3) : '-'} kg</span></div>
                                    <div><span class="text-gray-500">体积：</span>
                                        <span>{pkg.length !== null && pkg.width !== null && pkg.height !== null 
                                            ? `${pkg.length}×${pkg.width}×${pkg.height} cm` : '-'}</span>
                                    </div>
                                    <div><span class="text-gray-500">商品种类：</span><span>{pkg.items?.length || 0}</span></div>
                                    <div><span class="text-gray-500">总数量：</span>
                                        <span>{(pkg.items?.reduce((sum: number, i: PackageItem) => sum + safeParseFloat(i.quantity, 0), 0) || 0).toFixed(0)}</span>
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

<style>
    .container { max-width: 1200px; margin: 0 auto; }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-ghost { background: transparent; color: #6b7280; }
    .btn-ghost:hover:not(:disabled) { background: #f3f4f6; }
    .btn-outline { background: white; border: 1px solid #d1d5db; color: #374151; }
    .btn-outline:hover:not(:disabled) { background: #f9fafb; }
    .btn-primary { background: #1976d2; color: white; }
    .btn-primary:hover:not(:disabled) { background: #1565c0; }
    .btn-error { background: #dc3545; color: white; }
    .btn-error:hover:not(:disabled) { background: #c82333; }
    
    .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .badge-ghost { background: #f3f4f6; color: #6b7280; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-primary { background: #c7d2fe; color: #3730a3; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 0.5rem; text-align: left; }
    .bg-gray-50 { background: #f9fafb; }
    .hover\:bg-gray-50:hover { background: #f9fafb; }
    
    .text-success { color: #16a34a; }
    .text-error { color: #dc2626; }
    .text-gray-400 { color: #9ca3af; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    
    @media (max-width: 768px) {
        .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
    }
</style>

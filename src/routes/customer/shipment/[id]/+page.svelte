<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { shipmentAPI, packageAPI, trackingNumberAPI } from '$lib/shipmentApi';
    import { formatDate, safeParseFloat } from '$lib/utils';
    import type { Shipment, PackageItem, ShipmentItem, Package, TrackingNumberBrief } from '$lib/shipmentTypes';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { SHIPMENT_STATUS_CHOICES } from '$lib/shipmentTypes';

    let shipment = $state<Shipment | null>(null);
    let loading = $state(true);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleting = $state(false);
    let actionLoading = $state(false);
    
    // 包裹管理相关状态
    let showNewPackageModal = $state(false);
    let showLinkPackageModal = $state(false);
    let availablePackages = $state<Package[]>([]);
    let availableTrackingNumbers = $state<TrackingNumberBrief[]>([]);
    let linkingPackage = $state(false);
    let creatingPackage = $state(false);
    let selectedPackageId = $state<number | null>(null);
    
    // 新建包裹表单
    let newPackageForm = $state({
        packageNo: '',
        weight: null as number | null,
        length: null as number | null,
        width: null as number | null,
        height: null as number | null,
        trackingNumberId: null as number | null,
        notes: ''
    });
    
    // 按发货明细生成包裹内容
    let generateFromItems = $state(true);
    let selectedShipmentItems = $state<{item: ShipmentItem; quantity: number; selected: boolean}[]>([]);
    
    // 初始化发货明细选择
    function initShipmentItemsSelection() {
        if (!shipment?.items) {
            selectedShipmentItems = [];
            return;
        }
        selectedShipmentItems = shipment.items
            .filter(item => {
                const qty = safeParseFloat(item.quantity);
                const packed = safeParseFloat(item.quantity_packed, 0);
                return qty > packed; // 只显示有待打包数量的明细
            })
            .map(item => {
                const qty = safeParseFloat(item.quantity);
                const packed = safeParseFloat(item.quantity_packed, 0);
                const pending = qty - packed;
                return {
                    item,
                    quantity: 0, // 默认不选中，用户输入数量后自动加入
                    selected: true // 保留兼容性，实际根据 quantity > 0 判断
                };
            });
    }
    
    // 计算选中的总数量（根据 quantity > 0 判断）
    function getSelectedTotalQuantity(): number {
        return selectedShipmentItems
            .filter(s => s.quantity > 0)
            .reduce((sum, s) => sum + s.quantity, 0);
    }
    
    // 计算选中的商品种类数（根据 quantity > 0 判断）
    function getSelectedItemCount(): number {
        return selectedShipmentItems.filter(s => s.quantity > 0).length;
    }

    // 监听参数变化并加载数据
    $effect(() => {
        const id = parseInt($page.params.id);
        if (id && !isNaN(id)) {
            loadShipment(id);
        }
    });

    async function loadShipment(id: number) {
        try {
            loading = true;
            error = '';
            shipment = await shipmentAPI.get(id);
        } catch (err: any) {
            error = err.message || '加载发货批次失败';
            console.error('Load error:', err);
        } finally {
            loading = false;
        }
    }

    function goBack() {
        goto('/customer/shipment');
    }

    function goToEdit() {
        const id = parseInt($page.params.id);
        goto(`/customer/shipment/${id}/edit`);
    }

    // 执行状态操作
    async function doAction(action: string) {
        if (!shipment) return;
        
        const confirmMessages: Record<string, string> = {
            confirm: '确认要确认此发货单吗？确认后不可修改明细。',
            pack: '确认已打包完成？',
            ship: '确认要发货吗？',
            deliver: '确认已签收？',
            cancel: '确认要取消此发货单？',
            sync: '确认要同步发货明细到包裹吗？',
        };
        
        if (!confirm(confirmMessages[action] || '确认执行此操作？')) {
            return;
        }
        
        actionLoading = true;
        error = '';
        
        try {
            const id = shipment.id;
            switch (action) {
                case 'confirm':
                    await shipmentAPI.confirm(id);
                    break;
                case 'pack':
                    await shipmentAPI.pack(id);
                    break;
                case 'ship':
                    await shipmentAPI.ship(id);
                    break;
                case 'deliver':
                    await shipmentAPI.deliver(id);
                    break;
                case 'cancel':
                    await shipmentAPI.cancel(id);
                    break;
                case 'sync':
                    await shipmentAPI.syncItems(id);
                    break;
            }
            await loadShipment(id);
        } catch (err: any) {
            error = err.message || '操作失败';
            console.error('Action error:', err);
        } finally {
            actionLoading = false;
        }
    }

    function goToPackageDetail(packageId: number) {
        goto(`/customer/package/${packageId}`);
    }

    // 加载可用的包裹（未关联当前发货单的）
    async function loadAvailablePackages() {
        try {
            const response = await packageAPI.getList({ page_size: 100 });
            // 过滤掉已关联的包裹
            const linkedIds = new Set(shipment?.packages?.map(p => p.id) || []);
            availablePackages = response.results.filter(p => !linkedIds.has(p.id));
        } catch (err: any) {
            error = err.message || '加载可用包裹失败';
        }
    }

    // 加载可用的快递单号
    async function loadTrackingNumbers() {
        try {
            const response = await trackingNumberAPI.listAvailable();
            availableTrackingNumbers = response;
        } catch (err: any) {
            console.error('加载快递单号失败:', err);
        }
    }

    // 关联已有包裹到发货单
    async function linkPackageToShipment() {
        if (!selectedPackageId || !shipment) return;
        
        linkingPackage = true;
        error = '';
        
        try {
            await packageAPI.addToShipment(selectedPackageId, shipment.id);
            await loadShipment(shipment.id);
            showLinkPackageModal = false;
            selectedPackageId = null;
        } catch (err: any) {
            error = err.message || '关联包裹失败';
        } finally {
            linkingPackage = false;
        }
    }

    // 生成包裹编号
    function generatePackageNo(): string {
        if (!shipment) return '';
        const seq = (shipment.packages?.length || 0) + 1;
        return `${shipment.shipment_no}-PKG${seq.toString().padStart(3, '0')}`;
    }

    // 新建包裹并关联到发货单
    async function createAndLinkPackage() {
        if (!shipment) return;
        
        if (!newPackageForm.packageNo.trim()) {
            error = '请输入包裹编号';
            return;
        }
        
        creatingPackage = true;
        error = '';
        
        try {
            // 构建包裹明细
            let packageItems: { shipment_item: number; quantity: number; notes: string }[] = [];
            if (generateFromItems) {
                packageItems = selectedShipmentItems
                    .filter(s => s.quantity > 0)
                    .map(s => ({
                        shipment_item: s.item.id,
                        quantity: s.quantity,
                        notes: ''
                    }));
            }
            
            await packageAPI.create({
                package_no: newPackageForm.packageNo,
                sequence_no: (shipment.packages?.length || 0) + 1,
                weight: newPackageForm.weight || undefined,
                length: newPackageForm.length || undefined,
                width: newPackageForm.width || undefined,
                height: newPackageForm.height || undefined,
                tracking_number: newPackageForm.trackingNumberId || undefined,
                notes: newPackageForm.notes,
                items: packageItems,
                shipment_id: shipment.id  // 创建时即关联到当前发货单
            });
            
            await loadShipment(shipment.id);
            showNewPackageModal = false;
            
            // 重置表单
            newPackageForm = {
                packageNo: '',
                weight: null,
                length: null,
                width: null,
                height: null,
                trackingNumberId: null,
                notes: ''
            };
            generateFromItems = true; // 重置后默认选中
            selectedShipmentItems = [];
        } catch (err: any) {
            error = err.message || '创建包裹失败';
        } finally {
            creatingPackage = false;
        }
    }

    // 打开关联包裹弹窗时加载数据
    $effect(() => {
        if (showLinkPackageModal) {
            loadAvailablePackages();
        }
    });

    // 打开新建包裹弹窗时加载快递单号并生成编号
    $effect(() => {
        if (showNewPackageModal) {
            loadTrackingNumbers();
            newPackageForm.packageNo = generatePackageNo();
            generateFromItems = true; // 默认选中从发货明细生成
            initShipmentItemsSelection();
        }
    });

    function confirmDelete() {
        showDeleteModal = true;
    }

    function cancelDelete() {
        showDeleteModal = false;
    }

    async function executeDelete() {
        if (!shipment) return;
        
        try {
            deleting = true;
            await shipmentAPI.delete(shipment.id);
            goto('/customer/shipment');
        } catch (err: any) {
            error = err.message || '删除失败';
            deleting = false;
            showDeleteModal = false;
        }
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

    function getStatusText(status: string) {
        return SHIPMENT_STATUS_CHOICES.find(s => s.value === status)?.label || status;
    }

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'draft': return 'badge-ghost';
            case 'ready': return 'badge-info';
            case 'shipped': return 'badge-success';
            case 'delivered': return 'badge-primary';
            case 'cancelled': return 'badge-error';
            default: return '';
        }
    }
</script>

<svelte:head>
    <title>发货详情 - {shipment?.shipment_no || '加载中...'} - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
            <button class="btn btn-ghost btn-sm" aria-label="返回" onclick={goBack}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <h1 class="text-2xl font-bold">发货详情</h1>
        </div>
        {#if shipment}
            <div class="flex gap-2 flex-wrap">
                <!-- 状态操作按钮 -->
                {#if shipment.status === 'draft'}
                    <button class="btn btn-primary" onclick={() => doAction('confirm')} disabled={actionLoading}>
                        确认发货单
                    </button>
                    <button class="btn btn-outline" onclick={() => doAction('sync')} disabled={actionLoading}>
                        同步明细
                    </button>
                {/if}
                {#if shipment.status === 'confirmed'}
                    <button class="btn btn-primary" onclick={() => doAction('pack')} disabled={actionLoading}>
                        打包完成
                    </button>
                    <button class="btn btn-outline" onclick={() => doAction('ship')} disabled={actionLoading}>
                        直接发货
                    </button>
                {/if}
                {#if shipment.status === 'packed'}
                    <button class="btn btn-primary" onclick={() => doAction('ship')} disabled={actionLoading}>
                        确认发货
                    </button>
                {/if}
                {#if shipment.status === 'shipped'}
                    <button class="btn btn-primary" onclick={() => doAction('deliver')} disabled={actionLoading}>
                        确认签收
                    </button>
                {/if}
                {#if shipment.status !== 'delivered' && shipment.status !== 'cancelled'}
                    <button class="btn btn-error btn-outline" onclick={() => doAction('cancel')} disabled={actionLoading}>
                        取消
                    </button>
                {/if}
                <!-- 编辑和删除 -->
                {#if shipment.status === 'draft' || shipment.status === 'confirmed'}
                    <button class="btn btn-outline" onclick={goToEdit}>编辑</button>
                {/if}
                {#if shipment.status !== 'delivered'}
                    <button class="btn btn-error btn-outline" onclick={confirmDelete}>删除</button>
                {/if}
            </div>
        {/if}
    </div>

    {#if error}
        <Alert error={{ message: error }} />
    {/if}

    {#if loading}
        <Loading />
    {:else if shipment}
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
                            <div>
                                <span class="text-gray-500">客户：</span>
                                <span>{shipment.order_detail?.customer_name}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">总金额：</span>
                                <span>¥{shipment.order_detail?.total_amount}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">收货人：</span>
                                <span>{shipment.order_detail?.contact_person || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">电话：</span>
                                <span>{shipment.order_detail?.contact_phone || '-'}</span>
                            </div>
                        </div>
                        {#if shipment.order_detail?.shipping_address}
                            <div class="mt-2 text-sm">
                                <span class="text-gray-500">收货地址：</span>
                                <span>{shipment.order_detail.shipping_address}</span>
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
                {#if shipment.items && shipment.items.length > 0}
                    <div class="overflow-x-auto">
                        <table class="table w-full text-sm" style="border-collapse: collapse;">
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
                        <button class="btn btn-outline rounded-lg shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap flex items-center gap-1.5" onclick={() => showLinkPackageModal = true}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span>关联已有包裹</span>
                        </button>
                        <button class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap flex items-center gap-1.5" onclick={() => showNewPackageModal = true}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>新建包裹</span>
                        </button>
                    </div>
                </div>
                {#if shipment.packages && shipment.packages.length > 0}
                    <div class="space-y-4">
                        {#each shipment.packages as pkg}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <div class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onclick={() => goToPackageDetail(pkg.id)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goToPackageDetail(pkg.id); }} role="link" tabindex="0">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium">{pkg.package_no}</span>
                                        <span class="text-gray-400 text-sm">序号 #{pkg.sequence_no}</span>
                                        <a href="/customer/package/{pkg.id}" class="btn btn-xs btn-ghost" onclick={(e) => { e.stopPropagation(); }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            查看详情
                                        </a>
                                    </div>
                                    {#if pkg.tracking_number_detail}
                                        <div class="text-right">
                                            <span class="text-sm text-gray-500">{pkg.tracking_number_detail.carrier_name}</span>
                                            <p class="font-mono">{pkg.tracking_number_detail.tracking_no}</p>
                                        </div>
                                    {/if}
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                    <div>
                                        <span class="text-gray-500">重量：</span>
                                        <span>{pkg.weight ? parseFloat(pkg.weight).toFixed(3) : '-'} kg</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">体积：</span>
                                        <span>
                                            {pkg.length !== null && pkg.width !== null && pkg.height !== null 
                                                ? `${pkg.length}×${pkg.width}×${pkg.height} cm` 
                                                : '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">商品种类：</span>
                                        <span>{pkg.items?.length || 0}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">总数量：</span>
                                        <span>{(pkg.items?.reduce((sum: number, i: PackageItem) => sum + safeParseFloat(i.quantity, 0), 0) || 0).toFixed(0)}</span>
                                    </div>
                                </div>
                                {#if pkg.items && pkg.items.length > 0}
                                    <div class="bg-gray-50 rounded p-2">
                                        <table class="table w-full text-sm" style="border-collapse: collapse;">
                                            <thead>
                                                <tr class="text-gray-500">
                                                    <th class="text-left">SKU</th>
                                                    <th class="text-left">商品名称</th>
                                                    <th class="text-right">数量</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {#each pkg.items as item}
                                                    <tr>
                                                        <td class="font-mono">{item.sku}</td>
                                                        <td>{item.product_name}</td>
                                                        <td class="text-right">{(parseFloat(item.quantity as string) || 0).toFixed(0)}</td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                {/if}
                            </div>
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
            <p class="py-2 text-gray-600">确定要删除发货单 "{shipment?.shipment_no}" 吗？此操作不可撤销。</p>
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


<!-- 新建包裹弹窗 -->
{#if showNewPackageModal}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" 
         onclick={(e) => { if(e.target === e.currentTarget) showNewPackageModal = false; }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 class="font-bold text-lg mb-4">新建包裹</h3>
            <p class="text-sm text-gray-500 mb-4">包裹将自动关联到当前发货单</p>
            
            <div class="space-y-4">
                <!-- 基本信息 -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label" for="package-no">
                            <span class="label-text">包裹编号 <span class="text-error">*</span></span>
                        </label>
                        <input 
                            id="package-no"
                            type="text" 
                            class="input input-bordered"
                            bind:value={newPackageForm.packageNo}
                            placeholder="输入包裹编号"
                        />
                    </div>
                    <div class="form-control">
                        <label class="label" for="tracking-number">
                            <span class="label-text">快递单号</span>
                        </label>
                        <select id="tracking-number" class="select select-bordered" bind:value={newPackageForm.trackingNumberId}>
                            <option value={null}>暂不关联</option>
                            {#each availableTrackingNumbers as tn}
                                <option value={tn.id}>{tn.tracking_no} ({tn.carrier_name})</option>
                            {/each}
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-4 gap-4">
                    <div class="form-control">
                        <label class="label" for="package-weight">
                            <span class="label-text">重量 (kg)</span>
                        </label>
                        <input 
                            id="package-weight"
                            type="number" 
                            step="0.001"
                            class="input input-bordered"
                            bind:value={newPackageForm.weight}
                            placeholder="重量"
                        />
                    </div>
                    <div class="form-control">
                        <label class="label" for="package-length">
                            <span class="label-text">长 (cm)</span>
                        </label>
                        <input 
                            id="package-length"
                            type="number" 
                            step="0.01"
                            class="input input-bordered"
                            bind:value={newPackageForm.length}
                            placeholder="长"
                        />
                    </div>
                    <div class="form-control">
                        <label class="label" for="package-width">
                            <span class="label-text">宽 (cm)</span>
                        </label>
                        <input 
                            id="package-width"
                            type="number" 
                            step="0.01"
                            class="input input-bordered"
                            bind:value={newPackageForm.width}
                            placeholder="宽"
                        />
                    </div>
                    <div class="form-control">
                        <label class="label" for="package-height">
                            <span class="label-text">高 (cm)</span>
                        </label>
                        <input 
                            id="package-height"
                            type="number" 
                            step="0.01"
                            class="input input-bordered"
                            bind:value={newPackageForm.height}
                            placeholder="高"
                        />
                    </div>
                </div>
                
                <div class="form-control">
                    <label class="label" for="package-notes">
                        <span class="label-text">备注</span>
                    </label>
                    <textarea 
                        id="package-notes"
                        class="textarea textarea-bordered"
                        bind:value={newPackageForm.notes}
                        placeholder="输入备注"
                        rows="2"
                    ></textarea>
                </div>
                
                <!-- 按发货明细生成包裹内容 -->
                {#if selectedShipmentItems.length > 0}
                    <div class="border-t pt-4 mt-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                class="checkbox checkbox-primary" 
                                bind:checked={generateFromItems}
                            />
                            <span class="font-medium">按发货明细生成包裹内容</span>
                            <span class="text-xs text-gray-500">(从发货计划中选取商品打包)</span>
                        </label>
                        
                        {#if generateFromItems}
                            <div class="mt-4 bg-gray-50 rounded-lg p-4">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm font-medium text-gray-700">选择要打包的商品：</span>
                                        <button 
                                            type="button"
                                            class="btn btn-xs btn-ghost text-primary"
                                            onclick={() => {
                                                selectedShipmentItems = selectedShipmentItems.map(s => {
                                                    const itemMaxQty = safeParseFloat(s.item.quantity) - safeParseFloat(s.item.quantity_packed, 0);
                                                    return { ...s, quantity: itemMaxQty };
                                                });
                                            }}
                                        >
                                            全部填充
                                        </button>
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        已选 <span class="font-bold text-primary">{getSelectedItemCount()}</span> 种，
                                        共 <span class="font-bold text-primary">{getSelectedTotalQuantity()}</span> 件
                                    </div>
                                </div>
                                
                                <div class="overflow-x-auto max-h-64 overflow-y-auto">
                                    <table class="table w-full text-sm" style="border-collapse: collapse;">
                                        <thead>
                                            <tr class="bg-gray-100">
                                                <th class="text-left">SKU</th>
                                                <th class="text-left">商品名称</th>
                                                <th class="text-right w-20">计划数</th>
                                                <th class="text-right w-20">已打包</th>
                                                <th class="text-right w-20">待打包</th>
                                                <th class="text-center w-24">本次打包</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each selectedShipmentItems as selection, idx}
                                                {@const maxQty = safeParseFloat(selection.item.quantity) - safeParseFloat(selection.item.quantity_packed, 0)}
                                                <tr class="hover:bg-white">
                                                    <td class="font-mono text-xs">{selection.item.sku}</td>
                                                    <td>{selection.item.product_name}</td>
                                                    <td class="text-right">{safeParseFloat(selection.item.quantity).toFixed(0)}</td>
                                                    <td class="text-right text-success">{safeParseFloat(selection.item.quantity_packed, 0).toFixed(0)}</td>
                                                    <td class="text-right">
                                                        <span 
                                                            class="font-medium hover:underline cursor-pointer"
                                                            onclick={() => { selection.quantity = maxQty; }}
                                                            title="点击填充该商品的待打包数量"
                                                            role="button"
                                                            tabindex="0"
                                                            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selection.quantity = maxQty; }}}
                                                        >
                                                            {maxQty.toFixed(0)}
                                                        </span>
                                                    </td>
                                                    <td class="text-center">
                                                        <div class="flex items-center justify-center gap-1">
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                max={maxQty}
                                                                step="1"
                                                                class="input input-bordered input-xs w-20 text-center"
                                                                bind:value={selection.quantity}
                                                            />
                                                            {#if selection.quantity > 0}
                                                                <span 
                                                                    class="text-gray-400 hover:text-error cursor-pointer"
                                                                    onclick={() => { selection.quantity = 0; }}
                                                                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selection.quantity = 0; }}}
                                                                    title="清空"
                                                                    role="button"
                                                                    tabindex="0"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </span>
                                                            {/if}
                                                        </div>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        {/if}
                    </div>
                {:else if shipment?.items && shipment.items.length > 0}
                    <div class="border-t pt-4 mt-4">
                        <div class="alert alert-info alert-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>所有商品已打包完成，您可以创建空包裹或先到发货明细中调整数量。</span>
                        </div>
                    </div>
                {:else}
                    <div class="border-t pt-4 mt-4">
                        <div class="alert alert-warning alert-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <span>当前发货单没有发货明细，将创建空包裹。您可以后续在包裹详情中添加内容。</span>
                        </div>
                    </div>
                {/if}
            </div>
            
            <div class="flex justify-end gap-3 mt-6">
                <button class="btn btn-ghost rounded-lg hover:bg-gray-100 transition-all duration-200" onclick={() => showNewPackageModal = false}>取消</button>
                <button class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap" onclick={createAndLinkPackage} disabled={creatingPackage}>
                    {creatingPackage ? '创建中...' : generateFromItems ? '创建并生成内容' : '创建并关联'}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- 关联已有包裹弹窗 -->
{#if showLinkPackageModal}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" 
         onclick={(e) => { if(e.target === e.currentTarget) showLinkPackageModal = false; }}
         role="dialog"
         aria-modal="true"
         tabindex="-1">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 class="font-bold text-lg mb-4">关联已有包裹</h3>
            
            {#if availablePackages.length === 0}
                <div class="text-center py-8 text-gray-500">
                    <p>没有可关联的包裹</p>
                    <p class="text-sm mt-2">所有包裹都已关联到发货单</p>
                </div>
            {:else}
                <p class="text-sm text-gray-500 mb-4">选择要关联到当前发货单的包裹：</p>
                <div class="space-y-2 max-h-96 overflow-y-auto">
                    {#each availablePackages as pkg}
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50" 
                               class:bg-blue-50={selectedPackageId === pkg.id}
                               class:border-blue-500={selectedPackageId === pkg.id}>
                            <input 
                                type="radio" 
                                name="selectedPackage"
                                class="radio radio-primary mr-3"
                                checked={selectedPackageId === pkg.id}
                                onchange={() => selectedPackageId = pkg.id}
                            />
                            <div class="flex-1">
                                <div class="font-medium">{pkg.package_no}</div>
                                <div class="text-sm text-gray-500">
                                    {#if pkg.tracking_number_detail}
                                        {pkg.tracking_number_detail.carrier_name} - {pkg.tracking_number_detail.tracking_no}
                                    {:else}
                                        未关联快递单号
                                    {/if}
                                    {#if pkg.shipments && pkg.shipments.length > 0}
                                        <span class="ml-2 text-orange-500">(已关联 {pkg.shipments.length} 个发货单)</span>
                                    {:else}
                                        <span class="ml-2 text-green-500">(未关联)</span>
                                    {/if}
                                </div>
                            </div>
                        </label>
                    {/each}
                </div>
            {/if}
            
            <div class="flex justify-end gap-3 mt-6">
                <button class="btn btn-ghost rounded-lg hover:bg-gray-100 transition-all duration-200" onclick={() => { showLinkPackageModal = false; selectedPackageId = null; }}>取消</button>
                <button class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap" 
                        onclick={linkPackageToShipment} 
                        disabled={linkingPackage || !selectedPackageId || availablePackages.length === 0}>
                    {linkingPackage ? '关联中...' : '关联到发货单'}
                </button>
            </div>
        </div>
    </div>
{/if}


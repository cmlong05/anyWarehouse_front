<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { packageAPI } from '$lib/api';
    import { formatDate } from '$lib/utils';
    import type { Package, PackageItem } from '$lib/shipmentTypes';
    import Alert from '$lib/components/Alert.svelte';
    import Loading from '$lib/components/Loading.svelte';

    let pkg = $state<Package | null>(null);
    let loading = $state(true);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleting = $state(false);

    onMount(async () => {
        const id = $page.params.id;
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
        goto(`/customer/package/${$page.params.id}/edit`);
    }

    function goToShipmentDetail(shipmentId: number) {
        goto(`/customer/shipment/${shipmentId}`);
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
</script>

<svelte:head>
    <title>包裹详情 - {pkg?.package_no || '加载中...'} - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
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
            <button class="btn btn-outline" onclick={goToEdit}>编辑</button>
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
                        <span class="text-gray-500 text-sm">序号</span>
                        <p class="font-medium">#{pkg.sequence_no}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">商品种类</span>
                        <p class="font-medium">{pkg.total_items}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">总数量</span>
                        <p class="font-medium">{(parseFloat(pkg.total_quantity as string) || 0).toFixed(0)}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">重量</span>
                        <p class="font-medium">{pkg.weight ? `${parseFloat(pkg.weight).toFixed(3)} kg` : '-'}</p>
                    </div>
                    <div>
                        <span class="text-gray-500 text-sm">体积</span>
                        <p class="font-medium">
                            {pkg.length && pkg.width && pkg.height 
                                ? `${pkg.length}×${pkg.width}×${pkg.height} cm` 
                                : '-'}
                        </p>
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
            {#if pkg.tracking_number_detail}
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-lg font-bold mb-4">快递信息</h2>
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
                            <span class="text-gray-500 text-sm">状态</span>
                            <p class="font-medium">
                                {#if pkg.tracking_number_detail.status === 'unused'}
                                    <span class="badge badge-ghost">未使用</span>
                                {:else if pkg.tracking_number_detail.status === 'reserved'}
                                    <span class="badge badge-info">已预留</span>
                                {:else if pkg.tracking_number_detail.status === 'in_use'}
                                    <span class="badge badge-primary">使用中</span>
                                {:else if pkg.tracking_number_detail.status === 'delivered'}
                                    <span class="badge badge-success">已送达</span>
                                {:else if pkg.tracking_number_detail.status === 'returned'}
                                    <span class="badge badge-warning">已退回</span>
                                {:else}
                                    <span class="badge">{pkg.tracking_number_detail.status}</span>
                                {/if}
                            </p>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- 关联发货单 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-bold mb-4">关联发货单</h2>
                {#if (pkg.shipments?.filter(s => s.status !== 'draft').length ?? 0) > 0}
                    <div class="space-y-3">
                        {#each (pkg.shipments || []).filter(s => s.status !== 'draft') as shipment}
                            <div class="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <span class="font-medium">{shipment.shipment_no}</span>
                                    <span class="ml-2 text-sm text-gray-500">
                                        {#if shipment.status === 'draft'}
                                            <span class="badge badge-ghost">草稿</span>
                                        {:else if shipment.status === 'confirmed'}
                                            <span class="badge badge-info">已确认</span>
                                        {:else if shipment.status === 'packed'}
                                            <span class="badge badge-primary">已打包</span>
                                        {:else if shipment.status === 'shipped'}
                                            <span class="badge badge-success">已发货</span>
                                        {:else if shipment.status === 'delivered'}
                                            <span class="badge badge-success">已签收</span>
                                        {:else if shipment.status === 'cancelled'}
                                            <span class="badge badge-error">已取消</span>
                                        {:else}
                                            <span class="badge">{shipment.status}</span>
                                        {/if}
                                    </span>
                                </div>
                                <button 
                                    class="btn btn-sm btn-outline"
                                    onclick={() => goToShipmentDetail(shipment.id)}
                                >
                                    查看发货单
                                </button>
                            </div>
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
                    <table class="table w-full">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="text-left">SKU</th>
                                <th class="text-left">商品名称</th>
                                <th class="text-right">数量</th>
                                <th class="text-left">关联订单</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each pkg.items as item}
                                <tr class="hover:bg-gray-50">
                                    <td class="font-mono">{item.sku}</td>
                                    <td>{item.product_name}</td>
                                    <td class="text-right">{(parseFloat(item.quantity as string) || 0).toFixed(0)}</td>
                                    <td class="text-sm text-gray-500">
                                        {#if item.order_number}
                                            {item.order_number}
                                        {:else}
                                            -
                                        {/if}
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

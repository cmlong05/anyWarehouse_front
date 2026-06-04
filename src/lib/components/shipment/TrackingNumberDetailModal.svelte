<!-- 追踪号详情弹窗 -->
<script lang="ts">
    import { formatDate } from '$lib/utils';
    import type { TrackingNumber } from '$lib/shipmentTypes';
    import Alert from '$lib/components/Alert.svelte';

    export let isOpen = false;
    export let trackingNumber: TrackingNumber | null = null;
    export let syncing = false;
    export let registering = false;
    export let error: string | null = null;
    export let success: string | null = null;
    export let onCloseCallback: (() => void) | undefined;
    export let onSyncCallback: (() => void) | undefined;
    export let onRegisterCallback: (() => void) | undefined;
    export let onEditCallback: (() => void) | undefined;

    function handleClose() {
        onCloseCallback?.();
    }

    function handleSync() {
        onSyncCallback?.();
    }

    function handleRegister() {
        onRegisterCallback?.();
    }

    function handleEdit() {
        onEditCallback?.();
    }

    function getLogisticsBadgeClass(status: string): string {
        const classMap: Record<string, string> = {
            'pending':    'bg-gray-100 text-gray-600',
            'collected':  'bg-blue-100 text-blue-700',
            'in_transit': 'bg-indigo-100 text-indigo-700',
            'exception':  'bg-orange-100 text-orange-700',
            'delivered':  'bg-green-100 text-green-700',
            'returned':   'bg-yellow-100 text-yellow-700',
            'cancelled':  'bg-red-100 text-red-700',
        };
        return classMap[status] || 'bg-gray-100 text-gray-600';
    }

    function getLogisticsLabel(status: string): string {
        const labelMap: Record<string, string> = {
            'pending':    '待揽收',
            'collected':  '已揽收',
            'in_transit': '运输中',
            'exception':  '异常',
            'delivered':  '已签收',
            'returned':   '已退回',
            'cancelled':  '已作废',
        };
        return labelMap[status] || status;
    }

    $: sortedTrackingEvents = trackingNumber?.tracking_events
        ? [...trackingNumber.tracking_events].sort((a, b) => {
            const aTime = Date.parse(a.status_date) || 0;
            const bTime = Date.parse(b.status_date) || 0;
            return bTime - aTime;
        })
        : [];
</script>

{#if isOpen && trackingNumber}
    <div
        class="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        on:click|self={handleClose}
        on:keydown={(e) => e.key === 'Escape' && handleClose()}
    >
        <div class="bg-white rounded-lg shadow-xl max-w-5xl w-[95%] max-h-[85vh] overflow-y-auto">
            <div class="flex justify-between items-center px-6 py-5 border-b border-gray-200 sticky top-0 bg-white">
                <h3 class="text-gray-900 text-lg font-semibold">物流详情</h3>
                <div class="flex items-center gap-2">
                    {#if trackingNumber.logistics_status !== 'cancelled'}
                        <button
                            class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                            on:click={handleEdit}
                        >
                            编辑
                        </button>
                        <button
                            class="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                            on:click={handleSync}
                            disabled={syncing}
                        >
                            {syncing ? '同步中...' : '同步'}
                        </button>
                        <button
                            class="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                            on:click={handleRegister}
                            disabled={registering}
                        >
                            {registering ? '注册中...' : (trackingNumber.shippo_registered ? '重新注册' : '注册')}
                        </button>
                    {/if}
                    <button
                        class="text-gray-500 hover:text-gray-700 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-md transition-all text-xl leading-none"
                        on:click={handleClose}
                        aria-label="关闭"
                    >×</button>
                </div>
            </div>

            {#if error}
                <div class="px-6 py-4">
                    <Alert error={error} variant="error" onDismiss={() => error = null} />
                </div>
            {:else if success}
                <div class="px-6 py-4">
                    <Alert error={success} variant="info" onDismiss={() => success = null} />
                </div>
            {/if}

            <div class="px-6 py-5 grid gap-4 lg:grid-cols-2">
                <div class="space-y-5">
                    <div class="border rounded-lg p-4 bg-gray-50">
                        <h4 class="text-sm font-semibold text-gray-900 mb-3">基本信息</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="text-gray-500">快递单号</span>
                                <p class="font-mono font-medium text-gray-900 mt-0.5">{trackingNumber.tracking_no}</p>
                            </div>
                            <div>
                                <span class="text-gray-500">承运商</span>
                                <p class="font-medium text-gray-900 mt-0.5">
                                    {trackingNumber.carrier_name}
                                    {#if trackingNumber.carrier_code}
                                        <span class="text-gray-400 text-xs">({trackingNumber.carrier_code})</span>
                                    {/if}
                                </p>
                            </div>
                            <div>
                                <span class="text-gray-500">物流状态</span>
                                <p class="mt-0.5">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getLogisticsBadgeClass(trackingNumber.logistics_status)}">
                                        {getLogisticsLabel(trackingNumber.logistics_status)}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <span class="text-gray-500">Shippo 注册</span>
                                <p class="mt-0.5">
                                    {#if trackingNumber.shippo_registered}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">已注册</span>
                                    {:else}
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">未注册</span>
                                    {/if}
                                </p>
                            </div>
                            <div>
                                <span class="text-gray-500">最后同步</span>
                                <p class="font-medium text-gray-900 mt-0.5">
                                    {trackingNumber.last_synced_at ? formatDate(trackingNumber.last_synced_at) : '-'}
                                </p>
                            </div>
                        </div>
                        {#if trackingNumber.remark}
                            <div class="mt-3 pt-3 border-t border-gray-200">
                                <span class="text-gray-500 text-sm">备注</span>
                                <p class="text-gray-900 mt-1 text-sm">{trackingNumber.remark}</p>
                            </div>
                        {/if}
                    </div>

                    <div class="border rounded-lg p-4 bg-white">
                        <h4 class="text-sm font-semibold text-gray-900 mb-3">关联包裹</h4>
                        {#if (trackingNumber.linked_packages ?? []).length > 0}
                            <div class="space-y-3 text-sm text-gray-900">
                                {#each trackingNumber.linked_packages as pkg}
                                    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <div class="flex flex-wrap items-center gap-3">
                                            <a href={`/customer/package/${pkg.id}`} class="font-medium text-blue-600 hover:underline">
                                                {pkg.package_no}
                                            </a>
                                            {#if pkg.customer_name}
                                                <span class="text-xs text-gray-500">
                                                    {#if pkg.customer_id}
                                                        <a href={`/customer/${pkg.customer_id}`} class="text-blue-600 hover:underline">
                                                            {pkg.customer_name}
                                                        </a>
                                                    {:else}
                                                        {pkg.customer_name}
                                                    {/if}
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div class="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                                暂无关联包裹
                            </div>
                        {/if}
                    </div>

                    {#if trackingNumber.tracking_status_raw}
                        <div class="border rounded-lg p-4 bg-gray-50">
                            <h4 class="text-sm font-semibold text-gray-900 mb-3">当前状态</h4>
                            <div class="grid grid-cols-1 gap-3 text-sm">
                                {#if typeof trackingNumber.tracking_status_raw === 'string'}
                                    {@const statusData = JSON.parse(trackingNumber.tracking_status_raw)}
                                    <div>
                                        <span class="text-gray-500">API 状态</span>
                                        <p class="font-mono font-medium text-gray-900 mt-0.5">{statusData.status || '-'}</p>
                                    </div>
                                    {#if statusData.status_details}
                                        <div>
                                            <span class="text-gray-500">状态描述</span>
                                            <p class="text-gray-900 mt-0.5">{statusData.status_details}</p>
                                        </div>
                                    {/if}
                                    {#if statusData.status_date}
                                        <div>
                                            <span class="text-gray-500">状态时间</span>
                                            <p class="font-medium text-gray-900 mt-0.5">{formatDate(statusData.status_date)}</p>
                                        </div>
                                    {/if}
                                    {#if statusData.location}
                                        <div>
                                            <span class="text-gray-500">位置</span>
                                            <p class="text-gray-900 mt-0.5">
                                                {[
                                                    statusData.location.city,
                                                    statusData.location.state,
                                                    statusData.location.zip,
                                                    statusData.location.country
                                                ].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    {/if}
                                {:else}
                                    <div>
                                        <span class="text-gray-500">API 状态</span>
                                        <p class="font-mono font-medium text-gray-900 mt-0.5">{trackingNumber.tracking_status_raw.status || '-'}</p>
                                    </div>
                                    {#if trackingNumber.tracking_status_raw.status_details}
                                        <div>
                                            <span class="text-gray-500">状态描述</span>
                                            <p class="text-gray-900 mt-0.5">{trackingNumber.tracking_status_raw.status_details}</p>
                                        </div>
                                    {/if}
                                    {#if trackingNumber.tracking_status_raw.status_date}
                                        <div>
                                            <span class="text-gray-500">状态时间</span>
                                            <p class="font-medium text-gray-900 mt-0.5">{formatDate(trackingNumber.tracking_status_raw.status_date)}</p>
                                        </div>
                                    {/if}
                                    {#if trackingNumber.tracking_status_raw.location}
                                        <div>
                                            <span class="text-gray-500">位置</span>
                                            <p class="text-gray-900 mt-0.5">
                                                {[
                                                    trackingNumber.tracking_status_raw.location.city,
                                                    trackingNumber.tracking_status_raw.location.state,
                                                    trackingNumber.tracking_status_raw.location.zip,
                                                    trackingNumber.tracking_status_raw.location.country
                                                ].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    {/if}
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="space-y-5">
                    {#if sortedTrackingEvents && sortedTrackingEvents.length > 0}
                        <div class="border rounded-lg p-4 bg-gray-50 h-full">
                            <h4 class="text-sm font-semibold text-gray-900 mb-4">物流轨迹</h4>
                            <div class="space-y-4">
                                {#each sortedTrackingEvents as event, index}
                                    <div class="flex gap-3">
                                        <div class="flex flex-col items-center">
                                            <div class="w-3 h-3 bg-blue-600 rounded-full mt-1.5"></div>
                                            {#if index < sortedTrackingEvents.length - 1}
                                                <div class="w-0.5 h-8 bg-gray-300 my-1"></div>
                                            {/if}
                                        </div>
                                        <div class="pb-4 flex-1">
                                            <div class="flex justify-between items-start gap-2 mb-0.5">
                                                <p class="font-medium text-gray-900 text-sm">{event.status_details || event.status || '未知状态'}</p>
                                                {#if event.status_date}
                                                    <span class="text-gray-500 text-xs whitespace-nowrap">{formatDate(event.status_date)}</span>
                                                {/if}
                                            </div>
                                            {#if event.location}
                                                <p class="text-gray-600 text-sm">
                                                    📍 {typeof event.location === 'string'
                                                        ? event.location
                                                        : [event.location.city, event.location.state, event.location.zip, event.location.country].filter(Boolean).join(', ') || '地点未知'}
                                                </p>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {:else if trackingNumber.tracking_status_raw}
                        <div class="border rounded-lg p-4 bg-blue-50 text-blue-900 text-sm h-full">
                            <p>暂无轨迹历史，请稍后同步查询</p>
                        </div>
                    {:else}
                        <div class="border rounded-lg p-4 bg-blue-50 text-blue-900 text-sm h-full">
                            <p>暂无物流轨迹数据</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

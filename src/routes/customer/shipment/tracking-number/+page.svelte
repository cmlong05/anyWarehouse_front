<!-- 追踪号管理页 -->
<!--
被依赖：无
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { trackingNumberAPI } from '$lib/api';
    import { formatDate, getErrorMessage, hasChangedFields, shouldDismissModal } from '$lib/utils';
    import type { LogisticsStatus, TrackingNumber } from '$lib/shipmentTypes';
    import { Alert, Loading } from '$lib/components';
    import { ConfirmModal } from '$lib/components';
    import TrackingNumberDetailModal from '$lib/components/shipment/TrackingNumberDetailModal.svelte';
    import Plus from 'lucide-svelte/icons/plus';

    let trackingNumbers: TrackingNumber[] = [];
    let loading = true;
    let error = '';
    let success = '';
    
    // 筛选条件
    let linkedFilter = '';      // 关联状态
    let logisticsFilter = '';   // 物流状态
    
    // 关联状态选项
    const linkedOptions = [
        { value: '', label: '全部' },
        { value: 'false', label: '未关联' },
        { value: 'true', label: '已关联' },
    ];
    
    // 物流状态选项
    const logisticsOptions = [
        { value: '', label: '全部' },
        { value: 'pending', label: '待揽收' },
        { value: 'collected', label: '已揽收' },
        { value: 'in_transit', label: '运输中' },
        { value: 'exception', label: '异常' },
        { value: 'delivered', label: '已签收' },
        { value: 'returned', label: '已退回' },
        { value: 'cancelled', label: '已作废' },
    ];

    // 表单可选物流状态（不含“全部”）
    const logisticsFormOptions = logisticsOptions.filter((option) => option.value !== '');
    
    // 新建/编辑模态框
    let showFormModal = false;
    let editingId: number | null = null;
    interface TrackingNumberFormData extends Record<string, unknown> {
        tracking_no: string;
        carrier_code: string;
        carrier_name: string;
        logistics_status: LogisticsStatus;
        remark: string;
        cost: string;
        agent_name: string;
        from_location: string;
        to_location: string;
        handover_at: string;
    }
    let formData: {
        tracking_no: string;
        carrier_code: string;
        carrier_name: string;
        logistics_status: LogisticsStatus;
        remark: string;
        cost: string;
        agent_name: string;
        from_location: string;
        to_location: string;
        handover_at: string;
    } = {
        tracking_no: '',
        carrier_code: '',
        carrier_name: '',
        logistics_status: 'pending',
        remark: '',
        cost: '',
        agent_name: '',
        from_location: '',
        to_location: '',
        handover_at: ''
    };
    let initialFormData: TrackingNumberFormData | null = null;
    let isFormDirty = false;
    const formFields = ['tracking_no', 'carrier_code', 'carrier_name', 'logistics_status', 'cost', 'agent_name', 'from_location', 'to_location', 'handover_at', 'remark'] as const;
    
    // 删除确认
    let showDeleteModal = false;
    let trackingNumberToDelete: TrackingNumber | null = null;

    // 单条刷新中的 id 集合
    let syncingIds = new Set<number>();

    let detailSyncing = false;
    let detailRegistering = false;
    let detailError = '';
    let detailSuccess = '';

    // 详情模态框
    let showDetailModal = false;
    let detailTrackingNumber: TrackingNumber | null = null;

    function captureFormSnapshot(): TrackingNumberFormData {
        return { ...formData };
    }

    function closeFormModal() {
        showFormModal = false;
        initialFormData = null;
        isFormDirty = false;
    }

    function handleFormBackdropClick(event: MouseEvent) {
        if (shouldDismissModal(event, !isFormDirty)) {
            closeFormModal();
        }
    }

    function handleFormKeydown(event: KeyboardEvent) {
        if (shouldDismissModal(event, !isFormDirty)) {
            event.preventDefault();
            closeFormModal();
        }
    }

    $: isFormDirty = initialFormData === null
        ? false
        : hasChangedFields(formData, initialFormData, formFields);

    onMount(async () => {
        await loadTrackingNumbers();
        const openId = page.url.searchParams.get('open');
        if (openId) {
            const id = Number(openId);
            if (Number.isFinite(id) && id > 0) {
                const target = trackingNumbers.find((tn) => tn.id === id) ?? ({ id } as TrackingNumber);
                await openDetailModal(target);
            }
        }
    });

    async function loadTrackingNumbers() {
        try {
            loading = true;
            error = '';
            const params: Record<string, string> = {};
            if (logisticsFilter) params.logistics_status = logisticsFilter;
            
            const response = await trackingNumberAPI.list(params);
            let results = response.results || [];
            
            // 关联状态在前端过滤（is_linked 是计算字段）
            if (linkedFilter === 'true') results = results.filter(tn => tn.is_linked);
            else if (linkedFilter === 'false') results = results.filter(tn => !tn.is_linked);
            
            trackingNumbers = results;
        } catch (err) {
            error = getErrorMessage(err, '加载快递单号失败');
        } finally {
            loading = false;
        }
    }

    function getCurrentDatetimeLocal(): string {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function openCreateModal() {
        editingId = null;
        formData = {
            tracking_no: '',
            carrier_code: '',
            carrier_name: '',
            logistics_status: 'pending',
            remark: '',
            cost: '',
            agent_name: '',
            from_location: '',
            to_location: '',
            handover_at: getCurrentDatetimeLocal()
        };
        initialFormData = captureFormSnapshot();
        showFormModal = true;
    }

    function openEditModal(tn: TrackingNumber) {
        editingId = tn.id;
        formData = {
            tracking_no: tn.tracking_no,
            carrier_code: tn.carrier_code,
            carrier_name: tn.carrier_name,
            logistics_status: tn.logistics_status,
            remark: tn.remark || '',
            cost: tn.cost || '',
            agent_name: tn.agent_name || '',
            from_location: tn.from_location || '',
            to_location: tn.to_location || '',
            handover_at: tn.handover_at || ''
        };
        initialFormData = captureFormSnapshot();
        showFormModal = true;
    }

    function openCopyModal(tn: TrackingNumber) {
        editingId = null;
        formData = {
            tracking_no: '',
            carrier_code: tn.carrier_code,
            carrier_name: tn.carrier_name,
            logistics_status: 'pending',
            remark: '',
            cost: tn.cost || '',
            agent_name: tn.agent_name || '',
            from_location: tn.from_location || '',
            to_location: tn.to_location || '',
            handover_at: tn.handover_at || ''
        };
        initialFormData = captureFormSnapshot();
        showFormModal = true;
    }

    async function handleSubmit() {
        if (!formData.tracking_no.trim()) {
            error = '请输入快递单号';
            return;
        }
        if (!formData.carrier_name.trim()) {
            error = '请输入承运商名称';
            return;
        }

        // DRF DateTimeField 不接受空字符串，必须传 null
        const payload = {
            ...formData,
            handover_at: formData.handover_at || null,
        };

        try {
            if (editingId) {
                await trackingNumberAPI.update(editingId, payload);
                success = '快递单号已更新';
            } else {
                await trackingNumberAPI.create(payload);
                success = '快递单号已创建';
            }
            closeFormModal();
            await loadTrackingNumbers();
        } catch (err) {
            error = getErrorMessage(err, '保存失败');
        }
    }

    function confirmDelete(tn: TrackingNumber) {
        trackingNumberToDelete = tn;
        showDeleteModal = true;
    }

    async function handleDelete() {
        if (!trackingNumberToDelete) return;
        
        try {
            await trackingNumberAPI.delete(trackingNumberToDelete.id);
            success = '快递单号已删除';
            await loadTrackingNumbers();
        } catch (err) {
            error = getErrorMessage(err, '删除失败');
        } finally {
            showDeleteModal = false;
            trackingNumberToDelete = null;
        }
    }

    function goBack() {
        goto('/customer/shipment');
    }

    async function handleDetailRegister() {
        if (!detailTrackingNumber) return;
        detailRegistering = true;
        detailError = '';
        detailSuccess = '';
        try {
            const response = await trackingNumberAPI.register(detailTrackingNumber.id);
            detailSuccess = response.result?.message || `${detailTrackingNumber.tracking_no} 已注册到 Shippo`;
            detailTrackingNumber = response.tracking;
            await loadTrackingNumbers();
        } catch (err) {
            detailError = getErrorMessage(err, '注册失败');
        } finally {
            detailRegistering = false;
        }
    }

    async function handleSync(tn: TrackingNumber) {
        syncingIds = new Set([...syncingIds, tn.id]);
        try {
            const response = await trackingNumberAPI.sync(tn.id);
            success = response.result?.message || `${tn.tracking_no} 物流状态已同步`;
            await loadTrackingNumbers();
            if (detailTrackingNumber?.id === tn.id) {
                detailTrackingNumber = response.tracking;
            }
        } catch (err) {
            error = getErrorMessage(err, '同步失败');
        } finally {
            syncingIds.delete(tn.id);
            syncingIds = new Set(syncingIds);
        }
    }

    async function handleDetailSync() {
        if (!detailTrackingNumber) return;
        detailSyncing = true;
        detailError = '';
        detailSuccess = '';
        try {
            const response = await trackingNumberAPI.sync(detailTrackingNumber.id);
            detailSuccess = response.result?.message || `${detailTrackingNumber.tracking_no} 物流状态已同步`;
            detailTrackingNumber = response.tracking;
            await loadTrackingNumbers();
        } catch (err) {
            detailError = getErrorMessage(err, '同步失败');
        } finally {
            detailSyncing = false;
        }
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

    async function openDetailModal(tn: TrackingNumber) {
        detailError = '';
        detailSuccess = '';
        detailTrackingNumber = null;
        try {
            detailTrackingNumber = await trackingNumberAPI.get(tn.id);
            showDetailModal = true;
        } catch (err) {
            error = getErrorMessage(err, '加载快递单号详情失败');
        }
    }
</script>

<svelte:head>
    <title>快递单号管理 - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
            <button
                class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="返回"
                on:click={goBack}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <div>
                <h1 class="text-2xl font-bold">快递单号管理</h1>
                <p class="text-gray-500 text-sm mt-1">管理快递单号池</p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <button
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
                on:click={openCreateModal}
            >
                <Plus class="h-5 w-5 flex-shrink-0" />
                <span>新建单号</span>
            </button>
        </div>
    </div>

    <!-- 提示信息 -->
    {#if error}
        <Alert variant="error" error={error} onDismiss={() => error = ''} />
    {/if}
    {#if success}
        <Alert variant="info" error={{ message: success }} onDismiss={() => success = ''} />
    {/if}

    <!-- 筛选栏 -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-wrap gap-4 items-end">
            <div class="w-full md:w-36">
                <label class="block text-sm font-medium text-gray-700 mb-1" for="linkedFilter">关联状态</label>
                <select
                    id="linkedFilter"
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    bind:value={linkedFilter}
                    on:change={loadTrackingNumbers}
                >
                    {#each linkedOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
            <div class="w-full md:w-40">
                <label class="block text-sm font-medium text-gray-700 mb-1" for="logisticsFilter">物流状态</label>
                <select
                    id="logisticsFilter"
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    bind:value={logisticsFilter}
                    on:change={loadTrackingNumbers}
                >
                    {#each logisticsOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
            <button
                class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                on:click={loadTrackingNumbers}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>刷新</span>
            </button>
        </div>
    </div>

    <!-- 数据表格 -->
    {#if loading}
        <Loading />
    {:else if trackingNumbers?.length === 0}
        <div class="bg-white rounded-lg shadow p-12 text-center">
            <div class="text-gray-300 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">暂无快递单号</h3>
            <p class="text-gray-500 mb-4">点击上方按钮创建快递单号</p>
            <button
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                on:click={openCreateModal}
            >新建单号</button>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="px-4 py-3 text-left font-medium text-gray-600">快递单号</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">承运商</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">关联状态</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Shippo</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">物流状态</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">备注</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">最后同步</th>
                        <th class="px-4 py-3 text-center font-medium text-gray-600">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each trackingNumbers as tn}
                        <tr class="cursor-pointer hover:bg-blue-50 transition-colors" on:click={() => openDetailModal(tn)}>
                            <td class="px-4 py-3 font-medium font-mono">{tn.tracking_no}</td>
                            <td class="px-4 py-3">
                                <div class="flex flex-col">
                                    <span>{tn.carrier_name}</span>
                                    {#if tn.carrier_code}
                                        <span class="text-xs text-gray-400">{tn.carrier_code}</span>
                                    {/if}
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                {#if tn.is_linked}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">已关联</span>
                                {:else}
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">未关联</span>
                                {/if}
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    class="inline-flex h-4 w-4 rounded-full"
                                    class:bg-[radial-gradient(circle,_rgba(34,197,94,1)_0%,_rgba(34,197,94,0)_70%)]={tn.shippo_registered}
                                    class:bg-[radial-gradient(circle,_rgba(148,163,184,1)_0%,_rgba(148,163,184,0)_70%)]={!tn.shippo_registered}
                                    title={tn.shippo_registered ? '已注册' : '未注册'}
                                >
                                    <span class="sr-only">{tn.shippo_registered ? '已注册' : '未注册'}</span>
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getLogisticsBadgeClass(tn.logistics_status)}">
                                    {getLogisticsLabel(tn.logistics_status)}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-gray-500">{tn.remark || '-'}</td>
                            <td class="px-4 py-3 text-gray-400 text-xs">
                                {tn.last_synced_at ? formatDate(tn.last_synced_at) : '-'}
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex items-center justify-center gap-1">
                                    {#if tn.logistics_status !== 'cancelled'}
                                        <button
                                            class="px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
                                            on:click|stopPropagation={() => openCopyModal(tn)}
                                        >复制</button>
                                        <button
                                            class="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-40"
                                            disabled={syncingIds.has(tn.id)}
                                            on:click|stopPropagation={() => handleSync(tn)}
                                        >{syncingIds.has(tn.id) ? '刷新中...' : '刷新'}</button>
                                    {/if}

                                    {#if !tn.is_linked && tn.logistics_status !== 'cancelled'}
                                        <button
                                            class="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                                            on:click|stopPropagation={() => confirmDelete(tn)}
                                        >删除</button>
                                    {/if}
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<!-- 表单模态框 -->
{#if showFormModal}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
        class="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        on:click={handleFormBackdropClick}
        on:keydown={handleFormKeydown}
    >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-[95%] max-h-[90vh] overflow-y-auto">
            <!-- 标题栏 -->
            <div class="flex justify-between items-center px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h3 class="text-gray-900 text-lg font-semibold">{editingId ? '编辑快递单号' : '新建快递单号'}</h3>
                <button 
                    class="text-gray-500 hover:text-gray-700 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-md transition-all text-xl leading-none"
                    on:click={closeFormModal}
                    aria-label="关闭"
                >×</button>
            </div>

            <!-- 表单内容 -->
            <div class="px-6 py-5 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="trackingNo">
                            快递单号 <span class="text-red-500">*</span>
                        </label>
                        <input 
                            id="trackingNo"
                            type="text" 
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                            bind:value={formData.tracking_no}
                            placeholder="输入快递单号"
                            disabled={!!editingId}
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="handoverAt">
                            交接时间
                        </label>
                        <input 
                            id="handoverAt"
                            type="datetime-local"
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            bind:value={formData.handover_at}
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="carrierName">
                            承运商名称 <span class="text-red-500">*</span>
                        </label>
                        <input 
                            id="carrierName"
                            type="text" 
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            bind:value={formData.carrier_name}
                            placeholder="如：顺丰速运"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="carrierCode">
                            承运商代码
                        </label>
                        <input 
                            id="carrierCode"
                            type="text" 
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            bind:value={formData.carrier_code}
                            placeholder="如：sf"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="cost">
                            费用
                        </label>
                        <input 
                            id="cost"
                            type="text"
                            inputmode="decimal"
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            bind:value={formData.cost}
                            placeholder="如：150.00"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="logisticsStatus">
                            物流状态 <span class="text-red-500">*</span>
                        </label>
                        <select
                            id="logisticsStatus"
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            bind:value={formData.logistics_status}
                        >
                            {#each logisticsFormOptions as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="fromLocation">
                            起始地
                        </label>
                        <input 
                            id="fromLocation"
                            type="text"
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            bind:value={formData.from_location}
                            placeholder="如：深圳"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="toLocation">
                            目的地
                        </label>
                        <input 
                            id="toLocation"
                            type="text"
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            bind:value={formData.to_location}
                            placeholder="如：上海/美国"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="agentName">
                            货运代理 / 承运方
                        </label>
                        <input 
                            id="agentName"
                            type="text"
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            bind:value={formData.agent_name}
                            placeholder="如：上海XX货代"
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1" for="remark">
                        备注
                    </label>
                    <textarea 
                        id="remark"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows="3"
                        bind:value={formData.remark}
                        placeholder="输入备注信息"
                    ></textarea>
                </div>
            </div>

            <!-- 底部按钮 -->
            <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
                <button 
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors text-sm"
                    on:click={closeFormModal}
                >取消</button>
                <button 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
                    on:click={handleSubmit}
                >保存</button>
            </div>
        </div>
    </div>
{/if}

<!-- 删除确认模态框 -->
<ConfirmModal
    isOpen={showDeleteModal}
    title="确认删除"
    message={trackingNumberToDelete ? `确定要删除快递单号 "${trackingNumberToDelete.tracking_no}" 吗？此操作不可恢复。` : ''}
    confirmText="删除"
    onConfirm={handleDelete}
    onCancel={() => { showDeleteModal = false; trackingNumberToDelete = null; }}
/>

<TrackingNumberDetailModal
    isOpen={showDetailModal}
    trackingNumber={detailTrackingNumber}
    syncing={detailSyncing}
    registering={detailRegistering}
    error={detailError}
    success={detailSuccess}
    onCloseCallback={() => {
        showDetailModal = false;
        detailError = '';
        detailSuccess = '';
    }}
    onSyncCallback={handleDetailSync}
    onRegisterCallback={handleDetailRegister}
    onEditCallback={() => {
        if (detailTrackingNumber) {
            showDetailModal = false;
            openEditModal(detailTrackingNumber);
        }
    }}
/>
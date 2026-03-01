<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { trackingNumberAPI } from '$lib/api';
    import type { TrackingNumber } from '$lib/shipmentTypes';
    import Loading from '$lib/components/Loading.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';

    let trackingNumbers: TrackingNumber[] = [];
    let loading = true;
    let error = '';
    let success = '';
    
    // 筛选条件
    let statusFilter = '';
    
    // 状态选项
    const statusOptions = [
        { value: '', label: '全部状态' },
        { value: 'unused', label: '未使用' },
        { value: 'reserved', label: '已预留' },
        { value: 'in_use', label: '使用中' },
        { value: 'delivered', label: '已签收' },
        { value: 'returned', label: '已退回' },
        { value: 'cancelled', label: '已作废' },
    ];
    
    // 新建/编辑模态框
    let showFormModal = false;
    let editingId: number | null = null;
    let formData = {
        tracking_no: '',
        carrier_code: '',
        carrier_name: '',
        remark: ''
    };
    
    // 删除确认
    let showDeleteModal = false;
    let trackingNumberToDelete: TrackingNumber | null = null;

    onMount(async () => {
        await loadTrackingNumbers();
    });

    async function loadTrackingNumbers() {
        try {
            loading = true;
            error = '';
            const params: { status?: string } = {};
            if (statusFilter) params.status = statusFilter;
            
            const response = await trackingNumberAPI.list(params);
            trackingNumbers = response.results || [];
        } catch (err: any) {
            error = err.message || '加载快递单号失败';
        } finally {
            loading = false;
        }
    }

    function openCreateModal() {
        editingId = null;
        formData = {
            tracking_no: '',
            carrier_code: '',
            carrier_name: '',
            remark: ''
        };
        showFormModal = true;
    }

    function openEditModal(tn: TrackingNumber) {
        editingId = tn.id;
        formData = {
            tracking_no: tn.tracking_no,
            carrier_code: tn.carrier_code,
            carrier_name: tn.carrier_name,
            remark: tn.remark || ''
        };
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

        try {
            if (editingId) {
                await trackingNumberAPI.update(editingId, formData);
                success = '快递单号已更新';
            } else {
                await trackingNumberAPI.create(formData);
                success = '快递单号已创建';
            }
            showFormModal = false;
            await loadTrackingNumbers();
        } catch (err: any) {
            error = err.message || '保存失败';
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
        } catch (err: any) {
            error = err.message || '删除失败';
        } finally {
            showDeleteModal = false;
            trackingNumberToDelete = null;
        }
    }

    async function handleReserve(tn: TrackingNumber) {
        try {
            await trackingNumberAPI.reserve(tn.id);
            success = '快递单号已预留';
            await loadTrackingNumbers();
        } catch (err: any) {
            error = err.message || '操作失败';
        }
    }

    async function handleRelease(tn: TrackingNumber) {
        try {
            await trackingNumberAPI.release(tn.id);
            success = '快递单号已释放';
            await loadTrackingNumbers();
        } catch (err: any) {
            error = err.message || '操作失败';
        }
    }

    function goBack() {
        goto('/customer/shipment');
    }

    function getStatusBadgeClass(status: string): string {
        const classMap: Record<string, string> = {
            'unused': 'badge-ghost',
            'reserved': 'badge-warning',
            'in_use': 'badge-primary',
            'delivered': 'badge-success',
            'returned': 'badge-info',
            'cancelled': 'badge-error',
        };
        return classMap[status] || 'badge-ghost';
    }

    function getStatusLabel(status: string): string {
        const labelMap: Record<string, string> = {
            'unused': '未使用',
            'reserved': '已预留',
            'in_use': '使用中',
            'delivered': '已签收',
            'returned': '已退回',
            'cancelled': '已作废',
        };
        return labelMap[status] || status;
    }
</script>

<svelte:head>
    <title>快递单号管理 - AnyWarehouse</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
            <button class="btn btn-ghost btn-sm" aria-label="返回" on:click={goBack}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <div>
                <h1 class="text-2xl font-bold">快递单号管理</h1>
                <p class="text-gray-500 text-sm mt-1">管理快递单号池</p>
            </div>
        </div>
        <button class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2" on:click={openCreateModal}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>新建单号</span>
        </button>
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
        <div class="flex flex-wrap gap-4">
            <div class="form-control w-full md:w-48">
                <label class="label" for="statusFilter">
                    <span class="label-text">状态</span>
                </label>
                <select id="statusFilter" class="select select-bordered" bind:value={statusFilter} on:change={loadTrackingNumbers}>
                    {#each statusOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
            <div class="form-control flex-1 flex items-end">
                <button class="btn btn-outline rounded-lg shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap flex items-center gap-2" on:click={loadTrackingNumbers}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>刷新</span>
                </button>
            </div>
        </div>
    </div>

    <!-- 数据表格 -->
    {#if loading}
        <Loading />
    {:else if trackingNumbers?.length === 0}
        <div class="bg-white rounded-lg shadow p-12 text-center">
            <div class="text-gray-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">暂无快递单号</h3>
            <p class="text-gray-500 mb-4">点击上方按钮创建快递单号</p>
            <button class="btn btn-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap" on:click={openCreateModal}>新建单号</button>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="table table-zebra w-full">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="px-4 py-3 text-left">快递单号</th>
                        <th class="px-4 py-3 text-left">承运商</th>
                        <th class="px-4 py-3 text-left">状态</th>
                        <th class="px-4 py-3 text-left">备注</th>
                        <th class="px-4 py-3 text-center">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {#each trackingNumbers as tn}
                        <tr class="hover:bg-blue-50">
                            <td class="px-4 py-3 font-medium">{tn.tracking_no}</td>
                            <td class="px-4 py-3">
                                <div class="flex flex-col">
                                    <span>{tn.carrier_name}</span>
                                    {#if tn.carrier_code}
                                        <span class="text-xs text-gray-500">{tn.carrier_code}</span>
                                    {/if}
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                <span class="badge {getStatusBadgeClass(tn.status)} badge-sm">
                                    {getStatusLabel(tn.status)}
                                </span>
                            </td>
                            <td class="px-4 py-3">{tn.remark || '-'}</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center justify-center gap-1">
                                {#if tn.status === 'unused'}
                                    <button 
                                        class="btn btn-ghost btn-sm p-1"
                                        on:click={() => handleReserve(tn)}
                                    >
                                        预留
                                    </button>
                                {/if}
                                {#if tn.status === 'reserved'}
                                    <button 
                                        class="btn btn-ghost btn-sm p-1"
                                        on:click={() => handleRelease(tn)}
                                    >
                                        释放
                                    </button>
                                {/if}
                                {#if tn.status === 'unused' || tn.status === 'reserved'}
                                    <button 
                                        class="btn btn-ghost btn-sm p-1"
                                        on:click={() => openEditModal(tn)}
                                    >
                                        编辑
                                    </button>
                                    <button 
                                        class="btn btn-ghost btn-sm p-1 text-error"
                                        on:click={() => confirmDelete(tn)}
                                    >
                                        删除
                                    </button>
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
    <div class="modal modal-open">
        <div class="modal-box max-w-lg">
            <h3 class="font-bold text-lg mb-4">{editingId ? '编辑快递单号' : '新建快递单号'}</h3>
            
            <div class="space-y-4">
                <div class="form-control">
                    <label class="label" for="trackingNo">
                        <span class="label-text">快递单号 <span class="text-error">*</span></span>
                    </label>
                    <input 
                        id="trackingNo"
                        type="text" 
                        class="input input-bordered" 
                        bind:value={formData.tracking_no}
                        placeholder="输入快递单号"
                        disabled={!!editingId}
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label" for="carrierName">
                            <span class="label-text">承运商名称 <span class="text-error">*</span></span>
                        </label>
                        <input 
                            id="carrierName"
                            type="text" 
                            class="input input-bordered" 
                            bind:value={formData.carrier_name}
                            placeholder="如：顺丰速运"
                        />
                    </div>
                    <div class="form-control">
                        <label class="label" for="carrierCode">
                            <span class="label-text">承运商代码</span>
                        </label>
                        <input 
                            id="carrierCode"
                            type="text" 
                            class="input input-bordered" 
                            bind:value={formData.carrier_code}
                            placeholder="如：sf"
                        />
                    </div>
                </div>

                <div class="form-control">
                    <label class="label" for="remark">
                        <span class="label-text">备注</span>
                    </label>
                    <textarea 
                        id="remark"
                        class="textarea textarea-bordered" 
                        bind:value={formData.remark}
                        placeholder="输入备注信息"
                    ></textarea>
                </div>
            </div>

            <div class="modal-action">
                <button class="btn btn-ghost" on:click={() => showFormModal = false}>取消</button>
                <button class="btn btn-primary" on:click={handleSubmit}>保存</button>
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

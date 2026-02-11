<script lang="ts">
    import { goto } from '$app/navigation';
    import { customerAPI } from '$lib/api';
    import type { Customer, CustomerFormData } from '$lib/schemas';
    import CustomerForm from '$lib/components/CustomerForm.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    
    interface Props {
        data: { customer: Customer };
    }
    
    let { data }: Props = $props();
    
    let customer = $state<Customer>(data.customer);
    let isEditing = $state(false);
    let loading = $state(false);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleteLoading = $state(false);
    
    const breadcrumbs = $derived([
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customer' },
        { label: customer.name, href: `/customer/${customer.id}` },
    ]);
    
    const levelLabels: Record<string, string> = {
        'VIP': 'VIP客户',
        'NORMAL': '普通客户',
        'TEMP': '临时客户'
    };
    
    async function handleUpdate(data: CustomerFormData) {
        loading = true;
        error = '';
        
        try {
            const updated = await customerAPI.update(customer.id, data);
            customer = updated;
            isEditing = false;
        } catch (err) {
            error = err instanceof Error ? err.message : '更新客户失败';
        } finally {
            loading = false;
        }
    }
    
    async function handleDelete() {
        deleteLoading = true;
        error = '';
        
        try {
            await customerAPI.delete(customer.id);
            goto('/customer');
        } catch (err) {
            error = err instanceof Error ? err.message : '删除客户失败';
            deleteLoading = false;
            showDeleteModal = false;
        }
    }
    
    function handleCancel() {
        isEditing = false;
        error = '';
    }
    
    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString('zh-CN');
    }
</script>

<svelte:head>
    <title>{customer.name} - 客户详情</title>
</svelte:head>

<div class="content-container">
    <Breadcrumb items={breadcrumbs} />
    
    {#if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {/if}
    
    {#if isEditing}
        <div class="page-header">
            <h1>编辑客户</h1>
            <button class="btn btn-secondary" onclick={() => isEditing = false}>
                取消编辑
            </button>
        </div>
        
        <div class="form-container">
            <CustomerForm
                onSubmit={handleUpdate}
                onCancel={handleCancel}
                initialData={customer}
                submitLabel="保存修改"
                {loading}
            />
        </div>
    {:else}
        <div class="page-header">
            <div class="header-left">
                <h1>{customer.name}</h1>
                <span class="level-badge {customer.level.toLowerCase()}">
                    {levelLabels[customer.level]}
                </span>
                <span class="status-badge {customer.status.toLowerCase()}">
                    {customer.status === 'ACTIVE' ? '活跃' : '停用'}
                </span>
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" onclick={() => isEditing = true}>
                    编辑
                </button>
                <button class="btn btn-danger" onclick={() => showDeleteModal = true}>
                    删除
                </button>
            </div>
        </div>
        
        <div class="detail-grid">
            <div class="info-card">
                <h3>基本信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">客户编号</span>
                        <span class="value code">{customer.code}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">客户名称</span>
                        <span class="value">{customer.name}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">联系人</span>
                        <span class="value">{customer.contact_name || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">联系电话</span>
                        <span class="value">{customer.phone || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">电子邮箱</span>
                        <span class="value">{customer.email || '-'}</span>
                    </div>
                </div>
            </div>
            
            <div class="info-card">
                <h3>地址信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">主地址</span>
                        <span class="value">{customer.address || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">地址数量</span>
                        <span class="value">{customer.address_count || 0} 个</span>
                    </div>
                </div>
                
                <div class="card-actions">
                    <a href="/customer/{customer.id}/address" class="btn btn-outline">
                        管理地址簿
                    </a>
                </div>
            </div>
            
            <div class="info-card full-width">
                <h3>其他信息</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="label">备注</span>
                        <span class="value">{customer.remark || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">创建时间</span>
                        <span class="value">{formatDate(customer.created_at)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">更新时间</span>
                        <span class="value">{formatDate(customer.updated_at)}</span>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<ConfirmModal
    isOpen={showDeleteModal}
    title="删除客户"
    message="确定要删除以下客户吗？此操作不可撤销。"
    itemName={customer.name}
    confirmText="删除"
    cancelText="取消"
    loading={deleteLoading}
    onConfirm={handleDelete}
    onCancel={() => showDeleteModal = false}
/>

<style>
    .content-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }
    
    .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        color: #1f2937;
    }
    
    .header-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .level-badge, .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .level-badge.vip {
        background-color: #fef3c7;
        color: #92400e;
    }
    
    .level-badge.normal {
        background-color: #dbeafe;
        color: #1e40af;
    }
    
    .level-badge.temp {
        background-color: #f3f4f6;
        color: #4b5563;
    }
    
    .status-badge.active {
        background-color: #d1fae5;
        color: #065f46;
    }
    
    .status-badge.inactive {
        background-color: #fee2e2;
        color: #991b1b;
    }
    
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    
    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }
    
    .btn-secondary:hover {
        background-color: #4b5563;
    }
    
    .btn-danger {
        background-color: #dc2626;
        color: white;
    }
    
    .btn-danger:hover {
        background-color: #b91c1c;
    }
    
    .btn-outline {
        background-color: transparent;
        color: #3b82f6;
        border: 1px solid #3b82f6;
    }
    
    .btn-outline:hover {
        background-color: #eff6ff;
    }
    
    .form-container {
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }
    
    .info-card {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .info-card.full-width {
        grid-column: 1 / -1;
    }
    
    .info-card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #374151;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .info-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .info-item .label {
        color: #6b7280;
        font-size: 0.875rem;
        flex-shrink: 0;
    }
    
    .info-item .value {
        color: #1f2937;
        text-align: right;
        word-break: break-word;
    }
    
    .info-item .value.code {
        font-family: monospace;
        color: #6b7280;
    }
    
    .card-actions {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }
    
    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }
        
        .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .header-actions {
            width: 100%;
        }
        
        .header-actions .btn {
            flex: 1;
        }
        
        .detail-grid {
            grid-template-columns: 1fr;
        }
        
        .form-container {
            padding: 1.5rem 1rem;
        }
    }
</style>

<script lang="ts">
    import { goto } from '$app/navigation';
    import { customerAPI } from '$lib/api';
    import type { Customer, CustomerFormData, CustomerQuotationBrief } from '$lib';
    import { usePartnerDetail, PARTNER_STATUS_LABELS, PARTNER_LEVEL_LABELS } from '$lib/composables/usePartnerDetail.svelte';
    import CustomerForm from '$lib/components/CustomerForm.svelte';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import { PartnerDetailHeader, PartnerInfoCard, OrdersSection, QuotationsSection } from '$lib/components/partner';
    
    interface Props {
        data: { customer: Customer };
    }
    
    let { data }: Props = $props();
    
    // 使用共享逻辑
    const partnerDetail = usePartnerDetail<Customer, CustomerQuotationBrief, any>({
        partnerId: data.customer.id,
        api: customerAPI,
        listPath: '/customer',
        orderPath: '/customer/sales-order/add',
        quotationPath: '/customer/quotation/add',
        orderListPath: '/customer/sales-order',
    });
    
    // 初始化
    partnerDetail.init(data.customer);
    
    function getOrderStatusClass(status: string): string {
        const map: Record<string, string> = {
            'draft': 'draft',
            'pending': 'pending',
            'approved': 'approved',
            'confirmed': 'confirmed',
            'partial': 'partial',
            'shipped': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled',
        };
        return map[status] || '';
    }
    
    function getStatusLabel(status: string): string {
        return PARTNER_STATUS_LABELS[status] || status;
    }
</script>

<svelte:head>
    <title>{partnerDetail.partner?.name} - 客户详情</title>
</svelte:head>

<div class="content-container">
    <Breadcrumb items={[
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customer' },
        { label: partnerDetail.partner?.name, href: `/customer/${partnerDetail.partner?.id}` },
    ]} />
    
    {#if partnerDetail.error}
        <Alert error={partnerDetail.error} onDismiss={() => partnerDetail.error = ''} />
    {/if}
    
    {#if partnerDetail.isEditing}
        <PartnerDetailHeader
            name={partnerDetail.partner?.name || ''}
            level={partnerDetail.partner?.level || ''}
            status={partnerDetail.partner?.status || ''}
            isEditing={true}
            levelLabel={''}
            statusLabel={''}
            onEdit={() => {}}
            onCancel={partnerDetail.handleCancel}
            onDelete={() => {}}
        />
        
        <div class="form-container">
            <CustomerForm
                onSubmit={partnerDetail.handleUpdate}
                onCancel={partnerDetail.handleCancel}
                initialData={partnerDetail.partner}
                submitLabel="保存修改"
                loading={partnerDetail.loading}
            />
        </div>
    {:else}
        <PartnerDetailHeader
            name={partnerDetail.partner?.name || ''}
            level={partnerDetail.partner?.level || ''}
            status={partnerDetail.partner?.status || ''}
            isEditing={false}
            levelLabel={PARTNER_LEVEL_LABELS[partnerDetail.partner?.level] || partnerDetail.partner?.level}
            statusLabel={partnerDetail.partner?.status === 'ACTIVE' ? '活跃' : '停用'}
            onEdit={() => partnerDetail.isEditing = true}
            onCancel={() => {}}
            onDelete={() => partnerDetail.showDeleteModal = true}
        />
        
        <div class="detail-grid">
            <PartnerInfoCard
                title="基本信息"
                items={[
                    { label: '客户编号', value: partnerDetail.partner?.code || '', isCode: true },
                    { label: '客户名称', value: partnerDetail.partner?.name || '' },
                    { label: '联系人', value: partnerDetail.partner?.contact_name || '' },
                    { label: '联系电话', value: partnerDetail.partner?.phone || '' },
                    { label: '电子邮箱', value: partnerDetail.partner?.email || '' },
                ]}
            />
            
            <PartnerInfoCard
                title="地址信息"
                items={[
                    { label: '主地址', value: partnerDetail.partner?.address || '' },
                    { label: '地址数量', value: `${partnerDetail.partner?.address_count || 0} 个` },
                ]}
            />
            
            <PartnerInfoCard
                title="其他信息"
                fullWidth={true}
                items={[
                    { label: '备注', value: partnerDetail.partner?.remark || '' },
                    { label: '创建时间', value: partnerDetail.formatDate(partnerDetail.partner?.created_at || '') },
                    { label: '更新时间', value: partnerDetail.formatDate(partnerDetail.partner?.updated_at || '') },
                ]}
            />
        </div>
        
        <OrdersSection
            title="最近销售订单"
            orders={partnerDetail.recentOrders}
            loading={partnerDetail.ordersLoading}
            emptyText="暂无销售订单"
            viewAllHref={`/customer/sales-order?customer_id=${partnerDetail.partner?.id}`}
            getStatusLabel={getStatusLabel}
            getStatusClass={getOrderStatusClass}
            onRowClick={(id) => goto(`/customer/sales-order/${id}`)}
        />
        
        <QuotationsSection
            title="销售报价记录"
            quotations={partnerDetail.quotations}
            loading={partnerDetail.quotationsLoading}
            emptyText="暂无报价记录"
            addHref={`/customer/quotation/add?customer_id=${partnerDetail.partner?.id}`}
            quotationQuantities={partnerDetail.quotationQuantities}
            onQuantityChange={(id, value) => partnerDetail.quotationQuantities = { ...partnerDetail.quotationQuantities, [id]: value }}
            onRowClick={(id) => goto(`/customer/quotation/${id}`)}
            onCreateOrder={partnerDetail.goToCreateOrder}
        />
    {/if}
</div>

<ConfirmModal
    isOpen={partnerDetail.showDeleteModal}
    title="删除客户"
    message="确定要删除以下客户吗？此操作不可撤销。"
    itemName={partnerDetail.partner?.name}
    confirmText="删除"
    cancelText="取消"
    loading={partnerDetail.deleteLoading}
    onConfirm={partnerDetail.handleDelete}
    onCancel={() => partnerDetail.showDeleteModal = false}
/>

<style>
    .content-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 1.5rem;
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
        margin-bottom: 2rem;
    }
    
    @media (max-width: 768px) {
        .content-container {
            padding: 0 1rem;
        }
        
        .detail-grid {
            grid-template-columns: 1fr;
        }
        
        .form-container {
            padding: 1.5rem 1rem;
        }
    }
</style>

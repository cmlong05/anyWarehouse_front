<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { supplierAPI } from '$lib/api';
    import type { Supplier, QuotationBrief } from '$lib';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { PageContainer, PageHeader } from '$lib/components/layout';
    import { NumberStepper } from '$lib/components/ui';
    
    let supplierId = $derived(parseInt(page.params.slug));
    
    let supplier = $state<Supplier | null>(null);
    let loading = $state(true);
    let quotations = $state<QuotationBrief[]>([]);
    let recentOrders = $state<any[]>([]);
    let quotationsLoading = $state(true);
    let ordersLoading = $state(true);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleteLoading = $state(false);
    let quotationQuantities = $state<Record<number, number | undefined>>({});
    
    async function loadSupplier() {
        loading = true;
        error = '';
        try {
            supplier = await supplierAPI.get(supplierId);
        } catch (err) {
            error = err instanceof Error ? err.message : '加载供应商失败';
            supplier = null;
        } finally {
            loading = false;
        }
    }
    
    const statusLabels: Record<string, string> = {
        'draft': '草稿', 'pending': '待审批', 'approved': '已批准',
        'ordered': '已下单', 'partial': '部分到货', 'received': '已完成', 'cancelled': '已取消'
    };
    
    function getStatusLabel(status: string): string {
        return statusLabels[status] || status;
    }
    
    async function loadQuotations() {
        if (!supplier) return;
        quotationsLoading = true;
        try {
            const result = await supplierAPI.getQuotations(supplier!.id);
            quotations = result.quotations || [];
        } catch (err) {
            console.error('加载报价失败:', err);
        } finally {
            quotationsLoading = false;
        }
    }
    
    async function loadRecentOrders() {
        if (!supplier) return;
        ordersLoading = true;
        try {
            const result = await supplierAPI.getRecentOrders(supplier!.id);
            recentOrders = result.orders || [];
        } catch (err) {
            console.error('加载最近订单失败:', err);
        } finally {
            ordersLoading = false;
        }
    }
    
    async function handleDelete() {
        if (!supplier) return;
        deleteLoading = true;
        error = '';
        try {
            await supplierAPI.delete(supplier!.id);
            goto('/supplier');
        } catch (err) {
            error = err instanceof Error ? err.message : '删除供应商失败';
            deleteLoading = false;
            showDeleteModal = false;
        }
    }
    
    function goToCreatePurchaseOrder() {
        if (!supplier) return;
        const selectedItems = quotations
            .filter(q => {
                const qty = quotationQuantities[q.id];
                return qty !== undefined && qty !== null && qty > 0;
            })
            .map(q => ({
                quotation_id: q.id,
                item: q.item,
                sku: q.sku,
                item_name: q.item_name,
                quantity: quotationQuantities[q.id],
                unit_price: parseFloat(q.price)
            }));
        
        if (selectedItems.length > 0) {
            sessionStorage.setItem('purchase_order_preload_items', JSON.stringify({
                supplier_id: supplier!.id,
                items: selectedItems
            }));
        }
        
        goto(`/supplier/purchase-order/add?supplier_id=${supplier!.id}`);
    }
    
    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString('zh-CN');
    }
    
    function getOrderStatusClass(status: string): string {
        const map: Record<string, string> = {
            'draft': 'draft', 'pending': 'pending', 'approved': 'approved',
            'ordered': 'ordered', 'partial': 'partial', 'received': 'received', 'cancelled': 'cancelled',
        };
        return map[status] || '';
    }
    
    $effect(() => {
        loadSupplier();
    });
    
    $effect(() => {
        if (supplier) {
            loadQuotations();
            loadRecentOrders();
        }
    });
</script>

<svelte:head>
    <title>{supplier?.name || '供应商详情'}</title>
</svelte:head>

<PageContainer maxWidth="lg">
    {#if loading}
        <Loading text="加载中..." />
    {:else if !supplier}
        <Alert error={error || "供应商不存在或已删除"} />
        <div class="mt-4">
            <a href="/supplier" class="btn btn-secondary">返回供应商列表</a>
        </div>
    {:else}
    <Breadcrumb items={[
        { label: '首页', href: '/' },
        { label: '供应商管理', href: '/supplier' },
        { label: supplier!.name, href: `/supplier/${supplier!.id}` },
    ]} />
    
    {#if error}
        <Alert error={error} onDismiss={() => error = ''} />
    {/if}
    
    <PageHeader title={supplier!.name} mb="md">
        {#snippet left()}
            <span class="status-badge {supplier!.is_active ? 'active' : 'inactive'}">
                {supplier!.is_active ? '活跃' : '停用'}
            </span>
        {/snippet}
        {#snippet actions()}
            <a href="/supplier/{supplier!.id}/edit" class="btn btn-secondary">编辑</a>
            <button class="btn btn-error" onclick={() => showDeleteModal = true}>删除</button>
        {/snippet}
    </PageHeader>
    
    <div class="detail-grid">
        <div class="info-card">
            <h3>基本信息</h3>
            <div class="info-list">
                <div class="info-item">
                    <span class="label">供应商编号</span>
                    <span class="value code">{supplier!.code}</span>
                </div>
                <div class="info-item">
                    <span class="label">联系人</span>
                    <span class="value">{supplier!.contact || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="label">联系电话</span>
                    <span class="value">{supplier!.telephone || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="label">电子邮箱</span>
                    <span class="value">{supplier!.e_mail || '-'}</span>
                </div>
            </div>
        </div>
        
        <div class="info-card">
            <h3>备注</h3>
            <div class="info-list">
                <div class="info-item">
                    <span class="value">{supplier!.remark || '-'}</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 最近采购订单 -->
    <div class="orders-section">
        <div class="section-header">
            <h2>最近采购订单</h2>
            <a href="/supplier/purchase-order?supplier_id={supplier!.id}" class="btn btn-primary btn-sm">查看全部</a>
        </div>
        
        {#if ordersLoading}
            <Loading text="加载订单..." />
        {:else if recentOrders.length === 0}
            <div class="empty-state-small"><p>暂无采购订单</p></div>
        {:else}
            <div class="orders-table">
                <table>
                    <thead>
                        <tr>
                            <th>订单号</th>
                            <th>下单日期</th>
                            <th>状态</th>
                            <th>金额</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each recentOrders as order}
                            <tr class="clickable" onclick={() => goto(`/supplier/purchase-order/${order.id}`)}>
                                <td class="code">{order.order_number}</td>
                                <td>{order.order_date}</td>
                                <td>
                                    <span class="status-tag {getOrderStatusClass(order.status)}">
                                        {getStatusLabel(order.status)}
                                    </span>
                                </td>
                                <td class="numeric">¥{Number(order.total_amount).toFixed(2)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
    
    <!-- 采购报价记录 -->
    <div class="quotations-section">
        <div class="section-header">
            <h2>采购报价记录</h2>
            <div class="section-actions">
                <button class="btn btn-success btn-sm" onclick={goToCreatePurchaseOrder}>新建采购订单</button>
                <a href="/supplier/quotation/add?supplier_id={supplier!.id}" class="btn btn-primary btn-sm">添加报价</a>
            </div>
        </div>
        
        {#if quotationsLoading}
            <Loading text="加载报价..." />
        {:else if quotations.length === 0}
            <div class="empty-state">
                <p>暂无报价记录</p>
                <a href="/supplier/quotation/add?supplier_id={supplier!.id}" class="btn btn-primary">添加第一个报价</a>
            </div>
        {:else}
            <div class="quotations-table">
                <table>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>物品名称</th>
                            <th>单价</th>
                            <th>货币</th>
                            <th class="numeric">数量</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each quotations as quotation}
                            <tr>
                                <td class="clickable" onclick={() => goto(`/supplier/quotation/${quotation.id}`)}>{quotation.sku || '-'}</td>
                                <td class="clickable" onclick={() => goto(`/supplier/quotation/${quotation.id}`)}>{quotation.item_name || '-'}</td>
                                <td class="numeric clickable" onclick={() => goto(`/supplier/quotation/${quotation.id}`)}>{quotation.price}</td>
                                <td class="clickable" onclick={() => goto(`/supplier/quotation/${quotation.id}`)}>{quotation.currency}</td>
                                <td class="numeric">
                                    <NumberStepper
                                        bind:value={quotationQuantities[quotation.id]}
                                        min={1}
                                        step={1}
                                        size="sm"
                                    />
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <div class="section-footer">
                <button class="btn btn-success btn-sm" onclick={goToCreatePurchaseOrder}>新建采购订单</button>
            </div>
        {/if}
    </div>
    
    <!-- 地址信息和其他信息 -->
    <div class="detail-grid">
        <div class="info-card">
            <h3>地址信息</h3>
            <div class="info-list">
                <div class="info-item">
                    <span class="label">主地址</span>
                    <span class="value">{supplier!.address || '-'}</span>
                </div>
            </div>
        </div>
        
        <div class="info-card">
            <h3>其他信息</h3>
            <div class="info-list">
                <div class="info-item">
                    <span class="label">创建时间</span>
                    <span class="value">{formatDate(supplier!.created_at)}</span>
                </div>
                <div class="info-item">
                    <span class="label">更新时间</span>
                    <span class="value">{formatDate(supplier!.updated_at)}</span>
                </div>
            </div>
        </div>
    </div>
    {/if}
</PageContainer>

<ConfirmModal
    isOpen={showDeleteModal}
    title="删除供应商"
    message="确定要删除以下供应商吗？此操作不可撤销。"
    itemName={supplier?.name}
    confirmText="删除"
    cancelText="取消"
    loading={deleteLoading}
    onConfirm={handleDelete}
    onCancel={() => showDeleteModal = false}
/>

<style>
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .status-badge.active { background-color: #d1fae5; color: #065f46; }
    .status-badge.inactive { background-color: #fee2e2; color: #991b1b; }
    
    .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .info-card {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .info-card.full-width { grid-column: 1 / -1; }
    
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
    
    .info-item .label { color: #6b7280; font-size: 0.875rem; flex-shrink: 0; }
    .info-item .value { color: #1f2937; text-align: right; word-break: break-word; }
    .info-item .value.code { font-family: monospace; color: #6b7280; }
    
    .orders-section, .quotations-section {
        padding: 1.5rem 0;
        border-top: 1px solid #e5e7eb;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #1f2937;
    }
    
    .section-actions { display: flex; gap: 0.5rem; }
    .section-footer { margin-top: 1.5rem; display: flex; justify-content: flex-end; }
    
    .empty-state-small { text-align: center; padding: 1.5rem 0; color: #6b7280; font-size: 0.9rem; }
    .empty-state { text-align: center; padding: 3rem 0; color: #6b7280; }
    .empty-state p { margin-bottom: 1rem; }
    
    .orders-table, .quotations-table { overflow-x: auto; }
    
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }
    
    th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }
    
    th { font-weight: 600; color: #374151; background-color: #f9fafb; }
    td { color: #4b5563; }
    
    .numeric { font-family: monospace; text-align: right; }
    .code { font-family: monospace; }
    .clickable { cursor: pointer; }
    .clickable:hover { background-color: #f3f4f6; }
    
    .status-tag {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .status-tag.draft { background-color: #f3f4f6; color: #4b5563; }
    .status-tag.pending { background-color: #fef3c7; color: #92400e; }
    .status-tag.approved { background-color: #dbeafe; color: #1e40af; }
    .status-tag.ordered { background-color: #d1fae5; color: #065f46; }
    .status-tag.partial { background-color: #fef3c7; color: #b45309; }
    .status-tag.received { background-color: #e0e7ff; color: #3730a3; }
    .status-tag.cancelled { background-color: #fee2e2; color: #991b1b; }
    
    @media (max-width: 768px) {
        .detail-grid { grid-template-columns: 1fr; }
    }
</style>

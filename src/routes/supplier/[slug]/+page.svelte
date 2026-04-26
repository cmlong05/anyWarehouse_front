<script lang="ts">
	import { logger } from '$lib/logger';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { supplierAPI } from '$lib/api';
    import type { PurchaseOrderBrief, Supplier, QuotationBrief } from '$lib';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { PageContainer } from '$lib/components/layout';
    import { PartnerDetailHeader, OrdersSection, QuotationsSection } from '$lib/components/partner';
    import { getPurchaseStatusClass as getOrderStatusClass, getPurchaseStatusLabel as getStatusLabel } from '$lib/utils/orderBadges';

    let supplierId = $derived(parseInt(page.params.slug || '0'));
    
    let supplier = $state<Supplier | null>(null);
    let loading = $state(true);
    let quotations = $state<QuotationBrief[]>([]);
    let recentOrders = $state<PurchaseOrderBrief[]>([]);
    let quotationsLoading = $state(true);
    let ordersLoading = $state(true);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleteLoading = $state(false);
    let quotationQuantities = $state<Record<number, number | null>>({});
    
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
    
    // 状态徽章已从 $lib/utils/orderBadges 导入
    
    async function loadQuotations() {
        if (!supplier) return;
        quotationsLoading = true;
        try {
            const result = await supplierAPI.getQuotations(supplier!.id);
            quotations = result.quotations || [];
        } catch (err) {
            logger.error('加载报价失败:', err);
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
            logger.error('加载最近订单失败:', err);
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
                sku: q.item_sku,
                item_name: q.item_name,
                quantity: quotationQuantities[q.id],
                unit_price: parseFloat(q.price)
            }));
        
        // 收集所有可用的报价价格信息（用于创建订单时显示真实报价）
        const allQuotationPrices: Record<string, { price: number; currency: string; item: number | null }> = {};
        quotations.forEach(q => {
            if (q.item_sku) {
                allQuotationPrices[q.item_sku] = {
                    price: parseFloat(q.price || '0'),
                    currency: q.currency || 'CNY',
                    item: q.item
                };
            }
        });
        
        if (selectedItems.length > 0) {
            sessionStorage.setItem('purchase_order_preload_items', JSON.stringify({
                supplier_id: supplier!.id,
                items: selectedItems,
                all_quotation_prices: allQuotationPrices
            }));
        }
        
        goto(`/supplier/purchase-order/add?supplier_id=${supplier!.id}`);
    }
    
    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString('zh-CN');
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
            <a href="/supplier" class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                返回供应商列表
            </a>
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
    
    <PartnerDetailHeader
        name={supplier!.name}
        level=""
        status={supplier!.is_active ? 'active' : 'inactive'}
        isEditing={false}
        levelLabel=""
        statusLabel={supplier!.is_active ? '活跃' : '停用'}
        onEdit={() => goto(`/supplier/${supplier!.id}/edit`)}
        onCancel={() => {}}
        onDelete={() => showDeleteModal = true}
    />
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium text-gray-700 pb-3 mb-4 border-b border-gray-200">基本信息</h3>
            <div class="flex flex-col gap-3">
                <div class="flex justify-between items-start gap-4">
                    <span class="text-gray-500 text-sm flex-shrink-0">供应商编号</span>
                    <span class="text-gray-900 text-right font-mono text-gray-600">{supplier!.code}</span>
                </div>
                <div class="flex justify-between items-start gap-4">
                    <span class="text-gray-500 text-sm flex-shrink-0">联系人</span>
                    <span class="text-gray-900 text-right">{supplier!.contact_name || '-'}</span>
                </div>
                <div class="flex justify-between items-start gap-4">
                    <span class="text-gray-500 text-sm flex-shrink-0">联系电话</span>
                    <span class="text-gray-900 text-right">{supplier!.phone || '-'}</span>
                </div>
                <div class="flex justify-between items-start gap-4">
                    <span class="text-gray-500 text-sm flex-shrink-0">电子邮箱</span>
                    <span class="text-gray-900 text-right">{supplier!.email || '-'}</span>
                </div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium text-gray-700 pb-3 mb-4 border-b border-gray-200">备注</h3>
            <div class="flex flex-col gap-3">
                <div class="flex justify-between items-start gap-4">
                    <span class="text-gray-900 text-right">{supplier!.remark || '-'}</span>
                </div>
            </div>
        </div>
    </div>
    
    <OrdersSection
        title="最近采购订单"
        orders={recentOrders}
        loading={ordersLoading}
        emptyText="暂无采购订单"
        viewAllHref={`/supplier/purchase-order?supplier_id=${supplier!.id}`}
        getStatusLabel={getStatusLabel}
        getStatusClass={getOrderStatusClass}
        onRowClick={(id) => goto(`/supplier/purchase-order/${id}`)}
    />
    
    <!-- 采购报价记录 -->
    <QuotationsSection
        title="采购报价记录"
        quotations={quotations}
        loading={quotationsLoading}
        emptyText="暂无报价记录"
        addHref={`/supplier/quotation/add?supplier_id=${supplier!.id}`}
        currency={supplier?.currency}
        quotationQuantities={quotationQuantities}
        onQuantityChange={(id, value) => quotationQuantities[id] = value}
        onRowClick={(id) => goto(`/supplier/quotation/${id}`)}
        onCreateOrder={goToCreatePurchaseOrder}
    />
    
    <!-- 地址信息和其他信息 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium text-gray-700 pb-3 mb-4 border-b border-gray-200">地址信息</h3>
            <div class="flex flex-col gap-3">
                <div class="flex justify-between items-start gap-4">
                    <span class="text-gray-500 text-sm flex-shrink-0">主地址</span>
                    <span class="text-gray-900 text-right">{supplier!.address || '-'}</span>
                </div>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium text-gray-700 pb-3 mb-4 border-b border-gray-200">其他信息</h3>
            <div class="flex flex-col gap-3">
                <div class="flex justify-between items-start gap-4">
                    <span class="text-gray-500 text-sm flex-shrink-0">创建时间</span>
                    <span class="text-gray-900 text-right">{formatDate(supplier!.created_at)}</span>
                </div>
                <div class="flex justify-between items-start gap-4">
                    <span class="text-gray-500 text-sm flex-shrink-0">更新时间</span>
                    <span class="text-gray-900 text-right">{formatDate(supplier!.updated_at)}</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 底部操作区 -->
    {#if supplier}
        <div class="mt-8 pt-6 border-t border-gray-200 flex justify-start">
            <button class="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors" onclick={() => showDeleteModal = true}>删除供应商</button>
        </div>
    {/if}
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

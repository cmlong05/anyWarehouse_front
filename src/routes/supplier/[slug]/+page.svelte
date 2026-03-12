<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { supplierAPI } from '$lib/api';
    import type { Supplier, QuotationBrief } from '$lib';
    import Alert from '$lib/components/Alert.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import Loading from '$lib/components/Loading.svelte';
    import { PageContainer } from '$lib/components/layout';
    import { PartnerDetailHeader, QuotationsSection } from '$lib/components/partner';
    import { PARTNER_LEVEL_LABELS } from '$lib/composables/usePartnerDetail.svelte';
    
    let supplierId = $derived(parseInt(page.params.slug || '0'));
    
    let supplier = $state<Supplier | null>(null);
    let loading = $state(true);
    let quotations = $state<QuotationBrief[]>([]);
    let recentOrders = $state<any[]>([]);
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
        
        // 收集所有可用的报价价格信息（用于创建订单时显示真实报价）
        const allQuotationPrices: Record<string, { price: number; currency: string; item: number | null }> = {};
        quotations.forEach(q => {
            if (q.sku) {
                allQuotationPrices[q.sku] = {
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
    
    function getOrderStatusClass(status: string): string {
        const map: Record<string, string> = {
            'draft': 'bg-gray-100 text-gray-700',
            'pending': 'bg-amber-100 text-amber-700',
            'approved': 'bg-blue-100 text-blue-700',
            'ordered': 'bg-emerald-100 text-emerald-700',
            'partial': 'bg-amber-100 text-amber-700',
            'received': 'bg-indigo-100 text-indigo-700',
            'cancelled': 'bg-red-100 text-red-700',
        };
        return map[status] || 'bg-gray-100 text-gray-700';
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
    
    <!-- 最近采购订单 -->
    <div class="py-6 border-t border-gray-200">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-900">最近采购订单</h2>
            <a href="/supplier/purchase-order?supplier_id={supplier!.id}" class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
                查看全部
            </a>
        </div>
        
        {#if ordersLoading}
            <Loading text="加载订单..." />
        {:else if recentOrders.length === 0}
            <div class="text-center py-6 text-gray-500 text-sm"><p>暂无采购订单</p></div>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">订单号</th>
                            <th class="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">下单日期</th>
                            <th class="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">状态</th>
                            <th class="px-4 py-3 text-right font-semibold text-gray-700 border-b border-gray-200">金额</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each recentOrders as order}
                            <tr class="cursor-pointer hover:bg-gray-50 transition-colors" onclick={() => goto(`/supplier/purchase-order/${order.id}`)}>
                                <td class="px-4 py-3 font-mono text-gray-600 border-b border-gray-200">{order.order_number}</td>
                                <td class="px-4 py-3 text-gray-600 border-b border-gray-200">{order.order_date}</td>
                                <td class="px-4 py-3 border-b border-gray-200">
                                    <span class="inline-block px-2 py-0.5 rounded text-xs font-medium {getOrderStatusClass(order.status)}">
                                        {getStatusLabel(order.status)}
                                    </span>
                                </td>
                                <td class="px-4 py-3 font-mono text-right border-b border-gray-200">¥{Number(order.total_amount).toFixed(2)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
    
    <!-- 采购报价记录 -->
    <QuotationsSection
        title="采购报价记录"
        quotations={quotations}
        loading={quotationsLoading}
        emptyText="暂无报价记录"
        addHref={`/supplier/quotation/add?supplier_id=${supplier!.id}`}
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

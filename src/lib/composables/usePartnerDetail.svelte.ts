/**
 * 合作伙伴（客户/供应商）详情页共享逻辑
 */
import { goto } from '$app/navigation';

export interface PartnerDetailOptions<T, Q, O> {
    partnerId: number;
    api: {
        get: (id: number) => Promise<T>;
        update: (id: number, data: Partial<T>) => Promise<T>;
        delete: (id: number) => Promise<void>;
        getQuotations: (id: number) => Promise<{ quotations?: Q[]; results?: Q[] } | Q[]>;
        getRecentOrders: (id: number) => Promise<{ orders?: O[] } | O[]>;
    };
    listPath: string;
    orderPath: string;
    quotationPath: string;
    orderListPath: string;
}

export const PARTNER_STATUS_LABELS: Record<string, string> = {
    'draft': '草稿',
    'pending': '待审批',
    'approved': '已批准',
    'confirmed': '已确认',
    'partial': '部分发货',
    'shipped': '已发货',
    'delivered': '已交付',
    'cancelled': '已取消',
    'ordered': '已下单',
    'received': '已完成',
};

export const PARTNER_LEVEL_LABELS: Record<string, string> = {
    'VIP': 'VIP客户',
    'NORMAL': '普通客户',
    'TEMP': '临时客户',
    'A': 'A级供应商',
    'B': 'B级供应商',
    'C': 'C级供应商',
};

export function usePartnerDetail<T extends { id: number; name: string; level: string; status: string }, Q extends { id: number; item?: number | null; sku?: string | null; item_name?: string | null; price?: string | null; currency?: string | null }, O extends { id: number; order_number?: string | null; order_date?: string | null; status?: string | null; total_amount?: string | null }>(
    options: PartnerDetailOptions<T, Q, O>
) {
    let partner = $state<T>(null as unknown as T);
    let quotations = $state<Q[]>([]);
    let recentOrders = $state<O[]>([]);
    let isEditing = $state(false);
    let loading = $state(false);
    let quotationsLoading = $state(true);
    let ordersLoading = $state(true);
    let error = $state('');
    let showDeleteModal = $state(false);
    let deleteLoading = $state(false);
    
    // 报价数量输入
    let quotationQuantities = $state<Record<number, number | null>>({});

    async function loadQuotations() {
        quotationsLoading = true;
        try {
            const result = await options.api.getQuotations(options.partnerId);
            if (Array.isArray(result)) {
                quotations = result;
            } else if (result.quotations) {
                quotations = result.quotations;
            } else if (result.results) {
                quotations = result.results;
            } else {
                quotations = [];
            }
        } catch (err) {
            console.error('加载报价失败:', err);
        } finally {
            quotationsLoading = false;
        }
    }

    async function loadRecentOrders() {
        ordersLoading = true;
        try {
            const result = await options.api.getRecentOrders(options.partnerId);
            recentOrders = Array.isArray(result) ? result : ((result as any).orders || []);
        } catch (err) {
            console.error('加载最近订单失败:', err);
        } finally {
            ordersLoading = false;
        }
    }

    async function handleUpdate(data: Partial<T>) {
        loading = true;
        error = '';
        
        try {
            const updated = await options.api.update(options.partnerId, data);
            partner = updated;
            isEditing = false;
        } catch (err) {
            error = err instanceof Error ? err.message : '更新失败';
        } finally {
            loading = false;
        }
    }

    async function handleDelete() {
        deleteLoading = true;
        error = '';
        
        try {
            await options.api.delete(options.partnerId);
            goto(options.listPath);
        } catch (err) {
            error = err instanceof Error ? err.message : '删除失败';
            deleteLoading = false;
            showDeleteModal = false;
        }
    }

    function handleCancel() {
        isEditing = false;
        error = '';
    }

    function goToCreateOrder() {
        // 清除可能存在的复制订单数据，避免新建订单时显示"复制自订单"
        sessionStorage.removeItem('sales_order_copy_data');
        
        // 收集选中的项目（数量>0）
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
                unit_price: parseFloat(q.price || '0')
            }));
        
        // 收集所有可用的报价信息（包括未选中的变体，用于创建订单时显示真实报价）
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
            sessionStorage.setItem('sales_order_preload_items', JSON.stringify({
                partner_id: options.partnerId,
                items: selectedItems,
                all_quotation_prices: allQuotationPrices
            }));
        }
        
        goto(`${options.orderPath}?customer_id=${options.partnerId}`);
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString('zh-CN');
    }

    function getStatusLabel(status: string): string {
        return PARTNER_STATUS_LABELS[status] || status;
    }

    function getLevelLabel(level: string): string {
        return PARTNER_LEVEL_LABELS[level] || level;
    }

    function init(p: T) {
        partner = p;
        loadQuotations();
        loadRecentOrders();
    }

    return {
        // 状态
        get partner() { return partner; },
        set partner(value) { partner = value; },
        get quotations() { return quotations; },
        get recentOrders() { return recentOrders; },
        get isEditing() { return isEditing; },
        set isEditing(value) { isEditing = value; },
        get loading() { return loading; },
        get quotationsLoading() { return quotationsLoading; },
        get ordersLoading() { return ordersLoading; },
        get error() { return error; },
        set error(value) { error = value; },
        get showDeleteModal() { return showDeleteModal; },
        set showDeleteModal(value) { showDeleteModal = value; },
        get deleteLoading() { return deleteLoading; },
        get quotationQuantities() { return quotationQuantities; },
        set quotationQuantities(value) { quotationQuantities = value; },
        
        // 方法
        init,
        loadQuotations,
        loadRecentOrders,
        handleUpdate,
        handleDelete,
        handleCancel,
        goToCreateOrder,
        formatDate,
        getStatusLabel,
        getLevelLabel,
        
        // 配置
        listPath: options.listPath,
        orderPath: options.orderPath,
        quotationPath: options.quotationPath,
        orderListPath: options.orderListPath,
    };
}

/**
 * 订单列表 Composable
 * 
 * 提供采购订单和销售订单列表页面共享的逻辑
 */
import type { PaginatedResponse } from '$lib/api/base';

export interface ListFilters {
    status?: string;
    priority?: string;
    order_number?: string;
    date_from?: string;
    date_to?: string;
    [key: string]: string | undefined;
}

export interface UseOrderListOptions<B> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api: {
        listBrief: (params?: Record<string, unknown>) => Promise<PaginatedResponse<B>>;
        delete: (id: number) => Promise<void>;
    };
    initialFilters?: ListFilters;
    filterMapping?: Record<string, string>;
    onError?: (message: string) => void;
}

export interface PaginationState {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

/**
 * 创建订单列表状态管理
 */
export function useOrderList<B>(
    options: UseOrderListOptions<B>
) {
    const { api, initialFilters = {}, filterMapping = {}, onError } = options;
    
    // 数据状态
    let items = $state<B[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    
    // 筛选条件
    let filters = $state<ListFilters>({ ...initialFilters });
    
    // 分页状态 - 使用普通变量而非 $state 允许外部修改
    let currentPage = $state(1);
    let pageSizeState = $state(20);
    let totalCount = $state(0);
    let totalPages = $derived(Math.ceil(totalCount / pageSizeState));
    
    // Page setter for external use
    function setPage(p: number) {
        currentPage = p;
    }
    
    // Error setter for external use
    function setError(msg: string | null) {
        error = msg;
    }
    
    /**
     * 构建查询参数
     */
    function buildQueryParams(): Record<string, unknown> {
        const params: Record<string, unknown> = {
            page: currentPage,
            page_size: pageSizeState,
        };
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                // 应用字段映射
                const mappedKey = filterMapping[key] || key;
                params[mappedKey] = value;
            }
        });
        
        return params;
    }
    
    /**
     * 加载数据
     */
    async function loadData(): Promise<void> {
        loading = true;
        error = null;
        
        try {
            const params = buildQueryParams();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await (api as any).listBrief(params);
            
            items = response.results as B[];
            totalCount = response.count;
        } catch (err: any) {
            const message = err.message || '加载数据失败';
            error = message;
            onError?.(message);
            console.error('Load error:', err);
        } finally {
            loading = false;
        }
    }
    
    /**
     * 删除订单
     */
    async function deleteItem(id: number, confirmMessage = '确定要删除此订单吗？'): Promise<boolean> {
        if (!confirm(confirmMessage)) return false;
        
        try {
            await api.delete(id);
            await loadData();
            return true;
        } catch (err: any) {
            const message = err.message || '删除订单失败';
            error = message;
            onError?.(message);
            console.error('Delete error:', err);
            return false;
        }
    }
    
    /**
     * 应用筛选（重置到第一页）
     */
    function applyFilters(): void {
        currentPage = 1;
        loadData();
    }
    
    /**
     * 重置筛选条件
     */
    function resetFilters(): void {
        filters = { ...initialFilters };
        currentPage = 1;
        loadData();
    }
    
    /**
     * 跳转到指定页
     */
    function goToPage(p: number): void {
        if (p < 1 || p > totalPages) return;
        currentPage = p;
        loadData();
    }
    
    /**
     * 更新筛选条件
     */
    function updateFilter(key: string, value: string): void {
        filters[key] = value;
    }
    
    /**
     * 设置筛选条件（批量）
     */
    function setFilters(newFilters: ListFilters): void {
        filters = { ...newFilters };
    }
    
    return {
        // 状态 - 使用 getter/setter 确保响应性
        get items() { return items; },
        get loading() { return loading; },
        get error() { return error; },
        get filters() { return filters; },
        set filters(value) { filters = value; },
        get page() { return currentPage; },
        set page(value) { currentPage = value; },
        get pageSize() { return pageSizeState; },
        set pageSize(value) { pageSizeState = value; },
        get totalCount() { return totalCount; },
        get totalPages() { return totalPages; },
        
        // 方法
        loadData,
        deleteItem,
        applyFilters,
        resetFilters,
        goToPage,
        updateFilter,
        setFilters,
        setPage,
        setError,
    };
}

/**
 * 创建 URL 参数同步
 */
export function useUrlParamsSync(
    filters: ListFilters,
    updateFilter: (key: string, value: string) => void,
    pageStore: { url: URL }
): void {
    $effect(() => {
        const url = pageStore.url;
        Object.keys(filters).forEach(key => {
            const value = url.searchParams.get(key);
            if (value && filters[key] !== value) {
                updateFilter(key, value);
            }
        });
    });
}

/**
 * 标准订单状态选项
 */
export const ORDER_STATUS_OPTIONS = {
    purchase: [
        { value: '', label: '全部状态' },
        { value: 'draft', label: '草稿' },
        { value: 'pending', label: '待审批' },
        { value: 'approved', label: '已批准' },
        { value: 'ordered', label: '已下单' },
        { value: 'partial', label: '部分到货' },
        { value: 'received', label: '已完成' },
        { value: 'cancelled', label: '已取消' },
    ],
    sales: [
        { value: '', label: '全部状态' },
        { value: 'draft', label: '草稿' },
        { value: 'pending', label: '待审批' },
        { value: 'approved', label: '已批准' },
        { value: 'confirmed', label: '已确认' },
        { value: 'partial', label: '部分发货' },
        { value: 'shipped', label: '已发货' },
        { value: 'delivered', label: '已完成' },
        { value: 'cancelled', label: '已取消' },
    ],
};

/**
 * 标准优先级选项
 */
export const PRIORITY_OPTIONS = [
    { value: '', label: '全部优先级' },
    { value: 'low', label: '低' },
    { value: 'normal', label: '普通' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
];

/**
 * 标准状态映射（采购订单）
 */
export const PURCHASE_STATUS_MAP: Record<string, { label: string; class: string }> = {
    draft: { label: '草稿', class: 'badge-ghost' },
    pending: { label: '待审批', class: 'badge-warning' },
    approved: { label: '已批准', class: 'badge-info' },
    ordered: { label: '已下单', class: 'badge-primary' },
    partial: { label: '部分到货', class: 'badge-success' },
    received: { label: '已完成', class: 'badge-primary' },
    cancelled: { label: '已取消', class: 'badge-error' },
};

/**
 * 标准状态映射（销售订单）
 */
export const SALES_STATUS_MAP: Record<string, { label: string; class: string }> = {
    draft: { label: '草稿', class: 'badge-ghost' },
    pending: { label: '待审批', class: 'badge-warning' },
    approved: { label: '已批准', class: 'badge-info' },
    confirmed: { label: '已确认', class: 'badge-primary' },
    partial: { label: '部分发货', class: 'badge-success' },
    shipped: { label: '已发货', class: 'badge-success' },
    delivered: { label: '已完成', class: 'badge-primary' },
    cancelled: { label: '已取消', class: 'badge-error' },
};

/**
 * 优先级映射
 */
export const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
    low: { label: '低', class: 'badge-ghost' },
    normal: { label: '普通', class: 'badge-info' },
    high: { label: '高', class: 'badge-warning' },
    urgent: { label: '紧急', class: 'badge-error' },
};

/**
 * 优先级标签映射（简单版）
 */
export const PRIORITY_LABEL_MAP: Record<string, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
};

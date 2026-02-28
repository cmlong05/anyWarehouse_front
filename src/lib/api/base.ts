/**
 * API 基类
 * 
 * 提供通用的 CRUD 操作，所有具体 API 类都应继承此类。
 */
import { apiClient, type ApiClient, type ApiError } from './client';

export { apiClient, type ApiClient, type ApiError };

/** 分页响应接口 */
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/** 查询参数类型 */
export type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * API 基类
 * 
 * @template T 实体类型
 * @template TCreate 创建请求类型
 * @template TUpdate 更新请求类型（默认为 Partial<TCreate>）
 */
export abstract class BaseAPI<T, TCreate, TUpdate = Partial<TCreate>> {
    protected client: ApiClient;
    protected basePath: string;

    /**
     * 创建 API 实例
     * @param basePath API 基础路径（如 '/supplier/suppliers/'）
     * @param client ApiClient 实例（可选，默认使用全局实例）
     */
    constructor(basePath: string, client: ApiClient = apiClient) {
        this.client = client;
        this.basePath = basePath;
    }

    /**
     * 构建查询参数字符串
     * @param params 查询参数对象
     * @returns URLSearchParams 对象
     */
    protected buildQueryParams(params?: QueryParams): Record<string, string> | undefined {
        if (!params) return undefined;
        
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                result[key] = String(value);
            }
        }
        return Object.keys(result).length > 0 ? result : undefined;
    }

    /**
     * 获取列表
     * @param params 查询参数
     * @returns 分页响应
     */
    async list(params?: QueryParams): Promise<PaginatedResponse<T>> {
        return this.client.get<PaginatedResponse<T>>(this.basePath, this.buildQueryParams(params));
    }

    /**
     * 获取单个实体
     * @param id 实体 ID
     * @returns 实体详情
     */
    async get(id: number): Promise<T> {
        return this.client.get<T>(`${this.basePath}${id}/`);
    }

    /**
     * 创建实体
     * @param data 创建数据
     * @returns 创建的实体
     */
    async create(data: TCreate): Promise<T> {
        return this.client.post<T>(this.basePath, data);
    }

    /**
     * 更新实体（完整更新）
     * @param id 实体 ID
     * @param data 更新数据
     * @returns 更新后的实体
     */
    async update(id: number, data: TUpdate): Promise<T> {
        return this.client.put<T>(`${this.basePath}${id}/`, data);
    }

    /**
     * 部分更新实体
     * @param id 实体 ID
     * @param data 部分更新数据
     * @returns 更新后的实体
     */
    async patch(id: number, data: Partial<TUpdate>): Promise<T> {
        return this.client.patch<T>(`${this.basePath}${id}/`, data);
    }

    /**
     * 删除实体
     * @param id 实体 ID
     */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`${this.basePath}${id}/`);
    }
}

/**
 * 订单 API 基类
 * 
 * 专门用于采购订单和销售订单的通用 API 基类
 */
export abstract class BaseOrderAPI<T, TCreate, TUpdate, TItem, TStatistics, TSummary> extends BaseAPI<T, TCreate, TUpdate> {
    /**
     * 添加订单明细
     * @param orderId 订单 ID
     * @param data 明细数据
     * @returns 创建的明细
     */
    async addItem(orderId: number, data: unknown): Promise<TItem> {
        return this.client.post<TItem>(`${this.basePath}${orderId}/add_item/`, data);
    }

    /**
     * 更新订单明细
     * @param orderId 订单 ID
     * @param itemId 明细 ID
     * @param data 更新数据
     * @returns 更新后的明细
     */
    async updateItem(orderId: number, itemId: number, data: Record<string, unknown>): Promise<TItem> {
        return this.client.patch<TItem>(`${this.basePath}${orderId}/update_item/`, {
            item_id: itemId,
            ...data
        });
    }

    /**
     * 删除订单明细
     * @param orderId 订单 ID
     * @param itemId 明细 ID
     */
    async removeItem(orderId: number, itemId: number): Promise<void> {
        return this.client.post<void>(`${this.basePath}${orderId}/remove_item/`, { item_id: itemId });
    }

    /**
     * 变更订单状态
     * @param orderId 订单 ID
     * @param status 新状态
     * @param notes 备注（可选）
     * @returns 更新后的订单
     */
    async changeStatus(orderId: number, status: string, notes?: string): Promise<T> {
        return this.client.post<T>(`${this.basePath}${orderId}/change_status/`, {
            status,
            notes
        });
    }

    /**
     * 获取订单统计信息
     * @param orderId 订单 ID
     * @returns 统计数据
     */
    async getStatistics(orderId: number): Promise<TStatistics> {
        return this.client.get<TStatistics>(`${this.basePath}${orderId}/statistics/`);
    }

    /**
     * 获取订单汇总统计
     * @returns 汇总数据
     */
    async getSummary(): Promise<TSummary> {
        return this.client.get<TSummary>(`${this.basePath}summary/`);
    }
}

import { config } from './config';
import type { 
    Component, 
    ComponentDetail, 
    ComponentCreateRequest,
    BOMDetailResponse,
    BOMTreeResponse,
    TotalComponentsResponse,
    WhereUsedResponse
} from './index';

export interface ApiError {
    message: string;
    status: number;
    code?: string;
}

export class ApiClient {
    private baseURL: string;
    private timeout: number;

    constructor(baseURL: string = config.API_BASE_URL, timeout: number = 30000) {
        this.baseURL = baseURL;
        this.timeout = timeout;
    }

    private async request<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error: ApiError = {
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    status: response.status,
                };
                
                try {
                    const errorData = await response.json();
                    error.message = errorData.message || error.message;
                    error.code = errorData.code;
                } catch {
                    // 如果无法解析错误响应，使用默认错误信息
                }

                throw error;
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw {
                        message: '请求超时',
                        status: 408,
                        code: 'TIMEOUT'
                    } as ApiError;
                }
            }
            
            throw error;
        }
    }

    async get<T>(url: string, params?: Record<string, string>): Promise<T> {
        const searchParams = params ? new URLSearchParams(params) : null;
        const fullUrl = searchParams ? `${url}?${searchParams}` : url;
        
        return this.request<T>(fullUrl, {
            method: 'GET',
        });
    }

    async post<T>(url: string, data?: any): Promise<T> {
        return this.request<T>(url, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(url: string, data?: any): Promise<T> {
        return this.request<T>(url, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(url: string, data?: any): Promise<T> {
        return this.request<T>(url, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(url: string): Promise<T> {
        return this.request<T>(url, {
            method: 'DELETE',
        });
    }

    /** 删除请求 - 不解析响应体（用于返回 204 No Content 的接口） */
    async deleteNoContent(url: string): Promise<void> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                method: 'DELETE',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error: ApiError = {
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    status: response.status,
                };
                throw error;
            }
            // 不解析响应体，直接返回
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
}

// ========== Component (BOM) API 组件管理接口 ==========

export class ComponentAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取所有组件关系列表 */
    async list(): Promise<ComponentDetail[]> {
        return this.client.get<ComponentDetail[]>('/product/components/');
    }

    /** 获取单个组件关系详情 */
    async get(id: number): Promise<ComponentDetail> {
        return this.client.get<ComponentDetail>(`/product/components/${id}/`);
    }

    /** 创建组件关系 */
    async create(data: ComponentCreateRequest): Promise<Component> {
        return this.client.post<Component>('/product/components/', data);
    }

    /** 更新组件关系 */
    async update(id: number, data: Partial<ComponentCreateRequest>): Promise<Component> {
        return this.client.put<Component>(`/product/components/${id}/`, data);
    }

    /** 部分更新组件关系 */
    async patch(id: number, data: Partial<ComponentCreateRequest>): Promise<Component> {
        return this.client.patch<Component>(`/product/components/${id}/`, data);
    }

    /** 删除组件关系 */
    async delete(id: number): Promise<void> {
        return this.client.deleteNoContent(`/product/components/${id}/`);
    }

    /** 根据父物品获取所有组件 */
    async getByParent(parentId: number): Promise<ComponentDetail[]> {
        return this.client.get<ComponentDetail[]>('/product/components/by_parent/', { parent_id: parentId.toString() });
    }

    /** 根据子物品获取所有使用关系（逆向查询） */
    async getByChild(childId: number): Promise<ComponentDetail[]> {
        return this.client.get<ComponentDetail[]>('/product/components/by_child/', { child_id: childId.toString() });
    }
}

// ========== Item BOM API 物品BOM接口 ==========

export class ItemBOMAPI {
    private client: ApiClient;

    constructor(client: ApiClient = apiClient) {
        this.client = client;
    }

    /** 获取物品的完整BOM信息 */
    async getBOMDetail(itemId: number): Promise<BOMDetailResponse> {
        return this.client.get<BOMDetailResponse>(`/product/item/${itemId}/bom_detail/`);
    }

    /** 获取BOM树结构 */
    async getBOMTree(itemId: number, maxLevel: number = 10): Promise<BOMTreeResponse> {
        return this.client.get<BOMTreeResponse>(`/product/item/${itemId}/bom_tree/`, { max_level: maxLevel.toString() });
    }

    /** 计算物料总需求 */
    async getTotalComponents(itemId: number): Promise<TotalComponentsResponse> {
        return this.client.get<TotalComponentsResponse>(`/product/item/${itemId}/total_components/`);
    }

    /** 查询物品被用在哪些地方（逆向BOM） */
    async getWhereUsed(itemId: number): Promise<WhereUsedResponse> {
        return this.client.get<WhereUsedResponse>(`/product/item/${itemId}/where_used/`);
    }
}

// 默认 API 客户端实例
export const apiClient = new ApiClient();

// 组件API实例
export const componentAPI = new ComponentAPI();
export const itemBOMAPI = new ItemBOMAPI();

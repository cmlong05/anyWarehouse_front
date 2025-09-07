import { config } from './config';

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
}

// 默认 API 客户端实例
export const apiClient = new ApiClient();

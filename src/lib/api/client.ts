/**
 * HTTP 客户端
 * 
 * 提供基础的 HTTP 请求功能
 */
import { config } from '$lib/config';

export interface ApiError {
    message: string;
    status: number;
    code?: string;
}

/**
 * 解析 DRF 错误响应为人类可读字符串
 * 支持格式：
 *   { detail: "msg" }
 *   { field: ["msg1", "msg2"] }
 *   { non_field_errors: ["msg"] }
 *   { message: "msg" }
 */
function parseDrfError(data: any): string {
    if (!data || typeof data !== 'object') return '';

    // DRF 通用错误 / 自定义 exception_handler
    if (typeof data.detail === 'string') return data.detail;

    // 自定义 message 字段
    if (typeof data.message === 'string') return data.message;

    // 字段级别错误：拼接所有字段的错误信息
    const messages: string[] = [];
    for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
            const fieldMsgs = value
                .map((v: any) => {
                    const s = typeof v === 'string' ? v : JSON.stringify(v);
                    // 将 DRF UniqueTogetherValidator 英文报错翻译为友好中文
                    if (s.includes('must make a unique set')) {
                        return '该记录已存在，请勿重复提交';
                    }
                    return s;
                })
                .join('；');
            if (key === 'non_field_errors') {
                messages.push(fieldMsgs);
            } else {
                messages.push(`${key}: ${fieldMsgs}`);
            }
        } else if (typeof value === 'string') {
            messages.push(`${key}: ${value}`);
        }
    }
    return messages.join('\n');
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
        options: RequestInit = {},
        isFormData: boolean = false
    ): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const headers: Record<string, string> = {};
            // 只有非 FormData 请求才设置 Content-Type
            if (!isFormData) {
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${this.baseURL}${url}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    ...headers,
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
                    error.message = parseDrfError(errorData) || error.message;
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

    async post<T>(url: string, data?: unknown, isFormData: boolean = false): Promise<T> {
        return this.request<T>(url, {
            method: 'POST',
            body: data ? (isFormData ? data as FormData : JSON.stringify(data)) : undefined,
        }, isFormData);
    }

    async put<T>(url: string, data?: unknown, isFormData: boolean = false): Promise<T> {
        return this.request<T>(url, {
            method: 'PUT',
            body: data ? (isFormData ? data as FormData : JSON.stringify(data)) : undefined,
        }, isFormData);
    }

    async patch<T>(url: string, data?: unknown, isFormData: boolean = false): Promise<T> {
        return this.request<T>(url, {
            method: 'PATCH',
            body: data ? (isFormData ? data as FormData : JSON.stringify(data)) : undefined,
        }, isFormData);
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

// 默认 API 客户端实例
export const apiClient = new ApiClient();

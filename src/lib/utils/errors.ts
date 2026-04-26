/**
 * 通用错误处理工具
 */

/**
 * 从 unknown 类型的错误中提取可读消息。
 * 用法：catch (err) { showToast(getErrorMessage(err)); }
 */
export function getErrorMessage(error: unknown, fallback = '未知错误'): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
        const msg = (error as { message?: unknown }).message;
        if (typeof msg === 'string') return msg;
    }
    return fallback;
}

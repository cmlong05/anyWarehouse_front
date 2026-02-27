/**
 * 工具函数库
 */

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的字符串
 */
export function formatDate(date: string | Date | undefined | null): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化日期（仅日期部分）
 * @param date 日期字符串或Date对象
 * @returns 格式化后的字符串
 */
export function formatDateOnly(date: string | Date | undefined | null): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 格式化金额
 * @param amount 金额
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatMoney(amount: number | string | undefined | null, decimals: number = 2): string {
    if (amount === undefined || amount === null) return '-';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '-';
    return num.toFixed(decimals);
}

/**
 * 安全解析浮点数
 * @param value 要解析的值
 * @param defaultValue 默认值
 * @returns 解析后的数字，如果解析失败则返回默认值
 */
export function safeParseFloat(value: string | number | null | undefined, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? defaultValue : num;
}

/**
 * 安全解析整数
 * @param value 要解析的值
 * @param defaultValue 默认值
 * @returns 解析后的整数，如果解析失败则返回默认值
 */
export function safeParseInt(value: string | number | null | undefined, defaultValue: number = 0): number {
    const floatVal = safeParseFloat(value, defaultValue);
    return Math.floor(floatVal);
}

/**
 * 格式化工具函数
 */

/**
 * 格式化日期时间
 * @param date 日期字符串或 Date 对象
 * @returns 格式化后的字符串 (YYYY-MM-DD HH:mm)
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
 * @param date 日期字符串或 Date 对象
 * @returns 格式化后的字符串 (YYYY-MM-DD)
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
 * 格式化日期时间（完整格式）
 * @param date 日期字符串或 Date 对象
 * @returns 格式化后的字符串 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDateTime(date: string | Date | undefined | null): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化金额
 * @param amount 金额
 * @param decimals 小数位数，默认 2
 * @param currency 货币符号，默认 '¥'
 * @returns 格式化后的字符串
 */
export function formatMoney(
    amount: number | string | undefined | null,
    decimals: number = 2,
    currency: string = '¥'
): string {
    if (amount === undefined || amount === null) return '-';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '-';
    
    const formatted = num.toFixed(decimals);
    // 添加千分位
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${currency}${parts.join('.')}`;
}

/**
 * 格式化数字（带千分位）
 * @param num 数字
 * @param decimals 小数位数，默认 0
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number | string | undefined | null, decimals: number = 0): string {
    if (num === undefined || num === null) return '-';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '-';
    
    const formatted = n.toFixed(decimals);
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

/**
 * 根据货币代码返回货币符号
 * 未知货币代码直接返回 "{code} "（带尾随空格），用于拼接金额
 */
export function getCurrencySymbol(currency: string | undefined | null): string {
    const symbols: Record<string, string> = {
        CNY: '¥',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
    };
    const code = (currency || 'CNY').toUpperCase();
    return symbols[code] ?? `${code} `;
}

/**
 * 格式化货币金额（符号 + 两位小数）
 */
export function formatCurrencyAmount(amount: string | number, currency: string | undefined | null): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${getCurrencySymbol(currency)}${isNaN(num) ? '0.00' : num.toFixed(2)}`;
}

/**
 * 格式化百分比
 * @param value 数值
 * @param decimals 小数位数，默认 2
 * @returns 格式化后的字符串 (如 "12.50%")
 */
export function formatPercent(value: number | string | undefined | null, decimals: number = 2): string {
    if (value === undefined || value === null) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return `${num.toFixed(decimals)}%`;
}

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 * @returns 今天的日期字符串
 */
export function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * 获取当前日期时间的字符串
 * @returns 当前日期时间字符串
 */
export function getNowString(): string {
    return new Date().toISOString();
}

/**
 * 添加天数到日期
 * @param date 基准日期
 * @param days 要添加的天数
 * @returns 新的日期
 */
export function addDays(date: Date | string, days: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
}

/**
 * 添加月份到日期
 * @param date 基准日期
 * @param months 要添加的月数
 * @returns 新的日期
 */
export function addMonths(date: Date | string, months: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
    d.setMonth(d.getMonth() + months);
    return d;
}

/**
 * 计算两个日期之间的天数差
 * @param date1 日期1
 * @param date2 日期2
 * @returns 天数差
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 判断是否过期
 * @param date 截止日期
 * @returns 是否已过期
 */
export function isExpired(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    return d < now;
}

/**
 * 判断日期是否在今天之后
 * @param date 日期
 * @returns 是否在今天之后
 */
export function isAfterToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d > today;
}

/**
 * 截断文本
 * @param text 文本
 * @param maxLength 最大长度
 * @param suffix 后缀，默认 '...'
 * @returns 截断后的文本
 */
export function truncateText(text: string | undefined | null, maxLength: number, suffix: string = '...'): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 首字母大写
 * @param str 字符串
 * @returns 首字母大写的字符串
 */
export function capitalize(str: string | undefined | null): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

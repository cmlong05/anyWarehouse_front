/**
 * 通用国际化基础设施
 * 所有模块共享同一个 locale store
 */
import { writable } from 'svelte/store';

export type Locale = 'zh' | 'en';

export const defaultLocale: Locale = 'zh';

// 获取当前语言环境
export function getLocale(): Locale {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('app-locale') as Locale;
        if (saved && (saved === 'zh' || saved === 'en')) {
            return saved;
        }
    }
    return defaultLocale;
}

// 设置语言环境
export function setLocale(locale: Locale) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('app-locale', locale);
    }
}

// 全局 locale store - 所有模块共享
export const localeStore = writable<Locale>(getLocale());

// 订阅 store 变化以持久化
if (typeof window !== 'undefined') {
    localeStore.subscribe((locale) => {
        setLocale(locale);
    });
}

// 通用的翻译函数类型
export type TranslateFunction<T extends string> = (key: T, locale?: Locale) => string;

/**
 * 表格排序通用工具
 */

export type SortDirection = 'asc' | 'desc';

/**
 * 切换排序字段和方向
 */
export function toggleSortKey<T extends string>(
    currentKey: T,
    currentDirection: SortDirection,
    nextKey: T
): { sortKey: T; sortDirection: SortDirection } {
    if (currentKey === nextKey) {
        return {
            sortKey: currentKey,
            sortDirection: currentDirection === 'asc' ? 'desc' : 'asc'
        };
    }

    return {
        sortKey: nextKey,
        sortDirection: 'asc'
    };
}

/**
 * 按字段排序（返回新数组，不修改原数组）
 */
export function sortByKey<T extends object, K extends keyof T>(
    items: T[],
    key: K,
    direction: SortDirection,
    locale: string = 'zh-CN'
): T[] {
    const factor = direction === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
        const rawA = (a as Record<PropertyKey, unknown>)[key as PropertyKey] ?? '';
        const rawB = (b as Record<PropertyKey, unknown>)[key as PropertyKey] ?? '';

        if (typeof rawA === 'number' && typeof rawB === 'number') {
            return (rawA - rawB) * factor;
        }

        return String(rawA).localeCompare(String(rawB), locale, {
            numeric: true,
            sensitivity: 'base'
        }) * factor;
    });
}

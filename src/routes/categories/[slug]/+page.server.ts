import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

// 定义分类物品数组的类型
interface CategoryItems {
    // 这里可以根据实际的 API 返回数据结构添加具体的字段定义
    [key: string]: any;
}

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }: { params: { slug: string }, fetch: typeof globalThis.fetch }): Promise<{ category_items: CategoryItems }> {
    const { slug } = params;
    const res = await fetch(`${API_BASE_URL}/product/api/categories/${slug}/items`);
    if (!res.ok) {
        throw error(res.status, 'Failed to fetch category');
    }
    const category_items: CategoryItems = await res.json();
    return { category_items };
}
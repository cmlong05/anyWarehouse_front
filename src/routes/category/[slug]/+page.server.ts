import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

// 定义分类物品数组的类型
import type { CategoryData } from '$lib';


/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }: { params: { slug: string }, fetch: typeof globalThis.fetch }): Promise<{ category_details: CategoryData }> {
    const { slug } = params;
    const res = await fetch(`${API_BASE_URL}/product/api/category/${slug}/`);
    if (!res.ok) {
        throw error(res.status, 'Failed to fetch category');
    }
    const category_details: CategoryData = await res.json();
    return { category_details };
}
// 加载物料分类详情数据
// 被依赖：无
import { error } from '@sveltejs/kit';
import { config } from '$lib/config';

// 定义分类物品数组的类型
import type { CategoryData } from '$lib';


/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }: { params: { slug: string }, fetch: typeof globalThis.fetch }): Promise<{ category_details: CategoryData }> {
    const { slug } = params;
    const res = await fetch(`${config.API_BASE_URL}/product/category/${slug}/`);
    if (!res.ok) {
        throw error(res.status, 'Failed to fetch category');
    }
    const category_details: CategoryData = await res.json();
    return { category_details };
}
import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

import type { Item, CategoryData } from '$lib';

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }: { params: { slug: string }, fetch: typeof globalThis.fetch }): Promise<{ item: Item; categoryItemsArray: CategoryData[] }> {
    const { slug } = params;
    // 获取当前物品信息
    const itemRes = await fetch(`${API_BASE_URL}/product/api/item/${slug}/`);
    if (!itemRes.ok) {
        throw error(itemRes.status, 'Failed to fetch item');
    }
    const item: Item = await itemRes.json();

    // 存储每个分类的物品信息的数组
    const categoryItemsArray: CategoryData[] = [];

    // 遍历物品的分类列表
    for (const categoryId of item.category) {
        const categoryRes = await fetch(`${API_BASE_URL}/product/api/categories/${categoryId}/items`);
        if (categoryRes.ok) {
            const categoryData: CategoryData = await categoryRes.json();
            categoryItemsArray.push(categoryData);
        }
    }

    return {
        item,
        categoryItemsArray
    };
}

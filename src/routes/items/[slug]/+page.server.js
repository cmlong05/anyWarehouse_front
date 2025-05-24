import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }) {
    const { slug } = params;
    // 获取当前物品信息
    const itemRes = await fetch(`${API_BASE_URL}/product/api/items/${slug}/`);
    if (!itemRes.ok) {
        throw error(itemRes.status, 'Failed to fetch item');
    }
    const item = await itemRes.json();

    // 存储同级物品的数组
    const siblingItems = [];

    // 遍历物品的分类列表
    for (const categoryId of item.category) {
        const categoryRes = await fetch(`${API_BASE_URL}/product/api/categories/${categoryId}/items`);
        if (categoryRes.ok) {
            const categoryData = await categoryRes.json();
            // 过滤掉当前物品
            const filteredItems = categoryData.items.filter((it) => it.id !== item.id);
            siblingItems.push(...filteredItems);
        }
    }

    return {
        item,
        siblingItems
    };
}
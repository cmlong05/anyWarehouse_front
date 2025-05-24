import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

// 定义物品接口
interface Item {
    id: string;
    category: string[];
    // 可根据实际情况添加更多字段
}

// 定义分类数据接口
interface CategoryData {
    items: Item[];
}

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }: { params: { slug: string }, fetch: typeof globalThis.fetch }): Promise<{ item: Item; siblingItems: Item[] }> {
    const { slug } = params;
    // 获取当前物品信息
    const itemRes = await fetch(`${API_BASE_URL}/product/api/items/${slug}/`);
    if (!itemRes.ok) {
        throw error(itemRes.status, 'Failed to fetch item');
    }
    const item: Item = await itemRes.json();

    // 存储同级物品的数组
    const siblingItems: Item[] = [];

    // 遍历物品的分类列表
    for (const categoryId of item.category) {
        const categoryRes = await fetch(`${API_BASE_URL}/product/api/categories/${categoryId}/items`);
        if (categoryRes.ok) {
            const categoryData: CategoryData = await categoryRes.json();
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
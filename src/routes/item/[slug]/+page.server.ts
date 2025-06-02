import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';
import type { ItemSet } from '$lib';

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }: { params: { slug: string }, fetch: typeof globalThis.fetch }): Promise<{ itemDetail: ItemSet }> {
    const { slug } = params;
    // 获取当前物品信息
    const itemRes = await fetch(`${API_BASE_URL}/product/api/item/${slug}/`);
    if (!itemRes.ok) { 
        throw error(itemRes.status, 'Failed to fetch item');
    }
    const itemDetail: ItemSet = await itemRes.json();
    return { itemDetail };
}

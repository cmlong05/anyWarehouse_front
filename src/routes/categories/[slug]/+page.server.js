import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }) {
    const { slug } = params;
    const res = await fetch(`${API_BASE_URL}/product/api/categories/${slug}/items`);
    if (!res.ok) {
        throw error(res.status, 'Failed to fetch category');
    }
    const category_items = await res.json();
    return { category_items };
}

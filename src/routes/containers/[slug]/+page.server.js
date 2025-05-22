import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }) {
    const { slug } = params;
    const res = await fetch(`${API_BASE_URL}/warehouse/api/containers/${slug}/`);
    if (!res.ok) {
        throw error(res.status, 'Failed to fetch container');
    }
    const container = await res.json();
    return { container };
}
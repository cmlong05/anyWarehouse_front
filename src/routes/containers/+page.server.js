import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ fetch }) {
    const res = await fetch(`${API_BASE_URL}/warehouse/api/containers/`);
    if (!res.ok) {
        throw error(res.status, 'Failed to fetch containers');
    }
    const containers = await res.json();
    return { containers };
}
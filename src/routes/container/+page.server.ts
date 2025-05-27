import { redirect } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load() {
    throw redirect(302, '/container/Office');
}
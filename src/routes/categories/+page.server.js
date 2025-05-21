/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ fetch }) {
    const res = await fetch('http://10.10.10.1:8080/product/api/categories/');
    if (!res.ok) {
        throw new Error('Failed to fetch categories');
    }
    const categories = await res.json();
    return { categories };
}

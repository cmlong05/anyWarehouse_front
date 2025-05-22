/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }) {
    const { slug } = params;
    const res = await fetch(`http://10.10.10.1:8080/product/api/categories/${slug}/items`);
    if (!res.ok) {
        throw new Error('Failed to fetch category');
    }
    const data = await res.json();
    return { items: data.items };
}
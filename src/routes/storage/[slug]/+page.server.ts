import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';
import type { Storagestandard, ContainerBriefID } from '$lib';

/** @type {import('@sveltejs/kit').ServerLoad} */
export async function load({ params, fetch }: { params: { slug: string }, fetch: typeof globalThis.fetch }): Promise<{ storageDetail: Storagestandard, ContainerBriefDetails: ContainerBriefID[] }> {
    const { slug } = params;
    // 获取当前物品信息
    const itemRes = await fetch(`${API_BASE_URL}/warehouse/api/storage/${slug}/`);
    const ContainerBriefRes = await fetch(`${API_BASE_URL}/warehouse/api/container-brief/`);
    if (!itemRes.ok || !ContainerBriefRes.ok) { 
        throw error(itemRes.status, 'Failed to fetch item');
    }
    const storageDetail: Storagestandard = await itemRes.json();
    const ContainerBriefDetails: ContainerBriefID[] = await ContainerBriefRes.json();
    return { storageDetail, ContainerBriefDetails };

}

import { redirect } from '@sveltejs/kit';
// 给form提供更新支持
export const actions = {
    default: async ({ params, request, fetch }: { params: { slug: string }, request: Request, fetch: typeof globalThis.fetch }): Promise<{ success: boolean }> => {
    const { slug } = params;
    const formData = await request.formData();
    const updatedData = {
        container: formData.get('container'),
        quantity: formData.get('quantity'),
        text: formData.get('text'),
        sample: formData.has('sample'),
    };
    const res = await fetch(`${API_BASE_URL}/warehouse/api/storage/${slug}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    });
    if (!res.ok) {        
        // Try to parse the error response from the server
        const errorData = await res.json().catch(() => ({}));
        console.error('Error data:', errorData);
        throw error(res.status, `Failed to update item: ${JSON.stringify(errorData)}`);
    }
    //重定向回去
    throw redirect(303, `/item/${formData.get('item')}`);
},
};


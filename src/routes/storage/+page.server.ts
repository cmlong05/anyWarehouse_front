// 加载库存列表数据
import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';

export const actions = {
    default: async ({ request, fetch }) => {
        const formData = await request.formData();
        const updatedData = {
            item: Number(formData.get('item')),
            container: Number(formData.get('container')),
            quantity: Number(formData.get('quantity')),
            text: formData.get('text') || '',
            sample: formData.has('sample'),
        };

        try {
            const res = await fetch(`${config.API_BASE_URL}/warehouse/storage/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!res.ok) {
                throw error(res.status, 'Failed to create storage');
            }

            throw redirect(303, `/item/${updatedData.item}`);
        } catch (err) {
            throw err;
        }
    }
};
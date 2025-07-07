import { API_BASE_URL } from '$lib/config';
import { redirect } from '@sveltejs/kit';

export const actions = {
    default: async ({ request }: { request: Request }) => {
        const formData = await request.formData();
        const updatedData = {
            item: formData.get('item'),
            container: formData.get('container'),
            quantity: formData.get('quantity'),
            text: formData.get('text'),
            sample: formData.has('sample'),
        };
        // Replace global fetch with event.fetch
        const res = await fetch(`${API_BASE_URL}/warehouse/api/storage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });
        if (!res.ok) {
            throw redirect(303, '/storage');
        }
        throw redirect(303, '/storage');

    }
}
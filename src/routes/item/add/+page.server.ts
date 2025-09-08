import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Category } from '$lib/index';

interface CategoryResponse {
    categories: Category[];
}

export async function load({ fetch, url }) {
    try {
        const res = await fetch(`${config.API_BASE_URL}/product/api/category/`);
        if (!res.ok) {
            throw error(res.status, 'Failed to fetch categories');
        }
        const categories: Category[] = await res.json();
        
        // 获取URL参数中的分类ID
        const categoryParam = url.searchParams.get('category');
        const defaultCategoryId = categoryParam ? parseInt(categoryParam) : null;
        
        return { 
            categories,
            defaultCategoryId
        };
    } catch (err) {
        throw error(500, 'Failed to load data');
    }
}

export const actions = {
    default: async ({ request, fetch }) => {
        const formData = await request.formData();
        
        // 构建商品数据
        const itemData = {
            SKU: formData.get('SKU'),
            name: formData.get('name'),
            SKU_zite: formData.get('SKU_zite') || '',
            SKU_A: formData.get('SKU_A') || '',
            description: formData.get('description') || '',
            image: formData.get('image') || '',
            weight: formData.get('weight') || '',
            p_volume: Number(formData.get('p_volume')) || 0,
            s_volume: Number(formData.get('s_volume')) || 0,
            b_Price: formData.get('b_Price') || '',
            currency: formData.get('currency') || '',
            in_fee: formData.get('in_fee') ? Number(formData.get('in_fee')) : null,
            barcode: formData.get('barcode') || '',
            category: formData.getAll('category').map(id => Number(id))
        };

        try {
            const response = await fetch(`${config.API_BASE_URL}/product/api/item/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.message || 'Failed to create item'
                };
            }

            const newItem = await response.json();
            throw redirect(303, `/item/${newItem.id}`);
        } catch (err) {
            if (err instanceof Response) {
                throw err; // 重新抛出重定向
            }
            return {
                success: false,
                error: 'Failed to create item'
            };
        }
    }
};

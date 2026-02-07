import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Category } from '$lib/index';


export async function load({ fetch, url }) {
    try {
        const res = await fetch(`${config.API_BASE_URL}/product/category/`);
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
        const itemData: any = {
            SKU: formData.get('SKU'),
            name: formData.get('name'),
            SKU_zite: formData.get('SKU_zite') || '',
            SKU_A: formData.get('SKU_A') || '',
            description: formData.get('description') || '',
            p_volume: Number(formData.get('p_volume')) || 0,
            s_volume: Number(formData.get('s_volume')) || 0,
            currency: formData.get('currency') || '',
            in_fee: formData.get('in_fee') ? Number(formData.get('in_fee')) : null,
            barcode: formData.get('barcode') || '',
            category: formData.getAll('category').map(id => Number(id))
        };

        // 只在有值时添加可选字段
        const imageValue = formData.get('image');
        if (imageValue && imageValue.toString().trim()) {
            itemData.image = imageValue;
        }

        const weightValue = formData.get('weight');
        if (weightValue && weightValue.toString().trim()) {
            itemData.weight = weightValue;
        }

        const priceValue = formData.get('b_Price');
        if (priceValue && priceValue.toString().trim()) {
            itemData.b_Price = priceValue;
        }
        
        try {
            
            const response = await fetch(`${config.API_BASE_URL}/product/item/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText };
                }
                return {
                    success: false,
                    error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
                };
            }

            const newItem = await response.json();
            throw redirect(303, `/item/${newItem.id}`);
        } catch (err) {
            // 检查是否为重定向，重定向应该被重新抛出
            if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
                throw err; // 重新抛出重定向
            }
            return {
                success: false,
                error: 'Failed to create item'
            };
        }
    }
};

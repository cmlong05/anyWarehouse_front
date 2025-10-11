import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Category, ItemSet } from '$lib/index';

export async function load({ params, fetch }) {
    const { slug } = params;
    
    try {
        // 获取商品详细信息
        const itemRes = await fetch(`${config.API_BASE_URL}/product/item/${slug}/`);
        if (!itemRes.ok) {
            throw error(itemRes.status, 'Failed to fetch item');
        }
        const itemData: ItemSet = await itemRes.json();

        // 获取所有分类
        const categoriesRes = await fetch(`${config.API_BASE_URL}/product/category/`);
        if (!categoriesRes.ok) {
            throw error(categoriesRes.status, 'Failed to fetch categories');
        }
        const categories: Category[] = await categoriesRes.json();

        return {
            itemData,
            categories
        };
    } catch (err) {
        throw error(500, 'Failed to load data');
    }
}

export const actions = {
    default: async ({ params, request, fetch }) => {
        const { slug } = params;
        const formData = await request.formData();
        
        // 构建更新数据
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
            const response = await fetch(`${config.API_BASE_URL}/product/item/${slug}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.message || 'Failed to update item'
                };
            }

            throw redirect(303, `/item/${slug}`);
        } catch (err) {
            // 检查是否为重定向，重定向应该被重新抛出
            if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
                throw err; // 重新抛出重定向
            }
            return {
                success: false,
                error: 'Failed to update item'
            };
        }
    }
};

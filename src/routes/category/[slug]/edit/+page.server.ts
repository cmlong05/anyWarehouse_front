import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Category, CategoryData } from '$lib';

export async function load({ params, fetch }): Promise<{ categoryData: CategoryData; categories: Category[] }> {
    const { slug } = params;
    
    // 获取分类详情
    const categoryRes = await fetch(`${config.API_BASE_URL}/product/api/category/${slug}/`);
    if (!categoryRes.ok) {
        throw error(categoryRes.status, 'Failed to fetch category');
    }
    const categoryData: CategoryData = await categoryRes.json();
    
    // 获取所有分类列表用于父分类选择
    const categoriesRes = await fetch(`${config.API_BASE_URL}/product/api/category/`);
    let categories: Category[] = [];
    if (categoriesRes.ok) {
        categories = await categoriesRes.json();
    }
    
    return { 
        categoryData,
        categories 
    };
}

export const actions = {
    default: async ({ params, request, fetch }) => {
        const { slug } = params;
        const formData = await request.formData();
        
        const updateData = {
            name: formData.get('name'),
            parent: formData.get('parent') ? Number(formData.get('parent')) : null,
            top_category: formData.has('top_category')
        };

        const response = await fetch(`${config.API_BASE_URL}/product/api/category/${slug}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw error(response.status, `更新分类失败: ${errorText}`);
        }

        const updatedCategory = await response.json();
        // 更新成功后重定向到分类详情页
        throw redirect(302, `/category/${updatedCategory.id}`);
    }
};
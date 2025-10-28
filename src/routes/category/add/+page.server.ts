import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Category, CategoryData } from '$lib';

export async function load({ url, fetch }): Promise<{ categories: Category[]; parentCategory?: Category }> {
    // 获取所有分类列表用于父分类选择
    const categoriesRes = await fetch(`${config.API_BASE_URL}/product/category/`);
    let categories: Category[] = [];
    if (categoriesRes.ok) {
        categories = await categoriesRes.json();
    }
    
    // 检查是否有父分类参数
    const parentId = url.searchParams.get('parent');
    let parentCategory: Category | undefined;
    
    if (parentId) {
        try {
            const categoryRes = await fetch(`${config.API_BASE_URL}/product/category/${parentId}/`);
            if (categoryRes.ok) {
                const categoryData: CategoryData = await categoryRes.json();
                parentCategory = categoryData.category;
            }
        } catch (err) {
            console.warn('Failed to fetch parent category:', err);
        }
    }
    
    return { 
        categories,
        parentCategory
    };
}

export const actions = {
    default: async ({ request, fetch }) => {
        const formData = await request.formData();
        
        const createData = {
            name: formData.get('name'),
            parent: formData.get('parent') ? Number(formData.get('parent')) : null,
            top_category: formData.has('top_category')
        };

        const response = await fetch(`${config.API_BASE_URL}/product/api/category/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw error(response.status, `创建分类失败: ${errorText}`);
        }

        const newCategory = await response.json();
        // 创建成功后重定向到新分类详情页
        throw redirect(302, `/category/${newCategory.id}`);
    }
};
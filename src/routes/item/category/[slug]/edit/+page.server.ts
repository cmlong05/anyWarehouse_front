// 加载物料分类编辑数据
// 被依赖：无
import { error } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Category, CategoryData } from '$lib';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
    const { slug } = params;
    
    // 获取分类详情
    const categoryRes = await fetch(`${config.API_BASE_URL}/product/category/${slug}/`);
    if (!categoryRes.ok) {
        throw error(categoryRes.status, 'Failed to fetch category');
    }
    const categoryData: CategoryData = await categoryRes.json();
    
    // 获取所有分类列表用于父分类选择
    const categoriesRes = await fetch(`${config.API_BASE_URL}/product/category/`);
    let categories: Category[] = [];
    if (categoriesRes.ok) {
        categories = await categoriesRes.json();
    }

    const checkEmptyRes = await fetch(`${config.API_BASE_URL}/product/category/${slug}/check_empty/`);
    let emptyCheckData: { is_empty: boolean; item_count: number; children_count: number } | null = null;
    if (checkEmptyRes.ok) {
        emptyCheckData = await checkEmptyRes.json();
    }
    
    return { 
        categoryData,
        categories,
        emptyCheckData
    };
};
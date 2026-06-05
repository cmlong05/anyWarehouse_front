// 加载新增物料分类数据
// 被依赖：无
import { config } from '$lib/config';
import { logger } from '$lib/logger';
import type { Category, CategoryData } from '$lib';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
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
            logger.warn('Failed to fetch parent category:', { err });
        }
    }
    
    return { 
        categories,
        parentCategory
    };
};
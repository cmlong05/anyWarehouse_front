// 加载物料分类列表数据
// 被依赖：无
import { error } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Category } from '$lib/index';

export async function load({ fetch }) {
    try {
        const response = await fetch(`${config.API_BASE_URL}/product/category/`);
        if (!response.ok) {
            throw error(response.status, 'Failed to fetch categories');
        }
        const categories: Category[] = await response.json();
        
        return {
            categories
        };
    } catch (err) {
        throw error(500, 'Failed to load categories');
    }
}
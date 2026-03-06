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
        
        // 获取复制来源的商品ID
        const copyFromParam = url.searchParams.get('copy_from');
        let copyFromItem = null;
        
        if (copyFromParam) {
            try {
                const itemRes = await fetch(`${config.API_BASE_URL}/product/item/${copyFromParam}/`);
                if (itemRes.ok) {
                    const responseData = await itemRes.json();
                    // API 返回的是嵌套结构 { item: {...} }
                    const itemData = responseData.item || responseData;
                    
                    // 处理图片路径：提取相对路径，去掉 /media/ 前缀
                    let imagePath = itemData.image || '';
                    if (imagePath) {
                        // 去掉完整 URL 前缀，保留相对路径
                        // 例如：http://localhost:8080/media/product/images/xxx.jpg -> product/images/xxx.jpg
                        // 或：/media/product/images/xxx.jpg -> product/images/xxx.jpg
                        const mediaMatch = imagePath.match(/\/media\/(.*)/);
                        if (mediaMatch) {
                            imagePath = mediaMatch[1];
                        }
                    }
                    
                    copyFromItem = {
                        SKU: `${itemData.SKU}_COPY`, // SKU 加后缀避免冲突
                        name: `${itemData.name} (复制)`,
                        SKU_zite: itemData.SKU_zite || '',
                        SKU_A: itemData.SKU_A || '',
                        description: itemData.description || '',
                        image: imagePath,  // 用于预览显示
                        image_path: imagePath,  // 用于后端共用原图（write_only）
                        weight: itemData.weight || '',
                        p_volume: itemData.p_volume || 0,
                        s_volume: itemData.s_volume || 0,
                        b_Price: itemData.b_Price ?? '',
                        currency: itemData.currency || '',
                        in_fee: itemData.in_fee ?? null,
                        barcode: '', // 条形码不复制
                        category: itemData.category || []
                    };
                }
            } catch (e) {
                console.error('Failed to fetch copy item:', e);
            }
        }
        
        return { 
            categories,
            defaultCategoryId,
            copyFromItem
        };
    } catch (err) {
        throw error(500, 'Failed to load data');
    }
}

// 表单提交由前端 ItemForm.svelte 直接处理，不使用 server action

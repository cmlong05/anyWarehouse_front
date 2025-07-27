import { error, fail, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';

export async function load({ params, parent, fetch }) {
    const { containers } = await parent();
    
    try {
        // 获取物品信息以获取 SKU
        const itemRes = await fetch(`${config.API_BASE_URL}/product/api/item/${params.slug}/`);
        let itemSKU = params.slug; // 默认使用 slug
        
        if (itemRes.ok) {
            const itemDetail = await itemRes.json();
            // 根据你的 ItemSet 结构，SKU 在 item.SKU 中
            itemSKU = itemDetail.item?.SKU || itemDetail.SKU || params.slug;
        }
        
        return {
            item: params.slug,
            itemSKU,
            containers
        };
    } catch (err) {
        console.error('Load error:', err);
        return {
            item: params.slug,
            itemSKU: params.slug,
            containers
        };
    }
}

export const actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        
        const storageData = {
            item: Number(formData.get('item')),
            container: Number(formData.get('container')),
            quantity: Number(formData.get('quantity')),
            text: formData.get('text') || '',
            sample: formData.has('sample')
        };

        try {
            // 使用全局的 fetch，而不是从参数中解构
            const response = await fetch(`${config.API_BASE_URL}/warehouse/api/storage/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(storageData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                return fail(400, { 
                    error: errorData.message || '创建存储失败',
                    data: storageData 
                });
            }

            const result = await response.json();
            console.log('Storage created successfully:', result);

            // 创建成功，重定向到物品页面
            throw redirect(303, `/item/${storageData.item}`);

        } catch (error) {
            // 重新抛出 redirect 异常（SvelteKit 的 redirect 异常有特殊结构）
            if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
                throw error;
            }
            
            console.error('Create storage error:', error);
            return fail(500, { 
                error: '服务器错误: ' + (error instanceof Error ? error.message : '未知错误'),
                data: storageData 
            });
        }
    }
};
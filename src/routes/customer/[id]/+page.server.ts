import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, fetch }) => {
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
        throw error(404, '客户ID无效');
    }
    
    try {
        // 从环境变量或配置获取内部 API URL
        const apiBaseUrl = env.INTERNAL_API_URL || 'http://nginx:8080/api';
        
        const response = await fetch(`${apiBaseUrl}/customer/customer/${id}/`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw error(404, '客户不存在');
            }
            throw error(response.status, '获取客户信息失败');
        }
        
        const customer = await response.json();
        
        return {
            customer
        };
    } catch (err) {
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, '服务器错误');
    }
};

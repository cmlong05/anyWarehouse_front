// 客户详情数据加载器
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function fetchCustomerById(customerIdParam: string, fetchFn: typeof fetch) {
    const id = parseInt(customerIdParam, 10);

    if (isNaN(id)) {
        throw error(404, '客户ID无效');
    }

    try {
        const apiBaseUrl = env.INTERNAL_API_URL || 'http://nginx:8080/api';
        const response = await fetchFn(`${apiBaseUrl}/customer/customer/${id}/`);

        if (!response.ok) {
            if (response.status === 404) {
                throw error(404, '客户不存在');
            }

            throw error(response.status, '获取客户信息失败');
        }

        return await response.json();
    } catch (err) {
        if (err instanceof Error && 'status' in err) {
            throw err;
        }

        throw error(500, '服务器错误');
    }
}
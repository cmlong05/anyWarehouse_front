/**
 * 编辑容器页面的服务器端加载函数
 * @param {Object} params - 路由参数，包含容器的slug
 * @param {Function} fetch - SvelteKit的fetch函数，用于服务器端请求
 * @returns {Promise<{ container: Container; containers: ContainerBriefID[] }>} 包含容器详情和所有容器列表的Promise
 */
import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Container, ContainerBriefID, ContainerResponse } from '$lib';

export async function load({ params, fetch }): Promise<{ container: Container; containers: ContainerBriefID[] }> {
    const { slug } = params;
    
    // 获取容器详情
    const containerRes = await fetch(`${config.API_BASE_URL}/warehouse/api/container/${slug}/`);
    if (!containerRes.ok) {
        throw error(containerRes.status, 'Failed to fetch container');
    }
    const containerData: ContainerResponse = await containerRes.json();
    
    // 获取所有容器列表用于父容器选择
    const containersRes = await fetch(`${config.API_BASE_URL}/warehouse/api/containers/brief/`);
    let containers: ContainerBriefID[] = [];
    if (containersRes.ok) {
        containers = await containersRes.json();
    }
    
    return { 
        container: containerData.container,
        containers 
    };
}

export const actions = {
    default: async ({ params, request, fetch }) => {
        const { slug } = params;
        const formData = await request.formData();
        
        const updateData = {
            fastCode: formData.get('fastCode'),
            barcode: formData.get('barcode'),
            mark: formData.get('mark'),
            volume: Number(formData.get('volume')),
            a_volume: Number(formData.get('a_volume')),
            total_weight: Number(formData.get('total_weight')),
            parent: formData.get('parent') || null
        };

        const response = await fetch(`${config.API_BASE_URL}/warehouse/api/container/${slug}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw error(response.status, `更新容器失败: ${errorText}`);
        }

        // 更新成功后重定向到容器详情页
        throw redirect(302, `/container/${updateData.fastCode}`);
    }
};
/**
 * 编辑容器页面的服务器端加载函数
 * @param {Object} params - 路由参数，包含容器的slug
 * @param {Function} fetch - SvelteKit的fetch函数，用于服务器端请求
 * @returns {Promise<{ container: Container; containers: ContainerBriefID[] }>} 包含容器详情和所有容器列表的Promise
 */
import { error } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Container, ContainerBriefID, ContainerResponse } from '$lib';

export async function load({ params, fetch }): Promise<{ container: Container; containers: ContainerBriefID[] }> {
    const { slug } = params;
    
    // 获取容器详情
    const containerRes = await fetch(`${config.API_BASE_URL}/warehouse/container/${slug}/`);
    if (!containerRes.ok) {
        throw error(containerRes.status, 'Failed to fetch container');
    }
    const containerData: ContainerResponse = await containerRes.json();
    
    // 获取所有容器列表用于父容器选择
    const containersRes = await fetch(`${config.API_BASE_URL}/warehouse/container-brief/`);
    let containers: ContainerBriefID[] = [];
    if (containersRes.ok) {
        containers = await containersRes.json();
    }
    
    return { 
        container: containerData.container,
        containers 
    };
}
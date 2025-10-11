/**
 * 添加容器页面的服务器端处理
 */
import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { Container, ContainerBriefID, ContainerResponse } from '$lib';

export async function load({ url, fetch }): Promise<{ containers: ContainerBriefID[]; parentContainer?: Container }> {
    // 获取所有容器列表用于父容器选择
    const containersRes = await fetch(`${config.API_BASE_URL}/warehouse/container-brief/`);
    let containers: ContainerBriefID[] = [];
    if (containersRes.ok) {
        containers = await containersRes.json();
    }
    
    // 检查是否有父容器参数
    const parentSlug = url.searchParams.get('parent');
    let parentContainer: Container | undefined;
    
    if (parentSlug) {
        try {
            const containerRes = await fetch(`${config.API_BASE_URL}/warehouse/container/${parentSlug}/`);
            if (containerRes.ok) {
                const containerData: ContainerResponse = await containerRes.json();
                parentContainer = containerData.container;
            }
        } catch (err) {
            // 如果获取父容器失败，继续执行但不设置父容器
            console.warn('Failed to fetch parent container:', err);
        }
    }
    
    return { 
        containers,
        parentContainer
    };
}

export const actions = {
    default: async ({ request, fetch }) => {
        const formData = await request.formData();
        
        const createData = {
            fastCode: formData.get('fastCode'),
            barcode: formData.get('barcode') || null,
            mark: formData.get('mark'),
            volume: Number(formData.get('volume')),
            zz_volume: Number(formData.get('zz_volume')),
            zz_weight: Number(formData.get('zz_weight')),
            parent: formData.get('parent') ? Number(formData.get('parent')) : null
        };

        const response = await fetch(`${config.API_BASE_URL}/warehouse/container/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw error(response.status, `创建容器失败: ${errorText}`);
        }

        const newContainer = await response.json();
        // 创建成功后重定向到新容器详情页
        throw redirect(302, `/container/${newContainer.fastCode}`);
    }
};
import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';
import type { ContainerBriefID } from '$lib';

import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';

export async function load({ params, fetch }: { params: { slug: string }, fetch: typeof globalThis.fetch }) {
    try {
        // 获取容器列表
        const ContainerBriefRes = await fetch(`${API_BASE_URL}/warehouse/api/container-brief/`);
        if (!ContainerBriefRes.ok) {
            throw error(ContainerBriefRes.status, 'Failed to fetch containers');
        }
        const ContainerBriefDetails: ContainerBriefID[] = await ContainerBriefRes.json();

        return {
            item: params.slug,  // 从 URL 参数获取 item 编号
            ContainerBriefDetails
        };
    } catch (error) {
        console.error('Load error:', error);
        throw error;
    }
};

export const actions = {
    default: async ({ request, fetch }) => {
        const formData = await request.formData();
        
        // 获取表单数据
        const storage = {
            item: formData.get('item'),
            container: formData.get('container'),
            quantity: formData.get('quantity'),
            text: formData.get('text') || '',
            sample: formData.get('sample') === 'on'
        };

        try {
            // 发送 POST 请求创建新存储
            const response = await fetch(`${API_BASE_URL}/warehouse/api/storage/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(storage)
            });

            if (!response.ok) {
                const error = await response.json();
                return fail(400, { 
                    error: error.message || '创建存储失败',
                    data: storage 
                });
            }

            // 创建成功，返回成功标志
            return { success: true };

        } catch (error) {
            console.error('Submit error:', error);
            return fail(500, { 
                error: '服务器错误',
                data: storage 
            });
        }
    }
} satisfies Actions;
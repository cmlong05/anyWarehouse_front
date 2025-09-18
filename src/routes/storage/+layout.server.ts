import { config } from '$lib/config';
import { error } from '@sveltejs/kit';
import type { ContainerBriefID } from '$lib';

export async function load({ fetch }) {
    try {
        const containerRes = await fetch(`${config.API_BASE_URL}/warehouse/api/container-brief/`);
        if (!containerRes.ok) {
            console.error('Failed to fetch containers:', containerRes.status);
            return {
                containers: []
            };
        }
        const containers: ContainerBriefID[] = await containerRes.json();
        
        return {
            containers
        };
    } catch (err) {
        console.error('Layout load error:', err);
        // 返回空数组而不是抛出错误，让页面能够正常加载
        return {
            containers: []
        };
    }
}
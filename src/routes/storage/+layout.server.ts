import { config } from '$lib/config';
import { error } from '@sveltejs/kit';
import type { ContainerBriefID } from '$lib';

export async function load({ fetch }) {
    try {
        const containerRes = await fetch(`${config.API_BASE_URL}/warehouse/api/container-brief/`);
        if (!containerRes.ok) {
            throw error(containerRes.status, 'Failed to fetch containers');
        }
        const containers: ContainerBriefID[] = await containerRes.json();
        
        return {
            containers
        };
    } catch (err) {
        console.error('Layout load error:', err);
        throw error(500, 'Failed to load container data');
    }
}
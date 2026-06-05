// 加载新增库存流水数据
// 被依赖：无
import { logger } from '$lib/logger';
import { config } from '$lib/config';
import type { ContainerBriefID } from '$lib';

export async function load({ fetch, url }) {
    try {
        const containerRes = await fetch(`${config.API_BASE_URL}/warehouse/container-brief/`);
        const containers: ContainerBriefID[] = containerRes.ok ? await containerRes.json() : [];
        return {
            containers,
            initialItemId: url.searchParams.get('item_id'),
            initialFromContainerId: url.searchParams.get('from_container_id'),
            initialToContainerId: url.searchParams.get('to_container_id'),
            initialType: url.searchParams.get('type') || 'inbound',
        };
    } catch (err) {
        logger.error('Movement add load error:', err);
        return {
            containers: [],
            initialItemId: null,
            initialFromContainerId: null,
            initialToContainerId: null,
            initialType: 'inbound',
        };
    }
}
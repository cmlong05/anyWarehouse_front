import { error } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { BaseItem } from '$lib/index';

// 定义 ServerLoad 类型
interface ServerLoad {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    url: URL;
}

/**
 * 加载商品数据的服务端函数
 * @param loadEvent - 包含 fetch 和 url 的对象
 * @returns 包含商品数据的对象
 */
export async function load({ fetch, url }: ServerLoad): Promise<{ items: BaseItem[]; searchQuery: string }> {
    const searchQuery = url.searchParams.get('search') || '';
    
    const apiUrl = new URL(`${config.API_BASE_URL}/product/item/`);
    if (searchQuery) {
        apiUrl.searchParams.append('search', searchQuery);
    }
    
    const res: Response = await fetch(apiUrl.toString());
    
    if (!res.ok) {
        throw error(res.status, 'Failed to fetch items');
    }
    
    const data: BaseItem[] = await res.json();
    return { items: data, searchQuery };
}

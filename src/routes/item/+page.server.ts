import { error } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { BaseItem } from '$lib/index';
interface ItemResponse {
    items: BaseItem[];
}
// 定义 ServerLoad 类型
interface ServerLoad {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}
/**
 * 加载商品数据的服务端函数
 * @param loadEvent - 包含 fetch 函数的对象
 * @returns 包含商品数据的对象
 */
export async function load({ fetch }: ServerLoad): Promise<{ items: ItemResponse['items'] }> {
    const res: Response = await fetch(`${config.API_BASE_URL}/product/item/`);
    
    if (!res.ok) {
        throw error(res.status, 'Failed to fetch items');
    }
    
    const items: ItemResponse['items'] = await res.json();
    return { items };
}
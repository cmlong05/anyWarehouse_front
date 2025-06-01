import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

// 定义 ServerLoad 类型
interface ServerLoad {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// 定义 items 响应数据类型，这里先用通用对象类型，可按需调整
interface ItemResponse {
    [key: string]: any;
}

// 为函数及其参数添加类型注解
/**
 * 加载商品数据的服务端函数
 * @param param0 - 包含 fetch 函数的对象
 * @returns 包含商品数据的对象
 */
export async function load({ fetch }: ServerLoad): Promise<{ items: ItemResponse }> {
    const res: Response = await fetch(`${API_BASE_URL}/product/api/item/`);
    if (!res.ok) {
        throw error(res.status, 'Failed to fetch items');
    }
    const items: ItemResponse = await res.json();
    return { items };
}
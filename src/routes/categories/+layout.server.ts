import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

// 定义 ServerLoad 类型
interface ServerLoad {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// 定义分类响应数据的类型，这里用通用对象类型，可根据实际情况调整
interface CategoryResponse {
  [key: string]: any;
}

// 为函数和参数添加类型注解
export async function load({ fetch }: ServerLoad): Promise<{ categories: CategoryResponse }> {
  const res: Response = await fetch(`${API_BASE_URL}/product/api/categories/`);
  if (!res.ok) {
    throw error(res.status, 'Failed to fetch categories');
  }
  const categories: CategoryResponse = await res.json();
  return { categories };
}
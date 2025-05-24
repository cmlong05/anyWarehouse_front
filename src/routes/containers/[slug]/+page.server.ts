import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

// 定义响应数据的类型
interface Container {
  // 这里可以根据实际返回的数据结构补充具体的属性
  [key: string]: any;
}

/** @type {import('@sveltejs/kit').ServerLoad<{ slug: string }>} */
export async function load({ params, fetch }): Promise<{ container: Container }> {
  const { slug } = params;
  const res = await fetch(`${API_BASE_URL}/warehouse/api/containers/${slug}/`);
  if (!res.ok) {
    throw error(res.status, 'Failed to fetch container');
  }
  const container: Container = await res.json();
  return { container };
}
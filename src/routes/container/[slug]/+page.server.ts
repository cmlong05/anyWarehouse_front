import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

import type { ContainerResponse } from '$lib';
// 定义响应数据的类型

/** @type {import('@sveltejs/kit').ServerLoad<{ slug: string }>} */
export async function load({ params, fetch }): Promise<{ containerRes: ContainerResponse }> {
  // 当 slug 未提供时，设置默认值 'Office'
  const { slug } = params;
  // 使用 API_BASE_URL 构建请求 URL
  const res = await fetch(`${API_BASE_URL}/warehouse/api/container/${slug}/`);
  if (!res.ok) {
    throw error(res.status, 'Failed to fetch container');
  }
  const containerRes: ContainerResponse = await res.json();
  return { containerRes };
}
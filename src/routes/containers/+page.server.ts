import { error } from '@sveltejs/kit';
import { API_BASE_URL } from '$lib/config';

// 明确类型定义
interface ServerLoad { 
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>; 
}

// 明确返回数据类型
interface ContainerResponse { 
  [key: string]: any; 
}

// 使用 TypeScript 类型注解
export async function load({ fetch }: ServerLoad): Promise<{ containers: ContainerResponse }> { 
  const res: Response = await fetch(`${API_BASE_URL}/warehouse/api/containers/`); 
  if (!res.ok) { 
    throw error(res.status, 'Failed to fetch containers'); 
  }
  const containers: ContainerResponse = await res.json(); 
  return { containers }; 
}
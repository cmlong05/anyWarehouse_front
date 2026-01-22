import { z } from 'zod';

// 配置验证 schema
const configSchema = z.object({
  API_BASE_URL: z.string().min(1, 'API_BASE_URL cannot be empty').refine(
    (val) => val.startsWith('/') || z.string().url().safeParse(val).success,
    'API_BASE_URL must be a valid URL or start with /'
  ),
  IMAGE_BASE_URL: z.string().url('IMAGE_BASE_URL must be a valid URL').optional(),
  APP_NAME: z.string().min(1, 'APP_NAME cannot be empty'),
  DEBUG: z.boolean(),
  NODE_ENV: z.enum(['development', 'production', 'test'])
});

export type Config = z.infer<typeof configSchema>;

// 获取服务端环境变量（仅在 SSR 时可用）
function getServerEnv(key: string, fallback: string): string {
  if (typeof window === 'undefined') {
    // @ts-ignore - process 在服务端运行时是存在的
    return globalThis.process?.env?.[key] || fallback;
  }
  return fallback;
}

// 从环境变量读取配置
function getConfig(): Config {
  const env = import.meta.env;
  
  // 关键修改：区分服务端(SSR)和客户端(浏览器)
  const isServer = typeof window === 'undefined';
  
  const rawConfig = {
    // SSR 时使用内部地址，浏览器时使用相对路径或外部URL
    API_BASE_URL: isServer 
      ? getServerEnv('INTERNAL_API_URL', 'http://nginx/api')  // 服务端：从环境变量读取或使用默认值
      : (env.VITE_API_BASE_URL || '/api'),                     // 浏览器：相对路径
    IMAGE_BASE_URL: env.VITE_IMAGE_BASE_URL,
    APP_NAME: env.VITE_APP_NAME || 'AnyWarehouse',
    DEBUG: env.VITE_DEBUG === 'true',
    NODE_ENV: env.NODE_ENV || 'development'
  };

  // 使用 zod 验证配置
  const result = configSchema.safeParse(rawConfig);
  
  if (!result.success) {
    const errors = result.error.format();
    console.error('配置验证失败:', errors);
    
    // 提供更友好的错误信息
    const missingVars = [];
    if (!rawConfig.API_BASE_URL) missingVars.push('VITE_API_BASE_URL');
    if (missingVars.length > 0) {
      throw new Error(`缺少必需的环境变量: ${missingVars.join(', ')}`);
    }
    
    throw new Error('配置验证失败，请检查环境变量格式');
  }
  
  return result.data;
}

export const config = getConfig();
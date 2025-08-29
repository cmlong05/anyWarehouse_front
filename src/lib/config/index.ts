// src/lib/config/index.ts
interface Config {
  API_BASE_URL: string;
  // IMAGE_BASE_URL: string;
  APP_NAME: string;
  DEBUG: boolean;
  NODE_ENV: string;
}

// 从环境变量读取配置
function getConfig(): Config {
  const config = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    // IMAGE_BASE_URL: import.meta.env.VITE_IMAGE_BASE_URL,
    APP_NAME: import.meta.env.VITE_APP_NAME || 'AnyWarehouse',
    DEBUG: import.meta.env.VITE_DEBUG === 'true',
    NODE_ENV: import.meta.env.NODE_ENV || 'development'
  };

  // 验证必需的配置
  if (!config.API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL 环境变量是必需的');
  }
  
  return config;
}

export const config = getConfig();

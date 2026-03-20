// API 配置
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.xuegushi.com",
  TIMEOUT: 30000,
  PLATFORM: "web",
} as const;

// API 端点
export const API_ENDPOINTS = {
  CATALOG_LIST: "/api/catalog/list",
  CATALOG_DETAIL: "/api/catalog/detail",
  POEM_DETAIL: "/api/poem",
  POEM_PINYIN: "/api/pinyin/poem",
  POEMS_LIST: "/api/poems",
  POEMS_DETAIL: "/api/poems",
  POEMS_CATALOG_DETAIL: "/api/poems/catalog/detail",
  POEMS_CATALOG_LIST: "/api/poems/catalog/list",
  POEMS_PINYIN: "/api/poems/pinyin",
} as const;

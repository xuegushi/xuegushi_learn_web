# API 架构文档

## 概述

项目已重构为统一的 API 请求层，支持：
- ✅ 可配置的 API 域名
- ✅ 请求拦截器（自动添加参数）
- ✅ 响应拦截器（数据处理）
- ✅ 统一错误处理（Shadcn 弹窗）
- ✅ 客户端和服务端 API 支持

## 配置

### 环境变量
```bash
# .env.local (可选)
NEXT_PUBLIC_API_BASE_URL=https://api.xuegushi.com
```

默认配置在 `src/lib/api/config.ts`：
```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.xuegushi.com",
  TIMEOUT: 30000,
  PLATFORM: "web",
} as const;
```

## API 端点

在 `src/lib/api/config.ts` 中定义：
```typescript
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
```

## 使用方式

### 1. 服务端 API 路由 (App Router)

```typescript
import { NextResponse } from "next/server";
import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");

    // 自动添加 platform 参数，自动处理错误
    const data = await api.get(API_ENDPOINTS.CATALOG_LIST, { page });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ list: [], total: 0 });
  }
}
```

### 2. 客户端组件 (推荐使用钩子)

```typescript
"use client";

import { useApiClient } from "@/lib/api/hooks";
import { API_ENDPOINTS } from "@/lib/api/config";

export function MyComponent() {
  const { get, post } = useApiClient();

  const fetchData = async () => {
    try {
      // 会自动显示错误弹窗
      const data = await get(API_ENDPOINTS.CATALOG_LIST, { page: 1 });
      console.log(data);
    } catch (error) {
      // 错误已在弹窗中显示
    }
  };

  return <button onClick={fetchData}>加载数据</button>;
}
```

### 3. 直接使用 API 客户端

```typescript
import { api, apiRequest } from "@/lib/api/client";

// GET 请求
const data = await api.get("/api/catalog/list", { page: 1, size: 10 });

// POST 请求
const result = await api.post("/api/submit", { title: "测试" });

// 自定义请求
const data = await apiRequest("/api/data", {
  method: "GET",
  params: { page: 1 },
});
```

## 请求拦截器功能

自动添加：
- `platform=web` 参数到所有请求
- 自动构建查询字符串
- 处理 undefined/null 参数

示例：
```typescript
// 调用
api.get("/api/catalog/list", { page: 1, size: 10 });

// 实际请求
https://api.xuegushi.com/api/catalog/list?page=1&size=10&platform=web
```

## 错误处理

### 错误弹窗
所有 API 错误会自动触发 Shadcn 弹窗：
- 网络错误："无法连接到服务器，请检查网络连接"
- 请求超时："请求时间过长，请稍后重试"
- 服务器错误：显示服务器返回的具体错误信息

### 手动触发错误
```typescript
import { useApiErrorStore } from "@/lib/api/error-store";

const { showError } = useApiErrorStore();

// 显示错误弹窗
showError("标题", "错误详情");
```

### 错误弹窗组件
在 `src/app/layout.tsx` 中已自动添加：
```typescript
<ApiErrorDialog />
```

## 响应拦截器

自动处理：
- 检查 HTTP 状态码
- 解析 JSON 数据
- 提取错误消息

## 目录结构

```
src/lib/api/
├── config.ts          # API 配置和端点定义
├── client.ts          # 服务端 API 客户端
├── hooks.ts           # 客户端 API 钩子
├── error-store.ts     # 错误状态管理 (Zustand)
└── index.ts           # 统一导出

src/components/
└── api-error-dialog.tsx  # 错误弹窗组件

src/app/api/           # Next.js API 路由（代理）
```

## 最佳实践

### 1. 服务端组件
使用 `api` 对象：
```typescript
import { api } from "@/lib/api/client";

const data = await api.get(endpoint, params);
```

### 2. 客户端组件
使用 `useApiClient` 钩子：
```typescript
const { get } = useApiClient();
const data = await get(endpoint, params);
```

### 3. 错误处理
- 无需手动显示错误弹窗
- 只需处理业务逻辑
- 错误会自动提示给用户

## 示例

### 完整组件示例
```typescript
"use client";

import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api/hooks";
import { API_ENDPOINTS } from "@/lib/api/config";

export function PoemList() {
  const [poems, setPoems] = useState([]);
  const { get } = useApiClient();

  useEffect(() => {
    loadPoems();
  }, []);

  const loadPoems = async () => {
    const data = await get(API_ENDPOINTS.CATALOG_LIST, { page: 1, size: 20 });
    setPoems(data.list);
  };

  return (
    <div>
      {poems.map((poem) => (
        <div key={poem._id}>{poem.catalog_name}</div>
      ))}
    </div>
  );
}
```

## 更新记录

- ✅ 统一 API 请求层
- ✅ 可配置域名
- ✅ 请求/响应拦截器
- ✅ Shadcn 错误弹窗
- ✅ 服务端和客户端支持
- ✅ 移除旧的文件系统数据依赖

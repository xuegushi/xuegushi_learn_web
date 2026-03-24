# AGENTS.md - 诗词学习项目指南

## 项目概述

这是一个使用 Next.js 16 + TypeScript 构建的诗词学习应用，包含背诵练习、打卡记录、拼音标注等功能。使用 IndexedDB 进行本地数据持久化，shadcn/ui 作为 UI 组件库。

## 构建、测试与开发

### 常用命令

```bash
# 开发服务器（端口 1234）
pnpm dev

# 生产构建
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint
```

### 测试

本项目目前没有配置测试框架。如需添加测试，建议使用 Vitest + React Testing Library。

## 代码风格指南

### 导入规范

- 使用 `@/` 路径别名导入项目内部模块
- 导入顺序：第三方库 → 内部组件 → 本地文件
- shadcn/ui 组件从 `@/components/ui/...` 导入
- 使用 lucide-react 作为图标库

```typescript
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PoemDetail } from "@/types/poem";
import { CheckCheck } from "lucide-react";
```

### 类型与接口

- 使用 `interface` 定义 Props 类型
- 复杂类型使用泛型（`Promise<T>`, `Map<K, V>`, `Set<T>`）
- 配置对象使用 `as const` 断言
- 避免使用 `any`，必要时添加 ESLint 注释说明

```typescript
interface LearnCardProps {
  poemDetail: PoemDetail | null;
  onCheckInSuccess?: () => void;
}

const STORES = {
  POEMS: "poems",
  USERS: "users",
} as const;
```

### 组件结构

- 客户端组件添加 `"use client"` 指令
- 使用 `export function` 导出组件
- 复杂组件提取小型子组件
- 使用 JSDoc 注释描述组件用途

```typescript
"use client";

/** 打卡记录弹窗主组件 */
export function CheckInRecordsDialog({
  open,
  onOpenChange,
}: CheckInRecordsDialogProps) {
  // ...
}
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `CheckInRecordsDialog` |
| 函数 | camelCase | `loadData`, `formatDateTime` |
| 接口 | PascalCase | `CheckInDetail`, `User` |
| 常量 | UPPER_SNAKE_CASE | `STORES`, `DB_NAME` |
| 事件处理器 | handleXxx | `handleCheckIn` |

### 格式化约定

- 日期格式：`${year}-${month}-${day}`
- 使用 `padStart(2, "0")` 补零
- 模板字符串用于动态类名
- 使用可选链（`?.`）和空值合并（`??`）

```typescript
const date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
const userName = user?.user_name ?? "未知用户";
```

### 错误处理

- 数据库操作使用 `try-catch`，静默处理失败
- 使用 `console.warn` 记录非关键错误
- 返回默认值而非抛出异常

```typescript
export async function getFromDB<T>(storeName: string, key: string | number): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      // ...
    });
  } catch {
    return null;
  }
}
```

### 状态管理

- 组件内部状态使用 `useState`/`useEffect`
- 复杂派生状态使用 `useMemo`/`useCallback`
- 用户数据持久化到 `localStorage`
- 使用 `Promise.all` 并行加载数据

```typescript
const [loading, setLoading] = useState(false);

const loadData = useCallback(async () => {
  setLoading(true);
  const [users, details] = await Promise.all([
    getAllFromDB<User>(STORES.USERS),
    getAllFromDB<CheckInDetail>(STORES.POEM_STUDY),
  ]);
  // ...
}, []);
```

## 项目结构

```
src/
├── app/           # Next.js App Router 页面
├── components/    # React 组件
│   ├── ui/       # shadcn/ui 基础组件
│   └── *.tsx     # 业务组件
├── config/       # 配置常量
├── lib/          # 工具函数和数据库操作
│   ├── api/      # API 相关
│   ├── db.ts     # IndexedDB 封装
│   └── utils.ts  # 通用工具函数
└── types/        # TypeScript 类型定义
```

## 关键依赖

- **框架**: Next.js 16, React 19
- **UI**: shadcn/ui, Tailwind CSS 4, lucide-react
- **状态**: Zustand
- **构建**: pnpm, TypeScript

## 注意事项

- 修改数据库结构时更新 `src/lib/db.ts` 中的版本号
- 新增 shadcn/ui 组件使用 `components.json` 配置
- 移动端适配使用 Tailwind 响应式类（`md:hidden`, `hidden md:block`）
- 使用 `dangerouslySetInnerHTML` 渲染 HTML 内容时确保内容安全

## 背诵记录文档
- 背诵记录功能包含：ReciteRecordsDialog、DynastySelect、DetailCard、SummaryCard、数据表 recite_detail/recite_summary。
- 数据流与接口：数据来自 IndexedDB，recite_detail 为明细，recite_summary 为汇总，前端通过 todayDetails/historyDetails/summaries 渲染，分页变量 todayPage/historyPage/summaryPage 控制“查看更多”。
- 测试策略：基础 UI 渲染测试、筛选、分页行为的测试、以及端到端的浏览体验测试。依赖环境安装后执行测试命令。
- PR 规范：统一使用 Patch 4D/4E/4F/4G 的风格，提供清晰的变更点、为什么改动、测试步骤。

### PR Body 模板
```
## Summary
- <简要描述变更的目的>

## Changes
- 修改的文件及要点

## Why
- 变更的动机与业务价值

## Testing
- 本地测试步骤
- 依赖与环境要求
- 注意事项
```

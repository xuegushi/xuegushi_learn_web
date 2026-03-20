# 学古诗 - 诗词学习网站

一个基于 Next.js 开发的诗词学习网站，帮助用户学习和背诵古诗词。

> 本项目由 [OpenCode](https://opencode.ai) 生成，基于 AI 辅助开发。

## 功能特性

### 学习模式
- **学习模式**：查看诗词全文，包含拼音标注、译文、注释、创作背景、赏析
- **背诵模式**：智能背诵辅助，支持多种提示方式
  - 显示首字/尾字提示
  - 随机显示单个汉字
  - 随机提示功能（点击可重新随机）

### 核心功能
- **多选集支持**：小学古诗、初中古诗、高中古诗等
- **分册选择**：按年级/学期分册浏览
- **进度追踪**：状态指示点显示已掌握/未掌握/待学习
- **正确率统计**：实时显示背诵正确率
- **继续学习**：背诵完成后可继续下一分册

### 本地数据管理
- **IndexedDB 缓存**：诗词详情和拼音数据本地缓存
- **数据筛选**：支持关键字搜索和朝代筛选
- **批量操作**：批量删除、批量更新
- **预览功能**：查看完整诗词详情（含拼音、译文、注释等）

### 界面特性
- **响应式设计**：支持 PC 端和移动端
- **暗色模式**：支持明暗主题切换
- **侧边栏折叠**：PC 端可收起侧边栏

## 技术栈

- **框架**：Next.js 16 + React 19
- **样式**：Tailwind CSS + shadcn/ui
- **状态管理**：React Hooks + IndexedDB
- **构建工具**：Turbopack

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 1234）
pnpm dev

# 构建生产版本
pnpm build
```

## 项目结构

```
src/
├── app/
│   ├── api/          # API 代理路由
│   └── learn/        # 学习页面
├── components/
│   ├── learn/        # 学习相关组件
│   │   ├── sidebar.tsx
│   │   ├── status-bar.tsx
│   │   ├── learn-card.tsx
│   │   ├── recite-card.tsx
│   │   ├── poem-detail-dialog.tsx
│   │   └── result-dialog.tsx
│   ├── local-data-manager.tsx
│   └── ui/           # shadcn UI 组件
├── config/
│   └── poem.ts       # 诗词配置（朝代、类型）
├── lib/
│   └── db.ts         # IndexedDB 工具函数
└── types/
    └── poem.ts       # TypeScript 类型定义
```

## API 数据源

本项目使用 [学古诗 API](https://api.xuegushi.com) 获取诗词数据。

## 许可证

本项目代码由 AI 生成，仅供学习和参考使用。

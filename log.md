# 更新日志

## 待提交

<!-- 在此添加未提交的内容 -->

## 2026-03-20 ✅ (已提交) - 学习卡片翻译与侧边栏优化

### 功能更新

1. **学习页面翻译功能**
   - 学习卡片右上角新增“译”按钮
   - 按钮点击后显示每句诗词对应的译文（使用yi.content数据）
   - 按钮具有背景色和圆形边框
   - 未点击状态：背景色透明，文字和边框颜色同步
   - 点击状态：背景色为主题色，文字为白色（最大对比度）
   - 译文显示在每句诗词下方，具有独立背景色区分原文
   - 按钮位置已调整避免与滚动条冲突（right-7）

2. **侧边栏优化**
   - 移除左侧底部的隐藏侧边栏按钮
   - 将本地数据管理按钮移动到左侧区域底部并固定位置
   - 本地数据管理按钮前添加数据库图标（Database from Lucide）
   - 使用flexbox布局确保按钮始终保持在sidebar底部
   - 内容区域可滚动，按钮保持固定在视图底部

3. **代码清理与重构**
   - 移除sidebar折叠功能相关状态和props
   - 更新所有相关组件的接口和调用
   - 保持所有现有功能的正常工作

---

## 2026-03-20 ✅ (已提交) - API 错误处理与按钮优化

### 功能更新

1. **API 错误处理系统**
   - 新增 `src/lib/api/` 目录
   - `config.ts` - API 配置（域名、平台参数）
   - `client.ts` - API 客户端封装
   - `hooks.ts` - React hooks（支持错误弹窗）
   - `error-store.ts` - 错误状态管理
   - `src/components/api-error-dialog.tsx` - API 错误弹窗

2. **按钮组件优化**
   - 学习页面按钮提取为 `PageButtons.tsx` 组件
   - "掌握"、"未掌握"按钮添加图标（CircleX、CheckCircle2）
   - 按钮圆角改为 `rounded-xl`
   - 按钮文字和图标放大
   - 未掌握：红色 + CircleX 图标
   - 掌握：绿色 + CheckCircle2 图标

3. **随机提示功能统一**
   - 卡片"随机提示"按钮与侧边栏"随机显示"联动
   - 消除重复的随机显示逻辑
   - 随机索引状态提升到 page.tsx

4. **Header 优化**
   - 标题旁添加"学习版"标签
   - 固定在顶部（不随页面滚动）

5. **Footer 优化**
   - 左侧：© 2026 学古诗 + ICP备案号
   - 中间：友情链接（学古诗）
   - 固定在底部

6. **布局优化**
   - 引入 heti CSS（排版优化）
   - body 添加 `heti--classic` 类
   - 页面内容区域添加顶部和底部内边距

7. **关于页面更新**
   - 添加微信公众号、小程序图片
   - 添加微信、支付宝赞助图片
   - 底部文案：感谢大家的赞助和支持

---

## 2026-03-20 ✅ (已提交) - 本地数据管理与界面优化

### 功能更新

1. **IndexedDB 缓存系统**

## 2026-03-20 ✅ (已提交) - 本地数据管理与界面优化

### 功能更新

1. **IndexedDB 缓存系统**
   - 新增 `src/lib/db.ts` - IndexedDB 工具函数
     - `getFromDB()` - 从本地数据库获取数据
     - `setToDB()` - 存储数据到本地数据库
     - `getAllFromDB()` - 获取所有缓存数据
     - `deleteFromDB()` - 删除指定数据
     - `clearDB()` - 清空数据库
   - 诗词详情和拼音数据优先从本地缓存读取，无缓存再请求接口

2. **本地数据管理弹窗**
   - 新增 `src/components/local-data-manager.tsx`
   - Tab 切换展示诗词缓存和拼音缓存
   - 表格分页展示数据
   - 支持单选/全选
   - 批量删除选中的数据
   - 批量更新（并发量为1，逐个更新）
   - 更新时显示进度

3. **组件拆分重构**
   - 新增 `src/types/poem.ts` - 共享类型定义
   - 新增 `src/components/learn/` 目录
     - `sidebar.tsx` - 侧边栏（模式/选集/分册/背诵设置/本地数据管理）
     - `status-bar.tsx` - 顶部状态栏（导航/进度/正确率/状态指示点）
     - `learn-card.tsx` - 学习模式卡片（展示诗词详情）
     - `recite-card.tsx` - 背诵模式卡片（首字/尾字/随机/按钮操作）
     - `poem-detail-dialog.tsx` - 诗词详情弹窗（带拼音标注）
     - `result-dialog.tsx` - 结果弹窗
     - `index.ts` - 统一导出
   - 主页面 `page.tsx` 代码从 1061 行精简到 ~414 行

4. **学习模式卡片增强**
   - 显示标题和诗词内容的拼音标注
   - 诗词内容使用 HTML 渲染（注释、背景、赏析）
   - 字体大小调整：`text-base md:text-lg`
   - 行间距增大：`space-y-3`

5. **背诵模式修复**
   - 序号标记正确显示
   - 随机显示字符逻辑优化

### Bug 修复

1. 修复状态方块组不更新问题 - `Set.add()` 返回相同引用导致状态不更新
2. 修复点击掌握/未掌握后按钮禁用状态
3. 修复序号显示被裁剪问题 - 使用独立 wrapper div
4. 修复代码规范问题 - 变量声明顺序、useCallback 依赖

### 代码规范

1. `fetchCatalogDetail` 改为 `useCallback`
2. `resetProgress` 改为 `useCallback`
3. `nextPoem` / `prevPoem` 改为 `useCallback`
4. `loadData` 改为 `useCallback`
5. 移除未使用的导入和变量
6. 添加必要的 eslint-disable 注释

---

## 2026-03-19 ✅ (已提交)

### feat: improve learn page layout and functionality

- 完善 learn 页面结构和样式

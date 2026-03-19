# 更新日志

## 2026-03-20

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

## 2026-03-19 (上次提交)

### feat: improve learn page layout and functionality

- 完善 learn 页面结构和样式

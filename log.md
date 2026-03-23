# 更新日志

## 2026-03-22 ✅ (已提交)

### 项目文档

- **AGENTS.md 文件创建**
  - 新增项目指南文件，包含构建、测试命令
  - 代码风格指南（导入规范、类型、命名、格式化、错误处理）
  - 项目结构和关键依赖说明

### 诗词卡片 Section 字号调整

- **Section 组件优化**
  - 标题字号：`text-base` → `text-lg`
  - 内容字号：`text-sm` → `text-base`
  - Section 组件支持 className 属性
  - 赏析部分添加 `mb-8` 底部间距

### 左侧配置区域功能调整

- **ChoiceCard 组件**
  - 新增 `src/components/learn/choice-card.tsx` - 卡片式单选按钮组件
  - 使用 RadioGroup + RadioGroupItem
  - 标题和描述单行展示，超出隐藏截断（truncate）
  - 选中状态高亮（蓝色边框 + 背景）

- **选集和分册选择优化**
  - 从 Select 下拉改为 RadioGroup + ChoiceCard
  - 选集：title 使用 catalog_name
  - 分册：title 使用 fascicule_name，不展示 description

- **ScrollArea 滚动区域**
  - 选集和分册分别用 ScrollArea 包裹
  - 高度设置为 h-32，纵向可滚动

- **Accordion 折叠面板**
  - 选集和分册分别使用 Accordion 组件包裹
  - 默认展开，支持折叠

- **样式调整**
  - ChoiceCard padding：`p-3` → `p-1.5`
  - ChoiceCard title 字号：`text-sm` → `text-xs`
  - 宽度溢出修复（overflow-hidden、whitespace-nowrap）

### 诗人介绍功能

- **诗人介绍部分**
  - 诗词卡片和诗词详情弹窗新增"诗人介绍"部分，位于"创作背景"下方
  - 使用 author 对象的 profile 参数，HTML 渲染
  - 条件渲染：author 为 null 或 profile 为空时隐藏

### Bug 修复

- **check-in-records-dialog.tsx 类型错误**
  - 修复 onCountSortChange 函数签名，接受 `string | null` 类型

---

## 2026-03-21 ✅ (已提交)

### 打卡记录功能增强

- **打卡记录弹窗**
  - 弹窗宽度增大：`max-w-[1400px]`
  - 添加 Tabs 组件（打卡明细/打卡汇总）
  - 明细表：id, user_name, 诗词标题, 诗人, 打卡时间（按打卡时间排序）
  - 汇总表：id, user_name, 诗词标题, 打卡次数, 初次打卡, 最后打卡（可排序）
  - 筛选功能：用户筛选（默认选中当前用户，展示用户名）、诗词/诗人搜索、朝代筛选
  - 分页功能：每页10条，显示总条数，上一页/下一页按钮
  - 弹窗左侧新增日历区域（日历在左侧，表格在右侧）

- **日历组件**
  - 新增 `src/components/ui/calendar.tsx`
  - 显示当前月份，支持月份切换
  - 当天日期高亮（蓝色背景 + 边框）
  - 日期下方显示打卡数量
  - 点击日期可选中

- **学习模式方块组**
  - 顶部中间展示方块组（诗词打卡进度）
  - 已打卡方块显示蓝色背景 + CheckCheck 图标
  - 未打卡方块显示灰色背景
  - 当前诗词方块有高亮边框
  - 点击方块可跳转到对应诗词

- **打卡记录按钮**
  - 按钮样式，添加 CheckCheck 图标
  - 左上角绿色圆形 Badge，展示今日打卡数量
  - PC端：按钮在学习进度右侧
  - 移动端：方块组单独一行显示在状态栏下方

- **侧边栏优化**
  - 学习模式下隐藏背诵设置部分

- **弹窗层级优化**
  - 移动端底部按钮 z-index 调整为 30
  - Footer z-index 调整为 30，避免覆盖弹窗

- **代码优化**
  - 打卡记录弹窗提取 FilterBar、Pagination、DetailTable、SummaryTable 组件
  - 状态栏提取 ReciteStatusDots、CheckInBlocks、CheckInButton 组件
  - 添加合理的类型定义和注释
  - 删除未使用的 progress.tsx

---

## 2026-03-20 ✅ (已提交)

### 学习卡片翻译

- 学习卡片右上角新增"译"按钮，点击显示每句诗词对应的译文

### IndexedDB 缓存系统

- 新增 `src/lib/db.ts` - IndexedDB 工具函数
  - `getFromDB()`、`setToDB()`、`getAllFromDB()`、`deleteFromDB()`、`clearDb()`
- 新增 `src/components/local-data-manager.tsx` 本地数据管理弹窗
- Tab 切换展示诗词缓存和拼音缓存，支持批量删除和更新

### 数据库时间戳增强

- IndexedDB 版本从 1 升级到 2
- 数据保存时自动添加 `createdAt` 和 `updatedAt` 时间戳
- 实现从版本 1 到版本 2 的自动迁移

### 组件拆分重构

- 新增 `src/types/poem.ts` - 共享类型定义
- 新增 `src/components/learn/` 目录
  - `sidebar.tsx` - 侧边栏（模式/选集/分册/背诵设置/本地数据管理）
  - `status-bar.tsx` - 顶部状态栏（导航/进度/正确率/状态指示点）
  - `learn-card.tsx` - 学习模式卡片（展示诗词详情）
  - `recite-card.tsx` - 背诵模式卡片（首字/尾字/随机/按钮操作）
  - `poem-detail-dialog.tsx` - 诗词详情弹窗（带拼音标注）
  - `result-dialog.tsx` - 结果弹窗
- 主页面 `page.tsx` 代码从 1061 行精简到 ~414 行

### API 错误处理系统

- 新增 `src/lib/api/` 目录（config、client、hooks、error-store）
- 新增 `src/components/api-error-dialog.tsx` 错误弹窗

### 按钮组件优化

- 学习页面按钮提取为 `PageButtons.tsx` 组件
- "掌握"、"未掌握"按钮添加图标
- 按钮文字和图标放大

### 侧边栏优化

- 移除左侧底部隐藏侧边栏按钮
- 本地数据管理按钮移动到侧边栏底部并固定位置
- 学习模式下隐藏背诵设置部分

### Header/Footer 优化

- 标题旁添加"学习版"标签
- Footer 添加 ICP 备案号、微信公众号、小程序二维码

### 布局优化

- 引入 heti CSS 排版优化
- 页面内容区域添加顶部和底部内边距

### Bug 修复

- 状态方块组不更新问题
- 点击掌握/未掌握后按钮禁用状态
- 序号显示被裁剪问题
- 随机显示字符逻辑优化

---

## 2026-03-19 ✅ (已提交)

### learn 页面布局与功能完善

- 完善 learn 页面结构和样式

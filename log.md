# 更新日志

## 2026-03-24 ✅ (已提交)

### Patch 4H - 背诵记录完整实现

- **DB 层**
  - 新增 recite_detail、recite_summary 存储表
  - 新增 addReciteDetail、addReciteSummary 写入函数
  - 新增 clearReciteRecords（清空）、exportReciteRecordsJson（导出 JSON）工具函数
  - 新增 LEARNING_PROGRESS 存储表及 getLearningProgress、updateLearningProgress 等追踪函数

- **UI 层**
  - PC 端按钮组新增"背诵记录"按钮（蓝色，仅背诵模式显示）
  - 移动端按钮组新增"背诵记录"按钮
  - ReciteRecordsDialog 完整实现：Tabs（背诵明细/背诵汇总）、筛选栏、统计概览、分页加载
  - 统计概览栏：展示总数、掌握数、未掌握数、掌握率（颜色区分）
  - 背诵明细卡片：标题、朝代·作者、用户名、时间、状态图标（CircleCheck/CircleX）
  - 背诵汇总卡片：掌握/未掌握/跳过数量、用户名、时间、可展开查看诗词列表
  - 筛选功能：用户筛选、朝代筛选、关键词搜索（诗词/诗人）、日期范围筛选
  - 排序功能：明细（最新/最早优先）、汇总（最新/最早/掌握率）
  - 空状态提示、加载中状态
  - 导出 JSON、清空记录按钮（附确认）

- **数据绑定**
  - 点击"掌握"→写入 recite_detail（status=true）→更新汇总
  - 点击"未掌握"→写入 recite_detail（status=false）→更新汇总
  - 完成全部诗词或点击"提前结束"→写入 recite_summary

### Patch 4J - 学习进度追踪

- 新增 LEARNING_PROGRESS 存储表（DB v7）
- 新增 updateLearningProgress（掌握/未掌握时自动更新）
- 新增 LearningProgressCard 组件（显示掌握程度百分比、学习次数、正确/错误次数）
- 在 learn page 的 handleMastered/handleNotMastered 中调用更新

### Patch 4I - 代码重构与文档

- 抽取 useReciteRecords hook（数据加载、筛选、排序、分页、统计）
- ReciteRecordsDialog 从 ~421 行精简至 ~280 行
- 更新 AGENTS.md 背诵记录章节（实现路径、数据结构、接口、测试思路）
- 更新 PR 模板

### Patch 4K - 背诵记录按钮与弹窗

- PcButtons/MobileButtons 新增 onReciteRecordsClick
- 仅在背诵模式下显示"背诵记录"按钮
- LearnPage 渲染 ReciteRecordsDialog 弹窗

## 2026-03-22 ✅ (已提交)

### Patch 4G - Documentation Update
- Open issue: finalize documentation for 背诵记录 feature including UI, data binding, tests, and rollout plan.
- Summary of actions:
  - Document UI changes and test strategy in log and AGENTS.md
  - Provide an PR body template to standardize future PRs
- Next steps:
  - Finalize documentation in AGENTS.md
  - Prepare PR with complete changes
- 更新文档以覆盖最近实现的背诵记录相关变更，包括数据绑定、UI 风格对齐、测试策略草案以及后续工作计划。
- 变更要点：
  - 记录 Patch 4E/4F/4G 的测试、风格对齐与文档更新
  - 提供 PR body 模板，确保以后 PR 描述的一致性与完整性
- 验证方法：在本地执行构建、lint，并检查 log 与 AGENTS.md 的一致性。
### Patch 4E - Tests & Docs
- 新增端到端测试草案，包含 ReciteRecordsDialog 的渲染、筛选、分页的基本用例框架
- 新增 tests/recite-records-dialog.test.tsx 测试用例草案（需依赖测试框架与 UI 库）
- 更新文档与日志：记录 Patch 4 的数据绑定、分页实现以及 UI 布局调整，供后续维护者参考

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

### Learn 页面布局调整

- **左右分栏布局**
  - 顶部状态栏下方区域分为左右两部分
  - 左侧：宽度 w-40，用 ScrollArea 包裹（高度 h-full）
  - 右侧：占满剩余宽度，显示诗词卡片/背诵卡片

- **左侧诗词列表**
  - 展示当前分册的所有诗词
  - 卡片形式展示：诗词标题 + 诗人 [朝代]
  - 当前学习诗词高亮（蓝色背景 + 边框）
  - 点击卡片切换当前学习/背诵的诗词

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

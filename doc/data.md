# IndexedDB 数据表结构

## 数据库信息

- **数据库名称**: `poem_learn_db`
- **当前版本**: 5

## 数据表

### 1. poems（诗词缓存表）

缓存诗词详情数据，减少 API 请求。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 诗词 target_id，主键 |
| poem | object | 诗词基本信息（title、author、dynasty、type、content 等） |
| detail | object | 诗词详情（yi 译文、zhu 注释、shangxi 赏析） |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

**索引**: id（主键）、updatedAt、createdAt

---

### 2. pinyin（拼音缓存表）

缓存诗词拼音数据。

| 字段 | 类型 | 说明 |
|------|------|------|
| poem_id | number | 诗词 ID，主键 |
| title | string[] | 标题拼音数组 |
| author | string[] | 作者拼音数组 |
| content | string[][] | 诗词内容拼音数组 |
| xu | string | 序言拼音 |
| title_cn | string | 汉字标题（冗余字段） |
| author | string | 汉字作者（冗余字段） |
| dynasty | string | 朝代（冗余字段） |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

**索引**: poem_id（主键）、updatedAt、createdAt

---

### 3. poem_study（诗词学习打卡明细表）

记录每次学习打卡明细。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 自增主键 |
| user_id | string | 用户 ID |
| poem_id | number | 诗词 ID |
| poem_title | string | 诗词标题 |
| author | string | 诗人 |
| dynasty | string | 朝代 |
| check_in_time | string | 打卡时间 |

**索引**: id（主键，自增）、userId、poemId、checkInTime

---

### 4. poem_study_summary（诗词学习打卡汇总表）

汇总每首诗词的学习打卡情况。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 自增主键 |
| user_id | string | 用户 ID |
| poem_id | number | 诗词 ID |
| poem_title | string | 诗词标题 |
| count | number | 打卡次数 |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |

**索引**: id（主键，自增）、userId、poemId

---

### 5. users（用户表）

用户信息表。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 自增主键，起始为 1 |
| user_name | string | 用户名（最长 32 字符） |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |

**索引**: id（主键，自增）、userName

---

## 版本历史

| 版本 | 说明 |
|------|------|
| 1 | 初始版本，poems 和 pinyin 表 |
| 2 | 添加时间戳字段迁移 |
| 3 | 新增 poem_study 和 poem_study_summary 表 |
| 4 | 新增 users 表 |
| 5 | poem_study_summary 新增 count 字段 |

---
title: Income/Expense kind + amountCents positive
date: 2026-04-23
status: draft
owners:
  - mobile
  - api
---

## 背景与目标

当前 app 已支持「支出」快速记账与分类选择，但存在两点限制：

- **没有收入概念**：无法记录收入并在列表中区分正负方向。
- **金额语义依赖正负**：移动端本地 SQLite 里支出以负数存储（`amount_cents < 0`），这会在后续同步/统计/校验上带来歧义与脏数据风险。

本 spec 的目标：

1. 引入 **`kind: expense|income`** 作为交易方向的单一来源。
2. 将 **`amount_cents` 统一为正数**（方向完全由 `kind` 决定）。
3. UI 交互：点 `+` 后先选「支出/收入」，再进入对应分类透明菜单页，选中后进入计算器页录入金额。
4. 首页列表展示 `-20 / +100`，并用颜色区分（用户确认：**支出=绿色，收入=红色**）。
5. 前后端都支持该字段，并在移动端创建后 **立即尝试同步到后端**（失败不影响本地可用，v1 不做重试队列）。

## 非目标（v1 不做）

- 不实现完整的双向增量同步（拉取/冲突解决/重试队列）。
- 不实现收入预算/储蓄目标等高级统计（仅保证支出预算卡片继续可用）。

## 数据模型（统一语义）

### 核心约束

- `kind` ∈ {`expense`, `income`}
- `amount_cents`：**永远 > 0**
- 展示层：
  - expense：显示 `-amount`，颜色 **绿色**
  - income：显示 `+amount`，颜色 **红色**

### 本地 SQLite（mobile）

现状：`apps/mobile/src/db/schema.ts` 中的 `transactions` 已有字段 `amount_cents`, `category`, `deleted_at`, `occurred_at` 等。

变更：

- `ALTER TABLE transactions ADD COLUMN kind TEXT NOT NULL DEFAULT 'expense'`
- 迁移历史数据（现存支出为负数）：
  - `UPDATE transactions SET amount_cents = ABS(amount_cents), kind = 'expense' WHERE kind IS NULL OR kind = ''`
  - 为稳妥可直接对全表执行 `ABS(amount_cents)`（因 v1 历史数据均为支出）

查询/汇总函数更新（文件：`apps/mobile/src/domain/localTransactions.ts`）：

- `LocalTransactionRow` 增加 `kind`
- `listTransactionsForDay(d)`：`SELECT ... kind ...`
- `sumTodaySpentCents(d)` / `sumMonthSpentCents(d)`：仅统计 `kind='expense'`
- 新增 `insertQuickTransaction({ kind, amountYuan, ... })`（或在原 `insertQuickExpense` 上演进）：
  - 统一写入 `amount_cents = Math.round(amountYuan * 100)`（正数）

### 后端 Postgres（api）

现状：
- 表：`apps/api/src/db/schema/transactions.ts`
- 路由：`apps/api/src/modules/transactions/transactions.routes.ts`

变更：

#### 表结构

- 增加字段：`kind text not null default 'expense'`，并建议加 check constraint：
  - `CHECK (kind IN ('expense','income'))`

#### API schema

`POST /api/transactions` 新增必填字段 `kind`：

- `kind`: `"expense" | "income"`
- `amountCents`: `int` 且必须 `> 0`
- 其余字段保持：`currency, category, scene, occurredAt, note`

`GET /api/transactions` 返回的 `transaction` 对象需要包含 `kind`。

## UI/交互设计

### 1) 加号入口流程

入口：`apps/mobile/app/(tabs)/index.tsx` 的 `+` 按钮。

新流程：

1. 点击 `+`
2. 弹出「支出/收入」选择（轻量 segmented / 顶部两段按钮）
3. 选择后进入分类透明菜单页：
   - expense：支出分类（现有）
   - income：收入分类（新增一套）
4. 选择分类后进入计算器页 `quick-entry`，携带参数：
   - `kind`
   - `category`

### 2) 分类透明菜单

现状：已有支出分类菜单（iOS SwiftUI 网格），并带「取消」关闭。

变更：

- 增加收入分类列表（可先用最小集合）：
  - 工资、奖金、报销、理财、红包、其他
- 透明菜单布局与交互保持一致，仅数据源随 `kind` 切换。

### 3) 计算器页（quick-entry）

文件：`apps/mobile/app/quick-entry.tsx`

变更：

- 接收路由参数 `kind`（默认 `expense`）
- 写入本地时：
  - `amount_cents` 永远为正
  - `kind` 写入表
- 同步到后端：
  - `POST /api/transactions`（见同步策略）

### 4) 首页列表展示

文件：`apps/mobile/app/(tabs)/index.tsx`

变更：

- `rows` 需要包含 `kind`
- 金额展示：
  - expense：`-xx.xx`，颜色绿色
  - income：`+xx.xx`，颜色红色
- 删除（已实现）：左滑删除，软删除 `deleted_at`，需要确保删除后 totals 与列表刷新正确（已存在 `loadForDate()` 刷新逻辑）。

## 同步策略（v1 最小闭环）

### 目标

在移动端创建/删除交易后，尽快把变更推送到后端；失败不影响本地使用。

### v1 行为

- 创建交易：
  1) 本地 SQLite 写入成功后
  2) 立即尝试 `POST /api/transactions`
  3) 若失败：仅记录到 console/toast（可选），不阻塞 UI；不做重试队列

- 删除交易：
  - v1 暂仅本地软删除（`deleted_at`）；后端删除/同步策略后续再补

> 说明：后端目前只有 create/list API，没有 delete/update 端点。本 spec v1 不扩展删除同步；下一阶段可新增 `DELETE /api/transactions/:id` 或支持 `PATCH deletedAt`，并与本地 `updated_at` 做增量同步。

## 迁移与兼容

### 本地 SQLite 版本管理

当前 `apps/mobile/src/db/schema.ts` 中 `DB_VERSION = 1`。

需要：

- 将 DB_VERSION +1
- 在 db 初始化处增加迁移逻辑（若项目已有迁移框架则沿用；否则在 `getDb()` 或初始化时检测 version 并执行 `ALTER TABLE` 与数据修正）。

### 后端 migrations

为 Postgres 增加迁移脚本（Drizzle migrations）：

- 添加 `kind` 字段、默认值、约束
- 若已有历史数据：设为 `expense`，并将 `amount_cents` 修正为 `ABS(amount_cents)`（若历史数据之前使用正负语义）

## 测试与验收标准

### 手动验收（核心）

1. 点击 `+` → 先选支出/收入 → 进入对应分类网格 → 选分类 → 进入计算器 → 保存成功返回首页。
2. 首页列表：
   - 支出显示 `-` 号 + 绿色
   - 收入显示 `+` 号 + 红色
3. total-card：
   - `SPENT TODAY` 仅统计支出
   - `REMAINING THIS MONTH` 基于支出进度计算
4. 左滑删除可用，删除后列表与 totals 会刷新。

### 技术约束检查

- 本地与后端均保证 `amount_cents > 0`
- 任一交易记录 `kind` 必须为合法值


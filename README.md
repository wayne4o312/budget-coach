# BudgetCoach（记账训练营）

## 开发环境

### Mobile（Expo）
- 目录：`apps/mobile`
- 安装：`bun install`
- 启动：`bun run start`

如遇到 Metro 报错（watchers/EMFILE），建议：
- 确认已安装 watchman，并且 watchman 服务可用
- 尝试重启机器或清理 watchman state
- 临时用 `bun run start:offline`（仍可能受限于系统 watcher 权限）

### API（Node / Hono）
- 目录：`apps/api`
- 启动开发：`bun run dev`
- 健康检查：`GET /health`

## 环境变量（你需要提供/配置的）

### Mobile（Expo，放在 `.env` 或你的构建环境中）
- `EXPO_PUBLIC_API_BASE_URL`：例如 `http://localhost:8787`
- `EXPO_PUBLIC_APP_SCHEME`：例如 `budgetcoach`
- `EXPO_PUBLIC_WECHAT_APP_ID`：微信 AppID（占位也可）

### API（Node）
- `PORT`：默认 8787
- `DATABASE_URL`：Postgres 连接串
- `BETTER_AUTH_SECRET`：至少 16 位
- `BETTER_AUTH_BASE_URL`：例如 `http://localhost:8787`
- `EXPO_ACCESS_TOKEN`：可选（Expo Push）
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_REDIRECT_URI`
- `JWT_SECRET`

## Supabase（已弃用）

本项目已迁移为自建后端（Hono + Better Auth + Postgres + Drizzle），不再依赖 Supabase。


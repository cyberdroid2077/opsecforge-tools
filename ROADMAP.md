# OpsecForge 工具库 - 长期运维 Roadmap (V5 - Native Recurring)

**背景与基线**: 本项目为全静态纯前端工具站（Next.js + Vercel）。当前仓库 `~/opsecforge-tools/` 已有 ~20 个上线工具及完善的 AI-SEO 自动发文管线。
本次升级：全面接入 Agent Ops 平台的 Native Recurring (原生定时循环) 机制，实现全自动化无缝派发。

## 运维大周期与任务拆解

### 1. 每日 (Daily): 内容更新与引流
- **职责节点**: `Producer` 
- **任务目标**: 执行自动化 AI-SEO 博客发布管线，基于当前 `inventory.json` 自动撰写并发布 SEO 引流文章。
- **调度机制**: **[已切换]** 弃用外部 cronjob 补丁，直接在 Agent Ops 部署 `--recurring daily` 的原生循环模板。展板每天自动生成当日任务并通知 Producer。

### 2. 每周 (Weekly): 安全健康度与局部微更新
- **职责节点**: `Sentry` & `Cipher`
- **任务目标**:
  - `Sentry`: 触发静态代码审计与依赖扫描（通过 GitHub Actions Pipeline）。
  - `Cipher`: 根据清单，每周随机抽取 1-2 个已有工具进行特性翻新、UI 优化或 bug 修复，同时更新 `inventory.json` 中的 `lastUpdated`。
- **调度机制**: **[已激活]** 在 Agent Ops 部署两组 `--recurring weekly` 的原生循环模板。展板每周自动为 Sentry 和 Cipher 创建新实例。

### 3. 每月 (Monthly): 架构升级与全局整理
- **职责节点**: `Old Fred`
- **任务目标**: 执行 Next.js / Tailwind 框架的底层 package 升级，批量清理无用静态资源与废弃路由，压缩部署体积。
- **调度机制**: 每月触发一次大盘基线维护。（由于平台目前主打 daily/weekly 循环，月度任务暂保持大周期单次派发或由系统定时抛出）。

---

## Feature Backlog（功能待办）

> 优先级说明：P0=立即做 P1=短期 P2=中期
> 每次完成更新后立即 commit + push，不跨天拖延。

### JWT Decoder（Owner: Cipher）
- [x] **P0**: 时间戳格式化 — `exp`/`iat`/`nbf` → 人类可读时间（UTC + 本地 + 相对时间）+ 过期提示（2026-03-28 完成）
- [x] **P0**: 安全风险警报 — `alg: none` 红色警告 + 过期 Token 黄色警告 + HMAC 提示（2026-03-28 完成）
- [x] **P0**: 显示 Signature 部分 + "无法验证" 提示（2026-03-28 完成）
- [ ] P1: 多 Token 对比（同时粘贴两个 JWT，diff header/payload）
- [ ] P1: 标准 Claim 智能解释（匹配 Firebase/Okta/Auth0 模板）
- [ ] P2: PASETO Decoder（新工具，抢占替代 JWT 的生态位）

### Env Sanitizer（Owner: Cipher）
- [ ] **P0**: 扩展 pattern 库（Google API Key、Slack Token、Twitter Bearer、Heroku API Key）
- [ ] **P0**: 一键生成 `.env.example`（保留 Key，清除所有 Value）
- [ ] P1: 主流平台格式导出（Vercel、Docker、Heroku）
- [ ] P1: Value 疑似真实密钥的预判提醒（格式特征识别）
- [ ] P2: HAR Sanitizer（从控制台日志中抹除 UUID/Email/Auth Header）

### 跨工具联动（Owner: Cipher · Monthly Slot）
- [ ] P2: 工具间跳转优化（JWT Decoder 解出 payload 后，一键复制到 JSON Beautifier）

---

## 文件更新协议

更新任何一个工具时，必须同步更新以下文件并立即 push：

| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | `app/tools/<tool>/page.tsx` | 代码实现 |
| 2 | `data/tools/inventory.json` | 工具元数据（含 `blogPriority`） |
| 3 | `ai-seo/opsecforge_tools_catalog.json` | Producer 读取的内容输入 |
| 4 | `ROADMAP.md` | 内部执行追踪（checkbox 状态） |
| 5 | `git add + commit + push` | 立即 push，不跨天 |

**blogPriority 字段说明**：`high` = Producer 优先写 / `medium` = 正常排期 / `low` = 有空再写
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
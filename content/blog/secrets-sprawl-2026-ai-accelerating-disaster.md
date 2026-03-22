---
title: "Secrets Sprawl 2026: 2900万条凭证泄露背后，AI正在加速灾难"
date: "2026-03-22"
description: "GitGuardian 最新报告显示，2025年GitHub新增2865万个硬编码凭证，AI服务泄露暴增81%。Claude Code项目泄露率比平均水平高2倍。"
category: "威胁情报"
tags: ["Secrets Sprawl", "API Security", "AI Security", "DevSecOps", "GitHub"]
---

# Secrets Sprawl 2026: 2900万条凭证泄露背后，AI正在加速灾难

<div class="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold tracking-widest text-red-400 uppercase">
  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
  THREAT BRIEFING
</div>

GitGuardian 刚刚发布了《2026 Secrets Sprawl 报告》，数据触目惊心：**2025 年共有 2865 万个新的硬编码凭证被提交到公共 GitHub**——同比增长 34%，创下历史新高。

但真正的警报是 AI 带来的。

AI 服务相关的凭证泄露数量飙升至 **127 万条，同比暴增 81%**。其中包括 11.3 万个 DeepSeek API 密钥、数万个 OpenAI 和 Claude 凭证，以及大量新兴的 LLM 基础设施配置。

<div class="my-6 border-l-4 border-rose-500 bg-slate-900/50 p-6 rounded-r-xl">
  <h4 class="mb-2 text-lg font-bold text-rose-400">Claude Code 的隐秘代价</h4>
  <p class="m-0 text-slate-300 text-sm">报告显示，使用 Claude Code 辅助的提交中，<strong>3.2%</strong> 包含泄露的凭证，而 GitHub 整体平均水平仅为 <strong>1.5%</strong>。这不是工具的错——而是开发者在使用 AI 加速编码时，更容易忽略安全审查。</p>
</div>

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">MCP 配置成为新的泄露重灾区</h2>
</div>

AI 编程助手生态的爆发带来了新的攻击面。Model Context Protocol (MCP) 作为连接 AI 助手与外部工具的标准，正在被广泛采用——但安全配置严重滞后。

GitGuardian 在公共 GitHub 上发现了 **24,008 个唯一的 MCP 相关凭证**，其中 **2,117 个是有效的**（占比 8.8%）。

问题的根源在于文档本身。大量 MCP 配置教程直接在示例中展示如何把 API 密钥写入配置文件：

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSAAa1B2C3d4E5f6G7h8I9j0K1l2M3n4"  
      }
    }
  }
}
```

这个配置文件包含一个真实的 Brave Search API 密钥。开发者复制粘贴后，很容易直接将包含密钥的完整配置提交到仓库。

<div class="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
  <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
    <strong class="block text-slate-200 mb-1">增长速度最快</strong>
    <span class="text-sm text-slate-400">AI 服务凭证泄露同比增长 81%，远超传统云服务商</span>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
    <strong class="block text-slate-200 mb-1">最危险的泄露类型</strong>
    <span class="text-sm text-slate-400">LLM 基础设施（编排、RAG、向量存储）泄露速度是核心模型提供商的 5 倍</span>
  </div>
</div>

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">AI 时代的安全悖论</h2>
</div>

AI 辅助编码正在重塑软件开发的速度。GitHub 公开提交量在 2025 年达到 19.4 亿次，同比增长 43%；活跃开发者数量增长 33%。

但当组织以超过治理能力的多倍速度扩展开发时，凭证开始像野草一样蔓延。

讽刺的是，AI 助手本身并不是问题的根源。报告显示：

- Claude Code 的 3.2% 泄露率确实高于平均水平
- 但这并非工具的失败，而是**人类工作流程**的问题
- 开发者仍然控制着接受、编辑、忽略或推送的内容
- 即使编码助手不断改进护栏，人们仍然可以覆盖警告或要求模型以不安全的方式运行

**泄露仍然通过人类工作流程发生**。这是一个重要的细微差别。

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">在提交前捕获泄露的密钥</h3>
  <p class="mb-8 text-slate-400 text-lg">去年有超过 1000 万个密钥泄露到 GitHub。在本地运行 GitScan，在硬编码密钥、.env 文件和危险模式到达远程仓库之前识别它们。</p>
  <a href="https://opsecforge.tools/gitscan" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
    Install GitScan CLI →
  </a>
</div>

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">防御策略：从检测到预防</h2>
</div>

面对 Secrets Sprawl 的加速，传统的「发现后修复」模式已经跟不上泄露的速度。组织需要转向**左移安全**——在代码提交之前就阻止泄露。

### 1. 本地预提交钩子

在 `.pre-commit-config.yaml` 中集成密钥扫描：

```yaml
repos:
  - repo: https://github.com/gitguardian/ggshield
    rev: v1.35.0
    hooks:
      - id: ggshield
        language: python
        stages: [pre-commit]
        args: ['secret', 'scan', 'pre-commit']
```

这样每次提交前都会自动扫描，发现潜在泄露时阻止提交。

### 2. MCP 配置外部化

永远不要将凭证直接写入 MCP 配置文件。使用环境变量引用：

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

然后在 shell 配置文件（如 `.zshrc`）中设置实际值：

```bash
export BRAVE_API_KEY="your-actual-key-here"
```

### 3. 为 AI 助手设置安全边界

当使用 Claude Code、GitHub Copilot 或其他 AI 编程助手时：

- **永远不要**让 AI 生成包含真实凭证的代码
- **总是**审查 AI 生成的配置文件，特别是涉及 API 密钥、数据库连接字符串的部分
- 在项目中创建 `.cursorrules` 或类似的 AI 行为准则文件，明确要求 AI 使用占位符而非真实凭证

## 结语

2865 万个硬编码凭证不是统计学上的噪音——它是 2025 年软件开发速度的副产品。AI 辅助编码让更多人能够创建软件，但也让更多人能够在不知不觉中暴露组织的攻击面。

Secrets Sprawl 不会自行解决。它需要工具、流程和文化的同时演进。在代码离开开发者的机器之前捕获凭证，是我们可以控制的最关键点。

因为一旦密钥推送到 GitHub，它就不再是你的秘密了。

---

**数据来源：** [GitGuardian State of Secrets Sprawl Report 2026](https://www.gitguardian.com/state-of-secrets-sprawl-report-2026)

**本文关键词：** Secrets Sprawl, API Security, AI Security, GitGuardian, Claude Code, MCP, DevSecOps, 凭证泄露

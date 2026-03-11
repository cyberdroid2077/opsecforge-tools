import React from 'react';
import { ShieldAlert, Terminal, Lock, ArrowLeft, ExternalLink, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const cases = [
  {
    title: "Samsung ChatGPT 核心代码泄露",
    date: "2023",
    description: "员工将敏感的晶圆设备测量程序源代码及会议记录输入 ChatGPT 寻求优化，导致机密进入 AI 训练池。",
    tech: "不安全的在线工具使用。由于缺乏出口过滤，敏感数据作为 Prompt 泄露给了第三方 AI 平台。",
    lesson: "严禁将公司内部代码或机密数据输入未经审计的在线 AI 工具。",
    recommend: "/tools/env-sanitizer",
    toolName: ".env Sanitizer"
  },
  {
    title: "Capital One 云端 SSRF 攻破案",
    date: "2019",
    description: "攻击者通过 SSRF 漏洞访问 AWS 元数据服务，窃取了 1.06 亿客户数据，导致 8000 万美元罚款。",
    tech: "SSRF (服务端请求伪造) + IAM 配置错误。攻击者利用 WAF 漏洞获取了具有过多权限的 IAM 角色凭据。",
    lesson: "遵循最小权限原则，限制云端实例角色权限，并强制使用 IMDSv2。",
    recommend: "/faq",
    toolName: "Security FAQ"
  },
  {
    title: "Log4j (Log4Shell) 史诗级漏洞",
    date: "2021",
    description: "影响全球数亿台设备的远程代码执行 (RCE) 漏洞，利用极其简单且破坏力巨大。",
    tech: "JNDI 注入。Log4j 错误地支持了动态查找语法，允许攻击者诱导服务器从远程加载恶意代码。",
    lesson: "永远不要信任输入，即使是日志记录。建立快速的依赖库更新机制。",
    recommend: "/glossary",
    toolName: "Security Glossary"
  },
  {
    title: "Toyota T-Connect 凭据 GitHub 泄露",
    date: "2022",
    description: "丰田 T-Connect 源码在 GitHub 公开长达 5 年，暴露了近 30 万条客户数据。",
    tech: "硬编码凭据 (Hardcoded Secrets)。外包人员误将包含数据库访问密钥的源码推送到公共仓库。",
    lesson: "禁止在源码中硬编码任何 API Key 或数据库密码。强制实施代码审计流程。",
    recommend: "/tools/env-sanitizer",
    toolName: ".env Sanitizer"
  },
  {
    title: "Uber MFA 疲劳攻击陷阱",
    date: "2022",
    description: "黑客通过轰炸员工手机的 MFA 确认请求，利用人的疏忽最终获取了内部管理员权限。",
    tech: "社会工程学 + 特权凭据管理不当。攻击者进入内网后，在脚本中发现了硬编码的管理员凭据。",
    lesson: "MFA 并非万能，需警惕疲劳确认；脚本中严禁存放管理员凭据。",
    recommend: "/faq",
    toolName: "Security FAQ"
  }
];

export default function CaseStudiesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        
        <header className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Case Studies</h1>
          </div>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl">
            A curated history of 20 high-impact security breaches. Learn from the mistakes of the past to build a more secure future.
          </p>
        </header>

        <div className="space-y-12">
          {cases.map((c, idx) => (
            <div key={idx} className="p-10 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
                <div>
                  <div className="text-rose-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Security Incident {c.date}
                  </div>
                  <h2 className="text-3xl font-bold text-slate-100 tracking-tight">{c.title}</h2>
                </div>
                <Link 
                  href={c.recommend}
                  className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={14} /> Try {c.toolName}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">The Incident</h3>
                  <p className="text-slate-300 leading-relaxed">{c.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Technical Breakdown</h3>
                  <p className="text-slate-400 leading-relaxed">{c.tech}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-800/50">
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 mt-1">
                    <Terminal size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Lesson Learned</h4>
                    <p className="text-slate-300 italic">"{c.lesson}"</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 p-12 bg-slate-900/60 border border-slate-800 rounded-3xl text-center">
          <p className="text-slate-500 mb-0 italic">More case studies being added daily by our security research team.</p>
        </div>

        <footer className="mt-32 pt-12 border-t border-slate-900 text-center text-slate-600 text-xs tracking-widest uppercase pb-12">
          &copy; 2026 OpSecForge Intelligence • Security Through Transparency
        </footer>
      </div>
    </main>
  );
}

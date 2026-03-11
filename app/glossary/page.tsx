import React from 'react';
import { Book, ShieldAlert, ShieldCheck, Shield, Search, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const glossary = [
  { id: "xss", term: "XSS", full: "Cross-Site Scripting, 跨站脚本攻击", risk: "高", def: "攻击者在网页中注入恶意客户端脚本，当其他用户浏览该页时，脚本在用户浏览器中执行，从而窃取 Cookie 或进行钓鱼。", analogy: "坏人在公共布告栏的通知单后面贴了一张透明胶，上面写着自动转账指令，谁去摸那个通知单，谁的钱就可能被转走。" },
  { id: "csrf", term: "CSRF", full: "Cross-Site Request Forgery, 跨站请求伪造", risk: "高", def: "诱导已登录用户在不知情的情况下，向受信网站发送非预期的请求（利用用户的登录凭证）。", analogy: "你在银行柜台办业务，坏人递给你一张写着“转账给坏人”的单子混在你的表格里，你没看清楚就签了字，银行因为认你的签名而执行了转账。" },
  { id: "sqli", term: "SQL Injection", full: "SQL 注入", risk: "极高", def: "通过在 Web 表单输入或页面请求查询字符串中插入恶意 SQL 语句，篡改后台数据库查询逻辑。", analogy: "填表时在姓名栏写“张三；顺便把财务表删了”，如果系统不防范，真的会执行删表命令。" },
  { id: "jwt", term: "JWT", full: "JSON Web Token", risk: "中", def: "一种开放标准（RFC 7519），用于在各方之间以 JSON 对象的形式安全地传输信息。", analogy: "就像一张加盖了防伪钢印的景点通票，上面写着你的权限，工作人员只要看一眼钢印没坏，就不用去查总台数据库。" },
  { id: "hsts", term: "HSTS", full: "HTTP Strict Transport Security", risk: "低", def: "一种安全机制，通过响应头通知浏览器只能通过 HTTPS 访问该网站，禁止使用不安全的 HTTP。", analogy: "商店门口挂个牌子：“本店只接待穿正装的客人”，浏览器看到后，以后就算你敲 http 开头的地址，它也会自动帮你换成 https。" },
  { id: "csp", term: "CSP", full: "Content Security Policy, 内容安全策略", risk: "低", def: "一种额外的安全层，允许网站管理者声明哪些外部资源（JS, CSS, 图片）是可以加载执行的。", analogy: "酒店的前台名单：只有名单上的亲戚朋友能进你的房间，陌生人带进来的东西一律没收。" },
  { id: "salting", term: "Salting", full: "加盐", risk: "低", def: "在密码哈希之前往明文密码中加入的一串随机字符串，用以抵御彩虹表攻击。", analogy: "就像厨师做菜，每个人点红烧肉（相同密码）都要撒一把独有的秘制香料（盐），这样出来的成品（哈希值）就不一样了。" },
  { id: "pepper", term: "Pepper", full: "加胡椒粉", risk: "低", def: "与盐类似，但胡椒粉通常是全局唯一的，且存储在代码或安全存储中，不存储在数据库。", analogy: "撒完盐还不够，厨师又在所有的菜里加了一道锁在保险柜里的祖传秘方。即便菜谱丢了，没这秘方也复现不出味道。" },
  { id: "idor", term: "IDOR", full: "Insecure Direct Object Reference", risk: "高", def: "应用程序允许用户通过修改请求中的标识符（如 ID）来访问其未授权的数据。", analogy: "你去取快递，发现只要把取件码 001 改成 002，就能拎走别人的快递，而快递员根本不看你的身份证。" },
  { id: "ssrf", term: "SSRF", full: "Server-Side Request Forgery", risk: "高", def: "攻击者诱导服务器端应用程序向攻击者选定的任意 URL 发起请求。", analogy: "你给餐厅经理留个便条：“请帮我问问隔壁办公室的保险箱密码”，经理没多想真的去问了，利用经理的身份进到了你不该进的地方。" },
  { id: "cors", term: "CORS", full: "Cross-Origin Resource Sharing", risk: "中", def: "一种机制，通过 HTTP 头允许浏览器向不同源的服务器发起 AJAX 请求。", analogy: "“兄弟，我是 A 公司的，想借用一下你们 B 公司的复印机，你们老板批准了吗？”" },
  { id: "path-traversal", term: "Path Traversal", full: "路径遍历", risk: "高", def: "利用输入验证不足，通过 ../ 等字符访问服务器上不该被 Web 访问的文件目录。", analogy: "地址栏原本是 查看/照片.jpg，你改成 查看/../../etc/passwd，结果看到了系统密码文件。" },
  { id: "clickjacking", term: "Clickjacking", full: "点击劫持", risk: "中", def: "使用透明层或 iframe 覆盖网页，诱导用户在不知情的情况下点击下方被隐藏的操作按钮。", analogy: "在一个“领取礼品”的按钮上面覆盖了一个透明的“确认注销账号”按钮，你以为在领礼品，其实在自杀。" },
  { id: "samesite", term: "SameSite Cookie", full: "SameSite 属性", risk: "低", def: "Cookie 的一种属性，用于控制 Cookie 是否随跨站请求发送，主要防御 CSRF。", analogy: "银行卡规定：只能在银行官网柜台使用，如果你是从别的可疑链接点过来的，我就不认这张卡。" },
  { id: "httponly", term: "HttpOnly Cookie", full: "HttpOnly 属性", risk: "低", def: "防止客户端脚本（如 JS）访问 Cookie 的属性，有效缓解 XSS 带来的 Session 窃取。", analogy: "给 Cookie 套了个防弹玻璃罩，你可以带着它进门，但你自己摸不到它，脚本也偷不走它。" },
  { id: "secure-cookie", term: "Secure Cookie", full: "Secure 属性", risk: "低", def: "规定 Cookie 只能通过 HTTPS 协议加密传输。", analogy: "运钞车只能走武装押运通道，绝对不能走普通的泥巴小路。" },
  { id: "rate-limiting", term: "Rate Limiting", full: "速率限制", risk: "中", def: "限制特定时间内用户或 IP 发起的请求数量。", analogy: "银行柜台排队，一个人一分钟内只能取三次钱，取多了就请你去休息室待一会儿。" },
  { id: "brute-force", term: "Brute Force", full: "暴力破解", risk: "高", def: "通过穷举所有可能的组合（如密码、验证码）来尝试获取访问权限。", analogy: "拿着一大串钥匙，一把一把试到锁开为止。" },
  { id: "credential-stuffing", term: "Credential Stuffing", full: "撞库攻击", risk: "高", def: "攻击者利用在其他平台泄露的用户名和密码，批量尝试登录目标系统。", analogy: "坏人偷了你在 A 小区的钥匙，去 B 小区试试看能不能开你的门，因为很多人两边都用一样的锁。" },
  { id: "session-hijacking", term: "Session Hijacking", full: "会话劫持", risk: "高", def: "攻击者通过窃取、猜测等方式获取用户的会话 ID (Session ID)，从而冒充用户。", analogy: "趁你不在，偷走了你正在使用的、已经登录好的电脑。" },
  { id: "session-fixation", term: "Session Fixation", full: "会话固定", risk: "中", def: "攻击者先获取一个合法的会话 ID，诱导受害者使用该 ID 登录，从而掌握其会话控制权。", analogy: "坏人先在储物柜上插一把自己的钥匙，骗你去用那个柜子存东西，等你存完，他直接用备份钥匙开门。" },
  { id: "oauth2", term: "OAuth 2.0", full: "授权协议", risk: "中", def: "一种授权协议，允许第三方应用在不获取用户密码的情况下，访问用户在另一服务上的特定资源。", analogy: "酒店的前台不给你房间钥匙（密码），而是给你一张房卡（Token），这张卡只能开你定的那个房门，且到期失效。" },
  { id: "oidc", term: "OIDC", full: "OpenID Connect", risk: "中", def: "基于 OAuth 2.0 的身份认证层，用于确认用户的身份信息。", analogy: "房卡（OAuth）不仅能开门，刷卡时还能在大屏幕显示你的姓名和身份证号。" },
  { id: "rbac", term: "RBAC", full: "基于角色的访问控制", risk: "低", def: "根据用户的角色来分配权限，而不是针对个人。", analogy: "只要你是“经理”，就能看财务报表。我不管你是张三还是李四。" },
  { id: "abac", term: "ABAC", full: "基于属性的访问控制", risk: "低", def: "根据用户、环境或资源的各种属性（如地点、时间、部门）来决定访问权限。", analogy: "虽然你是经理，但必须在“工作时间内”且在“公司办公室”才能看报表。" },
  { id: "mfa", term: "MFA/2FA", full: "多因素认证/双因子认证", risk: "低", def: "要求用户提供两种及以上不同类别的证据来验证身份。", analogy: "进金库除了要钥匙（你知道的东西），还得录指纹（你拥有的东西）。" },
  { id: "hashing", term: "Hashing", full: "哈希/散列", risk: "中", def: "将任意长度的输入转化为固定长度输出的单向函数，不可逆。", analogy: "把一头牛扔进碎肉机做成香肠，你看到香肠猜不出原先那头牛长什么样，也变不回牛。" },
  { id: "rainbow-table", term: "Rainbow Table", full: "彩虹表", risk: "高", def: "预先计算好的常用密码哈希值的映射表，用于快速反查明文密码。", analogy: "坏人手里有一本“常见香肠与牛的对照表”，一看你的香肠长这样，就知道原来的牛是哪头。" },
  { id: "aes", term: "AES", full: "高级加密标准", risk: "低", def: "对称加密算法标准，加解密使用同一把密钥。", analogy: "一个带锁的盒子，你锁上它发给朋友，你朋友得有和你一模一样的钥匙才能打开。" },
  { id: "rsa", term: "RSA", full: "非对称加密算法", risk: "低", def: "使用公钥加密、私钥解密。", analogy: "你给全世界发了一把“只能锁、不能开”的锁（公钥），别人把信放进盒子里锁好发给你，只有你自己手里那把钥匙（私钥）能开。" },
  { id: "tls", term: "TLS", full: "传输层安全协议", risk: "低", def: "用于在互联网通信中提供身份验证和数据加密。", analogy: "通信双方在说话前先套上一层隐形、防窃听的防弹管道。" },
  { id: "sri", term: "SRI", full: "子资源完整性", risk: "低", def: "允许浏览器检查下载的文件（如来自 CDN 的 JS）是否被篡改。", analogy: "网上订外卖，商家给袋子贴了个一次性封条。你收到后发现封条断了，直接拒收。" },
  { id: "x-frame", term: "X-Frame-Options", full: "防点击劫持头", risk: "低", def: "指示浏览器是否允许该网页在 frame, iframe 或 object 中展现。", analogy: "“不准把我网站的内容套在别人的小盒子里显示，防止别人搞‘点击劫持’”。" },
  { id: "x-content", term: "X-Content-Type-Options", full: "防嗅探头", risk: "低", def: "设为 nosniff 时，防止浏览器猜测文件类型（MIME 类型嗅探）。", analogy: "我说这是个图片，你就按图片处理，不准偷偷把它当成脚本执行！" },
  { id: "waf", term: "WAF", full: "Web 应用防火墙", risk: "低", def: "专门过滤和监测 Web 应用 HTTP 流量的防火墙，防御 SQLi, XSS 等。", analogy: "餐厅门口的安检员，专门检查进店的人身上有没有带硫酸、打火机或违禁品。" },
  { id: "ids-ips", term: "IDS/IPS", full: "入侵检测/防御系统", risk: "低", def: "IDS 监控网络流量发现可疑活动；IPS 在发现可疑活动时直接阻断。", analogy: "IDS 是监控摄像头和保安，看到坏人就喊；IPS 是直接带枪的自动拦截系统。" },
  { id: "captcha", term: "Captcha", full: "验证码", risk: "低", def: "全自动区分计算机和人类的公开图灵测试。", analogy: "“证明你不是机器人，请在下面一堆图里找出所有的交通灯”。" },
  { id: "zero-trust", term: "Zero Trust", full: "零信任架构", risk: "低", def: "核心原则是“永不信任，始终验证”，无论是在内网还是外网访问。", analogy: "就算你进了公司大楼，进办公室、进厕所、进茶水间都要重新刷卡确认身份。" },
  { id: "least-privilege", term: "Least Privilege", full: "最小权限原则", risk: "低", def: "用户或程序仅应拥有完成任务所必需的最少权限。", analogy: "我是来修空调的，你只给我空调房的钥匙，不要把全屋和保险柜的钥匙都给我。" },
  { id: "defense-in-depth", term: "Defense in Depth", full: "纵深防御", risk: "低", def: "设置多层独立的安全控制措施，不依赖单一的防御手段。", analogy: "保卫金库：先有围墙，再有监控，再有厚大门，最后还有保险柜，层层设防。" },
  { id: "attack-surface", term: "Attack Surface", full: "攻击面", risk: "高", def: "系统中攻击者可以利用的所有可能入口点和漏洞的集合。", analogy: "你家房子窗户越多、门越多，小偷能钻进来的机会就越大。" },
  { id: "pentest", term: "Penetration Testing", full: "渗透测试", risk: "中", def: "模拟黑客攻击对系统进行安全评估。", analogy: "雇一个职业小偷来试着偷你家，看看他最后是从哪儿钻进来的，然后你赶紧把那儿补好。" },
  { id: "vulnerability-scan", term: "Vulnerability Scan", full: "漏洞扫描", risk: "低", def: "使用自动化工具检查系统是否存在已知的安全缺陷。", analogy: "拿着一份“常见破损清单”，挨个儿去检查家里窗户关严没、锁坏没。" },
  { id: "sast", term: "SAST", full: "静态应用安全测试", risk: "低", def: "在不运行代码的情况下，对源代码进行扫描和分析。", analogy: "还没盖楼呢，先对照图纸看看支柱够不够粗、电线会不会短路。" },
  { id: "dast", term: "DAST", full: "动态应用安全测试", risk: "中", def: "在应用程序运行时，通过外部输入来发现安全漏洞。", analogy: "楼盖好了，直接去猛踹大门、乱按电梯，看看会不会出故障。" },
  { id: "sca", term: "SCA", full: "软件成分分析", risk: "中", def: "分析项目中使用的第三方开源库是否存在已知漏洞。", analogy: "装修时检查一下你买的胶水、油漆是不是劣质有毒产品。" },
  { id: "cve", term: "CVE", full: "常见漏洞暴露", risk: "中", def: "公开披露的网络安全漏洞名单，每个漏洞都有一个唯一的编号。", analogy: "警察局的“通缉令编号”，提到 CVE-2021-44228 大家都知道是 Log4j 漏洞。" },
  { id: "zero-day", term: "Zero-Day", full: "零日漏洞", risk: "极高", def: "厂商还不知道、且没有补丁的漏洞。", analogy: "一种全新的病毒，医生还没见过，药厂也没出疫苗。" },
  { id: "open-redirect", term: "Open Redirect", full: "开放重定向", risk: "中", def: "网站将用户重定向到攻击者控制的恶意网站。", analogy: "你以为点的是“进入官网”，结果网页把你带到了一个长得一模一样的钓鱼网站。" },
  { id: "command-injection", term: "Command Injection", full: "命令注入", risk: "极高", def: "攻击者通过应用程序在服务器操作系统上执行任意系统命令。", analogy: "系统问：“你要备份哪个文件？”，你回答：“照片.jpg && 关机”，结果系统真的把服务器关了。" }
];

export default function GlossaryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        
        <header className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <Book size={32} />
            </div>
            <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Security Glossary</h1>
          </div>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl">
            A comprehensive dictionary of 50+ web security terms, explained for developers. Because understanding the threat is the first step to neutralising it.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {glossary.map((item) => (
            <div key={item.id} className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-slate-100 font-mono tracking-tight">{item.term}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
                  item.risk === '极高' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                  item.risk === '高' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                  item.risk === '中' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  风险: {item.risk}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                {item.full}
              </p>
              <p className="text-slate-300 mb-6 leading-relaxed">
                {item.def}
              </p>
              <div className="mt-auto p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 italic text-sm text-slate-400 flex gap-3">
                <Shield className="text-slate-600 shrink-0 mt-0.5" size={16} />
                <span>{item.analogy}</span>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-32 pt-12 border-t border-slate-900 text-center text-slate-600 text-sm">
          &copy; 2026 OpSecForge Engineering. Knowledge is the ultimate firewall.
        </footer>
      </div>
    </main>
  );
}

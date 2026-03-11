import React from 'react';
import { Book, Shield, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const glossary = [
  {
    id: "xss",
    term: "XSS",
    full: "Cross-Site Scripting",
    risk: "High",
    def: "An attacker injects malicious client-side scripts into a webpage. When other users view the page, the script executes in their browser, allowing the attacker to steal cookies or perform phishing.",
    analogy: "Like someone sticking a piece of transparent tape with 'automatic transfer' instructions behind a notice on a public bulletin board. Anyone who touches the notice might have their money transferred away."
  },
  {
    id: "csrf",
    term: "CSRF",
    full: "Cross-Site Request Forgery",
    risk: "High",
    def: "Inducing an authenticated user to unknowingly send unintended requests to a trusted website by leveraging the user's active session credentials.",
    analogy: "You're at a bank counter, and a stranger slips a 'transfer to me' form into your stack of papers. You sign it without looking closely, and the bank processes the transfer because the signature is yours."
  },
  {
    id: "sqli",
    term: "SQL Injection",
    full: "SQL Injection",
    risk: "Critical",
    def: "Inserting malicious SQL statements into web form inputs or query strings to manipulate the back-end database query logic.",
    analogy: "Writing 'John Doe; delete the finance table' in the name field of a form. If the system isn't protected, it might actually execute the command to wipe the table."
  },
  {
    id: "jwt",
    term: "JWT",
    full: "JSON Web Token",
    risk: "Medium",
    def: "An open standard (RFC 7519) used for securely transmitting information between parties as a JSON object.",
    analogy: "Like a theme park pass with an anti-counterfeit stamp. It lists your permissions, and staff only need to check the stamp to know you're authorized without checking a central database."
  },
  {
    id: "hsts",
    term: "HSTS",
    full: "HTTP Strict Transport Security",
    risk: "Low",
    def: "A security mechanism that informs browsers via a response header to only interact with the site using HTTPS, prohibiting insecure HTTP connections.",
    analogy: "A shop hangs a sign: 'Formal wear only.' Once the browser sees this, it will automatically change any http:// addresses you type to https:// for that store."
  },
  {
    id: "csp",
    term: "CSP",
    full: "Content Security Policy",
    risk: "Low",
    def: "An added layer of security that allows website administrators to declare which external resources (JS, CSS, images) are permitted to load and execute.",
    analogy: "A hotel guest list: only the friends and family on your list are allowed into your room; anything brought in by strangers is confiscated at the door."
  },
  {
    id: "salting",
    term: "Salting",
    full: "Salting",
    risk: "Low",
    def: "Adding a unique random string to a plaintext password before hashing it to defend against rainbow table attacks.",
    analogy: "Like a chef where every customer ordering the same dish (same password) gets a unique secret spice (salt), ensuring the final meal (hash value) looks different every time."
  },
  {
    id: "pepper",
    term: "Pepper",
    full: "Pepper",
    risk: "Low",
    def: "Similar to salting, but a 'pepper' is usually a global secret stored in code or a hardware security module rather than the database.",
    analogy: "After the salt, the chef adds a family secret sauce kept in a safe. Even if the recipe is stolen, the flavor can't be replicated without that secret ingredient."
  },
  {
    id: "idor",
    term: "IDOR",
    full: "Insecure Direct Object Reference",
    risk: "High",
    def: "A vulnerability where an application allows users to access unauthorized data by modifying identifiers (such as IDs) in a request.",
    analogy: "You go to pick up a package and realize that if you change the pickup code from 001 to 002, you can take someone else's package because the clerk doesn't check your ID."
  },
  {
    id: "ssrf",
    term: "SSRF",
    full: "Server-Side Request Forgery",
    risk: "High",
    def: "A vulnerability where an attacker induces a server-side application to make requests to an arbitrary URL of the attacker's choosing.",
    analogy: "Leaving a note for a restaurant manager: 'Could you ask the office next door for their safe combination?' The manager asks, using their trusted status to go where you aren't allowed."
  },
  {
    id: "cors",
    term: "CORS",
    full: "Cross-Origin Resource Sharing",
    risk: "Medium",
    def: "A mechanism that uses HTTP headers to tell browsers to give a web application running at one origin access to selected resources from a different origin.",
    analogy: "'Hey, I'm from Company A. I'd like to use Company B's copier—did your boss approve this access?'"
  },
  {
    id: "path-traversal",
    term: "Path Traversal",
    full: "Path Traversal",
    risk: "High",
    def: "Exploiting insufficient input validation to access files and directories outside the web root folder using characters like '../'.",
    analogy: "The URL says 'view/photo.jpg', but you change it to 'view/../../etc/passwd' and end up seeing the system's sensitive password files."
  },
  {
    id: "clickjacking",
    term: "Clickjacking",
    full: "Clickjacking",
    risk: "Medium",
    def: "Using transparent layers or iframes to overlay a webpage, tricking users into clicking hidden buttons or links.",
    analogy: "A 'Claim Prize' button has a transparent 'Delete Account' button layered over it. You think you're getting a gift, but you're actually deleting your profile."
  },
  {
    id: "samesite",
    term: "SameSite Cookie",
    full: "SameSite Attribute",
    risk: "Low",
    def: "A cookie attribute used to control whether cookies are sent with cross-site requests, primarily to mitigate CSRF.",
    analogy: "A bank card rule: 'This card is only valid if presented at the bank's official counter. If you followed a link from a suspicious site, I won't accept it.'"
  },
  {
    id: "httponly",
    term: "HttpOnly Cookie",
    full: "HttpOnly Attribute",
    risk: "Low",
    def: "An attribute that prevents client-side scripts (like JavaScript) from accessing cookies, mitigating session theft via XSS.",
    analogy: "Putting a cookie in a bulletproof glass case. You can carry it to show you're logged in, but you can't touch it directly, and neither can any malicious scripts."
  },
  {
    id: "secure-cookie",
    term: "Secure Cookie",
    full: "Secure Attribute",
    risk: "Low",
    def: "A cookie attribute that ensures the cookie is only transmitted over encrypted HTTPS connections.",
    analogy: "An armored truck that is only allowed to drive on secure, guarded highways, never on ordinary dirt roads."
  },
  {
    id: "rate-limiting",
    term: "Rate Limiting",
    full: "Rate Limiting",
    risk: "Medium",
    def: "Restricting the number of requests a user or IP address can make within a specific timeframe.",
    analogy: "At a bank counter, one person is only allowed to withdraw money three times per minute. If they try more, they're asked to wait in the lounge."
  },
  {
    id: "brute-force",
    term: "Brute Force",
    full: "Brute Force Attack",
    risk: "High",
    def: "An attempt to gain access by systematically trying all possible combinations of passwords or codes.",
    analogy: "Holding a massive ring of keys and trying every single one until the lock finally opens."
  },
  {
    id: "credential-stuffing",
    term: "Credential Stuffing",
    full: "Credential Stuffing",
    risk: "High",
    def: "A type of attack where stolen account credentials from one platform are used to gain unauthorized access to other systems.",
    analogy: "A thief steals your keys to Apartment A and tries them at Apartment B, knowing many people use the same locks for both."
  },
  {
    id: "session-hijacking",
    term: "Session Hijacking",
    full: "Session Hijacking",
    risk: "High",
    def: "An attack where the attacker gains unauthorized access to information or services by stealing or predicting a valid Session ID.",
    analogy: "Slipping into your chair and taking over your computer while it's still logged in and you've stepped away."
  },
  {
    id: "session-fixation",
    term: "Session Fixation",
    full: "Session Fixation",
    risk: "Medium",
    def: "An attack where the attacker provides a valid Session ID to a victim and induces them to log in with it, thereby gaining control over the session.",
    analogy: "A thief leaves their own key in a locker and tricks you into using that specific locker. Once you've stored your valuables, they use their spare key to open it."
  },
  {
    id: "oauth2",
    term: "OAuth 2.0",
    full: "Authorization Framework",
    risk: "Medium",
    def: "An authorization protocol that allows third-party applications to obtain limited access to user resources on another service without sharing the password.",
    analogy: "The hotel front desk doesn't give you the master key (password) but gives you a keycard (token) that only opens your specific room and expires when you check out."
  },
  {
    id: "oidc",
    term: "OIDC",
    full: "OpenID Connect",
    risk: "Medium",
    def: "An identity layer built on top of the OAuth 2.0 protocol used to verify the identity of the end-user.",
    analogy: "Your hotel keycard (OAuth) not only opens the door but also displays your name and ID on a screen when you swipe it."
  },
  {
    id: "rbac",
    term: "RBAC",
    full: "Role-Based Access Control",
    risk: "Low",
    def: "A method of regulating access to resources based on the roles of individual users within an organization.",
    analogy: "If you're a 'Manager,' you can see the financial reports. It doesn't matter if your name is John or Jane."
  },
  {
    id: "abac",
    term: "ABAC",
    full: "Attribute-Based Access Control",
    risk: "Low",
    def: "An authorization model that provides access based on attributes of the user, the resource, and the environment.",
    analogy: "Even if you're a manager, you must be in the 'Company Office' during 'Work Hours' to view the reports."
  },
  {
    id: "mfa",
    term: "MFA/2FA",
    full: "Multi-Factor Authentication",
    risk: "Low",
    def: "A security process that requires users to provide two or more different factors to verify their identity.",
    analogy: "To enter the vault, you need both a physical key (something you have) and a fingerprint scan (something you are)."
  },
  {
    id: "hashing",
    term: "Hashing",
    full: "Hashing",
    risk: "Medium",
    def: "A one-way function that converts input of any length into a fixed-length output string, which is irreversible.",
    analogy: "Putting a cow through a meat grinder to make sausages. You can't look at the sausage and know what the cow looked like, and you certainly can't turn the sausage back into a cow."
  },
  {
    id: "rainbow-table",
    term: "Rainbow Table",
    full: "Rainbow Table",
    risk: "High",
    def: "A precomputed table for reversing cryptographic hash functions, usually for cracking password hashes.",
    analogy: "A thief has a 'Sausage-to-Cow Reference Book.' They see your sausage and look it up to find exactly which cow it came from."
  },
  {
    id: "aes",
    term: "AES",
    full: "Advanced Encryption Standard",
    risk: "Low",
    def: "A symmetric encryption algorithm standard where the same key is used for both encryption and decryption.",
    analogy: "A locked box you send to a friend. Your friend must have an identical key to yours to unlock it."
  },
  {
    id: "rsa",
    term: "RSA",
    full: "Asymmetric Encryption Algorithm",
    risk: "Low",
    def: "An asymmetric encryption algorithm that uses a public key for encryption and a private key for decryption.",
    analogy: "You distribute 'locks that only close' (public keys) to the world. People put messages in boxes and lock them. Only your personal key (private key) can open them."
  },
  {
    id: "tls",
    term: "TLS",
    full: "Transport Layer Security",
    risk: "Low",
    def: "A protocol that provides authentication and data encryption between different endpoints.",
    analogy: "Communication parties create an invisible, anti-eavesdropping armored pipeline before talking."
  },
  {
    id: "sri",
    term: "SRI",
    full: "Subresource Integrity",
    risk: "Low",
    def: "A security feature that enables browsers to verify that resources they fetch (for example, from a CDN) are delivered without unexpected manipulation.",
    analogy: "Ordering takeout online where the merchant puts a one-time seal on the bag. If you find the seal broken upon delivery, you refuse the order."
  },
  {
    id: "x-frame",
    term: "X-Frame-Options",
    full: "X-Frame-Options Header",
    risk: "Low",
    def: "An HTTP response header used to indicate whether a browser should be allowed to render a page in a frame, iframe, or object.",
    analogy: "'Do not allow my website content to be nested in someone else's small box to prevent UI redressing attacks like clickjacking.'"
  },
  {
    id: "x-content",
    term: "X-Content-Type-Options",
    full: "X-Content-Type-Options Header",
    risk: "Low",
    def: "A header used by the server to prevent the browser from 'guessing' the MIME type of a file (MIME sniffing).",
    analogy: "If I say this is a picture, you treat it as a picture. Do not try to execute it as a script behind my back!"
  },
  {
    id: "waf",
    term: "WAF",
    full: "Web Application Firewall",
    risk: "Low",
    def: "A firewall that monitors and filters HTTP traffic between a web application and the internet to protect against attacks like SQLi and XSS.",
    analogy: "A security guard at a restaurant entrance specifically checking if guests are carrying hazardous materials or contraband."
  },
  {
    id: "ids-ips",
    term: "IDS/IPS",
    full: "Intrusion Detection/Prevention System",
    risk: "Low",
    def: "IDS monitors network traffic for suspicious activity; IPS blocks suspicious activity when it is discovered.",
    analogy: "IDS is a security camera and a guard who yells when they see a thief; IPS is an automated system that locks the doors immediately."
  },
  {
    id: "captcha",
    term: "Captcha",
    full: "CAPTCHA",
    risk: "Low",
    def: "A type of challenge-response test used in computing to determine whether or not the user is human.",
    analogy: "'Prove you're not a robot by finding all the traffic lights in these photos.'"
  },
  {
    id: "zero-trust",
    term: "Zero Trust",
    full: "Zero Trust Architecture",
    risk: "Low",
    def: "A security framework requiring all users to be authenticated, authorized, and continuously validated before being granted access to data.",
    analogy: "Even if you're inside the company building, you must swipe your card to enter the office, the restroom, and the breakroom."
  },
  {
    id: "least-privilege",
    term: "Least Privilege",
    full: "Principle of Least Privilege",
    risk: "Low",
    def: "The concept that a user or program should only have access to the specific data and resources needed to complete a task.",
    analogy: "If I come to fix your AC, you only give me the key to the AC room, not the keys to your entire house and safe."
  },
  {
    id: "defense-in-depth",
    term: "Defense in Depth",
    full: "Defense in Depth",
    risk: "Low",
    def: "An information security strategy that uses multiple layers of security controls throughout an IT system.",
    analogy: "Protecting a vault: first a perimeter wall, then cameras, then a thick vault door, and finally individual safety deposit boxes."
  },
  {
    id: "attack-surface",
    term: "Attack Surface",
    full: "Attack Surface",
    risk: "High",
    def: "The sum total of all possible entry points and vulnerabilities in a system that an attacker can exploit.",
    analogy: "The more windows and doors your house has, the more opportunities a burglar has to break in."
  },
  {
    id: "pentest",
    term: "Penetration Testing",
    full: "Penetration Testing",
    risk: "Medium",
    def: "A simulated cyberattack against your computer system to check for exploitable vulnerabilities.",
    analogy: "Hiring a professional thief to try and break into your house so you can find out exactly how they got in and fix it."
  },
  {
    id: "vulnerability-scan",
    term: "Vulnerability Scan",
    full: "Vulnerability Scanning",
    risk: "Low",
    def: "An automated process to identify security vulnerabilities in a system or network.",
    analogy: "Using a 'common damage checklist' to walk around your house and see if any windows are unlocked or if any locks are broken."
  },
  {
    id: "sast",
    term: "SAST",
    full: "Static Application Security Testing",
    risk: "Low",
    def: "Scanning and analyzing source code for security vulnerabilities without executing the code.",
    analogy: "Checking the blueprints before building a skyscraper to ensure the support beams are thick enough and the wiring won't short-circuit."
  },
  {
    id: "dast",
    term: "DAST",
    full: "Dynamic Application Security Testing",
    risk: "Medium",
    def: "Testing an application in its running state to find security vulnerabilities through external inputs.",
    analogy: "Once the building is finished, kicking the front door and messing with the elevator buttons to see if anything breaks."
  },
  {
    id: "sca",
    term: "SCA",
    full: "Software Composition Analysis",
    risk: "Medium",
    def: "Analyzing third-party open-source libraries used in a project for known security vulnerabilities.",
    analogy: "Checking the glue and paint you bought for a renovation to ensure they aren't toxic or low-quality."
  },
  {
    id: "cve",
    term: "CVE",
    full: "Common Vulnerabilities and Exposures",
    risk: "Medium",
    def: "A list of publicly disclosed cybersecurity vulnerabilities, each assigned a unique identification number.",
    analogy: "A police 'Wanted Poster' number; when CVE-2021-44228 is mentioned, everyone knows it's the famous Log4j vulnerability."
  },
  {
    id: "zero-day",
    term: "Zero-Day",
    full: "Zero-Day Vulnerability",
    risk: "Critical",
    def: "A vulnerability in software that is unknown to the vendor and has no patch available.",
    analogy: "A brand-new virus that doctors haven't seen yet, and for which there is no vaccine or cure."
  },
  {
    id: "open-redirect",
    term: "Open Redirect",
    full: "Open Redirect",
    risk: "Medium",
    def: "When an application redirects a user to an external, potentially malicious website specified in a URL parameter.",
    analogy: "You think you're clicking 'Enter Official Site,' but the page takes you to a phishing site that looks identical."
  },
  {
    id: "command-injection",
    term: "Command Injection",
    full: "Command Injection",
    risk: "Critical",
    def: "When an attacker executes arbitrary system commands on the host operating system via a vulnerable application.",
    analogy: "The system asks 'Which file to backup?' and you answer 'photo.jpg && shutdown,' causing the system to actually turn off the server."
  }
];

export default function GlossaryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        
        <header className="mb-20 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <Book size={32} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-100 tracking-tight">Security Glossary</h1>
          </div>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl">
            A comprehensive dictionary of 50+ web security terms, explained for developers. Because understanding the threat is the first step to neutralising it.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {glossary.map((item) => (
            <div key={item.id} className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-slate-100 font-mono tracking-tight group-hover:text-emerald-400 transition-colors">{item.term}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
                  item.risk === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                  item.risk === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                  item.risk === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  Risk: {item.risk}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                {item.full}
              </p>
              <p className="text-slate-300 mb-6 leading-relaxed font-sans">
                {item.def}
              </p>
              <div className="mt-auto p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 italic text-sm text-slate-400 flex gap-3 font-sans">
                <Shield className="text-slate-600 shrink-0 mt-0.5" size={16} />
                <span>{item.analogy}</span>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-32 pt-12 border-t border-slate-900 text-center text-slate-600 text-xs tracking-widest uppercase pb-12">
          &copy; 2026 OpSecForge Engineering • Knowledge is the ultimate firewall.
        </footer>
      </div>
    </main>
  );
}

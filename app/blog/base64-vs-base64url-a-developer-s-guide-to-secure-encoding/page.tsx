
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function BlogPost() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans">
      <div className="z-10 w-full max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors mb-12 text-sm font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Back to Blog
        </Link>
        
        <article>
          <header className="mb-12 pb-8 border-b border-slate-800">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-100 mb-6 tracking-tight">Base64 vs Base64URL: A Developer's Guide to Secure Encoding</h1>
            <div className="flex items-center gap-6 text-slate-500 text-sm">
              <span className="flex items-center gap-2"><Calendar size={16} /> March 14, 2026</span>
              <span className="flex items-center gap-2"><Clock size={16} /> 5 min read</span>
            </div>
          </header>
          
          <div className="prose prose-invert prose-emerald max-w-none" dangerouslySetInnerHTML={{ __html: `<p class="mb-6 text-slate-400 leading-relaxed">Base64 represents bytes with text characters. Base64URL is the URL-safe alphabet defined by <a href="https://www.rfc-editor.org/rfc/rfc4648.html#section-5">RFC 4648 section 5</a>. Neither format encrypts, authenticates, or makes the underlying data safe to disclose.</p><h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">What is Base64?</h2><p class="mb-6 text-slate-400 leading-relaxed">Standard Base64 uses A-Z, a-z, 0-9, &#96;+&#96;, and &#96;/&#96;, with &#96;=&#96; padding when needed. It is common in data URIs, MIME content, and protocol fields that explicitly require this alphabet.</p><h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">The URL Problem</h2><p class="mb-6 text-slate-400 leading-relaxed">The &#96;+&#96;, &#96;/&#96;, and &#96;=&#96; characters can require escaping or special handling in URL components. Using standard Base64 where a protocol expects Base64URL can corrupt or reject the value.</p><h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">Enter Base64URL</h2><p class="mb-6 text-slate-400 leading-relaxed">Base64URL changes the alphabet:
- &#96;+&#96; is replaced with &#96;-&#96; (hyphen).
- &#96;/&#96; is replaced with &#96;_&#96; (underscore).
- Padding is commonly omitted when the surrounding specification allows it.</p><p class="mb-6 text-slate-400 leading-relaxed">This avoids the standard alphabet characters that conflict with URL-safe transport. Always follow the exact padding and serialization rules of the protocol you are implementing.</p><h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">When to Use Which?</h2><p class="mb-6 text-slate-400 leading-relaxed">- <strong>Use standard Base64</strong> when the receiving format explicitly expects it, including many MIME and data-URI contexts.
- <strong>Use Base64URL</strong> for JWTs (JSON Web Tokens), OAuth state parameters, and any data passed via a URL.</p><h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">Secure Encoding with OpSecForge</h2><p class="mb-6 text-slate-400 leading-relaxed">Whether you need standard Base64 or Base64URL, you shouldn&#039;t be pasting sensitive binary data into random online converters. OpSecForge provides a secure, local-first Base64/Base64URL encoder and decoder. Your data is processed entirely on your machine, ensuring zero risk of interception. Keep your data safe and your URLs clean with OpSecForge.
- <strong>Do not use either as encryption.</strong> Anyone who receives an encoded value can generally decode it.</p><h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">Try both formats locally</h2><p class="mb-6 text-slate-400 leading-relaxed">Use the <a href="/tools/base64-converter">OpsecForge Base64 and Base64URL converter</a> to transform UTF-8 text in the loaded browser page. Tool input is not sent to an OpsecForge processing backend or included in analytics events. Avoid entering live secrets: local transformation does not make sensitive input safe to disclose.
</p>` }} />
        </article>
      </div>
    </main>
  );
}

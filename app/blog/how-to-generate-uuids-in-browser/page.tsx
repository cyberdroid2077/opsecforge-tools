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
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-100 mb-6 tracking-tight">How to Generate UUIDs in Your Browser: A Developer's Guide</h1>
            <div className="flex items-center gap-6 text-slate-500 text-sm">
              <span className="flex items-center gap-2"><Calendar size={16} /> March 27, 2026</span>
              <span className="flex items-center gap-2"><Clock size={16} /> 4 min read</span>
            </div>
          </header>
          
          <div className="prose prose-invert prose-emerald max-w-none" dangerouslySetInnerHTML={{ __html: `<p class="mb-6 text-slate-400 leading-relaxed">Universally Unique Identifiers (UUIDs) are 128-bit numbers used to identify information in software systems. They are the de facto standard for database primary keys, distributed system identifiers, session IDs, and correlation tokens. Unlike sequential integers, UUIDs can be generated independently across multiple systems without coordination, making them ideal for distributed architectures where multiple nodes might create records simultaneously.</p>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">What Is a UUID?</h2>
<p class="mb-6 text-slate-400 leading-relaxed">A UUID is a 36-character string (32 hex digits plus 4 hyphens) formatted as <code>xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx</code>. The M digit indicates the UUID version, and the N digit indicates the variant. The most common formats are UUID v1 (time-based), UUID v4 (random), and ULID (a newer format with better sortability).</p>
<p class="mb-6 text-slate-400 leading-relaxed">Example UUID v4: <code>f47ac10b-58cc-4372-a567-0e02b2c3d479</code></p>
<p class="mb-6 text-slate-400 leading-relaxed">The probability of generating the same UUID twice is infinitesimally small — approximately 1 in 5.3×10³⁶. This is often described as "enough UUIDs to assign one to every atom in your body, times a billion."</p>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">UUID Versions: Which One Should You Use?</h2>
<p class="mb-6 text-slate-400 leading-relaxed"><strong>UUID v1 (Time-based):</strong> Generated from a timestamp and node ID (typically the MAC address). Lexicographically sortable and time-ordered, but reveals the timestamp and machine identity when inspected. Less suitable for security-sensitive contexts.</p>
<p class="mb-6 text-slate-400 leading-relaxed"><strong>UUID v4 (Random):</strong> Generated using cryptographically secure random numbers. No identifying information is embedded. The standard choice for most application-level identifiers. Does not reveal timing or machine information.</p>
<p class="mb-6 text-slate-400 leading-relaxed"><strong>ULID (Universally Unique Lexicographically Sortable Identifier):</strong> A newer format that is timestamp-based like UUID v1 but uses a different encoding (Crockford's Base32). Sortable and more compact than UUID. Growing adoption in event-driven and time-series systems.</p>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">Common Use Cases for UUIDs</h2>
<ul class="mb-6 text-slate-400 leading-relaxed list-disc list-inside space-y-2">
<li><strong>Database primary keys:</strong> UUIDs allow merging data from distributed databases without key collisions. No need for a central ID generation service.</li>
<li><strong>Session identifiers:</strong> Web application session tokens are often UUIDs. The randomness prevents session hijacking via prediction.</li>
<li><strong>Correlation IDs:</strong> In microservices architectures, each request is tagged with a UUID that traces through all services. Logs can be searched by correlation ID to reconstruct a request path.</li>
<li><strong>File names:</strong> When storing user uploads, using a UUID as the filename prevents path traversal attacks and filename collisions.</li>
<li><strong>API resource identifiers:</strong> Public API endpoints often use UUIDs instead of sequential integers to prevent enumeration attacks.</li>
</ul>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">Why Generate UUIDs Client-Side?</h2>
<p class="mb-6 text-slate-400 leading-relaxed">Most backend frameworks provide UUID generation out of the box (Python's <code>uuid</code> module, Node's <code>crypto.randomUUID()</code>, Java's <code>UUID.randomUUID()</code>). Client-side UUID generation is useful in specific scenarios:</p>
<ul class="mb-6 text-slate-400 leading-relaxed list-disc list-inside space-y-2">
<li><strong>Offline-first applications:</strong> Generate UUIDs for local records before syncing to a server. Ensures IDs are stable regardless of network connectivity.</li>
<li><strong>Client-side mock data:</strong> When building frontend prototypes, generate realistic UUIDs for mock API responses without a backend.</li>
<li><strong>Privacy-sensitive contexts:</strong> Server-side UUID generation means the server knows every ID created. Client-side generation keeps the server ignorant of IDs until they are submitted.</li>
<li><strong>Performance optimization:</strong> Generating IDs on the client reduces server round-trips during bulk data entry operations.</li>
</ul>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">How to Use the OpsecForge UUID Generator</h2>
<ol class="mb-6 text-slate-400 leading-relaxed list-decimal list-inside space-y-2">
<li>Open the UUID Generator page</li>
<li>Click "Generate" to create a new UUID v4 (random)</li>
<li>Click multiple times to generate multiple UUIDs at once</li>
<li>Click the copy button next to any UUID to copy it to your clipboard</li>
<li>All generation happens locally — no network requests are made</li>
</ol>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">UUID vs. Sequential Integer IDs: A Comparison</h2>
<p class="mb-6 text-slate-400 leading-relaxed">Sequential integer IDs (1, 2, 3...) are simpler, smaller (8 bytes vs. 36 characters), and database-index-friendly. They also reveal the approximate age and size of your dataset to observant competitors or attackers.</p>
<p class="mb-6 text-slate-400 leading-relaxed">UUIDs are larger and can cause database indexing overhead (random insertion patterns in B-tree indexes). Modern databases handle this reasonably well, and UUID v7 (time-ordered UUID) specifically addresses the sorting problem while maintaining the privacy and distribution benefits of UUIDs.</p>

<p class="mb-6 text-slate-400 leading-relaxed">The OpsecForge UUID Generator uses the browser's native <code>crypto.randomUUID()</code> API for cryptographically secure random UUIDs. Fast, private, and requires no signup or server communication.</p>` }} />
        </article>
      </div>
    </main>
  );
}

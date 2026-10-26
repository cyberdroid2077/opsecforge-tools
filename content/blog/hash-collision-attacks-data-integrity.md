---
title: "Hash Collision Attacks: MD5, SHA-1, and Safe Verification"
date: "2026-04-04"
updated: "2026-10-26"
description: "Understand hash collisions, why MD5 and SHA-1 are unsafe for signatures, and how to verify files with SHA-256 and an authenticated source."
author: "OpsecForge Security Team"
category: "Application Security"
tags: ["hash-collisions", "cryptography", "data-integrity", "sha-256", "md5", "sha-1"]
source_reviewed: "2026-10-26"
primary_source: "https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm"
---

# Hash Collision Attacks: MD5, SHA-1, and Safe Verification

A hash collision exists when two different inputs produce the same digest. Collisions must exist because a fixed-size digest represents an unlimited set of possible inputs. A cryptographic hash is useful only when finding a collision is computationally impractical.

The practical rule is simple: do not use MD5 or SHA-1 where collision resistance protects a signature, certificate, update, or other security decision. Use an approved SHA-2 or SHA-3 algorithm and verify the expected digest through an authenticated source.

<div class="my-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
  <h2 class="mt-0 text-2xl font-bold text-slate-100">Check a downloaded file against its checksum</h2>
  <p class="text-slate-300">Select a file up to 32 MiB and compare its SHA-256 or SHA-512 digest in your browser. The file is not uploaded. Get the expected digest from a trusted publisher; matching checksums do not prove a file is safe.</p>
  <a href="/tools/hash-generator#file-checksum" class="mt-4 inline-flex rounded-full bg-emerald-500 px-6 py-3 font-bold !text-slate-950 !no-underline hover:bg-emerald-400">Compare a file checksum →</a>
</div>

## Collision resistance is not preimage resistance

These security properties answer different questions:

- **Collision resistance:** Can an attacker find any two different inputs with the same digest?
- **Second-preimage resistance:** Given one input, can an attacker find a different input with the same digest?
- **Preimage resistance:** Given a digest, can an attacker find an input that produces it?

A collision demonstration does not mean an attacker can reverse every digest or replace any arbitrary file with a chosen malicious file. It does mean the affected algorithm no longer provides its intended collision-security margin. That is enough to disqualify it from many signature and certificate uses.

For an ideal *n*-bit hash, generic collision search takes about 2<sup>n/2</sup> work because of the birthday bound. Cryptanalysis can reduce the work for a specific algorithm, which is what happened to MD5 and SHA-1.

## Why MD5 and SHA-1 should not protect security decisions

MD5 collision resistance is broken. [RFC 6151](https://www.rfc-editor.org/rfc/rfc6151) says MD5 is no longer acceptable where collision resistance is required, including digital signatures. Researchers also demonstrated a [rogue certification authority certificate](https://www.win.tue.nl/hashclash/rogue-ca/) using an MD5 chosen-prefix collision, showing how a weak digest can undermine a signed structure.

SHA-1 also no longer provides adequate collision resistance:

- The 2017 [SHAttered demonstration](https://shattered.io/) published two different PDF files with the same SHA-1 digest.
- The 2020 [SHA-1 chosen-prefix collision research](https://eprint.iacr.org/2020/014) made it possible to choose different prefixes before constructing colliding files, a more flexible attack model.
- [NIST announced its transition away from SHA-1](https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm) and recommends moving to SHA-2 or SHA-3.

Legacy systems may still expose MD5 or SHA-1 identifiers for compatibility. Do not treat those values as security evidence. Plan a migration and avoid creating new dependencies on them.

## Reproduce SHAttered yourself

The SHAttered authors published the two colliding PDFs at [shattered.io](https://shattered.io/). You can download them and check the claim with standard tools instead of taking it on trust. The files are harmless documents, but treat any download as untrusted data and open them in a viewer only if you want to see the visual difference.

```bash
curl -O https://shattered.io/static/shattered-1.pdf
curl -O https://shattered.io/static/shattered-2.pdf

# Linux
sha1sum   shattered-1.pdf shattered-2.pdf
sha256sum shattered-1.pdf shattered-2.pdf

# macOS
shasum -a 1   shattered-1.pdf shattered-2.pdf
shasum -a 256 shattered-1.pdf shattered-2.pdf
```

```powershell
# Windows PowerShell
Get-FileHash -Algorithm SHA1   .\shattered-1.pdf, .\shattered-2.pdf
Get-FileHash -Algorithm SHA256 .\shattered-1.pdf, .\shattered-2.pdf
```

We downloaded both files and computed the digests with Node.js `crypto` on 2026-10-26. Both files are 422,435 bytes.

| File | SHA-1 | SHA-256 |
| --- | --- | --- |
| `shattered-1.pdf` | `38762cf7f55934b34d179ae6a4c80cadccbb7f0a` | `2bb787a73e37352f92383abe7e2902936d1059ad9f1ba6daaa9c1e58ee6970d0` |
| `shattered-2.pdf` | `38762cf7f55934b34d179ae6a4c80cadccbb7f0a` | `d4488775d29bdef7993367d541064dbdda50d383f89f0aa13a6ff2e0894ba5ff` |

For reference, the MD5 values are `ee4aa52b139d925f8d8884402b0a750c` and `5bd9d8cabc46041579a311230539b8d1`. They differ, which is expected: the file pair targets SHA-1, not MD5.

Three things to notice in your own output:

- The SHA-1 digests are identical, so the SHA-1 comparison cannot tell these two files apart.
- The SHA-256 digests differ, so a SHA-256 comparison does tell them apart. This is the practical reason to migrate: the same two files that fool SHA-1 are distinguishable under SHA-256.
- The files really are different. A byte-by-byte comparison finds the first differing byte at offset 192 (0xC0) and the last at offset 319, with 62 bytes differing in total, all inside that 128-byte window. Everything else in the 422,435 bytes is identical, so the whole difference sits in a small region of the file.

The SHAttered pair is an identical-prefix collision. It does not let someone pick an arbitrary victim file and forge a colliding twin, which is the second-preimage case discussed above. The practical damage comes from formats where an attacker can prepare both versions before anyone signs one of them.

## Truncated digests and the birthday bound

The 2<sup>n/2</sup> figure is a rule of thumb. For a uniformly random *n*-bit digest with N = 2<sup>n</sup> possible values, the probability that at least one pair among *k* values collides is approximately 1 - e<sup>-k(k-1)/2N</sup>. Solving for *k* at a target probability *p* gives:

`k ≈ sqrt(2 · N · ln(1 / (1 - p)))`

We evaluated this with Node.js for common digest sizes. The values assume uniformly random outputs. They describe accidental collisions and generic attacks; a cryptanalytic weakness in the hash itself, as with MD5 and SHA-1, lets an attacker do better than these numbers.

| Digest bits | Values for ~50% collision chance | Values for ~1% collision chance |
| --- | --- | --- |
| 32 | about 77,000 (2<sup>16.2</sup>) | about 9,300 (2<sup>13.2</sup>) |
| 48 | about 2.0 × 10<sup>7</sup> | about 2.4 × 10<sup>6</sup> |
| 64 | about 5.1 × 10<sup>9</sup> | about 6.1 × 10<sup>8</sup> |
| 128 | about 2.2 × 10<sup>19</sup> (2<sup>64.2</sup>) | about 2.6 × 10<sup>18</sup> |
| 256 | about 4.0 × 10<sup>38</sup> (2<sup>128.2</sup>) | about 4.8 × 10<sup>37</sup> |

The consequence for engineering is that **the security margin depends on how many bits you keep, not on the algorithm you started with.** If you take a SHA-256 digest and keep the first 8 hex characters (32 bits) as a deduplication key or cache key, you have a 32-bit identifier. From the table, a store with only around 9,300 distinct items already has roughly a 1% chance that two of them share a key, and around 77,000 items make it a coin flip. SHA-256 being strong does not help, because the truncation discards the property you were relying on.

The same arithmetic applies to short IDs, truncated commit or build identifiers shown in a UI, and 64-bit tokens. Two different questions then need separate answers:

1. **Accidental collisions.** Use the table above with your expected number of items. Choose enough bits that the probability is negligible for your scale, or handle a collision explicitly by comparing the full content before treating two keys as the same.
2. **Adversarial collisions.** If someone else can choose the inputs, the attacker's cost for a 64-bit key is about 2<sup>32</sup> hash evaluations, which is within reach of ordinary hardware. Do not use short truncated digests as the only check on data that an untrusted party controls.

A common safe pattern for caches is to use the full digest as the key, or to use a short key only as an index and verify the full content or full digest on a hit.

## Git and SHA-1

Git identifies every object by a hash, and it historically used SHA-1. The Git project's [hash function transition document](https://git-scm.com/docs/hash-function-transition) describes the situation directly. It records that the SHAttered attack demonstrated a practical SHA-1 collision on 23 February 2017, and that Git v2.13.0 and later moved to a hardened SHA-1 implementation by default that is not vulnerable to the SHAttered attack. It also says SHA-1 is still weak and that it is prudent to move to a new hash.

The hardened implementation is based on the [sha1collisiondetection](https://github.com/cr-marcstevens/sha1collisiondetection) library by Marc Stevens and Dan Shumow. Its README describes a drop-in replacement that computes SHA-1 and additionally detects data produced by known cryptanalytic collision attacks, including the SHAttered pair. It builds on the counter-cryptanalysis technique from [Stevens' CRYPTO 2013 paper](https://marc-stevens.nl/research/papers/C13-S.pdf). The README states it detects attacks using the listed disturbance vectors, so it targets known attack families rather than being a general guarantee.

Git also supports an alternative. The [`git init` documentation](https://git-scm.com/docs/git-init) lists `--object-format=<format>` with valid values `sha1` and, if enabled, `sha256`, with `sha1` as the default:

```bash
git init --object-format=sha256 demo-repo
```

The same page notes that at present there is no interoperability between SHA-256 repositories and SHA-1 repositories. Check what your hosting provider and tooling support before planning around it.

The takeaway is not that every Git repository is unsafe. It is that Git's use of a hash for object names is an integrity mechanism whose designers chose to add detection now and plan a migration later, which is the same compatibility-window approach recommended in the checklist below.

## What a matching SHA-256 digest proves

If two byte sequences have the same SHA-256 digest, they are overwhelmingly likely to be identical. That comparison can detect accidental corruption or a changed file.

It does **not** prove who published the file. If an attacker can replace both the download and the checksum shown beside it, the values can still match. Obtain the expected digest from an authenticated channel, such as an HTTPS vendor page you trust, a signed release manifest, or a verified package-repository signature.

For signed software, verify the publisher's signature using the platform's supported tooling. A manually compared checksum is not a substitute for signature and trust-chain validation.

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Calculate a digest locally</h3>
  <p class="mb-8 text-slate-400 text-lg">OpsecForge computes supported hashes in your browser. Compare the result with a digest obtained from an authenticated source; a matching hash alone does not prove publisher identity.</p>
  <a href="/tools/hash-generator" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400">
    Open Hash Generator →
  </a>
</div>

## Safe migration checklist

1. **Inventory the purpose, not only the algorithm.** Separate non-security identifiers from signatures, certificates, integrity controls, password storage, and message authentication.
2. **Replace MD5 and SHA-1 in security-sensitive protocols.** Select an algorithm permitted by the relevant platform and current standard, normally SHA-256 or stronger.
3. **Do not invent a signature or MAC construction.** Use maintained libraries and the protocol's defined algorithm negotiation and key handling.
4. **Use password-hashing functions for passwords.** Follow the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); fast general-purpose hashes such as SHA-256 are not password-storage schemes.
5. **Design a compatibility window.** Version stored digests or signatures, verify old records only where necessary, and create new records with the approved algorithm.
6. **Test the complete verification path.** Confirm that failure is explicit when a digest, signature, certificate chain, or trusted source does not match.

## Which algorithm for which job

| Job | What matters | Guidance | Reference |
| --- | --- | --- | --- |
| File integrity check | Detect corruption or substitution against a digest from an authenticated source | SHA-256 or stronger; the digest must come from a channel the attacker cannot alter | [Hash Generator](/tools/hash-generator#file-checksum), [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf) |
| Digital signature or certificate | Collision resistance of the hash inside the signed structure | Do not use MD5 or SHA-1; use the algorithms your platform or protocol currently permits | [NIST on retiring SHA-1](https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm), [RFC 6151](https://www.rfc-editor.org/rfc/rfc6151) |
| Message authentication (HMAC) | A secret key, not just a hash | Use HMAC with a SHA-2 hash and compare in constant time | [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104), [webhook signature validation](/blog/webhook-signature-validation-hmac-sha256-best-practices-2026) |
| Password storage | Slowing down guessing | A password-hashing function, not a plain SHA-2 digest | [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) |
| Deduplication or cache key, no adversary | Few accidental collisions at your scale | Any well-distributed hash with enough bits; use the table above, and verify full content if a wrong match is costly | [Hash Generator](/tools/hash-generator), [hash tools and data integrity](/blog/hash-generator-tools-data-integrity-security) |
| Deduplication where an attacker chooses inputs | Collision resistance | Treat it as a security use: full-length SHA-256 or stronger | This article |

## Primary sources

- [Git: hash function transition](https://git-scm.com/docs/hash-function-transition)
- [Git: git-init, `--object-format`](https://git-scm.com/docs/git-init)
- [sha1collisiondetection (Stevens and Shumow)](https://github.com/cr-marcstevens/sha1collisiondetection)
- [Counter-cryptanalysis (Stevens, CRYPTO 2013)](https://marc-stevens.nl/research/papers/C13-S.pdf)
- [FIPS 180-4: Secure Hash Standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf)
- [RFC 2104: HMAC](https://www.rfc-editor.org/rfc/rfc2104)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST: Retiring SHA-1](https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm)
- [RFC 6151: Updated Security Considerations for MD5](https://www.rfc-editor.org/rfc/rfc6151)
- [SHAttered: the first practical SHA-1 collision](https://shattered.io/)
- [SHA-1 is a Shambles: chosen-prefix collision research](https://eprint.iacr.org/2020/014)
- [HashClash rogue CA demonstration](https://www.win.tue.nl/hashclash/rogue-ca/)

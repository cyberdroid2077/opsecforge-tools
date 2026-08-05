---
title: "Hash Collision Attacks: MD5, SHA-1, and Safe Verification"
date: "2026-04-04"
updated: "2026-08-05"
description: "Understand hash collisions, why MD5 and SHA-1 are unsafe for signatures, and how to verify files with SHA-256 and an authenticated source."
author: "OpsecForge Security Team"
category: "Application Security"
tags: ["hash-collisions", "cryptography", "data-integrity", "sha-256", "md5", "sha-1"]
source_reviewed: "2026-08-05"
primary_source: "https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm"
---

# Hash Collision Attacks: MD5, SHA-1, and Safe Verification

A hash collision exists when two different inputs produce the same digest. Collisions must exist because a fixed-size digest represents an unlimited set of possible inputs. A cryptographic hash is useful only when finding a collision is computationally impractical.

The practical rule is simple: do not use MD5 or SHA-1 where collision resistance protects a signature, certificate, update, or other security decision. Use an approved SHA-2 or SHA-3 algorithm and verify the expected digest through an authenticated source.

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

## Primary sources

- [NIST: Retiring SHA-1](https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm)
- [RFC 6151: Updated Security Considerations for MD5](https://www.rfc-editor.org/rfc/rfc6151)
- [SHAttered: the first practical SHA-1 collision](https://shattered.io/)
- [SHA-1 is a Shambles: chosen-prefix collision research](https://eprint.iacr.org/2020/014)
- [HashClash rogue CA demonstration](https://www.win.tue.nl/hashclash/rogue-ca/)

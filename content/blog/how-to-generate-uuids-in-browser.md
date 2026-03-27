---
title: "How to Generate UUIDs in Your Browser: A Developer's Guide"
date: "2026-03-27"
description: "UUIDs (Universally Unique Identifiers) are the standard for database keys, session IDs, and correlation tokens. Learn the difference between UUID versions, when to use each type, and why client-side generation is a privacy win."
category: "Developer Tools"
tags: ["uuid", "guid", "identifier", "database", "security", "privacy", "api", "session"]
---

# How to Generate UUIDs in Your Browser: A Developer's Guide

Universally Unique Identifiers (UUIDs) are 128-bit numbers used to identify information in software systems. They're the de facto standard for database primary keys, distributed system identifiers, session IDs, and correlation tokens. Unlike sequential integers, UUIDs can be generated independently across multiple systems without coordination, making them ideal for distributed architectures where multiple nodes might create records simultaneously.

## What Is a UUID?

A UUID is a 36-character string (32 hex digits plus 4 hyphens) formatted as `xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx`. The M digit indicates the UUID version, and the N digit indicates the variant.

Example UUID v4: `f47ac10b-58cc-4372-a567-0e02b2c3d479`

The probability of generating the same UUID twice is infinitesimally small — approximately 1 in 5.3×10³⁶.

## UUID Versions: Which One Should You Use?

**UUID v1 (Time-based):** Generated from a timestamp and node ID (typically the MAC address). Lexicographically sortable and time-ordered, but reveals the timestamp and machine identity when inspected. Less suitable for security-sensitive contexts.

**UUID v4 (Random):** Generated using cryptographically secure random numbers. No identifying information is embedded. The standard choice for most application-level identifiers. Does not reveal timing or machine information.

**ULID (Universally Unique Lexicographically Sortable Identifier):** A newer format that's timestamp-based like UUID v1 but uses a different encoding (Crockford's Base32). Sortable and more compact than UUID. Growing adoption in event-driven and time-series systems.

## Common Use Cases for UUIDs

- **Database primary keys:** UUIDs allow merging data from distributed databases without key collisions. No need for a central ID generation service.
- **Session identifiers:** Web application session tokens are often UUIDs. The randomness prevents session hijacking via prediction.
- **Correlation IDs:** In microservices architectures, each request is tagged with a UUID that traces through all services.
- **File names:** When storing user uploads, using a UUID as the filename prevents path traversal attacks and filename collisions.
- **API resource identifiers:** Public API endpoints often use UUIDs instead of sequential integers to prevent enumeration attacks.

## Why Generate UUIDs Client-Side?

Most backend frameworks provide UUID generation out of the box. Client-side UUID generation is useful in specific scenarios:

- **Offline-first applications:** Generate UUIDs for local records before syncing to a server.
- **Client-side mock data:** When building frontend prototypes, generate realistic UUIDs for mock API responses without a backend.
- **Privacy-sensitive contexts:** Server-side UUID generation means the server knows every ID created. Client-side generation keeps the server ignorant of IDs until they're submitted.
- **Performance optimization:** Generating IDs on the client reduces server round-trips during bulk data entry.

## UUID vs. Sequential Integer IDs

Sequential integer IDs (1, 2, 3...) are simpler, smaller (8 bytes vs. 36 characters), and database-index-friendly. They also reveal the approximate age and size of your dataset to observant competitors or attackers.

UUIDs are larger and can cause database indexing overhead. Modern databases handle this reasonably well, and UUID v7 (time-ordered UUID) specifically addresses the sorting problem while maintaining the privacy and distribution benefits.

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Generate UUIDs in Your Browser</h3>
  <p class="mb-8 text-slate-400 text-lg">Cryptographically secure, instant, and private. Uses the browser's native crypto.randomUUID() API.</p>
  <a href="/tools/uuid-generator" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
    Open UUID Generator →
  </a>
</div>

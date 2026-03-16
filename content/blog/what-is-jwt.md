---
title: "What Is JWT?"
date: "2026-03-16"
description: "A practical primer on JSON Web Tokens, how they work, and where developers usually misuse them."
---

# What Is JWT?

JWT stands for JSON Web Token. It is a compact string format used to transmit claims between systems.

Most JWTs contain three dot-separated parts:

- A header
- A payload
- A signature

The header describes the token type and signing algorithm. The payload carries claims such as a user ID, issuer, audience, or expiration time. The signature helps the receiving system verify that the token has not been tampered with.

JWTs are common in authentication and service-to-service authorization, but they are often misunderstood. A JWT is not encrypted by default. If a token contains sensitive data, anyone who gets the token can usually read its payload.

When debugging JWTs, developers should validate the signature, check expiration, and confirm the expected issuer and audience before trusting the claims inside the token.

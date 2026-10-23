---
title: "NIST SP 800-63B-4 Password Rules, and How to Calculate Passphrase Entropy"
date: "2026-04-05"
updated: "2026-10-23"
description: "What NIST SP 800-63B-4 requires for password length, composition, rotation, blocklists and pasting, with section numbers, the entropy formulas for random characters and words, and a review of the OpsecForge Password Generator."
author: "OpsecForge Security Team"
category: "Application Security"
tags: ["password-security", "authentication", "NIST", "entropy", "passphrases"]
source_reviewed: "2026-10-23"
primary_source: "https://pages.nist.gov/800-63-4/sp800-63b.html"
---

# NIST SP 800-63B-4 Password Rules, and How to Calculate Passphrase Entropy

**Short answer.** The current NIST guidance is [SP 800-63B-4](https://csrc.nist.gov/pubs/sp/800/63/b/4/final) (final, July 2025; it supersedes the 2020 SP 800-63B). For a service that verifies passwords, it asks for a longer minimum length, no composition rules, no scheduled rotation, a blocklist check, and support for password managers and pasting. For a person, the practical result is a unique, randomly generated password per site, kept in a password manager. Entropy figures only apply when the password was generated randomly; a phrase you invented has no calculable entropy.

## What SP 800-63B-4 says

Section numbers refer to SP 800-63B-4. Wording is paraphrased; "SHALL" and "SHOULD" are NIST's own requirement levels.

- **Minimum length (3.1.1.2).** SHALL require at least 15 characters when the password is the only factor, and at least 8 when it is only part of multi-factor authentication. SHOULD allow at least 64 characters.
- **No composition rules (3.1.1.1, 3.1.1.2).** SHALL NOT impose other composition rules, such as mixtures of character types.
- **No scheduled rotation (3.1.1.2).** SHALL NOT require periodic changes. SHALL force a change if there is evidence the authenticator was compromised.
- **Blocklist (3.1.1.2).** SHALL compare a new password, in full, against known commonly used, expected or compromised passwords (breach corpuses, dictionary words, the service name and username), and SHALL give the reason when it rejects one.
- **Password managers and paste (3.1.1.2).** SHALL allow password managers and autofill. SHOULD permit paste.
- **Storage (3.1.1.2).** SHALL store passwords salted and hashed with a suitable password hashing scheme, with a salt of at least 32 bits.
- **Guessing limits (3.1.1.2, 3.2.2).** SHALL rate-limit failed attempts.

The change log lists the higher single-factor minimum as a change from the previous edition. Section 3.1.1 also states that passwords are not phishing-resistant, so they do not replace phishing-resistant authentication where it is available. Appendix A gives NIST's reason for dropping composition rules: users respond predictably, for example turning "password" into "Password1!". NIST states the rotation rule (repeated in the Section 8 usability guidance, which also advises supporting copy and paste) without giving a rationale, so we do not invent one. These are requirements for verifiers in NIST's digital identity guidelines; other organizations may adopt them as a reference.

## Calculating entropy

If every element is chosen uniformly at random from a known set, the number of equally likely outcomes is the set size raised to the number of elements. Entropy in bits is the base-2 logarithm of that count:

- Random characters: `H = length × log2(character set size)`
- Random words: `H = number of words × log2(word list size)`

Each added bit doubles the work of an exhaustive guess, and on average an attacker needs about half the possibilities, as [EFF](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases) explains.

The premise matters. The formulas hold only if each character or word was picked at random, for example by dice or a cryptographic random number generator. A password a person thinks up does not qualify. NIST's Appendix A notes that estimating entropy for user-chosen passwords is challenging, and EFF notes people are not good at random choices.

Worked examples:

- **Six words from EFF's large list.** The [list](https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt) has 7,776 words (one for each outcome of five dice rolls). `log2(7776) ≈ 12.92`, so six words give `6 × 12.92 ≈ 77.5` bits, which matches EFF's figure of 77. Four words give about 51.7 bits.
- **Why "four words is 44 bits" is incomplete.** Four words reach 44 bits only if the list holds 2,048 words (`4 × 11`). The figure depends on list size, so always state it.
- **Sixteen random characters from 70 symbols.** `16 × log2(70) ≈ 98.1` bits at most.

## The OpsecForge Password Generator, as reviewed

We read `components/PasswordGeneratorTool.tsx` at commit `fe82b42` on 2026-10-23 and copied its generation functions into a Node script to check the behaviour. If the tool changes, this section needs revisiting.

- **Random source.** `window.crypto.getRandomValues`, the Web Crypto API. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) describes it as returning cryptographically strong values, using a browser-specific generator seeded with enough entropy. The Web Crypto specification mandates no minimum entropy level, so quality depends on the browser and operating system.
- **Character sets.** Uppercase (26), lowercase (26), digits (10) and the eight symbols `!@#$%^&*`, giving 70 characters when all are enabled. Length runs from 8 to 128, default 16. There is no passphrase or word-list mode.
- **Forced coverage.** It always places one character from each enabled set, then fills the rest and shuffles. In 20,000 trial passwords of length 16 every one contained all four kinds. That removes some strings from the space and makes balanced mixes slightly likelier than lopsided ones. By our calculation the Shannon entropy at length 16 is about 97.6 bits, against the 98.1-bit upper bound.
- **Modulo bias.** Random indexes come from `array[0] % max` on a 32-bit value. Because 2^32 is not a multiple of 70 (`2^32 mod 70 = 46`), 46 of the 70 characters each map from 61,356,676 source values and the other 24 from 61,356,675. That is a relative difference of about 1.6 in 100 million, and at most about 3 in 100 million for any index size the tool uses. It is far too small to help a guesser in our assessment, but it means the generator is not exactly uniform, so we do not call it unbiased.
- **Strength label.** The Weak/Medium/Strong/Hacker-Proof label comes from length and how many sets are enabled. It is not measured entropy. Use the formula above.

## Practical checklist

For service operators: require the minimum in 3.1.1.2; drop composition rules and scheduled expiry; check the full password against a blocklist; allow pasting and password managers; hash with a salted, suitable scheme; rate-limit failures.

For individuals: one unique password per site; generate rather than invent; use a manager; prefer a six-word phrase from a dice-based list where you must type the secret yourself; add phishing-resistant authentication where offered.

Try the [Password Generator](/tools/password-generator) for random character passwords, which runs in your browser.

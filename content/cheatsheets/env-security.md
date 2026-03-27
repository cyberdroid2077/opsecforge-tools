# .env Security Checklist

## Never Commit .env to Git
This is the most common credential leak. Add `.env` to your `.gitignore` immediately after creating it. Also check that `.env.example` or `.env.template` (which contains only key names, no values) is what's committed instead.

## Rotate API Keys Quarterly
Credential rotation limits the blast radius of a leaked key. Set a calendar reminder to rotate high-value credentials (Stripe, AWS, payment processors) every 90 days. Immediately rotate if any exposure event occurs.

## Use Different Keys Per Environment
Production keys should never appear in development. A bug in a development tool that logs environment variables can expose production credentials. Keep environments strictly isolated.

## Sanitize Before Sharing
Before posting a .env file in a GitHub issue, Stack Overflow question, or Slack message — always sanitize it. The OpsecForge Env Sanitizer automatically redacts Stripe keys, AWS credentials, GitHub tokens, and more. Never share live credentials.

## Add to .gitignore Immediately
Create the habit: `touch .env && echo ".env" >> .gitignore` before writing any real credentials. This prevents accidental commits from the very first line.

## Use a Secrets Manager in Production
For production deployments, use AWS Secrets Manager, HashiCorp Vault, Doppler, or similar. These provide encryption at rest, access auditing, automatic rotation, and policy-based access control that .env files simply cannot offer.

## Audit Access Logs Regularly
Review who accessed which credentials and when. Many credential leaks go undetected for months because there was no logging. Enable CloudTrail, GCP Audit Logs, or equivalent for your infrastructure.

## Enable 2FA on All Cloud Accounts
Your cloud provider account is the master key to all your infrastructure. Enable two-factor authentication (hardware key preferred over authenticator app) on AWS, Google Cloud, GitHub, Stripe, and any other service that holds credentials.

## Never Use Plain Text Storage
Don't store .env files in Slack, email, Confluence, Notion, or any SaaS tool. These services are often breached via phishing or have broad internal access. Use a password manager or dedicated secrets manager for credential storage.

## Use the OpsecForge Env Sanitizer
Sanitize .env files safely at opsecforge.com/tools/env-sanitizer — 100% client-side, zero data transmission.

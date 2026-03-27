## Twitter/X Post 1 — .env Safety

🚨 Never commit .env files to GitHub.

I repeat: NEVER.

Every year, thousands of companies leak AWS keys, Stripe credentials, and database passwords through accidental git commits.

Start: `echo ".env" >> .gitignore`
Now.

#DevOps #Security #AWS #infosec

---

## Twitter/X Post 2 — Credential Rotation

Quick security checklist:

☑️ Rotate API keys quarterly
☑️ Different keys per environment
☑️ 2FA on all cloud accounts
☑️ Use a secrets manager
☑️ Never share raw .env files

Bookmark this. Your future self will thank you.

#infosec #cloudsecurity #DevSecOps

---

## Twitter/X Post 3 — Before You Share That Screenshot

Before you paste your .env into a bug report...

Did you sanitize it?

That screenshot with your Stripe key visible? It's in a Slack channel with 200 people. It's in a Zoom recording. It's in someone's downloaded files.

Sanitize first. Always.

→ opsecforge.com/tools/env-sanitizer

#Security #Developer #infosec

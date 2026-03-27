## LinkedIn Post — .env Security

The most common infrastructure security mistake I see in engineering teams?

Accidentally committing .env files to version control.

It happens to everyone. A developer creates the file, writes credentials, gets distracted, does a `git add .` and `git push` before the `.gitignore` is updated. 

24 hours later, an automated scanner finds your AWS keys in a public GitHub repository.

Here's what a solid .env security posture looks like:

1. `.gitignore` first
The moment you create a `.env` file, add it to `.gitignore`. Not after. Before. Make it a reflex: `touch .env && echo ".env" >> .gitignore`.

2. Rotate credentials regularly
Set a quarterly reminder to rotate your most sensitive credentials — Stripe keys, AWS access keys, payment processor secrets. If a key was exposed in a previous incident, rotate it immediately.

3. Environment isolation
Production credentials should never appear in development. If you're debugging with production tokens, something is wrong with your development setup.

4. Never share raw .env files
Before posting in a Slack message, bug report, or support ticket — sanitize it. A simple find-and-replace is error-prone. Use a dedicated sanitizer that catches Stripe keys, AWS credentials, GitHub tokens, and database URLs automatically.

5. Use a secrets manager for production
.env files are fine for local development. For production, use AWS Secrets Manager, HashiCorp Vault, or Doppler. These provide encryption at rest, access auditing, and automatic rotation — things a flat file cannot offer.

6. Enable 2FA on all cloud accounts
Your cloud provider console is the master key to your entire infrastructure. Hardware 2FA (YubiKey) over authenticator apps.

This checklist takes 30 minutes to implement. The breach it prevents could take months to recover from.

#DevSecOps #cloudsecurity #AWS #infosec #softwaredevelopment

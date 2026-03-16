# OpSecForge - Operations & Development Manual

## 1. Project Overview
- **Goal**: Auto-SaaS Monetization Factory (The AdSense Pipeline).
- **Product**: Client-side, zero-data-transmission developer tools (Starting with JWT Decoder).
- **Monetization**: Google AdSense (Status: "Getting ready").

## 2. Pending Development Tasks (UI/UX)
*These tasks must be executed by the dedicated Web Dev Agent / Mac Codex:*
- [x] **Terms of Service Link**: The ToS page was created at `app/terms-of-service/page.tsx`, but there is no entry point. Add a footer link pointing to `/terms-of-service` across the site.
- [x] **Mobile Navigation Scroll**: Add left/right scroll buttons to the top navigation menu to prevent menu items from being cut off on smaller screens. Ensure smooth horizontal overflow.

## 3. Pending SEO / Marketing Tasks
*To be executed by the Content/SEO Agent:*
- [ ] Generate and publish the 3 planned SEO blog posts targeting long-tail privacy/security keywords (e.g., `decode jwt without sending to server`).
- [ ] Post updates via the Vincent Jia X (Twitter) account using the `twitter_poster.py` script.

## 4. Agent Operational Rules
- **Separation of Concerns**: Jarvis (Main Agent) will no longer handle day-to-step code commits for this repo. 
- **Execution**: A dedicated Web Dev Agent (or Mac Codex) will read this manual, execute the pending tasks, commit to `main`, and push to Vercel.

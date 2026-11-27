# Kepler: vision

Kepler is a mobile budget app for one person in the Philippines. It tracks the monthly budget and, more importantly, answers one question every day: **how much can I spend today?**

Money moves through cash, GCash, Maya and bank accounts, and much of it is cash that is easy to lose track of.

## Standard features

These are the features most budget apps have.

- Manual expense and income entry
- Categories, including custom ones
- Multiple accounts: cash, GCash, Maya, bank
- Monthly budget and per-category limits
- Charts and reports: weekly, monthly, yearly
- Bill and subscription reminders
- Savings goals
- Search and filter transactions
- Export to CSV, and backup

## What makes Kepler different

- **Daily number.** "₱320 left for today", calculated from the remaining flexible money divided by the days until payday. It updates every day.
- **Taglish multi-item logging with Gemini.** Typing or saying "pamasahe 40, ulam 85, load 50" creates 3 categorized entries.
- **Receipt and GCash/Maya screenshot scanning with Gemini.** Only the extracted data is stored. Images are not kept.
- **Nightly wallet count.** Enter the actual cash on hand. The difference from logged spending shows up as "untracked cash".
- **Payday mode.** Split the salary into bills, savings and padala (money sent to family), then spread the rest into daily amounts.
- **AI accuracy test suite.** 100+ real Taglish inputs with expected results, run in CI, with the accuracy score shown in the README.

## Build phases

See `CLAUDE.md` for the phase list and the current phase.

## Open questions

These decisions have not been made yet. Each has some context and the options seen so far. None of them is a recommendation.

### Data and storage

- **Local-only storage or cloud sync?** Local-only is simpler and more private. Sync gives backup and multi-device use, and is part of the cloud portfolio. One option is local-first now with sync added in phase 5.
- **Which local database?** For example: expo-sqlite (SQL, built into Expo), a key-value store, or a sync-friendly database. The choice affects how hard reports, search and sync will be.
- **Backup format and destination?** For example: a file export, Google Drive, or the backend once it exists.

### Backend and security

- **Backend language and framework?** For example: TypeScript (Node, sharing types with the app) or Python. It runs on Cloud Run.
- **How does the app talk to the backend safely without login?** Anything stored in the app can be extracted, so a shared secret in the app is not real protection. Options include Firebase App Check (device attestation), a per-install device token, rate limits and budget caps on the backend, or adding simple login after all.
- **Which Gemini model?** This is a trade-off between cost, speed and Taglish accuracy. The accuracy test suite can decide it with measurements instead of guesses.
- **How is the privacy of financial data handled?** What gets sent to Gemini (only the text or image being parsed?), whether Gemini API data is used for training under the chosen plan, what the backend logs, encryption on the device and in the cloud, and how to delete everything.

### Kepler features

- **How does the daily number handle overspending?** If today goes ₱100 over, does tomorrow's number shrink, is the overage spread across the remaining days, or does it just show as negative?
- **What counts as "flexible money"?** Which bills, savings and padala get subtracted before dividing, and how are future bills due before payday handled?
- **What is the payday schedule?** For example: monthly, semi-monthly on the 15th and 30th, or irregular. This changes "days until payday".
- **When does a day roll over?** At midnight, or at a set time, for example after the nightly wallet count?
- **What happens to untracked cash?** Is it just shown, or logged as an "untracked" expense so balances stay correct?
- **How does voice input work?** On-device speech-to-text with the text sent to Gemini, or audio sent to Gemini directly?
- **How does the AI test suite run in CI?** It needs a key from CI secrets, has a per-run cost, and needs a decision on whether it runs on every push or on a schedule.

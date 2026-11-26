@AGENTS.md

# Kepler

A personal mobile budget tracker for one user in the Philippines who spends with cash, GCash, Maya and bank accounts. It tracks the monthly budget and answers "how much can I spend today?". It is also a portfolio project, for both the app and the cloud/DevOps work behind it.

Full feature list and undecided questions: `docs/vision.md`. Read it before planning or building any feature. When a decision gets made, move it out of "Open questions" in that file.

## Working with the user

The user is a beginner. Explain each step in plain language as you go: what you are doing and why. Define jargon the first time it comes up.

## Hard rule: the Gemini API key

The Gemini API key lives only on the backend, loaded from Secret Manager (or a local `.env` during development). The app calls the backend, and the backend calls Gemini. Keep the key out of app code, `app.json`, `EXPO_PUBLIC_*` variables, test fixtures, CI logs and git history. Anything bundled into the app can be extracted from it, so a key shipped in the app counts as leaked. Before committing, check that no key or credential file is staged.

## Tech choices

- App: React Native + Expo + TypeScript (Expo Go for testing on the phone)
- Navigation: Expo Router, per `AGENTS.md`. Not installed yet: `App.tsx` is still the blank-template entry point.
- AI: Gemini API, called only from the backend
- Later: backend on Google Cloud (Cloud Run, Cloud Scheduler, Secret Manager), Terraform, GitHub Actions CI/CD, monitoring, separate dev and prod environments
- First version has no login
- Currency is PHP (₱)

## Build phases

Current phase: **0, setup** (scaffold only, no features yet).

1. Foundation: manual entry, categories, accounts, monthly budget, transaction list
2. AI logging: Taglish text/voice, then receipt and screenshot scanning
3. Kepler features: daily number, wallet count, payday mode
4. Polish: charts, reminders, goals, export
5. Cloud/DevOps: backend, sync, Terraform, CI/CD, monitoring (parts may start earlier)

## Agent skills

### Issue tracker

Issues live in GitHub Issues for chimkenchrls/kepler, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root, created only when needed. See `docs/agents/domain.md`.

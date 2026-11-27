# Phase 1 data lives on the phone in expo-sqlite, with plain SQL

Phase 1 keeps all data on the phone only, with no server, and cloud sync is added in Phase 5 (local-first). The database is Expo's own expo-sqlite, queried with plain SQL. It runs in Expo Go, it answers a budget app's usual questions ("this month's Expenses, totalled by Category") in one query, and most sync tools build on SQLite.

## Considered Options

- **expo-sqlite + Drizzle ORM**: typed queries and generated migrations, but 1.0 is still a release candidate, it needs extra Babel and Metro config, and nobody has confirmed it runs in Expo Go. It can be added later on top of the same database file.
- **TinyBase**: sync is built in, but it has its own query style instead of SQL, no migration tool, and it would tie Phase 5 to its sync model.
- **AsyncStorage / key-value stores**: every monthly total would mean loading everything and summing it in JavaScript. These stores are meant for small settings.
- **WatermelonDB, Realm, MMKV, op-sqlite, PowerSync (persistent)**: each needs a custom native build, so none runs in Expo Go. Realm's sync service also shut down on 2025-09-30.

## Consequences

- **Room for sync**: every row has a random UUID as its ID (never 1, 2, 3…), so phone and server can't both create the same ID. Every row also records when it was last changed.
- **Deletes are real deletes in Phase 1.** Nothing syncs before Phase 5, and the first sync uploads whatever exists then. Phase 5 adds tombstones (hidden "deleted" markers) in a migration.
- **Schema changes** are numbered migration steps, tracked by `PRAGMA user_version` and run at app start. Each step runs in a transaction, so it either finishes or leaves the data as it was. A step that has shipped is never edited: a fix is a new step.
- **Storage formats**: amounts are integer centavos (₱40.50 → `4050`). An Entry's date is `YYYY-MM-DD` text, so a month is a simple range. The hidden creation time is a full timestamp.
- The database file lives in the app's private storage, so uninstalling Expo Go or clearing its data deletes it. How to guard against that is the "Phase 1 data-loss safety net" ticket.

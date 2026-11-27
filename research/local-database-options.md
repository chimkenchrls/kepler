# Local database options for Expo SDK 58

Research for [issue #2](https://github.com/chimkenchrls/kepler/issues/2). It reports facts only. The decision is made in a later ticket, "Where Phase 1 data lives, and which database".

Checked on 2026-11-27 against the project's `expo ~58.0.26` and `react-native 0.88.1`.

## The deciding constraint: Expo Go

Expo Go is a fixed app. It contains only the native code that Expo bundled into it. The Expo FAQ says "only APIs and libraries that were bundled in the native app can be used". If a library needs native code that is not in Expo Go, the JavaScript loads and then "it will immediately error because the JS code tries to call the native code". ([Development builds FAQ](https://docs.expo.dev/develop/development-builds/faq/))

So a database runs in Expo Go only if one of these is true:

- its native module ships inside Expo Go, or
- it is pure JavaScript on top of a module that ships inside Expo Go (in practice `expo-sqlite` or AsyncStorage).

The libraries Expo Go supports by default are listed on the [SDK 58 third-party overview](https://docs.expo.dev/versions/v58.0.0/sdk/third-party-overview/). The only storage library on it is `@react-native-async-storage/async-storage`. No third-party database (MMKV, op-sqlite, Realm, WatermelonDB) is on it. The same page says you "may use any library of your choice with development builds". A development build is your own version of Expo Go that includes any native libraries you choose ([Introduction to development builds](https://docs.expo.dev/develop/development-builds/introduction/)).

## Summary table

| Option | Runs in Expo Go on SDK 58? | Month query and totals | Schema changes | Path to cloud sync |
|---|---|---|---|---|
| expo-sqlite (raw SQL) | **Yes**, stated by Expo docs (SQLCipher encryption excluded) | SQL `WHERE` on dates plus `SUM` | Manual, using `PRAGMA user_version` | No built-in sync. Session extension changesets are a building block. Several sync tools build on it |
| expo-sqlite + Drizzle ORM | **Likely yes** (pure JS over expo-sqlite). Not stated by Drizzle or Expo docs | Typed SQL queries, `useLiveQuery` | Generated SQL migrations, `useMigrations` | Same as expo-sqlite |
| Key-value: AsyncStorage | **Yes**, stated by Expo docs | Load and filter in JavaScript. No queries | Manual. No schema | None built in |
| Key-value: `expo-sqlite/kv-store` | **Yes** (part of expo-sqlite) | Same as AsyncStorage | Manual | None built in |
| Key-value: SecureStore | Expo docs list it, but it is meant for "small values such as tokens" | Not suited | Not suited | Not suited |
| TinyBase (with expo-sqlite) | **Yes**: Expo docs say it "works seamlessly with Expo Go" | TinyBase's own query API | No migration tool found in the docs reviewed | Built-in sync (CRDT `MergeableStore` plus WebSocket synchronizers). Persisters for Postgres, Supabase, Turso, PowerSync |
| PowerSync | **Only for prototyping**: an alpha JS adapter, in-memory by default, with persistence deprecated. Production needs a development build | SQL (SQLite) | "Schema migrations are not required" on the client | Core feature: syncs with Postgres, MongoDB, MySQL (beta), SQL Server (beta) |
| ElectricSQL | Not stated. Its client is a TypeScript HTTP client. It is not a local database | Not applicable: Electric does not store data on the device | Not applicable | Read-path sync from Postgres. Writes go through your own API |
| RxDB (expo-sqlite storage) | Not stated. The free SQLite storage is a limited trial. Full SQLite storage is paid | RxDB queries (NoSQL documents) | RxDB schema versions | Replication plugins: HTTP, Supabase, Firestore, GraphQL, CouchDB |
| WatermelonDB | **No**: needs its own native module, which is not in Expo Go | — | — | — |
| Realm / Atlas Device SDK | **No**: native module not in Expo Go. Sync service ended 2025-09-30 | — | — | — |
| MMKV, op-sqlite | **No**: native modules, need a development build | — | — | — |

## expo-sqlite (raw SQL)

**Expo Go.** The SDK 58 reference marks it "Android, iOS, macOS, tvOS, Web, Included in Expo Go". The one exception: "SQLCipher is not supported on Expo Go". SQLCipher is the optional encryption build. ([expo-sqlite, SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/))

**What it is.** This is Expo's own SQLite module. "The database is persisted across restarts of your app." ([Store data](https://docs.expo.dev/develop/user-interface/store-data/)) Recommended version for SDK 58: `~58.0.18`, which is also the current `latest` on npm.

**Month of transactions and totals.** This is plain SQL. A month is a `WHERE date BETWEEN ...` filter, and totals are `SUM(...)` with `GROUP BY` category. The API includes:

- `getAllAsync`, `getFirstAsync` and `getEachAsync` (row by row) for reads
- `runAsync` for writes
- prepared statements (`prepareAsync` / `executeAsync`), which the docs recommend for user input
- `withTransactionAsync` and `withExclusiveTransactionAsync`
- `SQLiteProvider` and `useSQLiteContext()` for React, with optional Suspense
- `addDatabaseChangeListener`, which needs `enableChangeListener: true` when the database is opened

([expo-sqlite, SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/))

**Schema changes.** There is no migration framework. The official example stores a version number in `PRAGMA user_version`. A `migrateDbIfNeeded` function passed to `SQLiteProvider`'s `onInit` reads the version, runs the pending steps, and writes the new version back. You write each migration step yourself. ([expo-sqlite, SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/))

**Path to sync.** expo-sqlite has no sync service. It does expose the SQLite session extension (`createSessionAsync`), which records changes as changesets that can be applied elsewhere. This is a low-level building block. ([expo-sqlite, SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/)) Expo's local-first guide calls expo-sqlite "a great choice for persistence for local-first apps". It names tools that use expo-sqlite as their on-device storage: TinyBase, RxDB, LiveStore and Turso. The guide says "You can use Turso today with expo-sqlite", but the SDK 58 expo-sqlite reference does not mention Turso or libSQL. ([Local-first architecture with Expo](https://docs.expo.dev/guides/local-first/))

**Maturity.** It is first-party. It is released with each SDK (npm has an `sdk-NN` tag for each). It includes a dev-tools inspector (Shift + M in the Expo CLI terminal).

## expo-sqlite with Drizzle ORM

An ORM (object-relational mapper) is a library that lets you write database queries as typed TypeScript code instead of SQL strings. Drizzle is one.

**Expo Go.** Neither the Drizzle docs nor the Expo docs say "Expo Go". Drizzle's Expo driver is JavaScript that calls `expo-sqlite`'s `openDatabaseSync` ([Drizzle with Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite)). It adds no native module of its own, so it should run wherever expo-sqlite runs. That is an inference, not a documented guarantee. One community guide claims the opposite. No official source supports that claim. Testing in Expo Go settles it. The SDK 58 expo-sqlite reference lists Drizzle under "Third-party library integrations" ([expo-sqlite, SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/)). An Expo blog post (January 7, 2025) says Drizzle "works right out of the box with Expo" ([Modern SQLite for React Native apps](https://expo.dev/blog/modern-sqlite-for-react-native-apps)).

**Month of transactions and totals.** You write typed SQL queries with Drizzle's query builder. `useLiveQuery` "make[s] any Drizzle query reactive", meaning the screen re-renders when the data changes. It needs `openDatabaseSync('db.db', { enableChangeListener: true })`. ([Drizzle with Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite))

**Schema changes.** `drizzle-kit generate` writes SQL migration files from your TypeScript schema. The `drizzle.config.ts` needs `dialect: 'sqlite'` and `driver: 'expo'`. "Expo / React Native requires you to have SQL migrations bundled into the app". This takes `babel-plugin-inline-import` with `.sql` in `babel.config.js` and `config.resolver.sourceExts.push('sql')` in `metro.config.js`. The `useMigrations(db, migrations)` hook applies the migrations at startup and returns `success` and `error`. ([Drizzle with Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite)) These changes are JavaScript build configuration, not native code.

**Path to sync.** Same as raw expo-sqlite. Drizzle adds none.

**Maturity.** The latest stable release is `0.45.4`. Version 1.0 is in release candidates (`1.0.0-rc.6`, 2026-11-20) (npm dist-tags, [GitHub releases](https://github.com/drizzle-team/drizzle-orm/releases)). Drizzle's Expo page currently tells you to install `drizzle-orm@rc` and `expo-sqlite@next`. On npm, the `expo-sqlite@next` tag points to `58.0.13`, which is older than the SDK 58 recommendation. This project's `AGENTS.md` says to install Expo packages with `npx expo install`, which picks the SDK-matched version. Drizzle Studio can browse the on-device database through the `drizzle-studio-expo` dev-tools plugin.

## Key-value storage

A key-value store saves values under names ("keys"), like a dictionary. It has no tables and no queries.

**AsyncStorage.** The SDK 58 page says "Included in Expo Go", recommended version `2.2.0` ([AsyncStorage, SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/async-storage/)). Expo describes it as "asynchronous, unencrypted, persistent". It is "a good choice for storing small amounts of data", such as "user preferences or app state" ([Store data](https://docs.expo.dev/develop/user-interface/store-data/)). The library is maintained: its upstream is at 3.1.1 (May 2026), but SDK 58 recommends 2.2.0.

**`expo-sqlite/kv-store`.** This is part of expo-sqlite, so it runs in Expo Go. It is "a drop-in replacement for AsyncStorage" that adds synchronous methods such as `setItemSync()`. "This key-value store is backed by SQLite." ([expo-sqlite, SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/)) `expo-sqlite/localStorage/install` also provides a web-style `localStorage`.

**SecureStore.** It encrypts values and is "intended for small values such as tokens, keys, and other secrets" ([Store data](https://docs.expo.dev/develop/user-interface/store-data/)). It is not meant for a list of transactions.

**Trade-offs for Kepler's needs.** These follow from what a key-value store is, not from a specific doc page:

- Showing a month means reading the stored data and filtering and summing it in JavaScript.
- Changing the data shape means writing code that rewrites the stored values.
- Sync has to be built by hand.

**MMKV** is a popular fast key-value store. It is not in Expo Go. Its README's Expo steps are `npx expo install react-native-mmkv react-native-nitro-modules` and then `npx expo prebuild`, which creates the native project folders that a custom build needs. Version 4 is a Nitro native module ([react-native-mmkv](https://github.com/mrousavy/react-native-mmkv)).

## Sync-oriented local-first options

"Local-first" means the data lives on the phone and works offline, and syncing to a server is added on top. Expo's guide lists Legend-State, TinyBase, Yjs, Prisma, Jazz, LiveStore, Turso, Instant, RxDB, Automerge, ElectricSQL and PowerSync ([Local-first architecture with Expo](https://docs.expo.dev/guides/local-first/)). It states Expo Go support only for TinyBase. The candidates this ticket names are below.

### TinyBase

**Expo Go.** "TinyBase works seamlessly with Expo Go." On Android and iOS it saves data through `expo-sqlite`. ([Local-first architecture with Expo](https://docs.expo.dev/guides/local-first/))

**How it stores data.** TinyBase is a reactive data store with "persisters" that save it somewhere. `ExpoSqlitePersister` provides "SQLite in React Native, using expo-sqlite". It needs the modern expo-sqlite API, since "TinyBase support for the legacy version of Expo-SQLite is no longer available". Database persisters have two modes:

- JSON mode: the whole Store is "stored in a single row of a table (normally called `tinybase`)".
- Tabular mode: each TinyBase table maps to a database table.

([Database persistence](https://tinybase.org/guides/persistence/database-persistence/), [persister-expo-sqlite](https://tinybase.org/api/persister-expo-sqlite/))

**Month of transactions and totals.** You query with TinyBase's own query and aggregation API, not with SQL against the device database. In tabular mode, a `condition` can limit which rows load and is "used as a SQL `WHERE` clause". ([Database persistence](https://tinybase.org/guides/persistence/database-persistence/))

**Schema changes.** The TinyBase pages reviewed for this note do not describe a migration tool.

**Path to sync.** Sync is built in. A `MergeableStore` "records additional metadata as the data is changed so that potential conflicts can be reconciled", using a CRDT, a data type that merges edits from several devices without conflicts. ([Synchronization](https://tinybase.org/guides/synchronization/)) Two ways to sync:

- Synchronizers: `WsSynchronizer` over WebSockets to a "relatively 'thin server'" (`createWsServer`, or `WsServerDurableObject` on Cloudflare), or a custom synchronizer ([Using a synchronizer](https://tinybase.org/guides/synchronization/using-a-synchronizer/)).
- Server-side persisters: `PgPersister` / `PostgresPersister` (PostgreSQL), `SupabasePersister`, `LibSqlPersister` (Turso), `PowerSyncPersister`, `MsSqlPersister` ([Database persistence](https://tinybase.org/guides/persistence/database-persistence/)).

**Maturity.** MIT license. Actively released: v10.0.0 (2026-09-24), v10.1.0 (2026-11-12), a v10.2.0 beta (2026-11-18) ([GitHub releases](https://github.com/tinyplex/tinybase/releases)).

### PowerSync

**Expo Go.** Only for prototyping. "Our native database adapter is not compatible with Expo Go's sandbox environment." For Expo Go you install `@powersync/adapter-sql-js`, which runs SQLite as JavaScript ([PowerSync React Native & Expo](https://docs.powersync.com/client-sdk-references/react-native-and-expo)). That adapter:

- "is in an **alpha** release"
- "uses in-memory persistence" by default, so data is lost when the app restarts
- has deprecated persistence: "Support for persistence with `@powersync/adapter-sql-js` is deprecated"
- "will be much slower than native database adapters"

For data that survives restarts and for production, the docs point to the OP-SQLite adapter (`@op-engineering/op-sqlite` ≥ 1.17.0), which is native and needs a development build. ([Expo Go support](https://docs.powersync.com/client-sdk-references/react-native-and-expo/expo-go-support))

**Month of transactions and totals.** The client is SQLite, so you query with SQL.

**Schema changes.** "Schema migrations are not required." The SDK syncs schemaless data and applies the client schema through SQLite views. The exception is raw tables, which you create and migrate yourself. ([PowerSync React Native & Expo](https://docs.powersync.com/client-sdk-references/react-native-and-expo))

**Path to sync.** Sync is the product. Source databases ([Database setup](https://docs.powersync.com/installation/database-setup)):

- Postgres (including Supabase, Neon, AWS RDS/Aurora)
- MongoDB
- MySQL ("Beta")
- SQL Server ("Beta")
- Convex ("experimental")

Both PowerSync's cloud service and a self-hosted option are documented. Writes go back through a connector to your own backend.

**Maturity.** `@powersync/react-native` 2.4.1. The JS SDK repo (Apache-2.0) is active, with releases in November 2026 ([powersync-js](https://github.com/powersync-ja/powersync-js)).

### ElectricSQL

**What it is now.** "Electric Sync is a read-path sync engine for Postgres." It streams "Shapes" (subsets of Postgres tables) to clients over HTTP. Writes are "patterns for writing data back through your API", meaning your own backend. ([Electric docs intro](https://electric.ax/docs/intro); `electric-sql.com` now redirects to `electric.ax`.)

**Expo Go.** The docs do not state Expo Go support. The Expo integration page uses the TypeScript client (`@electric-sql/react`, `useShape`) and pauses streams while the app is in the background. It does not say where synced data is stored on the device. It says PGlite, Electric's embeddable Postgres, "doesn't _yet_ work in React Native". ([Electric Expo integration](https://electric.ax/docs/integrations/expo)) So Electric is not a local database by itself. You would pair it with a local store such as expo-sqlite.

**Maturity.** `@electric-sql/client` 1.5.28. Apache-2.0. The repo is active, and it includes an `expo-db-electric-starter` package (Sep 2026) ([electric-sql/electric](https://github.com/electric-sql/electric)).

### RxDB

**Expo Go.** The docs do not say "Expo Go". The FAQ says RxDB "runs in Expo apps" with the managed workflow ([RxDB React Native](https://rxdb.info/react-native-database.html)). Storage options:

- **SQLite RxStorage over expo-sqlite.** The production version is in RxDB Premium (`rxdb-premium`), which is paid. A free trial (`getRxStorageSQLiteTrial`) is "for evaluation and prototypes only". It is "limited to store 500 non-deleted documents", uses no indexes, and "fetches the whole storage state to run queries in memory". ([SQLite RxStorage](https://rxdb.info/rx-storage-sqlite.html))
- **Expo Filesystem RxStorage.** "Part of RxDB Premium", in beta since 17.0.0, built on `expo-file-system` and `expo-opfs` (SDK 54+). Its docs do not say whether it runs in Expo Go. ([Expo Filesystem RxStorage](https://rxdb.info/rx-storage-filesystem-expo.html))

**Month of transactions and totals.** RxDB is a NoSQL document database with its own query language. It is not SQL.

**Path to sync.** It has replication plugins for HTTP, Supabase/Postgres, Firebase/Firestore, GraphQL and CouchDB ([RxDB React Native](https://rxdb.info/react-native-database.html)).

**Maturity.** Apache-2.0 core. Active: v17.6.0 (2026-10-05) ([GitHub releases](https://github.com/pubkey/rxdb/releases)).

### WatermelonDB: fails the Expo Go constraint

It ships its own native code: a `native` folder, an iOS podspec, CocoaPods linking, and an optional Android JSI setup that you "need to take a few additional steps manually" for. Its installation docs do not mention Expo. ([WatermelonDB installation](https://watermelondb.dev/docs/Installation)) It is not on Expo Go's list of included libraries, so it needs a development build. Maintenance: latest stable `0.28.0` (2025-04-07). The newest prerelease is `0.28.1-0` (2025-07-24). The last commit to the main branch was in August 2025 (npm, [GitHub](https://github.com/Nozbe/WatermelonDB)).

### Realm / Atlas Device SDK: fails the Expo Go constraint, and its sync has ended

"As of September 2024, Atlas Device SDKs are deprecated. Atlas Device SDKs reached end-of-life and were removed on **September 30, 2025**." "Atlas Device Sync is deprecated." "The on-device database continues to exist as an open source project." A JavaScript community branch with the sync code removed exists. ([Atlas Device SDKs deprecation](https://www.mongodb.com/docs/atlas/device-sdks/deprecation/), [realm-js community branch](https://github.com/realm/realm-js/tree/community)) Realm is a native module and is not in Expo Go. Last npm release: `realm` 20.2.0 (2025-08-11).

### Other native SQLite libraries

`@op-engineering/op-sqlite` is the library PowerSync uses in production. It is a native module, is not in Expo Go's list, and needs a development build.

## Options that clearly fail the Expo Go constraint

- WatermelonDB
- Realm / Atlas Device SDK (its sync service has also ended)
- MMKV
- op-sqlite
- PowerSync with its native adapter. Its Expo Go adapter is in-memory, alpha, and deprecated for persistence, so it does not keep real data in Expo Go.

## Options documented to run in Expo Go

- expo-sqlite (without SQLCipher encryption)
- `expo-sqlite/kv-store`
- AsyncStorage
- SecureStore (for secrets only)
- TinyBase with expo-sqlite (Expo's local-first guide says so)

Drizzle on expo-sqlite is very likely to run (pure JavaScript), but no official page says so explicitly. RxDB and the ElectricSQL client do not state Expo Go support either way.

## Not verified

- Drizzle, RxDB and the Electric client were not run in Expo Go. Their Expo Go status above comes from reading the docs, not from testing.
- TinyBase's schema-migration support was not checked beyond the persistence and synchronization guides.
- Storage size limits for AsyncStorage on Android were not covered by the SDK 58 page.

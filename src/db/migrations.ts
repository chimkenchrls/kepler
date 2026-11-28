import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

// Schema changes, run in order at app start (ADR 0001). Never edit a step after it has merged:
// a fix is a new step added to the end of this list.
const MIGRATIONS: ((db: SQLiteDatabase) => Promise<void>)[] = [
  // 1: the Phase 1 schema, the default Categories and one ₱0 Cash Account.
  async (db) => {
    await db.execAsync(`
      CREATE TABLE accounts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        kind TEXT NOT NULL CHECK (kind IN ('cash', 'gcash', 'maya', 'bank')),
        starting_balance INTEGER NOT NULL CHECK (starting_balance BETWEEN 0 AND 1000000000),
        position INTEGER NOT NULL,
        archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
        updated_at TEXT NOT NULL
      );

      CREATE TABLE categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
        position INTEGER NOT NULL,
        archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
        built_in INTEGER NOT NULL DEFAULT 0 CHECK (built_in IN (0, 1)),
        updated_at TEXT NOT NULL
      );

      -- One table for Expenses, Incomes and Transfers, so a kind change keeps the id and created_at.
      CREATE TABLE entries (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('expense', 'income', 'transfer')),
        amount INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 1000000000),
        date TEXT NOT NULL,       -- YYYY-MM-DD, the phone's local calendar date
        note TEXT,
        created_at TEXT NOT NULL, -- full timestamp, only for ordering Entries within a day
        account_id TEXT NOT NULL REFERENCES accounts (id), -- the Account, or From for a Transfer
        to_account_id TEXT REFERENCES accounts (id),
        category_id TEXT REFERENCES categories (id),
        fee INTEGER CHECK (fee BETWEEN 1 AND 1000000000),
        updated_at TEXT NOT NULL,
        CHECK (
          (kind = 'transfer' AND to_account_id IS NOT NULL AND to_account_id <> account_id AND category_id IS NULL)
          OR (kind <> 'transfer' AND to_account_id IS NULL AND fee IS NULL AND category_id IS NOT NULL)
        )
      );
      CREATE INDEX entries_date ON entries (date);

      -- The Monthly budget for a month is the latest change at or before it. NULL amount = removed.
      CREATE TABLE monthly_budget_changes (
        id TEXT PRIMARY KEY NOT NULL,
        effective_month TEXT NOT NULL UNIQUE, -- YYYY-MM
        amount INTEGER CHECK (amount BETWEEN 1 AND 1000000000),
        updated_at TEXT NOT NULL
      );

      -- Same pattern per Expense Category. NULL amount = limit removed.
      CREATE TABLE category_limit_changes (
        id TEXT PRIMARY KEY NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories (id),
        effective_month TEXT NOT NULL, -- YYYY-MM
        amount INTEGER CHECK (amount BETWEEN 1 AND 1000000000),
        updated_at TEXT NOT NULL,
        UNIQUE (category_id, effective_month)
      );

      -- Small settings (last-used Account, last backup time) live here so a Backup holds everything.
      CREATE TABLE settings (
        id TEXT PRIMARY KEY NOT NULL,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const now = new Date().toISOString();
    const categories: [type: 'expense' | 'income', names: string[]][] = [
      ['expense', ['Food', 'Transport', 'Load & Internet', 'Bills', 'Groceries', 'Padala', 'Shopping', 'Health', 'Fun', 'Other', 'Fees']],
      ['income', ['Salary', 'Gift', 'Refund', 'Other']],
    ];
    for (const [type, names] of categories) {
      for (const [position, name] of names.entries()) {
        await db.runAsync(
          'INSERT INTO categories (id, name, type, position, built_in, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          randomUUID(), name, type, position, type === 'expense' && name === 'Fees' ? 1 : 0, now,
        );
      }
    }
    // Seeded so the add form has an Account to pick on first launch.
    await db.runAsync(
      "INSERT INTO accounts (id, name, kind, starting_balance, position, updated_at) VALUES (?, 'Cash', 'cash', 0, 0, ?)",
      randomUUID(), now,
    );
  },
];

/** Brings the database up to the newest schema. Each step commits fully or not at all. */
export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let version = row?.user_version ?? 0; version < MIGRATIONS.length; version++) {
    // Not the exclusive variant: it opens a new connection, where foreign_keys is off.
    // Nothing else queries the database yet, because onInit runs before any screen.
    await db.withTransactionAsync(async () => {
      await MIGRATIONS[version](db);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

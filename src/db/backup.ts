import { randomUUID } from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { backupDatabaseAsync, deserializeDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './migrations';

/** What Home and the Backup screen need to know about the last Backup. */
export function getBackupStatus(db: SQLiteDatabase) {
  return db.getFirstAsync<{ lastBackup: string | null; lastChange: string; installedAt: string }>(`
    SELECT
      (SELECT value FROM settings WHERE key = 'last_backup') AS lastBackup,
      (SELECT MAX(t) FROM (
        SELECT MAX(updated_at) AS t FROM accounts
        UNION ALL SELECT MAX(updated_at) FROM categories
        UNION ALL SELECT MAX(updated_at) FROM entries
        UNION ALL SELECT MAX(updated_at) FROM monthly_budget_changes
        UNION ALL SELECT MAX(updated_at) FROM category_limit_changes
      )) AS lastChange,
      -- shortcut: the oldest Category time stands in for the install time; wrong only if every Category was edited
      (SELECT MIN(updated_at) FROM categories) AS installedAt
  `);
}

/** Records the Backup time, then copies the whole database into a dated file in the cache. */
export async function writeBackup(db: SQLiteDatabase) {
  const now = new Date();
  // Recorded first, so the file itself knows when it was made (the Restore summary shows it).
  await db.runAsync(
    `INSERT INTO settings (id, key, value, updated_at) VALUES (?, 'last_backup', ?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    randomUUID(), now.toISOString(), now.toISOString(),
  );
  const pad = (n: number) => String(n).padStart(2, '0');
  const file = new File(Paths.cache, `kepler-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.db`);
  file.create({ overwrite: true });
  await file.write(await db.serializeAsync());
  return file;
}

export type OpenedBackup = {
  db: SQLiteDatabase | null;
  tables: string[];
  version: number;
};

/** Opens a picked file in memory, without touching the real data. Unreadable files come back with no tables. */
export async function openBackup(uri: string): Promise<OpenedBackup> {
  const bytes = await new File(uri).bytes();
  // The live database is in WAL mode and its copy says so in bytes 18-19, but an in-memory
  // database can't open a WAL file. 1 = the plain journal mode, which holds the same data.
  if (bytes.length > 19 && bytes[18] === 2) bytes[18] = bytes[19] = 1;
  let backup: SQLiteDatabase | null = null;
  try {
    backup = await deserializeDatabaseAsync(bytes);
    const tables = await backup.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'");
    const row = await backup.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    return { db: backup, tables: tables.map((t) => t.name), version: row?.user_version ?? 0 };
  } catch {
    await backup?.closeAsync().catch(() => {});
    return { db: null, tables: [], version: 0 };
  }
}

/** The numbers the Restore confirm summary shows. */
export async function summarize(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ entries: number; lastBackup: string | null }>(`
    SELECT (SELECT COUNT(*) FROM entries) AS entries,
           (SELECT value FROM settings WHERE key = 'last_backup') AS lastBackup
  `);
  return row ?? { entries: 0, lastBackup: null };
}

/**
 * Replaces all data with the opened Backup, all or nothing. The copy is upgraded in memory
 * first, so a failing migration stops before the real data is touched; SQLite's backup then
 * swaps the pages in a single write transaction.
 */
export async function restoreBackup(db: SQLiteDatabase, backup: SQLiteDatabase) {
  try {
    await migrate(backup);
    await backupDatabaseAsync({ sourceDatabase: backup, destDatabase: db });
  } finally {
    await backup.closeAsync();
  }
}

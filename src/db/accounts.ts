import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

export type AccountKind = 'cash' | 'gcash' | 'maya' | 'bank';

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  startingBalance: number; // centavos
};

const COLUMNS = 'id, name, kind, starting_balance AS startingBalance';

export function listAccounts(db: SQLiteDatabase) {
  return db.getAllAsync<Account>(`SELECT ${COLUMNS} FROM accounts WHERE archived = 0 ORDER BY position`);
}

export function getAccount(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<Account>(`SELECT ${COLUMNS} FROM accounts WHERE id = ?`, id);
}

/** Adds the Account at the end of the list. */
export async function addAccount(db: SQLiteDatabase, { name, kind, startingBalance }: Omit<Account, 'id'>) {
  await db.runAsync(
    `INSERT INTO accounts (id, name, kind, starting_balance, position, updated_at)
     SELECT ?, ?, ?, ?, COALESCE(MAX(position) + 1, 0), ? FROM accounts`,
    randomUUID(), name, kind, startingBalance, new Date().toISOString(),
  );
}

export async function updateAccount(db: SQLiteDatabase, { id, name, kind, startingBalance }: Account) {
  await db.runAsync(
    'UPDATE accounts SET name = ?, kind = ?, starting_balance = ?, updated_at = ? WHERE id = ?',
    name, kind, startingBalance, new Date().toISOString(), id,
  );
}

import { checkRestore, lastBackupLabel, needsBackupNudge } from './backup';

const KEPLER_TABLES = ['accounts', 'categories', 'entries', 'monthly_budget_changes', 'category_limit_changes', 'settings'];

describe('checkRestore', () => {
  test('accepts a Backup from this version of the app', () => {
    expect(checkRestore({ tables: KEPLER_TABLES, version: 1 }, 1)).toEqual({ verdict: 'accept' });
  });

  test('accepts an older Backup, to be brought up to date by the migrations', () => {
    expect(checkRestore({ tables: KEPLER_TABLES, version: 1 }, 3)).toEqual({ verdict: 'upgrade' });
  });

  test('rejects a Backup from a newer version of the app', () => {
    expect(checkRestore({ tables: KEPLER_TABLES, version: 4 }, 3)).toEqual({
      verdict: 'reject',
      reason: 'This Backup is from a newer version of Kepler. Update the app, then try again.',
    });
  });

  test.each([
    ['another app’s database', { tables: ['notes'], version: 2 }],
    ['a database missing a Kepler table', { tables: KEPLER_TABLES.filter((t) => t !== 'entries'), version: 1 }],
    ['an empty or unreadable file', { tables: [], version: 0 }],
  ])('rejects %s as not a Kepler Backup', (_, backup) => {
    expect(checkRestore(backup, 3)).toEqual({ verdict: 'reject', reason: 'This file isn’t a Kepler Backup.' });
  });
});

describe('needsBackupNudge', () => {
  const now = new Date('2026-11-28T12:00:00.000Z');
  const installedAt = '2026-11-01T08:00:00.000Z';

  test('never Backed up: quiet on a fresh install, shown once something changed', () => {
    expect(needsBackupNudge({ lastBackup: null, lastChange: installedAt, installedAt }, now)).toBe(false);
    expect(needsBackupNudge({ lastBackup: null, lastChange: '2026-11-02T09:00:00.000Z', installedAt }, now)).toBe(true);
  });

  test('Backed up within 7 days: quiet even after changes', () => {
    const lastBackup = '2026-11-25T12:00:00.000Z';
    expect(needsBackupNudge({ lastBackup, lastChange: '2026-11-27T12:00:00.000Z', installedAt }, now)).toBe(false);
    // Exactly 7 days is not yet "more than 7 days".
    expect(needsBackupNudge({ lastBackup: '2026-11-21T12:00:00.000Z', lastChange: '2026-11-27T12:00:00.000Z', installedAt }, now)).toBe(false);
  });

  test('Backed up over 7 days ago: shown only if something changed since', () => {
    const lastBackup = '2026-11-20T12:00:00.000Z';
    expect(needsBackupNudge({ lastBackup, lastChange: '2026-11-22T12:00:00.000Z', installedAt }, now)).toBe(true);
    expect(needsBackupNudge({ lastBackup, lastChange: '2026-11-19T12:00:00.000Z', installedAt }, now)).toBe(false);
  });
});

describe('lastBackupLabel', () => {
  // Local times, because "days ago" counts the phone's calendar days.
  const now = new Date(2026, 10, 28, 8, 0);
  const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 0).toISOString();

  test('counts calendar days', () => {
    expect(lastBackupLabel(null, now)).toBe('Never');
    expect(lastBackupLabel(at(28, 7), now)).toBe('Today');
    expect(lastBackupLabel(at(27, 23), now)).toBe('1 day ago');
    expect(lastBackupLabel(at(18, 9), now)).toBe('10 days ago');
  });
});

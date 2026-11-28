export type RestoreCheck = { verdict: 'accept' } | { verdict: 'upgrade' } | { verdict: 'reject'; reason: string };

// The tables migration 1 creates. Every Kepler database since then has them.
const KEPLER_TABLES = ['accounts', 'categories', 'entries', 'monthly_budget_changes', 'category_limit_changes', 'settings'];

/** Decides whether an opened file can be Restored, from its table names and schema version. */
export function checkRestore(backup: { tables: string[]; version: number }, appVersion: number): RestoreCheck {
  if (!KEPLER_TABLES.every((t) => backup.tables.includes(t))) {
    return { verdict: 'reject', reason: 'This file isn’t a Kepler Backup.' };
  }
  if (backup.version > appVersion) {
    return { verdict: 'reject', reason: 'This Backup is from a newer version of Kepler. Update the app, then try again.' };
  }
  return { verdict: backup.version < appVersion ? 'upgrade' : 'accept' };
}

type NudgeInput = {
  lastBackup: string | null; // ISO timestamps, so they compare as text
  lastChange: string; // newest updated_at across the data tables
  installedAt: string; // stands in for "since" when there is no Backup yet
};

/** Home asks for a Backup when the last one is over 7 days old (or missing) and data changed since. */
export function needsBackupNudge({ lastBackup, lastChange, installedAt }: NudgeInput, now: Date): boolean {
  if (lastBackup && now.getTime() - Date.parse(lastBackup) <= 7 * DAY) return false;
  return lastChange > (lastBackup ?? installedAt);
}

const DAY = 24 * 60 * 60 * 1000;

/** "Never", "Today", "1 day ago" or "N days ago", counting the phone's calendar days. */
export function lastBackupLabel(lastBackup: string | null, now: Date): string {
  if (!lastBackup) return 'Never';
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(now) - midnight(new Date(lastBackup))) / DAY);
  return days <= 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
}

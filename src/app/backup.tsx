import { getDocumentAsync } from 'expo-document-picker';
import { Directory } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { getBackupStatus, openBackup, restoreBackup, summarize, writeBackup } from '../db/backup';
import { SCHEMA_VERSION } from '../db/migrations';
import { checkRestore, lastBackupLabel } from '../rules/backup';

export default function BackupScreen() {
  const db = useSQLiteContext();
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getBackupStatus(db).then((s) => setLastBackup(s?.lastBackup ?? null));
  }, [db]);
  useFocusEffect(load);

  // Runs one button's work, keeping both buttons off until it ends and showing any failure.
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await work();
    } catch (e) {
      setMessage({ text: `Something went wrong: ${e instanceof Error ? e.message : String(e)}`, error: true });
    } finally {
      setBusy(false);
      load();
    }
  }

  // Android's share sheet only lists apps, so saving onto the phone goes through its folder picker.
  const saveToPhone = () =>
    run(async () => {
      let folder: Directory;
      try {
        folder = await Directory.pickDirectoryAsync(); // picked first, so a cancel records no Backup
      } catch {
        return; // no folder chosen
      }
      const file = await writeBackup(db);
      await folder.createFile(file.name, 'application/octet-stream').write(await file.bytes());
      setMessage({ text: `Saved ${file.name}. Keep a copy off this phone too, like on Google Drive.` });
    });

  const share = () =>
    run(async () => {
      const file = await writeBackup(db);
      load();
      await shareAsync(file.uri, { mimeType: 'application/octet-stream', dialogTitle: 'Send your Kepler Backup' });
    });

  const restore = () =>
    run(async () => {
      // No cache copy: Expo Go can't read the picker's cache folder, but it can read the content:// link.
      const picked = await getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (picked.canceled) return;
      const opened = await openBackup(picked.assets[0].uri);
      const check = checkRestore(opened, SCHEMA_VERSION);
      if (check.verdict === 'reject') {
        await opened.db?.closeAsync();
        return setMessage({ text: check.reason, error: true });
      }
      const backup = opened.db!; // a file that didn't open has no tables, so it was rejected above
      if (await confirmReplace(db, backup)) {
        await restoreBackup(db, backup);
        setMessage({ text: 'Restored. Your data is now the Backup’s.' });
      } else {
        await backup.closeAsync();
      }
    });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Last backup</Text>
      <Text style={styles.value}>{lastBackupLabel(lastBackup, new Date())}</Text>

      <Text style={styles.label}>Back up now</Text>
      <Text style={styles.hint}>Makes a file with a copy of all your data.</Text>
      <Pressable style={[styles.button, busy && styles.disabled]} onPress={saveToPhone} disabled={busy} accessibilityRole="button">
        <Text style={styles.buttonText}>Save to phone</Text>
      </Pressable>
      <Pressable style={[styles.button, busy && styles.disabled]} onPress={share} disabled={busy} accessibilityRole="button">
        <Text style={styles.buttonText}>Share to Drive, Messenger…</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.secondary, styles.gap, busy && styles.disabled]} onPress={restore} disabled={busy} accessibilityRole="button">
        <Text style={[styles.buttonText, styles.secondaryText]}>Restore from backup</Text>
      </Pressable>
      <Text style={styles.hint}>Replaces all your data with a Backup file. Nothing is merged.</Text>

      {message && <Text style={[styles.message, message.error && styles.error]}>{message.text}</Text>}
    </View>
  );
}

/** Shows the Backup's date and counts next to the current data, and resolves true on "Replace my data". */
async function confirmReplace(db: SQLiteDatabase, backup: SQLiteDatabase) {
  const [theirs, ours] = await Promise.all([summarize(backup), summarize(db)]);
  const date = theirs.lastBackup ? new Date(theirs.lastBackup).toLocaleString() : 'an unknown date';
  return new Promise<boolean>((resolve) =>
    Alert.alert(
      'Replace all your data?',
      `This Backup is from ${date} and has ${entries(theirs.entries)}.\n` +
        `Your data now has ${entries(ours.entries)}, and it will be gone.\n\n` +
        'To keep a copy of it, Cancel and Back up now first.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Replace my data', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}

const entries = (n: number) => `${n} ${n === 1 ? 'Entry' : 'Entries'}`;

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  label: { fontSize: 14 },
  value: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  button: { backgroundColor: '#1565c0', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#1565c0' },
  secondaryText: { color: '#1565c0' },
  gap: { marginTop: 32 },
  disabled: { opacity: 0.5 },
  hint: { fontSize: 13, opacity: 0.6 },
  message: { marginTop: 16, fontSize: 15 },
  error: { color: '#c62828' },
});

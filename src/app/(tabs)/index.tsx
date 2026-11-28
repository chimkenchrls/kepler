import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Placeholder } from '../../components/Placeholder';
import { getBackupStatus } from '../../db/backup';
import { needsBackupNudge } from '../../rules/backup';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [nudge, setNudge] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getBackupStatus(db).then((s) => setNudge(!!s && needsBackupNudge(s, new Date())));
    }, [db]),
  );

  // shortcut: the nudge sits alone on a placeholder Home until #22 (Home screen) builds the rest around it
  return (
    <View style={styles.container}>
      {nudge && (
        <Pressable style={styles.nudge} onPress={() => router.push('/backup')} accessibilityRole="button">
          <Text style={styles.nudgeTitle}>Back up your data</Text>
          <Text>You have changes that aren’t in a Backup yet. Tap to back up now.</Text>
        </Pressable>
      )}
      <Placeholder title="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nudge: { margin: 16, padding: 16, borderRadius: 8, backgroundColor: '#fff3e0', gap: 4 },
  nudgeTitle: { fontSize: 16, fontWeight: '600' },
});

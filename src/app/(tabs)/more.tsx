import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.row} onPress={() => router.push('/accounts')} accessibilityRole="button">
        <Text style={styles.text}>Accounts</Text>
      </Pressable>
      {/* Placeholders until #18 (Categories) and #14 (Backup & restore) */}
      <Text style={[styles.row, styles.text, styles.soon]}>Categories</Text>
      <Text style={[styles.row, styles.text, styles.soon]}>Backup & restore</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  row: { paddingVertical: 16 },
  text: { fontSize: 16 },
  soon: { opacity: 0.4 },
});

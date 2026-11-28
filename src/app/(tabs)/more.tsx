import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.row} onPress={() => router.push('/accounts')} accessibilityRole="button">
        <Text style={styles.text}>Accounts</Text>
      </Pressable>
      {/* Placeholder until #18 (Categories) */}
      <Text style={[styles.row, styles.text, styles.soon]}>Categories</Text>
      <Pressable style={styles.row} onPress={() => router.push('/backup')} accessibilityRole="button">
        <Text style={styles.text}>Backup & restore</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  row: { paddingVertical: 16 },
  text: { fontSize: 16 },
  soon: { opacity: 0.4 },
});

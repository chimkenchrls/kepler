import { StyleSheet, Text, View } from 'react-native';

// shortcut: stand-in screen body, replaced as each screen's ticket lands
export function Placeholder({ title, lines = [] }: { title: string; lines?: string[] }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 20 },
  line: { fontSize: 16 },
});

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ACCOUNT_KINDS } from '../../components/accountKinds';
import { type Account, listAccounts } from '../../db/accounts';
import { formatAmount } from '../../rules/money';

export default function AccountsScreen() {
  const db = useSQLiteContext();
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Reload every time the screen comes back into view, e.g. after saving the form.
  useFocusEffect(
    useCallback(() => {
      listAccounts(db).then(setAccounts);
    }, [db]),
  );

  // shortcut: Current balance is only the Starting balance until Entries exist (#13 adds the balance rule)
  const balance = (a: Account) => a.startingBalance;
  const total = accounts.reduce((sum, a) => sum + balance(a), 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={[styles.total, total < 0 && styles.negative]}>{formatAmount(total)}</Text>
      </View>

      {accounts.map((a) => (
        <Pressable
          key={a.id}
          style={styles.row}
          onPress={() => router.push({ pathname: '/accounts/edit', params: { id: a.id } })}
          accessibilityRole="button"
        >
          <MaterialIcons name={ACCOUNT_KINDS[a.kind].icon} size={24} />
          <View style={styles.rowText}>
            <Text style={styles.name}>{a.name}</Text>
            <Text style={styles.kind}>{ACCOUNT_KINDS[a.kind].label}</Text>
          </View>
          <Text style={[styles.amount, balance(a) < 0 && styles.negative]}>{formatAmount(balance(a))}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.addButton} onPress={() => router.push('/accounts/edit')} accessibilityRole="button">
        <Text style={styles.addText}>+ Add an Account</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  totalBox: { paddingVertical: 12 },
  totalLabel: { fontSize: 14 },
  total: { fontSize: 28, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowText: { flex: 1 },
  name: { fontSize: 16 },
  kind: { fontSize: 13, opacity: 0.6 },
  amount: { fontSize: 16 },
  negative: { color: '#c62828' },
  addButton: { paddingVertical: 16 },
  addText: { fontSize: 16, color: '#1565c0' },
});

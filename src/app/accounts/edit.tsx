import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ACCOUNT_KINDS } from '../../components/accountKinds';
import { type AccountKind, addAccount, getAccount, updateAccount } from '../../db/accounts';
import { formatAmount, parseAmount } from '../../rules/money';

/** Adds an Account, or edits one when opened with ?id=… */
export default function AccountForm() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('cash');
  const [balanceText, setBalanceText] = useState('0');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getAccount(db, id).then((a) => {
      if (!a) return;
      setName(a.name);
      setKind(a.kind);
      setBalanceText(formatAmount(a.startingBalance).slice(1)); // drop the ₱; the rest parses back
    });
  }, [db, id]);

  async function save() {
    if (name.trim() === '') return setError('Enter a name.');
    const balance = parseAmount(balanceText, { allowZero: true });
    if (!balance.ok) return setError(balance.error);
    const account = { name: name.trim(), kind, startingBalance: balance.centavos };
    try {
      await (id ? updateAccount(db, { id, ...account }) : addAccount(db, account));
      router.back();
    } catch (e) {
      setError(`Couldn't save: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: id ? 'Edit Account' : 'New Account' }} />

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. BPI Savings" autoFocus={!id} />

      <Text style={styles.label}>Kind</Text>
      <View style={styles.chips}>
        {(Object.keys(ACCOUNT_KINDS) as AccountKind[]).map((k) => (
          <Pressable
            key={k}
            onPress={() => setKind(k)}
            style={[styles.chip, kind === k && styles.chipSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected: kind === k }}
          >
            <Text style={kind === k && styles.chipSelectedText}>{ACCOUNT_KINDS[k].label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Starting balance (₱)</Text>
      <TextInput style={styles.input} value={balanceText} onChangeText={setBalanceText} keyboardType="decimal-pad" selectTextOnFocus />
      <Text style={styles.hint}>What the Account holds today. It doesn&apos;t count as Income.</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.save} onPress={save} accessibilityRole="button">
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  label: { fontSize: 14, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#999', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  chipSelected: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  chipSelectedText: { color: '#fff' },
  hint: { fontSize: 13, opacity: 0.6 },
  error: { color: '#c62828', marginTop: 8 },
  save: { marginTop: 16, backgroundColor: '#1565c0', borderRadius: 8, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

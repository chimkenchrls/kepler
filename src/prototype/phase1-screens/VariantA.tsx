// PROTOTYPE, throwaway. Variant A: bottom tabs (Entries · Budget · + · Accounts · Categories), + opens a full-screen form.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { budgetLines, fmt, FEES, parseAmount, thisMonth, today, useStore } from './store';
import { AccountPick, AccountsView, AmountInput, BudgetView, Btn, C, CategoriesView, CategoryPick, Chip, DatePick, EntryList, Header, Label, MonthPick, NoteInput, s, useBack, Wrap } from './ui';

export const name = 'Tabs + form';
type Tab = 'entries' | 'budget' | 'accounts' | 'categories';

export function VariantA() {
  const [tab, setTab] = useState<Tab>('entries');
  const [adding, setAdding] = useState(false);
  const [month, setMonth] = useState(thisMonth());
  const st = useStore();
  if (adding) return <AddForm close={() => setAdding(false)} />;
  const r = budgetLines(st, thisMonth());

  return (
    <View style={{ flex: 1 }}>
      {tab === 'entries' && (
        <>
          <Header title="Entries" />
          <MonthPick month={month} set={setMonth} />
          {r && month === thisMonth() && (
            <Pressable onPress={() => setTab('budget')} style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <Text style={[s.dim, r.total.spent > r.total.limit && { color: C.red }]}>
                {r.total.spent > r.total.limit ? `${fmt(r.total.spent - r.total.limit)} over budget` : `${fmt(r.total.limit - r.total.spent)} left this month`} ›
              </Text>
            </Pressable>
          )}
          <ScrollView><EntryList month={month} /></ScrollView>
        </>
      )}
      {tab === 'budget' && (
        <>
          <Header title="Budget" />
          <MonthPick month={month} set={setMonth} />
          <ScrollView><BudgetView month={month} /></ScrollView>
        </>
      )}
      {tab === 'accounts' && (<><Header title="Accounts" /><ScrollView><AccountsView /></ScrollView></>)}
      {tab === 'categories' && (<><Header title="Categories" /><ScrollView><CategoriesView /></ScrollView></>)}

      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: C.line, alignItems: 'center' }}>
        <TabBtn label="Entries" on={tab === 'entries'} onPress={() => setTab('entries')} />
        <TabBtn label="Budget" on={tab === 'budget'} onPress={() => setTab('budget')} />
        <Pressable onPress={() => setAdding(true)} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>
          <Text style={{ color: '#fff', fontSize: 34, lineHeight: 38 }}>+</Text>
        </Pressable>
        <TabBtn label="Accounts" on={tab === 'accounts'} onPress={() => setTab('accounts')} />
        <TabBtn label="Categories" on={tab === 'categories'} onPress={() => setTab('categories')} />
      </View>
    </View>
  );
}

const TabBtn = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
    <Text style={{ fontSize: 13, color: on ? C.blue : C.dim, fontWeight: on ? '700' : '400' }}>{label}</Text>
  </Pressable>
);

function AddForm({ close }: { close: () => void }) {
  const st = useStore();
  useBack(close);
  const [kind, setKind] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState('');
  const [acc, setAcc] = useState(st.lastAccountId);
  const [to, setTo] = useState('');
  const [fee, setFee] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const amount = parseAmount(amt);
  const feeAmt = fee ? parseAmount(fee) : undefined;
  const ok = !!amount && (kind === 'transfer' ? !!to && to !== acc && feeAmt !== null : !!cat);

  const save = () => {
    if (!ok || !amount) return;
    if (kind === 'transfer') st.add({ kind, amount, fee: feeAmt ?? undefined, fromId: acc, toId: to, date, note: note || undefined });
    else st.add({ kind, amount, categoryId: cat, accountId: acc, date, note: note || undefined });
    close();
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="New entry" onBack={close} />
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={[s.wrap, { paddingTop: 12 }]}>
          {(['expense', 'income', 'transfer'] as const).map((k) => (
            <Chip key={k} label={k[0].toUpperCase() + k.slice(1)} on={kind === k} onPress={() => (setKind(k), setCat(''))} />
          ))}
        </View>
        <AmountInput value={amt} set={setAmt} autoFocus onSubmit={save} />
        {kind === 'transfer' ? (
          <>
            <AccountPick label="From" value={acc} set={setAcc} />
            <AccountPick label="To" value={to} set={setTo} exclude={acc} />
            <Label>{`Fee (optional, counts under ${st.categories.find((c) => c.id === FEES)!.name})`}</Label>
            <AmountInput value={fee} set={setFee} placeholder="₱0" />
          </>
        ) : (
          <>
            <CategoryPick type={kind} value={cat} set={setCat} />
            <AccountPick value={acc} set={setAcc} />
          </>
        )}
        <Label>Date</Label>
        <View style={{ paddingHorizontal: 16 }}><DatePick date={date} set={setDate} /></View>
        <Label>Note</Label>
        <NoteInput value={note} set={setNote} />
      </ScrollView>
      <Btn label="Save" onPress={save} disabled={!ok} />
    </View>
  );
}

// PROTOTYPE, throwaway. Variant B: the app opens on a keypad. Type the amount, tap a Category, saved. Everything else is behind ☰.
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { accName, budgetLines, catsOf, fmt, parseAmount, thisMonth, today, useStore } from './store';
import { AccountPick, AccountsView, BudgetView, Btn, C, CategoriesView, Chip, DatePick, EntryList, Header, MonthPick, Row, s, useBack } from './ui';

export const name = 'Keypad first';
type Screen = 'keypad' | 'menu' | 'entries' | 'budget' | 'accounts' | 'categories';

export function VariantB() {
  const [screen, setScreen] = useState<Screen>('keypad');
  const [month, setMonth] = useState(thisMonth());
  const back = () => setScreen(screen === 'menu' ? 'keypad' : 'menu');
  useBack(screen === 'keypad' ? null : back);

  if (screen === 'keypad') return <Keypad open={setScreen} />;
  if (screen === 'menu')
    return (
      <View style={{ flex: 1 }}>
        <Header title="Kepler" onBack={back} />
        {(['entries', 'budget', 'accounts', 'categories'] as const).map((k) => (
          <Row key={k} title={k[0].toUpperCase() + k.slice(1)} value="›" onPress={() => setScreen(k)} />
        ))}
      </View>
    );
  const title = screen[0].toUpperCase() + screen.slice(1);
  return (
    <View style={{ flex: 1 }}>
      <Header title={title} onBack={back} />
      {(screen === 'entries' || screen === 'budget') && <MonthPick month={month} set={setMonth} />}
      <ScrollView>
        {screen === 'entries' && <EntryList month={month} />}
        {screen === 'budget' && <BudgetView month={month} />}
        {screen === 'accounts' && <AccountsView />}
        {screen === 'categories' && <CategoriesView />}
      </ScrollView>
    </View>
  );
}

function Keypad({ open }: { open: (s: Screen) => void }) {
  const st = useStore();
  const [kind, setKind] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amt, setAmt] = useState('');
  const [acc, setAcc] = useState(st.lastAccountId);
  const [to, setTo] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [pickAcc, setPickAcc] = useState(false);
  const amount = parseAmount(amt);
  const r = budgetLines(st, thisMonth());

  const press = (k: string) => {
    if (k === '⌫') return setAmt(amt.slice(0, -1));
    const next = amt + k;
    if (/^\d*(\.\d{0,2})?$/.test(next)) setAmt(next);
  };
  const done = () => (setAmt(''), setNote(''), setDate(today()));
  const saveTxn = (categoryId: string) => {
    if (!amount || kind === 'transfer') return;
    st.add({ kind, amount, categoryId, accountId: acc, date, note: note || undefined });
    done();
  };
  const saveTransfer = () => {
    if (!amount || !to) return;
    // shortcut: no Fee field on this variant; it would need a second amount, which this layout doesn't have room for yet
    st.add({ kind: 'transfer', amount, fromId: acc, toId: to, date, note: note || undefined });
    done();
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.header, { justifyContent: 'space-between' }]}>
        <Pressable onPress={() => open('budget')}>
          {r ? (
            <Text style={[s.rowTitle, r.total.spent > r.total.limit && { color: C.red }]}>
              {r.total.spent > r.total.limit ? `${fmt(r.total.spent - r.total.limit)} over` : `${fmt(r.total.limit - r.total.spent)} left`} this month ›
            </Text>
          ) : (
            <Text style={[s.rowTitle, { color: C.blue }]}>Set a monthly budget ›</Text>
          )}
        </Pressable>
        <Pressable onPress={() => open('menu')} hitSlop={12}><Text style={{ fontSize: 26 }}>☰</Text></Pressable>
      </View>

      <View style={[s.wrap, { paddingTop: 10 }]}>
        {(['expense', 'income', 'transfer'] as const).map((k) => (
          <Chip key={k} label={k[0].toUpperCase() + k.slice(1)} on={kind === k} onPress={() => setKind(k)} />
        ))}
      </View>

      <Text style={[s.amount, { textAlign: 'right', fontSize: 48 }, !amt && { color: C.dim }]}>₱{amt || '0'}</Text>

      <View style={[s.inline, { paddingHorizontal: 16, justifyContent: 'space-between' }]}>
        <Pressable onPress={() => setPickAcc(!pickAcc)}>
          <Text style={[s.rowTitle, { color: C.blue }]}>{kind === 'transfer' ? 'from ' : ''}{accName(st, acc)} ▾</Text>
        </Pressable>
        <DatePick date={date} set={setDate} />
      </View>
      <TextInput style={s.note} value={note} onChangeText={setNote} placeholder="Note (optional)" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
        {pickAcc ? (
          <AccountPick value={acc} set={(id) => (setAcc(id), setPickAcc(false))} />
        ) : kind === 'transfer' ? (
          <>
            <AccountPick label="To" value={to} set={setTo} exclude={acc} />
            <Btn label="Save transfer" onPress={saveTransfer} disabled={!amount || !to} />
          </>
        ) : (
          <View style={s.wrap}>
            {catsOf(st, kind).map((c) => (
              <Pressable key={c.id} onPress={() => saveTxn(c.id)} disabled={!amount}
                style={{ width: '31%', paddingVertical: 14, borderRadius: 10, backgroundColor: C.chip, alignItems: 'center', opacity: amount ? 1 : 0.4 }}>
                <Text style={{ fontSize: 14 }}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderColor: C.line }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => (
          <Pressable key={k} onPress={() => press(k)} style={{ width: '33.33%', paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 26 }}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

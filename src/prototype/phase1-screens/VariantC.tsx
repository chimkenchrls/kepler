// PROTOTYPE, throwaway. Variant C: one scrolling home (budget, log buttons, accounts, entries). Tap a Category first, a sheet asks the amount.
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { balance, budgetLines, catName, catsOf, fmt, parseAmount, thisMonth, today, useStore } from './store';
import { AccountPick, AccountsView, AmountInput, BudgetLine, BudgetView, Btn, C, CategoriesView, CategoryPick, Chip, DatePick, EntryList, Header, Label, MonthPick, NoteInput, s, useBack, Wrap } from './ui';

export const name = 'One home, category first';
type Sheet = { kind: 'expense'; categoryId: string } | { kind: 'income' } | { kind: 'transfer' };

export function VariantC() {
  const st = useStore();
  const [screen, setScreen] = useState<'home' | 'budget' | 'accounts' | 'categories'>('home');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [month, setMonth] = useState(thisMonth());
  const home = () => setScreen('home');
  useBack(screen === 'home' ? null : home);

  if (screen !== 'home')
    return (
      <View style={{ flex: 1 }}>
        <Header title={screen[0].toUpperCase() + screen.slice(1)} onBack={home} />
        {screen === 'budget' && <MonthPick month={month} set={setMonth} />}
        <ScrollView>
          {screen === 'budget' && <BudgetView month={month} />}
          {screen === 'accounts' && <AccountsView />}
          {screen === 'categories' && <CategoriesView />}
        </ScrollView>
      </View>
    );

  const r = budgetLines(st, thisMonth());
  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <Label>Budget</Label>
        {r ? (
          <>
            <BudgetLine l={r.total} onPress={() => setScreen('budget')} />
            {[...r.lines, r.rest].filter((l) => l.spent > l.limit).map((l) => <BudgetLine key={l.key} l={l} onPress={() => setScreen('budget')} />)}
          </>
        ) : (
          <Pressable onPress={() => setScreen('budget')}><Text style={s.link}>Set a monthly budget ›</Text></Pressable>
        )}

        <Label>Log</Label>
        <Wrap>
          {catsOf(st, 'expense').map((c) => <Chip key={c.id} label={c.name} onPress={() => setSheet({ kind: 'expense', categoryId: c.id })} />)}
          <Chip label="+ Income" onPress={() => setSheet({ kind: 'income' })} />
          <Chip label="⇄ Transfer" onPress={() => setSheet({ kind: 'transfer' })} />
        </Wrap>

        <Pressable onPress={() => setScreen('accounts')}><Label>Accounts ›</Label></Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {st.accounts.map((a) => {
            const b = balance(st, a.id);
            return (
              <Pressable key={a.id} onPress={() => setScreen('accounts')} style={{ borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12, minWidth: 110 }}>
                <Text style={s.dim}>{a.name}</Text>
                <Text style={[s.rowValue, b < 0 && { color: C.red }]}>{fmt(b)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[s.inline, { justifyContent: 'space-between', paddingRight: 16 }]}>
          <Label>Entries</Label>
          <Pressable onPress={() => setScreen('categories')}><Text style={[s.dim, { color: C.blue }]}>Manage categories</Text></Pressable>
        </View>
        <MonthPick month={month} set={setMonth} />
        <EntryList month={month} />
      </ScrollView>
      {sheet && <AddSheet sheet={sheet} close={() => setSheet(null)} />}
    </View>
  );
}

function AddSheet({ sheet, close }: { sheet: Sheet; close: () => void }) {
  const st = useStore();
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState(sheet.kind === 'expense' ? sheet.categoryId : '');
  const [acc, setAcc] = useState(st.lastAccountId);
  const [to, setTo] = useState('');
  const [fee, setFee] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const amount = parseAmount(amt);
  const feeAmt = fee ? parseAmount(fee) : undefined;
  const ok = !!amount && (sheet.kind === 'transfer' ? !!to && to !== acc && feeAmt !== null : !!cat);

  const save = () => {
    if (!ok || !amount) return;
    if (sheet.kind === 'transfer') st.add({ kind: 'transfer', amount, fee: feeAmt ?? undefined, fromId: acc, toId: to, date, note: note || undefined });
    else st.add({ kind: sheet.kind, amount, categoryId: cat, accountId: acc, date, note: note || undefined });
    close();
  };
  const title = sheet.kind === 'expense' ? catName(st, sheet.categoryId) : sheet.kind === 'income' ? 'Income' : 'Transfer';

  return (
    <Modal transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior="height" style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <Pressable style={{ flex: 1 }} onPress={close} />
        {/* the Modal is its own window, so taps are counted here too */}
        <View onTouchStart={st.tap} style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24, maxHeight: '85%' }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Header title={title} />
            <AmountInput value={amt} set={setAmt} autoFocus onSubmit={save} />
            {sheet.kind === 'income' && <CategoryPick type="income" value={cat} set={setCat} />}
            {sheet.kind === 'transfer' ? (
              <>
                <AccountPick label="From" value={acc} set={setAcc} />
                <AccountPick label="To" value={to} set={setTo} exclude={acc} />
                <Label>Fee (optional)</Label>
                <AmountInput value={fee} set={setFee} />
              </>
            ) : (
              <AccountPick value={acc} set={setAcc} />
            )}
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}><DatePick date={date} set={setDate} /></View>
            <NoteInput value={note} set={setNote} />
            <Btn label="Save" onPress={save} disabled={!ok} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

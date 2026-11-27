// PROTOTYPE, throwaway. Shared pieces for the three Phase 1 layout variants. Plain on purpose: visual style is out of scope.
import { ReactNode, useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { accName, budgetLines, catName, catsOf, dayLabel, Entry, fmt, Line, monthLabel, parseAmount, shiftDay, shiftMonth, thisMonth, today, useStore, balance } from './store';

export const C = { line: '#e2e2e2', dim: '#777', red: '#c62828', blue: '#1565c0', chip: '#eee', green: '#2e7d32' };
export const stub = (what: string) => Alert.alert('Prototype', `${what} isn't built in this prototype.`);

export function useBack(fn: (() => void) | null) {
  useEffect(() => {
    if (!fn) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => (fn(), true));
    return () => sub.remove();
  }, [fn]);
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={s.header}>
      {onBack && <Pressable onPress={onBack} hitSlop={12}><Text style={s.headerBtn}>←</Text></Pressable>}
      <Text style={s.headerTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function Row({ title, sub, value, red, onPress }: { title: string; sub?: string; value?: string; red?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub ? <Text style={s.dim}>{sub}</Text> : null}
      </View>
      {value ? <Text style={[s.rowValue, red && { color: C.red }]}>{value}</Text> : null}
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && { backgroundColor: C.blue }]}>
      <Text style={[s.chipText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Btn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.btn, disabled && { opacity: 0.35 }]}>
      <Text style={s.btnText}>{label}</Text>
    </Pressable>
  );
}

export const Label = ({ children }: { children: string }) => <Text style={s.label}>{children}</Text>;
export const Wrap = ({ children }: { children: ReactNode }) => <View style={s.wrap}>{children}</View>;

export function DatePick({ date, set }: { date: string; set: (d: string) => void }) {
  // shortcut: arrows instead of a calendar picker; the real app needs a date picker for far-back dates
  return (
    <View style={s.inline}>
      <Pressable onPress={() => set(shiftDay(date, -1))} hitSlop={10}><Text style={s.arrow}>‹</Text></Pressable>
      <Text style={s.rowTitle}>{dayLabel(date)}</Text>
      <Pressable onPress={() => date < today() && set(shiftDay(date, 1))} hitSlop={10}>
        <Text style={[s.arrow, date >= today() && { opacity: 0.2 }]}>›</Text>
      </Pressable>
    </View>
  );
}

export function MonthPick({ month, set }: { month: string; set: (m: string) => void }) {
  const atNow = month >= thisMonth();
  return (
    <View style={[s.inline, { justifyContent: 'center', paddingVertical: 8 }]}>
      <Pressable onPress={() => set(shiftMonth(month, -1))} hitSlop={10}><Text style={s.arrow}>‹</Text></Pressable>
      <Text style={[s.rowTitle, { minWidth: 90, textAlign: 'center' }]}>{monthLabel(month)}</Text>
      <Pressable onPress={() => !atNow && set(shiftMonth(month, 1))} hitSlop={10}>
        <Text style={[s.arrow, atNow && { opacity: 0.2 }]}>›</Text>
      </Pressable>
    </View>
  );
}

export function AccountPick({ value, set, exclude, label = 'Account' }: { value: string; set: (id: string) => void; exclude?: string; label?: string }) {
  const st = useStore();
  return (
    <>
      <Label>{label}</Label>
      <Wrap>{st.accounts.filter((a) => a.id !== exclude).map((a) => <Chip key={a.id} label={a.name} on={a.id === value} onPress={() => set(a.id)} />)}</Wrap>
    </>
  );
}

export function CategoryPick({ type, value, set }: { type: 'expense' | 'income'; value: string; set: (id: string) => void }) {
  const st = useStore();
  return (
    <>
      <Label>Category</Label>
      <Wrap>{catsOf(st, type).map((c) => <Chip key={c.id} label={c.name} on={c.id === value} onPress={() => set(c.id)} />)}</Wrap>
    </>
  );
}

export function AmountInput({ value, set, autoFocus, onSubmit, placeholder = '₱0' }: { value: string; set: (v: string) => void; autoFocus?: boolean; onSubmit?: () => void; placeholder?: string }) {
  const st = useStore();
  return (
    <TextInput
      style={s.amount}
      value={value}
      onChangeText={(v) => (st.tap(), set(v.replace(',', '.')))} // each keyboard key press counts as a tap
      keyboardType="decimal-pad"
      autoFocus={autoFocus}
      placeholder={placeholder}
      returnKeyType="done"
      onSubmitEditing={onSubmit}
    />
  );
}

export const NoteInput = ({ value, set }: { value: string; set: (v: string) => void }) => (
  <TextInput style={s.note} value={value} onChangeText={set} placeholder="Note (optional)" />
);

export function entryText(st: ReturnType<typeof useStore>, e: Entry) {
  if (e.kind === 'transfer') {
    return {
      title: `${accName(st, e.fromId)} → ${accName(st, e.toId)}`,
      sub: ['Transfer', e.fee ? `fee ${fmt(e.fee)}` : '', e.note].filter(Boolean).join(' · '),
      value: fmt(e.amount),
    };
  }
  return {
    title: catName(st, e.categoryId),
    sub: [accName(st, e.accountId), e.note].filter(Boolean).join(' · '),
    value: (e.kind === 'income' ? '+' : '−') + fmt(e.amount),
  };
}

// This month's Entries, newest first, grouped by day.
export function EntryList({ month, limit }: { month: string; limit?: number }) {
  const st = useStore();
  const list = st.entries
    .filter((e) => e.date.slice(0, 7) === month)
    .sort((a, b) => (a.date === b.date ? b.created - a.created : a.date < b.date ? 1 : -1))
    .slice(0, limit);
  if (!list.length) return <Text style={[s.dim, { padding: 16 }]}>Nothing logged in {monthLabel(month)}.</Text>;
  return (
    <>
      {list.map((e, i) => {
        const t = entryText(st, e);
        return (
          <View key={e.id}>
            {(i === 0 || list[i - 1].date !== e.date) && <Text style={s.dayHead}>{dayLabel(e.date)}</Text>}
            <Row title={t.title} sub={t.sub} value={t.value} onPress={() => stub('Editing an entry')} />
          </View>
        );
      })}
    </>
  );
}

export function BudgetLine({ l, onPress }: { l: Line; onPress?: () => void }) {
  const over = l.spent > l.limit;
  return (
    <Pressable onPress={onPress} style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{l.name}</Text>
        <Text style={s.dim}>{fmt(l.spent)} of {fmt(l.limit)}</Text>
        <View style={s.bar}>
          <View style={[s.barFill, { width: `${Math.min(100, (l.spent / l.limit) * 100)}%` }, over && { backgroundColor: C.red }]} />
        </View>
      </View>
      <Text style={[s.rowValue, over && { color: C.red }]}>{over ? `${fmt(l.spent - l.limit)} over` : `${fmt(l.limit - l.spent)} left`}</Text>
    </Pressable>
  );
}

export function SetBudget() {
  const st = useStore();
  const [v, setV] = useState('');
  const amt = parseAmount(v);
  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={s.rowTitle}>Set a monthly budget</Text>
      <Text style={s.dim}>The most you mean to spend each month. Logging works without one.</Text>
      <AmountInput value={v} set={setV} placeholder="₱15,000" />
      <Btn label="Set budget" disabled={!amt} onPress={() => amt && st.setBudget(amt)} />
    </View>
  );
}

// Monthly budget + each Category limit + Everything else.
export function BudgetView({ month }: { month: string }) {
  const st = useStore();
  const r = budgetLines(st, month);
  if (!r) return <SetBudget />;
  return (
    <>
      <BudgetLine l={r.total} onPress={() => stub('Changing the monthly budget')} />
      <Label>Category limits</Label>
      {r.lines.map((l) => <BudgetLine key={l.key} l={l} onPress={() => stub('Changing a limit')} />)}
      <BudgetLine l={r.rest} />
      <Pressable onPress={() => stub('Adding a Category limit')}><Text style={s.link}>+ Add a Category limit</Text></Pressable>
      <Pressable onPress={() => st.setBudget(null)}><Text style={[s.link, { color: C.red }]}>Remove budget (to see the empty state)</Text></Pressable>
    </>
  );
}

export function AccountsView() {
  const st = useStore();
  const total = st.accounts.reduce((a, x) => a + balance(st, x.id), 0);
  return (
    <>
      <Row title="All accounts" value={fmt(total)} />
      {st.accounts.map((a) => {
        const b = balance(st, a.id);
        return <Row key={a.id} title={a.name} sub={a.kind} value={fmt(b)} red={b < 0} onPress={() => stub('Account detail / edit')} />;
      })}
      <Pressable onPress={() => stub('Adding an account')}><Text style={s.link}>+ Add account</Text></Pressable>
    </>
  );
}

export function CategoriesView() {
  const st = useStore();
  const list = (type: 'expense' | 'income') =>
    catsOf(st, type).map((c) => (
      <Row
        key={c.id}
        title={c.name}
        sub={[c.locked && 'built-in, can’t be removed', st.budget.limits[c.id] && `limit ${fmt(st.budget.limits[c.id])}`].filter(Boolean).join(' · ')}
        value="≡"
        onPress={() => stub('Rename / archive / reorder')}
      />
    ));
  return (
    <>
      <Label>Expense categories</Label>
      {list('expense')}
      <Pressable onPress={() => stub('Adding a category')}><Text style={s.link}>+ Add expense category</Text></Pressable>
      <Label>Income categories</Label>
      {list('income')}
      <Pressable onPress={() => stub('Adding a category')}><Text style={s.link}>+ Add income category</Text></Pressable>
    </>
  );
}

export const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: C.line },
  headerBtn: { fontSize: 24 },
  headerTitle: { fontSize: 20, fontWeight: '600', flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line, gap: 12 },
  rowTitle: { fontSize: 16 },
  rowValue: { fontSize: 16, fontWeight: '500' },
  dim: { color: C.dim, fontSize: 13 },
  dayHead: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, color: C.dim, fontWeight: '600' },
  label: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, color: C.dim, fontWeight: '600', textTransform: 'uppercase', fontSize: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: C.chip },
  chipText: { fontSize: 15 },
  btn: { backgroundColor: C.blue, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginHorizontal: 16, marginVertical: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  arrow: { fontSize: 28, paddingHorizontal: 6 },
  amount: { fontSize: 40, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 8 },
  note: { fontSize: 16, marginHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: C.line },
  link: { color: C.blue, padding: 16, fontSize: 15 },
  bar: { height: 4, backgroundColor: C.chip, borderRadius: 2, marginTop: 6 },
  barFill: { height: 4, backgroundColor: C.blue, borderRadius: 2 },
});

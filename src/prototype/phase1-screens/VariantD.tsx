// PROTOTYPE, throwaway. Variant D = A's tabs and form + a trimmed-down version of C's home.
// Tabs: Home · Entries · + · Budget · More. Home: month left, over warnings, balances, top 5 Categories, last 5 entries.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { balance, budgetLines, catsOf, fmt, thisMonth, useStore } from './store';
import { AddForm } from './VariantA';
import { AccountsView, BudgetLine, BudgetView, C, CategoriesView, Chip, EntryList, Header, Label, MonthPick, Row, s, useBack, Wrap } from './ui';

export const name = 'Tabs + clean home (A + C)';
type Tab = 'home' | 'entries' | 'budget' | 'more';

export function VariantD() {
  const st = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [sub, setSub] = useState<'accounts' | 'categories' | null>(null);
  const [adding, setAdding] = useState<{ categoryId?: string } | null>(null);
  const [month, setMonth] = useState(thisMonth());
  useBack(sub ? () => setSub(null) : tab !== 'home' ? () => setTab('home') : null);

  if (adding) return <AddForm close={() => setAdding(null)} categoryId={adding.categoryId} />;
  if (sub)
    return (
      <View style={{ flex: 1 }}>
        <Header title={sub === 'accounts' ? 'Accounts' : 'Categories'} onBack={() => setSub(null)} />
        <ScrollView>{sub === 'accounts' ? <AccountsView /> : <CategoriesView />}</ScrollView>
      </View>
    );

  const r = budgetLines(st, thisMonth());
  const over = r ? [...r.lines, r.rest].filter((l) => l.spent > l.limit) : [];

  return (
    <View style={{ flex: 1 }}>
      {tab === 'home' && (
        <ScrollView>
          <Pressable onPress={() => setTab('budget')} style={{ padding: 16 }}>
            {r ? (
              <>
                <Text style={s.dim}>Left this month</Text>
                <Text style={{ fontSize: 40, fontWeight: '600', color: r.total.spent > r.total.limit ? C.red : '#000' }}>
                  {r.total.spent > r.total.limit ? `${fmt(r.total.spent - r.total.limit)} over` : fmt(r.total.limit - r.total.spent)}
                </Text>
                <Text style={s.dim}>{fmt(r.total.spent)} of {fmt(r.total.limit)} spent</Text>
              </>
            ) : (
              <Text style={s.link}>Set a monthly budget ›</Text>
            )}
          </Pressable>
          {over.map((l) => <BudgetLine key={l.key} l={l} onPress={() => setTab('budget')} />)}

          <Label>Quick log</Label>
          <Wrap>
            {catsOf(st, 'expense').slice(0, 5).map((c) => <Chip key={c.id} label={c.name} onPress={() => setAdding({ categoryId: c.id })} />)}
          </Wrap>

          <Label>Balances</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {st.accounts.map((a) => {
              const b = balance(st, a.id);
              return (
                <Pressable key={a.id} onPress={() => setSub('accounts')} style={{ borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12, minWidth: 110 }}>
                  <Text style={s.dim}>{a.name}</Text>
                  <Text style={[s.rowValue, b < 0 && { color: C.red }]}>{fmt(b)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Label>Recent</Label>
          <EntryList month={thisMonth()} limit={5} />
          <Pressable onPress={() => setTab('entries')}><Text style={s.link}>See all entries ›</Text></Pressable>
        </ScrollView>
      )}
      {tab === 'entries' && (
        <>
          <Header title="Entries" />
          <MonthPick month={month} set={setMonth} />
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
      {tab === 'more' && (
        <>
          <Header title="More" />
          <Row title="Accounts" value="›" onPress={() => setSub('accounts')} />
          <Row title="Categories" value="›" onPress={() => setSub('categories')} />
        </>
      )}

      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: C.line, alignItems: 'center' }}>
        <TabBtn label="Home" on={tab === 'home'} onPress={() => setTab('home')} />
        <TabBtn label="Entries" on={tab === 'entries'} onPress={() => setTab('entries')} />
        <Pressable onPress={() => setAdding({})} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>
          <Text style={{ color: '#fff', fontSize: 34, lineHeight: 38 }}>+</Text>
        </Pressable>
        <TabBtn label="Budget" on={tab === 'budget'} onPress={() => setTab('budget')} />
        <TabBtn label="More" on={tab === 'more'} onPress={() => setTab('more')} />
      </View>
    </View>
  );
}

const TabBtn = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
    <Text style={{ fontSize: 13, color: on ? C.blue : C.dim, fontWeight: on ? '700' : '400' }}>{label}</Text>
  </Pressable>
);

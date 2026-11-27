// PROTOTYPE, throwaway. In-memory fake data for the Phase 1 screens prototype. Nothing is saved.
import { createContext, ReactNode, useContext, useRef, useState } from 'react';

export type Kind = 'Cash' | 'GCash' | 'Maya' | 'Bank';
export type Account = { id: string; name: string; kind: Kind; start: number };
export type Category = { id: string; name: string; type: 'expense' | 'income'; locked?: boolean };
type Base = { id: string; amount: number; date: string; note?: string; created: number };
export type Txn = Base & { kind: 'expense' | 'income'; accountId: string; categoryId: string };
export type Transfer = Base & { kind: 'transfer'; fromId: string; toId: string; fee?: number };
export type Entry = Txn | Transfer;
export type NewEntry = Omit<Txn, 'id' | 'created'> | Omit<Transfer, 'id' | 'created'>;
// shortcut: one budget for every month, real app keeps past months' amounts (per the budget ticket)
type Budget = { amount: number | null; limits: Record<string, number> };
type State = { accounts: Account[]; categories: Category[]; entries: Entry[]; budget: Budget; lastAccountId: string };

// ---- money (whole centavos) and dates (plain YYYY-MM-DD) ----
export const fmt = (c: number) => {
  const sign = c < 0 ? '-' : '';
  const a = Math.abs(c);
  const pesos = String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}₱${pesos}${a % 100 ? '.' + String(a % 100).padStart(2, '0') : ''}`;
};
export const parseAmount = (s: string): number | null => {
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const c = Math.round(parseFloat(s) * 100);
  return c > 0 && c <= 1_000_000_000 ? c : null;
};
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => ymd(new Date());
export const thisMonth = () => today().slice(0, 7);
export const shiftDay = (date: string, n: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return ymd(new Date(y, m - 1, d + n));
};
export const shiftMonth = (month: string, n: number) => {
  const [y, m] = month.split('-').map(Number);
  return ymd(new Date(y, m - 1 + n, 1)).slice(0, 7);
};
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (m: string) => `${MON[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
export const dayLabel = (date: string) =>
  date === today() ? 'Today' : date === shiftDay(today(), -1) ? 'Yesterday' : `${MON[+date.slice(5, 7) - 1]} ${+date.slice(8)}`;

// ---- seed data ----
export const FEES = 'e-Fees';
const EXP = ['Food', 'Transport', 'Load & Internet', 'Bills', 'Groceries', 'Padala', 'Shopping', 'Health', 'Fun', 'Other', 'Fees'];
const INC = ['Salary', 'Gift', 'Refund', 'Other'];

function seed(): State {
  const t = today();
  const cur = t.slice(0, 7);
  const last = shiftMonth(cur, -1);
  const d = (m: string, day: number) => `${m}-${pad(m === cur ? Math.min(day, +t.slice(8)) : day)}`;
  let n = 0;
  const tx = (kind: 'expense' | 'income', pesos: number, m: string, day: number, accountId: string, cat: string, note?: string): Entry => ({
    id: 's' + n, created: n++, kind, amount: pesos * 100, date: d(m, day), accountId, categoryId: (kind === 'expense' ? 'e-' : 'i-') + cat, note,
  });
  const tr = (pesos: number, m: string, day: number, fromId: string, toId: string, fee?: number, note?: string): Entry => ({
    id: 's' + n, created: n++, kind: 'transfer', amount: pesos * 100, fee: fee && fee * 100, date: d(m, day), fromId, toId, note,
  });
  return {
    accounts: [
      { id: 'cash', name: 'Wallet', kind: 'Cash', start: 120000 },
      { id: 'gcash', name: 'GCash', kind: 'GCash', start: 350000 },
      { id: 'maya', name: 'Maya', kind: 'Maya', start: 0 },
      { id: 'bpi', name: 'BPI Savings', kind: 'Bank', start: 2000000 },
    ],
    categories: [
      ...EXP.map((name): Category => ({ id: 'e-' + name, name, type: 'expense', locked: name === 'Fees' })),
      ...INC.map((name): Category => ({ id: 'i-' + name, name, type: 'income' })),
    ],
    entries: [
      // last month: over budget, to show the red state
      tx('income', 25000, last, 1, 'bpi', 'Salary'),
      tx('expense', 3000, last, 2, 'gcash', 'Padala', 'Kay Mama'),
      tx('expense', 2400, last, 5, 'gcash', 'Bills', 'Meralco'),
      tx('expense', 5600, last, 12, 'cash', 'Food'),
      tx('expense', 1800, last, 20, 'cash', 'Transport'),
      tx('expense', 2900, last, 25, 'gcash', 'Shopping', 'Shopee'),
      // this month: Food ₱150 under its ₱5,000 limit, so one ulam tips it over
      tx('income', 25000, cur, 1, 'bpi', 'Salary'),
      tr(3000, cur, 2, 'bpi', 'gcash', 15, 'Cash-in'),
      tx('expense', 3000, cur, 2, 'gcash', 'Padala', 'Kay Mama'),
      tr(2000, cur, 3, 'bpi', 'cash', undefined, 'ATM'),
      tx('expense', 2500, cur, 4, 'gcash', 'Bills', 'Meralco'),
      tx('expense', 1200, cur, 6, 'cash', 'Food'),
      tx('expense', 299, cur, 7, 'gcash', 'Load & Internet', 'GoSURF'),
      tx('expense', 640, cur, 9, 'cash', 'Transport'),
      tx('expense', 850, cur, 12, 'cash', 'Food', 'Jollibee'),
      tx('expense', 1500, cur, 18, 'gcash', 'Food', 'Groceries sa palengke'),
      tx('expense', 600, cur, 22, 'cash', 'Transport', 'Grab'),
      tx('expense', 1300, cur, 26, 'cash', 'Food'),
    ],
    budget: { amount: 1500000, limits: { 'e-Food': 500000, 'e-Transport': 200000 } },
    lastAccountId: 'cash',
  };
}

// ---- calculations ----
export function balance(st: State, id: string) {
  let b = st.accounts.find((a) => a.id === id)!.start;
  for (const e of st.entries) {
    if (e.kind === 'transfer') {
      if (e.fromId === id) b -= e.amount + (e.fee ?? 0);
      if (e.toId === id) b += e.amount;
    } else if (e.accountId === id) b += e.kind === 'income' ? e.amount : -e.amount;
  }
  return b;
}

export type Line = { key: string; name: string; spent: number; limit: number };
export function budgetLines(st: State, month: string): { total: Line; lines: Line[]; rest: Line } | null {
  const { amount, limits } = st.budget;
  if (amount === null) return null;
  const by: Record<string, number> = {};
  for (const e of st.entries) {
    if (e.date.slice(0, 7) !== month) continue;
    if (e.kind === 'expense') by[e.categoryId] = (by[e.categoryId] ?? 0) + e.amount;
    if (e.kind === 'transfer' && e.fee) by[FEES] = (by[FEES] ?? 0) + e.fee;
  }
  const sum = (xs: number[]) => xs.reduce((a, v) => a + v, 0);
  const lines = st.categories
    .filter((c) => limits[c.id] !== undefined)
    .map((c) => ({ key: c.id, name: c.name, spent: by[c.id] ?? 0, limit: limits[c.id] }));
  const total = sum(Object.values(by));
  return {
    total: { key: 'month', name: monthLabel(month), spent: total, limit: amount },
    lines,
    rest: { key: 'rest', name: 'Everything else', spent: total - sum(lines.map((l) => l.spent)), limit: amount - sum(lines.map((l) => l.limit)) },
  };
}

function overLines(st: State, month: string) {
  const r = budgetLines(st, month);
  return r ? [r.total, ...r.lines, r.rest].filter((l) => l.spent > l.limit) : [];
}

// ---- store ----
type Store = State & {
  add: (e: NewEntry) => void;
  setBudget: (amount: number | null) => void;
  msg: string;
  taps: number;
  lastTaps: number | null;
  tap: () => void;
  resetTaps: () => void;
};
const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState(seed);
  const [msg, setMsg] = useState('');
  const [taps, setTaps] = useState(0);
  const [lastTaps, setLastTaps] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const add = (e: NewEntry) => {
    const entry = { ...e, id: 'n' + Date.now(), created: Date.now() } as Entry;
    const next: State = {
      ...st,
      entries: [...st.entries, entry],
      lastAccountId: entry.kind === 'transfer' ? entry.fromId : entry.accountId,
    };
    const month = entry.date.slice(0, 7);
    const before = new Set(overLines(st, month).map((l) => l.key));
    const fresh = overLines(next, month).filter((l) => !before.has(l.key));
    setSt(next);
    setMsg(fresh.length ? fresh.map((l) => `${l.name} is now ${fmt(l.spent - l.limit)} over`).join(' · ') : `Saved ${fmt(entry.amount)}`);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 4000);
    setLastTaps(taps);
    setTaps(0);
  };
  const setBudget = (amount: number | null) => setSt({ ...st, budget: { amount, limits: amount === null ? {} : st.budget.limits } });

  return (
    <Ctx.Provider value={{ ...st, add, setBudget, msg, taps, lastTaps, tap: () => setTaps((t) => t + 1), resetTaps: () => setTaps(0) }}>
      {children}
    </Ctx.Provider>
  );
}

export const catsOf = (s: Store, type: 'expense' | 'income') => s.categories.filter((c) => c.type === type);
export const catName = (s: Store, id: string) => s.categories.find((c) => c.id === id)?.name ?? '?';
export const accName = (s: Store, id: string) => s.accounts.find((a) => a.id === id)?.name ?? '?';

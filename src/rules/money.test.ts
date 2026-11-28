import { formatAmount, parseAmount } from './money';

describe('parseAmount', () => {
  test('reads whole pesos as centavos', () => {
    expect(parseAmount('40')).toEqual({ ok: true, centavos: 4000 });
  });

  test('reads centavos with one or two digits', () => {
    expect(parseAmount('40.50')).toEqual({ ok: true, centavos: 4050 });
    expect(parseAmount('40.5')).toEqual({ ok: true, centavos: 4050 });
    expect(parseAmount('1.15')).toEqual({ ok: true, centavos: 115 });
  });
});

describe('parseAmount refuses', () => {
  test('an empty amount', () => {
    expect(parseAmount('')).toEqual({ ok: false, error: 'Enter an amount.' });
    expect(parseAmount('   ')).toEqual({ ok: false, error: 'Enter an amount.' });
  });

  test('text that is not an amount, including negatives and extra decimals', () => {
    for (const text of ['abc', '40.505', '-40', '4.0.0', '.']) {
      expect(parseAmount(text)).toEqual({ ok: false, error: 'Enter an amount like 40 or 40.50.' });
    }
  });
});

describe('parseAmount limits', () => {
  test('refuses zero', () => {
    expect(parseAmount('0')).toEqual({ ok: false, error: 'Enter an amount more than ₱0.' });
    expect(parseAmount('0.00')).toEqual({ ok: false, error: 'Enter an amount more than ₱0.' });
  });

  test('allows exactly ₱10M and refuses anything above it', () => {
    expect(parseAmount('10000000')).toEqual({ ok: true, centavos: 1_000_000_000 });
    expect(parseAmount('10000000.01')).toEqual({ ok: false, error: 'The most you can enter is ₱10,000,000.' });
    expect(parseAmount('99999999999999999999')).toEqual({ ok: false, error: 'The most you can enter is ₱10,000,000.' });
  });

  test('allows ₱0 when zero is allowed, as for a Starting balance', () => {
    expect(parseAmount('0', { allowZero: true })).toEqual({ ok: true, centavos: 0 });
  });
});

describe('parseAmount thousands separators', () => {
  test('accepts commas between groups of three digits', () => {
    expect(parseAmount('1,250')).toEqual({ ok: true, centavos: 125_000 });
    expect(parseAmount('1,250,000.50')).toEqual({ ok: true, centavos: 125_000_050 });
  });

  test('refuses a comma in the wrong place, which may have meant a decimal point', () => {
    expect(parseAmount('12,50')).toEqual({ ok: false, error: 'Enter an amount like 40 or 40.50.' });
  });
});

describe('formatAmount', () => {
  test('shows whole pesos with thousands separators and no centavos', () => {
    expect(formatAmount(4000)).toBe('₱40');
    expect(formatAmount(125_000)).toBe('₱1,250');
    expect(formatAmount(1_000_000_000)).toBe('₱10,000,000');
    expect(formatAmount(0)).toBe('₱0');
  });
});

describe('formatAmount centavos and negatives', () => {
  test('shows two centavo digits when there are centavos', () => {
    expect(formatAmount(4050)).toBe('₱40.50');
    expect(formatAmount(5)).toBe('₱0.05');
    expect(formatAmount(125_099)).toBe('₱1,250.99');
  });
});

describe('formatAmount negatives', () => {
  test('puts a minus sign before the peso sign', () => {
    expect(formatAmount(-4000)).toBe('−₱40');
    expect(formatAmount(-4050)).toBe('−₱40.50');
    expect(formatAmount(-125_000)).toBe('−₱1,250');
  });
});

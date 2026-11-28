export type ParseResult = { ok: true; centavos: number } | { ok: false; error: string };

export const MAX_CENTAVOS = 1_000_000_000; // ₱10,000,000

/** Reads typed text as a whole number of centavos (₱40.50 → 4050). Pass allowZero for a Starting balance. */
export function parseAmount(text: string, { allowZero = false } = {}): ParseResult {
  const trimmed = text.trim();
  if (trimmed === '') return { ok: false, error: 'Enter an amount.' };
  // Pesos are plain digits or correctly grouped thousands (1,250); up to two centavo digits.
  const match = /^(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d{0,2}))?$/.exec(trimmed);
  if (!match) return { ok: false, error: 'Enter an amount like 40 or 40.50.' };
  // Read pesos and centavos as separate whole numbers: floating-point maths turns 1.15 × 100 into 114.999…
  const [, pesos, cents = ''] = match;
  const centavos = Number(pesos.replaceAll(',', '')) * 100 + Number(cents.padEnd(2, '0'));
  if (centavos === 0 && !allowZero) return { ok: false, error: 'Enter an amount more than ₱0.' };
  if (centavos > MAX_CENTAVOS) return { ok: false, error: 'The most you can enter is ₱10,000,000.' };
  return { ok: true, centavos };
}

/** Shows centavos as pesos: ₱1,250 or ₱40.50 (centavos only when not zero). */
export function formatAmount(centavos: number): string {
  const sign = centavos < 0 ? '−' : '';
  const abs = Math.abs(centavos);
  // Grouped by hand, not Intl: the phone's JavaScript engine and Node (tests) may format differently.
  const pesos = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+$)/g, ',');
  const cents = abs % 100;
  return `${sign}₱${pesos}${cents === 0 ? '' : '.' + String(cents).padStart(2, '0')}`;
}

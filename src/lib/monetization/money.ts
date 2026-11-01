// Money is always an integer amount in minor units (cents) plus an ISO 4217 code.
// Never pass floats: the formatter rejects them so rounding bugs cannot reach the UI.
export const SUPPORTED_CURRENCIES = ['usd'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
export type Money = { amount: number; currency: Currency };

export function isMinorUnits(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0;
}

export function money(amount: number, currency: Currency = 'usd'): Money {
  if (!isMinorUnits(amount)) throw new Error('Money must be a whole, non-negative number of cents.');
  if (!SUPPORTED_CURRENCIES.includes(currency)) throw new Error(`Unsupported currency: ${currency}`);
  return { amount, currency };
}

export function formatMoney(value: Money, opts: { compact?: boolean } = {}): string {
  const checked = money(value.amount, value.currency);
  const whole = checked.amount % 100 === 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: checked.currency.toUpperCase(),
    minimumFractionDigits: opts.compact && whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(checked.amount / 100);
}

export function formatInterval(interval: 'month' | 'year' | 'once' | 'days', days?: number): string {
  if (interval === 'once') return 'one-time';
  if (interval === 'days') return `${days ?? 0} consecutive days`;
  return `per ${interval}`;
}

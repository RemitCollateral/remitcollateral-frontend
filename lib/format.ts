/** Display formatting shared across the dashboard. */

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatLocal(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown ISO code — fall back to a plain number with the code appended.
    return `${new Intl.NumberFormat('en-US').format(amount)} ${currency}`;
  }
}

/** 1.35 -> "135%" */
export function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 1000) / 10}%`;
}

/** 0.82 -> "82" on a 0–100 scale. */
export function formatScore(score: number): string {
  return Math.round(score * 100).toString();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** "in 12 days", "3 days ago", "today". */
export function formatRelativeDays(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);
  const msPerDay = 86_400_000;
  const days = Math.round(
    (Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      msPerDay,
  );
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

export function truncateWallet(address: string, lead = 6, tail = 4): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

/** Masks all but the last four digits of a beneficiary phone number. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return phone;
  return `${phone.slice(0, phone.length - 4).replace(/\d/g, '•')}${phone.slice(-4)}`;
}

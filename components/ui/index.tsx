import type { ReactNode } from 'react';
import Link from 'next/link';

/** Joins conditional class names. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        'rounded-xl border border-surface-border bg-surface p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) {
  const toneClass = {
    neutral: 'text-ink',
    good: 'text-good',
    warn: 'text-warn',
    bad: 'text-bad',
  }[tone];

  return (
    <div className="rounded-xl border border-surface-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={cx('mt-2 font-mono text-2xl font-semibold tabular-nums', toneClass)}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

const badgeTones = {
  neutral: 'bg-surface-sunken text-ink-muted ring-surface-border',
  brand: 'bg-brand-soft text-brand ring-brand/20',
  good: 'bg-good-soft text-good ring-good/20',
  warn: 'bg-warn-soft text-warn ring-warn/20',
  bad: 'bg-bad-soft text-bad ring-bad/20',
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

const buttonVariants = {
  primary: 'bg-brand text-white hover:bg-brand/90 disabled:bg-brand/40',
  secondary:
    'border border-surface-border bg-surface text-ink hover:bg-surface-sunken disabled:text-ink-muted',
  danger: 'bg-bad text-white hover:bg-bad/90 disabled:bg-bad/40',
} as const;

type ButtonVariant = keyof typeof buttonVariants;

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed';

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={cx(buttonBase, buttonVariants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link href={href} className={cx(buttonBase, buttonVariants[variant], className)}>
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>}
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs text-bad">{error}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/20';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-surface-border bg-surface-sunken px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-lg bg-surface-sunken', className)} />;
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-medium underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}

/** Horizontal progress bar, `value` given as a 0–1 ratio. */
export function ProgressBar({
  value,
  tone = 'brand',
}: {
  value: number;
  tone?: 'brand' | 'good' | 'warn' | 'bad';
}) {
  const fill = {
    brand: 'bg-brand',
    good: 'bg-good',
    warn: 'bg-warn',
    bad: 'bg-bad',
  }[tone];

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
      <div
        className={cx('h-full rounded-full transition-all', fill)}
        style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
      />
    </div>
  );
}

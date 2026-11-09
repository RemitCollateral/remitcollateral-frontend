import React, { type ReactNode } from 'react';
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
        'rounded-2xl border border-surface-border bg-surface p-5 shadow-card sm:p-6',
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
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
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
  const accentClass = {
    neutral: 'bg-surface-border',
    good: 'bg-good/60',
    warn: 'bg-gold',
    bad: 'bg-bad/60',
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface p-5 shadow-card">
      <span
        aria-hidden="true"
        className={cx('absolute inset-x-0 top-0 h-0.5', accentClass)}
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</p>
      <p className={cx('mt-2.5 font-mono text-2xl font-semibold tabular-nums tracking-tight', toneClass)}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

const badgeTones = {
  neutral: 'bg-surface-sunken text-ink-muted ring-surface-border',
  gold: 'bg-gold-soft text-gold ring-gold/25',
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
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

const buttonVariants = {
  primary:
    'bg-brand text-white shadow-sm hover:bg-brand-strong disabled:bg-brand/40 disabled:shadow-none',
  gold: 'bg-gold-bright text-forest shadow-sm hover:bg-[#ebc26f] disabled:opacity-50',
  secondary:
    'border border-surface-border bg-surface text-ink shadow-sm hover:border-ink/25 hover:bg-surface-sunken disabled:text-ink-muted',
  danger: 'bg-bad text-white shadow-sm hover:bg-bad/90 disabled:bg-bad/40',
} as const;

type ButtonVariant = keyof typeof buttonVariants;

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:translate-y-px disabled:cursor-not-allowed';

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

/** Secure External Link component enforcing rel="noopener noreferrer" and target="_blank" */
export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const isSecure = href.startsWith('https://') || href.startsWith('http://');
  const safeHref = isSecure ? href : '#';

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cx('inline-flex items-center gap-1 hover:underline', className)}
    >
      {children}
      <span className="text-xs" aria-hidden="true">
        ↗
      </span>
    </a>
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
  'w-full rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-ink-faint hover:border-ink/25 focus:border-brand focus:ring-2 focus:ring-brand/20';

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
    <div className="rounded-2xl border border-dashed border-ink/20 bg-surface/60 px-6 py-14 text-center">
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-2xl bg-surface-subtle', className)} />;
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
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
    brand: 'bg-gradient-to-r from-brand to-[#16906f]',
    good: 'bg-good',
    warn: 'bg-warn',
    bad: 'bg-bad',
  }[tone];

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
      <div
        className={cx('h-full rounded-full transition-all', fill)}
        style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
      />
    </div>
  );
}

/** Accessible Modal Dialog with keyboard trap, Escape handling, and ARIA attributes */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          last.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest/60 p-4 backdrop-blur-sm"
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className="w-full max-w-lg animate-fade-up rounded-2xl border border-surface-border bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="modal-title" className="font-display text-xl font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}


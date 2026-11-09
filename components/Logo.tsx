import { cx } from '@/components/ui';

/** The RemitCollateral mark: a gold "R" on forest green. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'grid shrink-0 place-items-center rounded-lg bg-forest-raised font-display font-bold text-gold-bright ring-1 ring-gold-bright/30',
        className ?? 'h-8 w-8 text-base',
      )}
    >
      R
    </span>
  );
}

export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span
        className={cx(
          'font-display text-lg font-semibold tracking-tight',
          tone === 'light' ? 'text-white' : 'text-ink',
        )}
      >
        Remit<span className="text-gold-bright">Collateral</span>
      </span>
    </span>
  );
}

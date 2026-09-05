import { Badge, ProgressBar } from '@/components/ui';
import { formatRatio, formatScore } from '@/lib/format';

/** A beneficiary's composite score alongside the LTV it currently earns. */
export function ReputationMeter({
  score,
  ltv,
  compact = false,
}: {
  score: number;
  ltv?: number;
  compact?: boolean;
}) {
  const tone = score >= 0.7 ? 'good' : score >= 0.4 ? 'warn' : 'bad';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16">
          <ProgressBar value={score} tone={tone} />
        </div>
        <span className="font-mono text-xs tabular-nums text-ink-muted">
          {formatScore(score)}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-3xl font-semibold tabular-nums text-ink">
          {formatScore(score)}
          <span className="ml-1 text-base font-normal text-ink-muted">/ 100</span>
        </span>
        {ltv !== undefined && (
          <Badge tone={tone}>Qualifies for {formatRatio(ltv)} LTV</Badge>
        )}
      </div>
      <div className="mt-3">
        <ProgressBar value={score} tone={tone} />
      </div>
    </div>
  );
}

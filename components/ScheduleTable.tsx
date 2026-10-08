import { Badge, type BadgeTone } from '@/components/ui';
import { formatDate, formatLocal, formatRelativeDays } from '@/lib/format';
import type { ScheduleEntry } from '@/lib/types';

const statusTone: Record<ScheduleEntry['status'], BadgeTone> = {
  paid: 'good',
  due: 'brand',
  upcoming: 'neutral',
  overdue: 'bad',
};

const statusLabel: Record<ScheduleEntry['status'], string> = {
  paid: 'Paid',
  due: 'Due next',
  upcoming: 'Upcoming',
  overdue: 'Missed',
};

export function ScheduleTable({
  schedule,
  currency,
}: {
  schedule: ScheduleEntry[];
  currency: string;
}) {
  return (
    <div className="space-y-6">
      {/* Visual Timeline Stepper */}
      <div className="relative border-b border-surface-border pb-6 pt-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {schedule.map((entry, idx) => {
            const isPaid = entry.status === 'paid';
            const isDue = entry.status === 'due';
            const isOverdue = entry.status === 'overdue';

            return (
              <div
                key={entry.installment}
                className="flex flex-1 min-w-[5.5rem] flex-col items-center text-center"
              >
                <div className="flex w-full items-center">
                  <div
                    className={`h-0.5 flex-1 ${
                      idx === 0
                        ? 'invisible'
                        : isPaid
                        ? 'bg-good'
                        : isOverdue
                        ? 'bg-bad/50'
                        : 'bg-surface-border'
                    }`}
                  />
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isPaid
                        ? 'bg-good text-white'
                        : isOverdue
                        ? 'bg-bad text-white animate-pulse'
                        : isDue
                        ? 'bg-brand text-white ring-2 ring-brand/30'
                        : 'border border-surface-border bg-surface-subtle text-ink-muted'
                    }`}
                  >
                    {isPaid ? '✓' : entry.installment}
                  </div>
                  <div
                    className={`h-0.5 flex-1 ${
                      idx === schedule.length - 1
                        ? 'invisible'
                        : isPaid && schedule[idx + 1]?.status === 'paid'
                        ? 'bg-good'
                        : 'bg-surface-border'
                    }`}
                  />
                </div>
                <span className="mt-1.5 text-[11px] font-medium text-ink">
                  #{entry.installment}
                </span>
                <span className="text-[10px] text-ink-muted">
                  {formatLocal(entry.amount_local, currency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="pb-2 pr-4 font-medium">#</th>
              <th className="pb-2 pr-4 font-medium">Amount</th>
              <th className="pb-2 pr-4 font-medium">Due Date</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {schedule.map((entry) => {
              const isOverdue = entry.status === 'overdue';
              return (
                <tr
                  key={entry.installment}
                  className={isOverdue ? 'bg-bad-soft/30' : undefined}
                >
                  <td className="py-3 pr-4 font-mono text-ink-muted">{entry.installment}</td>
                  <td className="py-3 pr-4 font-mono tabular-nums text-ink">
                    {formatLocal(entry.amount_local, currency)}
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">
                    {formatDate(entry.due_at)}
                    {!entry.paid_at && (
                      <span
                        className={`ml-2 text-xs font-medium ${
                          isOverdue ? 'text-bad' : 'text-ink-muted'
                        }`}
                      >
                        ({formatRelativeDays(entry.due_at)})
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={statusTone[entry.status]}>
                      {statusLabel[entry.status]}
                    </Badge>
                    {entry.paid_at && (
                      <span className="ml-2 text-xs text-ink-muted">
                        paid on {formatDate(entry.paid_at)}
                      </span>
                    )}
                    {isOverdue && (
                      <span className="ml-2 text-xs font-semibold text-bad">
                        Action required
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

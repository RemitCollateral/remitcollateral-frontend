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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="pb-2 pr-4 font-medium">#</th>
            <th className="pb-2 pr-4 font-medium">Amount</th>
            <th className="pb-2 pr-4 font-medium">Due</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {schedule.map((entry) => (
            <tr key={entry.installment}>
              <td className="py-3 pr-4 font-mono text-ink-muted">{entry.installment}</td>
              <td className="py-3 pr-4 font-mono tabular-nums text-ink">
                {formatLocal(entry.amount_local, currency)}
              </td>
              <td className="py-3 pr-4 text-ink-muted">
                {formatDate(entry.due_at)}
                {!entry.paid_at && (
                  <span className="ml-2 text-xs">({formatRelativeDays(entry.due_at)})</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <Badge tone={statusTone[entry.status]}>{statusLabel[entry.status]}</Badge>
                {entry.paid_at && (
                  <span className="ml-2 text-xs text-ink-muted">
                    {formatDate(entry.paid_at)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

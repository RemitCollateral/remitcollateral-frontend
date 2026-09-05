import { Badge, type BadgeTone } from '@/components/ui';
import type { LoanStatus } from '@/lib/types';

const presentation: Record<LoanStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'brand' },
  grace: { label: 'In grace period', tone: 'warn' },
  repaid: { label: 'Repaid', tone: 'good' },
  defaulted: { label: 'Defaulted', tone: 'bad' },
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const { label, tone } = presentation[status];
  return <Badge tone={tone}>{label}</Badge>;
}

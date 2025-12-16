import { DevisStatus } from '@/types/devis';

const statusConfig: Record<DevisStatus, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'status-badge status-draft' },
  pending: { label: 'En attente', className: 'status-badge status-pending' },
  validated: { label: 'Validé', className: 'status-badge status-validated' },
  rejected: { label: 'Refusé', className: 'status-badge status-rejected' },
};

interface StatusBadgeProps {
  status: DevisStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <span className={config.className}>{config.label}</span>;
}

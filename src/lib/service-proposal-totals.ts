import type { ServiceLine } from '@/hooks/useServiceProposals';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Contribution d'une ligne au total HT sur la durée du contrat.
 * - mode 'total'   : montant saisi = total sur la durée
 * - mode 'mensuel' : montant saisi = par mois → total = montant × durée
 */
export function serviceLineTotalHt(line: ServiceLine, durationMonths: number | null | undefined): number {
  const mode = line.show_price_mode ?? 'total';
  const amount = Number(line.amount_ht) || 0;
  if (mode === 'mensuel') {
    const d = durationMonths && durationMonths > 0 ? durationMonths : 0;
    return round2(amount * d);
  }
  return round2(amount);
}

export function computeTotalServicesHt(lines: ServiceLine[], durationMonths: number | null | undefined): number {
  return round2(lines.reduce((sum, l) => sum + serviceLineTotalHt(l, durationMonths), 0));
}

/**
 * Loyer mensuel = total services HT / durée du contrat.
 * Loyer trimestriel = loyer mensuel × 3.
 * Retourne null si la durée est manquante ou nulle.
 */
export function computePeriodicRent(
  totalServicesHt: number,
  durationMonths: number | null | undefined,
  frequency: 'mensuel' | 'trimestriel' | null | undefined,
): number | null {
  if (!durationMonths || durationMonths <= 0) return null;
  if (frequency !== 'mensuel' && frequency !== 'trimestriel') return null;
  const monthly = totalServicesHt / durationMonths;
  return frequency === 'mensuel' ? round2(monthly) : round2(monthly * 3);
}

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
 * Loyer périodique = total HT services × facteur périodicité.
 * - mensuel     : total × 1
 * - trimestriel : total × 3
 * La durée du contrat est déjà intégrée dans le total (lignes en /mois × durée).
 */
export function computePeriodicRent(
  totalServicesHt: number,
  _durationMonths: number | null | undefined,
  frequency: 'mensuel' | 'trimestriel' | null | undefined,
): number | null {
  if (frequency !== 'mensuel' && frequency !== 'trimestriel') return null;
  const factor = frequency === 'mensuel' ? 1 : 3;
  return round2(totalServicesHt * factor);
}


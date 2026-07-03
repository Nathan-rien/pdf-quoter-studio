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
 * Loyer périodique = total HT services / (durée / facteur périodicité).
 * - mensuel     : total / durée
 * - trimestriel : total / (durée / 3)   (= mensuel × 3)
 * Retourne null si la durée ou la fréquence sont manquantes/invalides.
 */
export function computePeriodicRent(
  totalServicesHt: number,
  durationMonths: number | null | undefined,
  frequency: 'mensuel' | 'trimestriel' | null | undefined,
): number | null {
  if (frequency !== 'mensuel' && frequency !== 'trimestriel') return null;
  if (!durationMonths || durationMonths <= 0) return null;
  const monthsPerPeriod = frequency === 'trimestriel' ? 3 : 1;
  return round2(totalServicesHt / (durationMonths / monthsPerPeriod));
}

export function periodicRentLabel(
  frequency: 'mensuel' | 'trimestriel' | null | undefined,
): '€ / mois HT' | '€ / trimestre HT' | null {
  if (frequency === 'mensuel') return '€ / mois HT';
  if (frequency === 'trimestriel') return '€ / trimestre HT';
  return null;
}

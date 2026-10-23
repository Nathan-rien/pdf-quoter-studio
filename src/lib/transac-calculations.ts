// Calculs purs du devis transactionnel (vente simple + option location).
// Le coefficient et les frais de dossier passent par le résolveur partagé de la base taux.
import { getFraisDossierIn, lookupBaseTauxRowIn, type BaseTauxRow, type FinancialPartner } from '@/lib/partners';
import { calculateLoyerMensuel, calculateLoyerTrimestriel, calculateSommeLoyers } from '@/lib/rental-calculations';

export const TVA_RATE = 0.2;
const r2 = (x: number) => Math.round(x * 100) / 100;

export type TransacLineType = 'product' | 'delivery';

export interface TransacLine {
  id: string;
  lineType: TransacLineType;
  reference: string;
  designation: string;
  ecoParticipation: number | null;
  unitPriceHt: number;
  quantity: number;
  // Internes — jamais imprimés
  purchasePrice: number | null;
  supplier: string;
  supplierRef: string;
  /** Taux de marque en % (ex. 25 pour 25 %). */
  markupRate: number | null;
}

/** PU suggéré = achat / (1 − taux de marque). Null si taux ≥ 100 % ou données manquantes. */
export function suggestedUnitPrice(purchase: number | null, markupRatePct: number | null): number | null {
  if (purchase === null || markupRatePct === null || !Number.isFinite(purchase) || !Number.isFinite(markupRatePct)) return null;
  if (markupRatePct >= 100) return null;
  return r2(purchase / (1 - markupRatePct / 100));
}

/** Taux de marque réel (%) = (PU − achat) / PU, arrondi au centième de point. */
export function realMarkupRate(unitPrice: number, purchase: number | null): number | null {
  if (purchase === null || !unitPrice) return null;
  return r2(((unitPrice - purchase) / unitPrice) * 100);
}

export const lineTotalHt = (l: Pick<TransacLine, 'unitPriceHt' | 'quantity'>) => r2((l.unitPriceHt || 0) * (l.quantity || 0));

export function lineMargin(l: Pick<TransacLine, 'unitPriceHt' | 'quantity' | 'purchasePrice'>): number | null {
  if (l.purchasePrice === null) return null;
  return r2((l.unitPriceHt - l.purchasePrice) * (l.quantity || 0));
}

export interface TransacTotals {
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  totalPurchase: number;
  margin: number;
  marginPercent: number | null;
  negativeLineIds: string[];
  hasNegativeMargin: boolean;
}

export function computeTransacTotals(lines: readonly TransacLine[]): TransacTotals {
  const totalHt = r2(lines.reduce((s, l) => s + lineTotalHt(l), 0));
  const totalTva = r2(totalHt * TVA_RATE);
  const totalTtc = r2(totalHt + totalTva);
  const totalPurchase = r2(lines.reduce((s, l) => s + (l.purchasePrice ?? 0) * (l.quantity || 0), 0));
  const margin = r2(lines.reduce((s, l) => s + (lineMargin(l) ?? 0), 0));
  const negativeLineIds = lines.filter((l) => (lineMargin(l) ?? 0) < 0).map((l) => l.id);
  return {
    totalHt, totalTva, totalTtc, totalPurchase, margin,
    marginPercent: totalHt ? r2((margin / totalHt) * 100) : null,
    negativeLineIds,
    hasNegativeMargin: negativeLineIds.length > 0 || margin < 0,
  };
}

// --- Option location ---------------------------------------------------------

export type Periodicity = 'mensuel' | 'trimestriel';

export interface TransacRentalInput {
  amount: number;
  durationMonths: number | null;
  /** null = meilleur coefficient parmi les partenaires actifs. */
  partnerName: string | null;
  periodicity: Periodicity;
}

export type TransacRentalResult =
  | { status: 'ok'; partnerName: string; coefficient: number; monthlyRent: number; periodRent: number;
      periods: number; totalCost: number; fraisDossier: number | null; durationMonths: number; periodicity: Periodicity }
  | { status: 'out_of_range' | 'incomplete'; message: string };

/** Durées disponibles (lignes actives des partenaires actifs), triées. */
export function availableDurations(partners: readonly FinancialPartner[], rows: readonly BaseTauxRow[]): number[] {
  const active = new Set(partners.filter((p) => p.isActive).map((p) => p.id));
  return [...new Set(rows.filter((r) => r.isActive && active.has(r.partnerId)).map((r) => r.dureeMois))].sort((a, b) => a - b);
}

export function computeTransacRental(
  partners: readonly FinancialPartner[],
  rows: readonly BaseTauxRow[],
  input: TransacRentalInput,
): TransacRentalResult {
  const { amount, durationMonths, periodicity } = input;
  if (!amount || amount <= 0 || !durationMonths) {
    return { status: 'incomplete', message: 'Renseignez des lignes et une durée pour calculer le loyer.' };
  }
  const candidates = input.partnerName
    ? partners.filter((p) => p.isActive && p.name === input.partnerName)
    : partners.filter((p) => p.isActive);
  let best: { partner: FinancialPartner; row: BaseTauxRow } | null = null;
  for (const partner of candidates) {
    const row = lookupBaseTauxRowIn(partners, rows, partner.name, amount, durationMonths);
    if (!row || !row.isActive) continue;
    if (!best || row.taux < best.row.taux) best = { partner, row };
  }
  if (!best) {
    return {
      status: 'out_of_range',
      message: `Aucune tranche de la base taux ne couvre ${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € HT sur ${durationMonths} mois${input.partnerName ? ` pour ${input.partnerName}` : ''} : pas de loyer proposé.`,
    };
  }
  const monthlyRent = calculateLoyerMensuel(amount, best.row.taux, null) as number;
  const periodRent = periodicity === 'trimestriel' ? (calculateLoyerTrimestriel(monthlyRent) as number) : monthlyRent;
  const periods = periodicity === 'trimestriel' ? Math.ceil(durationMonths / 3) : durationMonths;
  return {
    status: 'ok',
    partnerName: best.partner.name,
    coefficient: best.row.taux,
    monthlyRent,
    periodRent,
    periods,
    totalCost: calculateSommeLoyers(periodRent, periods) as number,
    fraisDossier: getFraisDossierIn(partners, best.partner.name, rows, amount, durationMonths),
    durationMonths,
    periodicity,
  };
}

export function transacPdfFileName(brandLabel: string, quoteNumber: string, client: string): string {
  const clean = (s: string) => s.trim().replace(/[^\p{L}\p{N}-]+/gu, '_').replace(/^_+|_+$/g, '');
  return `Devis_Transac_${clean(brandLabel)}_${clean(quoteNumber)}_${clean(client) || 'Client'}.pdf`;
}

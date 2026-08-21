/**
 * Utilitaires partagés pour le formatage des prix des options
 * Utilisés par RentalProposalPreview et RentalProposalExport
 */

export interface OptionPriceInput {
  price: number | null;
  priceTotal: number | null;
  showPriceMode: 'mensuel' | 'total';
  pricingScope: 'par_machine' | 'pour_le_parc';
}

const formatNum = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

/**
 * Retourne le libellé prix complet d'une option, avec fallback.
 * - mode mensuel → "xx,xx € / mois" (suffixe "/parc" uniquement si portée parc)
 * - mode total   → "xx,xx €"
 * - Si la valeur du mode choisi est vide, utilise l'autre valeur disponible.
 * - Retourne null si aucune valeur disponible.
 */
export function getOptionPriceLabel(opt: OptionPriceInput): string | null {
  const mode = opt.showPriceMode ?? 'mensuel';
  const scope = opt.pricingScope ?? 'par_machine';
  const scopeSuffix = scope === 'pour_le_parc' ? ' /parc' : '';

  const hasMensuel = opt.price !== null && opt.price !== undefined;
  const hasTotal = opt.priceTotal !== null && opt.priceTotal !== undefined;

  if (mode === 'mensuel') {
    if (hasMensuel) return `${formatNum(opt.price!)} € / mois${scopeSuffix}`;
    if (hasTotal) return `${formatNum(opt.priceTotal!)} €${scopeSuffix}`;
    return null;
  }

  // mode === 'total'
  if (hasTotal) return `${formatNum(opt.priceTotal!)} €${scopeSuffix}`;
  if (hasMensuel) return `${formatNum(opt.price!)} € / mois${scopeSuffix}`;
  return null;
}

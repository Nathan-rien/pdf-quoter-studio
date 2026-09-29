// Fonctions pures autour des partenaires financiers et de la base taux.
// Aucune dépendance à React ni à Supabase : testables unitairement.

export const CONDITIONS_FIN_CONTRAT = ['Reprise obligatoire loueur', 'Cession client possible'] as const;
export type ConditionFinContrat = (typeof CONDITIONS_FIN_CONTRAT)[number];

export interface FinancialPartner {
  id: string;
  name: string;
  fraisDossier: number | null;
  conditionFinContrat: string | null;
  aliases: string[];
  isActive: boolean;
  sortOrder: number | null;
}

export interface BaseTauxRow {
  id: string;
  partnerId: string;
  montantMin: number;
  montantMax: number;
  dureeMois: number;
  taux: number;
  isActive: boolean;
}

/** Clé de comparaison : sans espaces de début/fin, casse ignorée, espaces internes réduits. */
export function normalizePartnerName(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Résout un nom saisi (nom officiel ou alias) vers un partenaire, actif ou non. */
export function resolvePartner(
  partners: readonly FinancialPartner[],
  name: string | null | undefined,
): FinancialPartner | null {
  const key = normalizePartnerName(name);
  if (!key) return null;
  const byName = partners.find((p) => normalizePartnerName(p.name) === key);
  if (byName) return byName;
  return partners.find((p) => p.aliases.some((a) => normalizePartnerName(a) === key)) ?? null;
}

/** Nom d'affichage canonique (regroupe les variantes d'alias) ; conserve la saisie si inconnu. */
export function canonicalPartnerName(
  partners: readonly FinancialPartner[],
  name: string | null | undefined,
): string {
  const partner = resolvePartner(partners, name);
  return partner ? partner.name : (name ?? '').trim();
}

export function getFraisDossierIn(
  partners: readonly FinancialPartner[],
  name: string | null | undefined,
): number | null {
  return resolvePartner(partners, name)?.fraisDossier ?? null;
}

export function getConditionFinContratIn(
  partners: readonly FinancialPartner[],
  name: string | null | undefined,
): string | null {
  return resolvePartner(partners, name)?.conditionFinContrat ?? null;
}

/**
 * Coefficient de la tranche (montant, durée) d'un partenaire.
 * Inclut les partenaires inactifs : un dossier existant garde son coefficient.
 * Une ligne active est préférée à une ligne inactive couvrant la même tranche.
 */
export function lookupCoefficientIn(
  partners: readonly FinancialPartner[],
  rows: readonly BaseTauxRow[],
  name: string | null | undefined,
  montant: number | null,
  dureeMois: number | null,
): number | null {
  if (montant === null || dureeMois === null) return null;
  const partner = resolvePartner(partners, name);
  if (!partner) return null;
  const matches = rows.filter(
    (r) =>
      r.partnerId === partner.id &&
      r.dureeMois === dureeMois &&
      r.montantMin <= montant &&
      r.montantMax >= montant,
  );
  return (matches.find((r) => r.isActive) ?? matches[0])?.taux ?? null;
}

// --- Validation base taux ---------------------------------------------------

export interface BaseTauxDraft {
  id?: string;
  partnerId: string;
  montantMin: number;
  montantMax: number;
  dureeMois: number;
  taux: number;
}

/** Retourne les messages d'erreur (vide si valide). */
export function validateBaseTauxDraft(d: BaseTauxDraft): string[] {
  const errors: string[] = [];
  if (!d.partnerId) errors.push('Partenaire obligatoire');
  if (!Number.isFinite(d.montantMin) || !Number.isFinite(d.montantMax)) {
    errors.push('Montants invalides');
  } else if (d.montantMin >= d.montantMax) {
    errors.push('Le montant min doit être inférieur au montant max');
  }
  if (!Number.isInteger(d.dureeMois) || d.dureeMois <= 0) errors.push('La durée doit être un entier de mois positif');
  if (!Number.isFinite(d.taux) || d.taux <= 0) errors.push('Le taux doit être strictement positif');
  return errors;
}

/**
 * Lignes actives du même partenaire et de la même durée dont la tranche chevauche
 * celle du brouillon (bornes incluses). La ligne éditée elle-même est ignorée.
 */
export function findOverlaps(rows: readonly BaseTauxRow[], d: BaseTauxDraft): BaseTauxRow[] {
  return rows.filter(
    (r) =>
      r.id !== d.id &&
      r.isActive &&
      r.partnerId === d.partnerId &&
      r.dureeMois === d.dureeMois &&
      r.montantMin <= d.montantMax &&
      d.montantMin <= r.montantMax,
  );
}

/** Un alias ou un nom déjà porté par un autre partenaire (comparaison normalisée). */
export function findNameConflict(
  partners: readonly FinancialPartner[],
  candidates: readonly string[],
  selfId?: string,
): string | null {
  for (const c of candidates) {
    const key = normalizePartnerName(c);
    if (!key) continue;
    const clash = partners.find(
      (p) =>
        p.id !== selfId &&
        (normalizePartnerName(p.name) === key || p.aliases.some((a) => normalizePartnerName(a) === key)),
    );
    if (clash) return `« ${c.trim()} » est déjà utilisé par le partenaire « ${clash.name} »`;
  }
  return null;
}

/** Nombre de valeurs (ex: contracts.financial_partner) rattachées à un partenaire via nom ou alias. */
export function countReferences(partner: FinancialPartner, values: readonly (string | null | undefined)[]): number {
  const keys = new Set([partner.name, ...partner.aliases].map(normalizePartnerName));
  return values.filter((v) => keys.has(normalizePartnerName(v))).length;
}

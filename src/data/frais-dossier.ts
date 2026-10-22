// Frais de dossier et condition de fin de contrat par refinanceur.
// Frais de la ligne base_taux retenue, sinon défaut financial_partners (cache react-query).
// La résolution se fait par nom OU alias, sans tenir compte de la casse, et inclut
// les partenaires inactifs afin que les dossiers existants conservent leurs valeurs.
import {
  getConditionFinContratIn,
  getFraisDossierIn,
  resolveSavedFraisDossierIn,
  type ResolvedFraisDossier,
  type SavedFraisDossier,
} from '@/lib/partners';
import { getBaseTauxCache, getPartnersCache } from '@/lib/partners-cache';

/** Frais de dossier en euros, ou null si le partenaire est inconnu / non renseigné. */
export function getFraisDossier(
  refinanceur: string | null,
  montant: number | null = null,
  dureeMois: number | null = null,
): number | null {
  return getFraisDossierIn(getPartnersCache(), refinanceur, getBaseTauxCache(), montant, dureeMois);
}

/** Frais appliqués à une proposition (montant mémorisé ou tarif actuel) et tarif actuel. */
export function resolveProposalFraisDossier(
  refinanceur: string | null,
  montant: number | null,
  dureeMois: number | null,
  saved?: SavedFraisDossier | null,
): ResolvedFraisDossier {
  return resolveSavedFraisDossierIn(getPartnersCache(), getBaseTauxCache(), refinanceur, montant, dureeMois, saved);
}

/** Condition de fin de contrat, ou null si le partenaire est inconnu / non renseigné. */
export function getConditionFinContrat(refinanceur: string | null): string | null {
  return getConditionFinContratIn(getPartnersCache(), refinanceur);
}

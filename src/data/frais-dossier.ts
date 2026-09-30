// Frais de dossier et condition de fin de contrat par refinanceur.
// Source unique : table Supabase `financial_partners` (via le cache alimenté par react-query).
// La résolution se fait par nom OU alias, sans tenir compte de la casse, et inclut
// les partenaires inactifs afin que les dossiers existants conservent leurs valeurs.
import { getConditionFinContratIn, getFraisDossierIn } from '@/lib/partners';
import { getPartnersCache } from '@/lib/partners-cache';

/** Frais de dossier en euros, ou null si le partenaire est inconnu / non renseigné. */
export function getFraisDossier(refinanceur: string | null): number | null {
  return getFraisDossierIn(getPartnersCache(), refinanceur);
}

/** Condition de fin de contrat, ou null si le partenaire est inconnu / non renseigné. */
export function getConditionFinContrat(refinanceur: string | null): string | null {
  return getConditionFinContratIn(getPartnersCache(), refinanceur);
}

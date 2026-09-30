// Cache mémoire alimenté par les requêtes react-query (useFinancialPartners / useBaseTaux).
// Permet aux fonctions de calcul synchrones de lire les données Supabase sans localStorage.
import type { BaseTauxRow, FinancialPartner } from '@/lib/partners';

let partners: FinancialPartner[] = [];
let baseTaux: BaseTauxRow[] = [];

export const setPartnersCache = (next: FinancialPartner[]) => {
  partners = next;
};
export const setBaseTauxCache = (next: BaseTauxRow[]) => {
  baseTaux = next;
};
export const getPartnersCache = () => partners;
export const getBaseTauxCache = () => baseTaux;

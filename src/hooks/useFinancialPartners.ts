import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { BaseTauxRow, FinancialPartner } from '@/lib/partners';
import { setBaseTauxCache, setPartnersCache } from '@/lib/partners-cache';

const PARTNERS_KEY = ['financial-partners'] as const;
const BASE_TAUX_KEY = ['base-taux'] as const;

const toPartner = (r: Tables<'financial_partners'>): FinancialPartner => ({
  id: r.id,
  name: r.name,
  fraisDossier: r.frais_dossier === null ? null : Number(r.frais_dossier),
  conditionFinContrat: r.condition_fin_contrat,
  aliases: r.aliases ?? [],
  isActive: r.is_active,
  sortOrder: r.sort_order,
});

const toRow = (r: Tables<'base_taux'>): BaseTauxRow => ({
  id: r.id,
  partnerId: r.partner_id,
  montantMin: Number(r.montant_min),
  montantMax: Number(r.montant_max),
  dureeMois: r.duree_mois,
  taux: Number(r.taux),
  isActive: r.is_active,
});

async function fetchPartners(): Promise<FinancialPartner[]> {
  const { data, error } = await supabase
    .from('financial_partners')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });
  if (error) throw error;
  const all = (data ?? []).map(toPartner);
  // Le cache est alimenté avant que react-query ne livre les données aux composants,
  // ce qui garantit que les calculs synchrones lisent des valeurs à jour au re-render.
  setPartnersCache(all);
  return all;
}

async function fetchBaseTaux(): Promise<BaseTauxRow[]> {
  // Plage explicite : PostgREST plafonne à 1000 lignes par défaut.
  const { data, error } = await supabase.from('base_taux').select('*').range(0, 4999);
  if (error) throw error;
  const all = (data ?? []).map(toRow);
  setBaseTauxCache(all);
  return all;
}

/**
 * Partenaires financiers. Par défaut uniquement les partenaires actifs (sélecteurs de
 * nouvelle proposition). Utiliser `includeInactive` pour l'admin et pour résoudre
 * l'historique.
 */
export function useFinancialPartners({ includeInactive = false }: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: fetchPartners,
    staleTime: 60_000,
    select: (all) => (includeInactive ? all : all.filter((p) => p.isActive)),
  });
}

/** Toutes les lignes de base taux (actives et inactives). */
export function useBaseTaux() {
  return useQuery({ queryKey: BASE_TAUX_KEY, queryFn: fetchBaseTaux, staleTime: 60_000 });
}

/** Charge partenaires + base taux (tous, inactifs inclus) et alimente le cache synchrone. */
export function useReferenceData() {
  const partners = useFinancialPartners({ includeInactive: true });
  const baseTaux = useBaseTaux();
  return {
    partners: partners.data ?? [],
    baseTaux: baseTaux.data ?? [],
    isLoading: partners.isLoading || baseTaux.isLoading,
  };
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function useInvalidateReferenceData() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: PARTNERS_KEY }),
      qc.invalidateQueries({ queryKey: BASE_TAUX_KEY }),
    ]);
}

export interface PartnerInput {
  id?: string;
  name: string;
  fraisDossier: number | null;
  conditionFinContrat: string | null;
  aliases: string[];
  isActive: boolean;
}

export function useSavePartner() {
  const invalidate = useInvalidateReferenceData();
  return useMutation({
    mutationFn: async (p: PartnerInput) => {
      const updated_by = await currentUserId();
      const payload = {
        name: p.name.trim(),
        frais_dossier: p.fraisDossier,
        condition_fin_contrat: p.conditionFinContrat,
        aliases: p.aliases.map((a) => a.trim()).filter(Boolean),
        is_active: p.isActive,
        updated_by,
      };
      if (p.id) {
        const { error } = await supabase.from('financial_partners').update(payload).eq('id', p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('financial_partners').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });
}

export function useSetPartnerActive() {
  const invalidate = useInvalidateReferenceData();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('financial_partners')
        .update({ is_active: isActive, updated_by: await currentUserId() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** La suppression échoue côté base (ON DELETE RESTRICT) si des lignes de taux référencent le partenaire. */
export function useDeletePartner() {
  const invalidate = useInvalidateReferenceData();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_partners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export interface BaseTauxInput {
  id?: string;
  partnerId: string;
  montantMin: number;
  montantMax: number;
  dureeMois: number;
  taux: number;
  isActive?: boolean;
}

const toDb = (r: BaseTauxInput, updated_by: string | null) => ({
  partner_id: r.partnerId,
  montant_min: r.montantMin,
  montant_max: r.montantMax,
  duree_mois: r.dureeMois,
  taux: r.taux,
  ...(r.isActive === undefined ? {} : { is_active: r.isActive }),
  updated_by,
});

export function useSaveBaseTauxRow() {
  const invalidate = useInvalidateReferenceData();
  return useMutation({
    mutationFn: async (r: BaseTauxInput) => {
      const payload = toDb(r, await currentUserId());
      if (r.id) {
        const { error } = await supabase.from('base_taux').update(payload).eq('id', r.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('base_taux').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });
}

export function useDeleteBaseTauxRow() {
  const invalidate = useInvalidateReferenceData();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('base_taux').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export interface BaseTauxImportPlan {
  /** Partenaires inconnus à créer (actifs, sans frais ni condition : à compléter dans l'onglet Partenaires). */
  newPartners: string[];
  /** partnerId null = partenaire à créer, retrouvé par partnerName après création. */
  inserts: (Omit<BaseTauxInput, 'partnerId'> & { partnerId: string | null; partnerName: string })[];
  updates: (BaseTauxInput & { id: string })[];
  deleteIds: string[];
}

/** Applique un import Excel confirmé. Les écritures ne sont pas transactionnelles côté client. */
export function useApplyBaseTauxImport() {
  const invalidate = useInvalidateReferenceData();
  return useMutation({
    mutationFn: async (plan: BaseTauxImportPlan) => {
      const uid = await currentUserId();
      const createdIds = new Map<string, string>();
      if (plan.newPartners.length) {
        const { data, error } = await supabase
          .from('financial_partners')
          .insert(plan.newPartners.map((name) => ({ name, is_active: true, updated_by: uid })))
          .select('id, name');
        if (error) throw error;
        (data ?? []).forEach((p) => createdIds.set(p.name.trim().toLowerCase(), p.id));
      }
      if (plan.deleteIds.length) {
        const { error } = await supabase.from('base_taux').delete().in('id', plan.deleteIds);
        if (error) throw error;
      }
      const inserts = plan.inserts.map((r) => {
        const partnerId = r.partnerId ?? createdIds.get(r.partnerName.trim().toLowerCase());
        if (!partnerId) throw new Error(`Partenaire introuvable pour l'import : ${r.partnerName}`);
        return toDb({ ...r, partnerId }, uid) as TablesInsert<'base_taux'>;
      });
      for (let i = 0; i < inserts.length; i += 200) {
        const { error } = await supabase.from('base_taux').insert(inserts.slice(i, i + 200));
        if (error) throw error;
      }
      for (const u of plan.updates) {
        const { error } = await supabase
          .from('base_taux')
          .update(toDb(u, uid) as TablesUpdate<'base_taux'>)
          .eq('id', u.id);
        if (error) throw error;
      }
    },
    // Même en cas d'échec partiel, on relit l'état réel de la base.
    onSettled: invalidate,
  });
}

/** Valeurs brutes de contracts.financial_partner (admin) pour compter les références d'un partenaire. */
export function useContractPartnerValues(enabled = true) {
  return useQuery({
    queryKey: ['contracts-financial-partner-values'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('contracts').select('financial_partner').range(0, 9999);
      if (error) throw error;
      return (data ?? []).map((c) => c.financial_partner as string | null);
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TransacLine, Periodicity, TransacRentalResult } from '@/lib/transac-calculations';
import { computeTransacTotals, lineTotalHt } from '@/lib/transac-calculations';
import type { TransacAddress } from '@/lib/transac-html-generator';
import { brandSettingsKey, mergeBrandSettings, type TransacBrand, type TransacBrandSettings } from '@/lib/transac-brands';

export interface FrozenRental { key: string; result: TransacRentalResult }

export interface TransacEditorState {
  id: string | null;
  brand: TransacBrand;
  quoteNumber: string;
  clientNumber: string;
  clientName: string;
  quoteDate: string;
  validUntil: string;
  commercialId: string;
  commercialName: string;
  deliveryAddress: TransacAddress;
  billingAddress: TransacAddress;
  billingSameAsDelivery: boolean;
  comment: string;
  lines: TransacLine[];
  rentalEnabled: boolean;
  rentalDuration: number | null;
  rentalPartner: string | null;
  rentalPeriodicity: Periodicity;
  frozenRental: FrozenRental | null;
}

export interface TransacQuoteSummary {
  id: string;
  brand: TransacBrand;
  quote_number: string;
  client_name: string | null;
  client_number: string | null;
  commercial_id: string | null;
  commercial_name: string | null;
  quote_date: string;
  total_ht: number;
  rental_enabled: boolean;
  status: string;
  created_at: string;
}

const LIST_KEY = ['transac-quotes'];
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export function useTransacQuotes() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transac_quotes')
        .select('id, brand, quote_number, client_name, client_number, commercial_id, commercial_name, quote_date, total_ht, rental_enabled, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TransacQuoteSummary[];
    },
  });
}

export async function loadTransacQuote(id: string): Promise<TransacEditorState> {
  const [{ data: q, error }, { data: lines, error: lErr }] = await Promise.all([
    supabase.from('transac_quotes').select('*').eq('id', id).single(),
    supabase.from('transac_quote_lines').select('*').eq('quote_id', id).order('position'),
  ]);
  if (error) throw error;
  if (lErr) throw lErr;
  const rental = (q.rental ?? null) as null | { durationMonths: number | null; partner: string | null; periodicity: Periodicity; frozen: FrozenRental | null };
  return {
    id: q.id,
    brand: q.brand as TransacBrand,
    quoteNumber: q.quote_number,
    clientNumber: q.client_number ?? '',
    clientName: q.client_name ?? '',
    quoteDate: q.quote_date,
    validUntil: q.valid_until,
    commercialId: q.commercial_id ?? '',
    commercialName: q.commercial_name ?? '',
    deliveryAddress: (q.delivery_address ?? {}) as TransacAddress,
    billingAddress: (q.billing_address ?? {}) as TransacAddress,
    billingSameAsDelivery: q.billing_same_as_delivery,
    comment: q.comment ?? '',
    lines: (lines ?? []).map((l) => ({
      id: l.id,
      lineType: l.line_type as TransacLine['lineType'],
      reference: l.reference ?? '',
      designation: l.designation,
      ecoParticipation: num(l.eco_participation),
      unitPriceHt: Number(l.unit_price_ht),
      quantity: Number(l.quantity),
      purchasePrice: num(l.purchase_price),
      supplier: l.supplier ?? '',
      supplierRef: l.supplier_ref ?? '',
      markupRate: num(l.markup_rate),
    })),
    rentalEnabled: q.rental_enabled,
    rentalDuration: rental?.durationMonths ?? null,
    rentalPartner: rental?.partner ?? null,
    rentalPeriodicity: rental?.periodicity ?? 'mensuel',
    frozenRental: rental?.frozen ?? null,
  };
}

export function useSaveTransacQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ state, rental, exported }: { state: TransacEditorState; rental: FrozenRental | null; exported?: boolean }) => {
      const totals = computeTransacTotals(state.lines);
      const row = {
        brand: state.brand,
        quote_number: state.quoteNumber.trim(),
        client_number: state.clientNumber || null,
        client_name: state.clientName || null,
        quote_date: state.quoteDate,
        valid_until: state.validUntil,
        commercial_id: state.commercialId || null,
        commercial_name: state.commercialName || null,
        delivery_address: state.deliveryAddress as never,
        billing_address: (state.billingSameAsDelivery ? state.deliveryAddress : state.billingAddress) as never,
        billing_same_as_delivery: state.billingSameAsDelivery,
        comment: state.comment || null,
        total_ht: totals.totalHt,
        total_tva: totals.totalTva,
        total_ttc: totals.totalTtc,
        total_purchase: totals.totalPurchase,
        rental_enabled: state.rentalEnabled,
        rental: (state.rentalEnabled
          ? { durationMonths: state.rentalDuration, partner: state.rentalPartner, periodicity: state.rentalPeriodicity, frozen: rental }
          : null) as never,
        ...(exported ? { status: 'exported', exported_at: new Date().toISOString() } : {}),
      };
      let id = state.id;
      if (id) {
        const { error } = await supabase.from('transac_quotes').update(row).eq('id', id);
        if (error) throw error;
        const { error: dErr } = await supabase.from('transac_quote_lines').delete().eq('quote_id', id);
        if (dErr) throw dErr;
      } else {
        const { data, error } = await supabase.from('transac_quotes').insert(row).select('id').single();
        if (error) throw error;
        id = data.id;
      }
      if (state.lines.length) {
        const { error } = await supabase.from('transac_quote_lines').insert(
          state.lines.map((l, i) => ({
            quote_id: id!,
            position: i,
            line_type: l.lineType,
            reference: l.reference || null,
            designation: l.designation,
            eco_participation: l.ecoParticipation,
            unit_price_ht: l.unitPriceHt,
            quantity: l.quantity,
            total_ht: lineTotalHt(l),
            purchase_price: l.purchasePrice,
            supplier: l.supplier || null,
            supplier_ref: l.supplierRef || null,
            markup_rate: l.markupRate,
          })),
        );
        if (error) throw error;
      }
      return id!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useDeleteTransacQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transac_quotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export async function transacQuoteNumberExists(number: string, excludeId: string | null): Promise<boolean> {
  if (!number.trim()) return false;
  const { data, error } = await supabase.rpc('transac_quote_number_exists', {
    _number: number,
    ...(excludeId ? { _exclude_id: excludeId } : {}),
  });
  if (error) return false;
  return !!data;
}

export function useTransacBrandSettings() {
  return useQuery({
    queryKey: ['transac-brand-settings'],
    queryFn: async (): Promise<Record<TransacBrand, TransacBrandSettings>> => {
      const { data } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', [brandSettingsKey('cybertek-pro'), brandSettingsKey('grosbill-pro')]);
      const get = (b: TransacBrand) => data?.find((r) => r.key === brandSettingsKey(b))?.value;
      return {
        'cybertek-pro': mergeBrandSettings('cybertek-pro', get('cybertek-pro')),
        'grosbill-pro': mergeBrandSettings('grosbill-pro', get('grosbill-pro')),
      };
    },
    staleTime: 60_000,
  });
}

export function useSaveTransacBrandSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ brand, settings }: { brand: TransacBrand; settings: TransacBrandSettings }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ key: brandSettingsKey(brand), value: JSON.stringify(settings), updated_at: now });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transac-brand-settings'] }),
  });
}

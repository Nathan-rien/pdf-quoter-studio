/**
 * Helper used at service-contract validation time to seed
 * client_service_references from the same source that generates the PDF
 * (service_proposals.selected_services / nos_options).
 */
import { supabase } from '@/integrations/supabase/client';

export interface SeedServiceRef {
  option_service_id: string | null;
  service_label: string;
  erp_reference: string | null;
}

export async function seedClientServiceReferences(params: {
  contractId: string;
  serviceProposalId: string | null;
}): Promise<number> {
  const { contractId, serviceProposalId } = params;
  if (!serviceProposalId) return 0;

  const { data: sp } = await supabase
    .from('service_proposals')
    .select('selected_services')
    .eq('id', serviceProposalId)
    .maybeSingle();

  const selected: Array<{ service_id?: string; label?: string }> =
    (sp?.selected_services as any) ?? [];
  if (!selected.length) return 0;

  const ids = Array.from(
    new Set(selected.map((s) => s.service_id).filter(Boolean) as string[]),
  );
  const catalog: Record<string, { erp_reference: string | null; title: string }> = {};
  if (ids.length) {
    const { data: opts } = await supabase
      .from('options_services')
      .select('id, title, erp_reference')
      .in('id', ids);
    (opts ?? []).forEach((o: any) => {
      catalog[o.id] = { erp_reference: o.erp_reference ?? null, title: o.title };
    });
  }

  const rows = selected.map((s) => {
    const cat = s.service_id ? catalog[s.service_id] : undefined;
    return {
      contract_id: contractId,
      option_service_id: s.service_id ?? null,
      service_label: s.label || cat?.title || 'Service',
      erp_reference: cat?.erp_reference ?? null,
      tickets_initial: null,
      tickets_remaining: null,
    };
  });

  const { error } = await supabase.from('client_service_references').insert(rows);
  if (error) {
    console.error('[technician-tracking] seed failed', error);
    return 0;
  }
  return rows.length;
}

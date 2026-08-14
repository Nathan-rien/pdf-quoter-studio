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

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ids = Array.from(
    new Set(
      selected
        .map((s) => s.service_id)
        .filter((v): v is string => !!v && UUID_RE.test(v)),
    ),
  );
  const catalog: Record<string, { erp_reference: string | null; title: string; requires_intervention: boolean }> = {};
  if (ids.length) {
    const { data: opts } = await supabase
      .from('options_services')
      .select('id, title, erp_reference, requires_intervention')
      .in('id', ids);
    (opts ?? []).forEach((o: any) => {
      catalog[o.id] = {
        erp_reference: o.erp_reference ?? null,
        title: o.title,
        requires_intervention: o.requires_intervention ?? true,
      };
    });
  }

  const rows = selected.map((s) => {
    const validId = s.service_id && UUID_RE.test(s.service_id) ? s.service_id : null;
    const cat = validId ? catalog[validId] : undefined;
    return {
      contract_id: contractId,
      option_service_id: validId,
      service_label: s.label || cat?.title || 'Service',
      erp_reference: cat?.erp_reference ?? null,
      requires_intervention: cat?.requires_intervention ?? true,
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

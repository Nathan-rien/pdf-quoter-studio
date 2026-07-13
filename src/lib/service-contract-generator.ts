/**
 * Generates the "contrat" mode PDF (HTML) for a validated Service Proposal
 * from the snapshot stored in proposal_exports, uploads it to the
 * contract-attachments bucket, and returns the storage path.
 *
 * Runs entirely client-side using the shared pure HTML generator.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  generateServiceProposalHtml,
  type ServiceProposalHtmlData,
} from './service-proposal-html-generator';

export interface GeneratedContractAttachment {
  path: string;
  name: string;
}

function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
    .replace(/\s+/g, '_');
}

export async function generateAndUploadServiceContractPdf(params: {
  proposalId: string;
  contractId: string;
  clientName: string;
}): Promise<GeneratedContractAttachment | null> {
  const { proposalId, contractId, clientName } = params;

  // 1. Load the proposal snapshot
  const { data: exportRow, error: exportErr } = await supabase
    .from('proposal_exports')
    .select('proposal_state, template_id')
    .eq('id', proposalId)
    .maybeSingle();
  if (exportErr || !exportRow) {
    console.error('[service-contract-generator] snapshot introuvable', exportErr);
    return null;
  }
  const snapshot = (exportRow as any).proposal_state;
  if (!snapshot || snapshot.kind !== 'service-proposal') {
    console.warn('[service-contract-generator] snapshot invalide, génération ignorée');
    return null;
  }

  // 2. Load the template (prefer the one saved in the snapshot)
  const templateId =
    snapshot.activeTemplateId ||
    snapshot.selectedTemplateId ||
    (exportRow as any).template_id;
  if (!templateId) {
    console.warn('[service-contract-generator] aucun template lié — génération ignorée');
    return null;
  }
  const { data: versionRow } = await supabase
    .from('template_versions')
    .select('pages_content')
    .eq('template_id', templateId)
    .eq('status', 'published')
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!versionRow || !(versionRow as any).pages_content) {
    console.warn('[service-contract-generator] aucune version publiée trouvée');
    return null;
  }
  const pages = (versionRow as any).pages_content;

  // 3. Load admin options catalog (for pack description resolution)
  const { data: adminOpts } = await supabase
    .from('options_services')
    .select('*');
  const adminOptions = (adminOpts ?? []) as any[];

  // 4. Build the generator input directly from the snapshot
  const data: ServiceProposalHtmlData = {
    clientData: snapshot.clientData,
    commercialData: snapshot.commercialData,
    lignesData: snapshot.lignesData ?? [],
    proposalName: snapshot.proposalName ?? '',
    totalInvest: snapshot.totalInvest ?? 0,
    selectedServices: snapshot.selectedServices ?? [],
    paymentFrequency: snapshot.paymentFrequency ?? '',
    paymentMode: snapshot.paymentMode ?? '',
    contractDuration: snapshot.contractDuration ?? null,
    startDate: snapshot.startDate ?? '',
    totalServicesHt: snapshot.totalServicesHt ?? 0,
    nosOptions: snapshot.nosOptions ?? [],
    siteAddresses: snapshot.siteAddresses ?? [],
    operationalContact:
      snapshot.operationalContact ?? { name: '', role: '', email: '', phone: '' },
    externalProviders: snapshot.externalProviders ?? [],
    adminOptions,
    latestVersion: { pages: Array.isArray(pages) ? pages : [] },
    selectedCommercial: snapshot.selectedCommercial ?? null,
    entityLabel: snapshot.entityLabel ?? null,
    docTitle: `Contrat_${clientName}`,
  };

  // 5. Generate the full contract HTML (all pages)
  const html = await generateServiceProposalHtml(data, 'contrat');

  // 6. Upload to storage
  const fileName = `Contrat_Services_${sanitize(clientName)}_${
    new Date().toISOString().split('T')[0]
  }.html`;
  const path = `contracts/${contractId}/${Date.now()}-${fileName}`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const { error: upErr } = await supabase.storage
    .from('contract-attachments')
    .upload(path, blob, { contentType: 'text/html', upsert: false });
  if (upErr) {
    console.error('[service-contract-generator] upload échoué', upErr);
    return null;
  }

  return { path, name: fileName };
}

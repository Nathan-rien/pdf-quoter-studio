/**
 * Generates the "contrat" mode PDF for a validated Service Proposal.
 *
 * Priority:
 *  1) Load the FRESH service_proposals row (data as of validation time).
 *  2) Fall back to the proposal_exports snapshot if the row is missing.
 *
 * Converts the HTML output of generateServiceProposalHtml() into a real multi-page PDF
 * (html2canvas + jsPDF) and uploads it to the contract-attachments bucket.
 */
import { supabase } from '@/integrations/supabase/client';
import { generateServiceProposalHtml } from './service-proposal-html-generator';
import {
  buildHtmlDataFromServiceProposal,
} from './service-proposal-data-builder';
import { htmlToPdfBlob } from './html-to-pdf';
import type { ServiceProposal } from '@/hooks/useServiceProposals';
import type { ServiceProposalHtmlData } from './service-proposal-html-generator';

export interface GeneratedContractAttachment {
  path: string;
  name: string;
}

function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
    .replace(/\s+/g, '_');
}

async function loadTemplatePages(templateId: string): Promise<any[] | null> {
  const { data } = await supabase
    .from('template_versions')
    .select('pages')
    .eq('template_id', templateId)
    .eq('status', 'publie')
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const pages = (data as any)?.pages;
  return Array.isArray(pages) ? pages : null;
}

function hasContractScopedPages(pages: any[] | null): pages is any[] {
  return Array.isArray(pages) && pages.some((page: any) => page?.documentScope === 'contrat');
}

async function loadLatestPublishedPagesForTemplateIds(ids: string[]): Promise<any[] | null> {
  if (ids.length === 0) return null;

  const { data: versions } = await supabase
    .from('template_versions')
    .select('pages, version_number, published_at, template_id')
    .in('template_id', ids)
    .eq('status', 'publie')
    .order('version_number', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(10);

  for (const version of versions ?? []) {
    const pages = (version as any)?.pages;
    if (hasContractScopedPages(pages)) return pages;
  }
  return null;
}

async function loadLatestServiceContractTemplatePages(): Promise<any[] | null> {
  const { data: contractTemplates } = await supabase
    .from('pdf_templates')
    .select('id')
    .eq('name', 'Contrat Cadre Services');

  const contractIds = (contractTemplates ?? []).map((t: any) => t.id).filter(Boolean);
  const contractPages = await loadLatestPublishedPagesForTemplateIds(contractIds);
  if (contractPages) return contractPages;

  const { data: serviceTemplates } = await supabase
    .from('pdf_templates')
    .select('id')
    .eq('target_view', 'services');

  const serviceIds = (serviceTemplates ?? []).map((t: any) => t.id).filter(Boolean);
  return loadLatestPublishedPagesForTemplateIds(serviceIds);
}

export async function generateAndUploadServiceContractPdf(params: {
  proposalId: string; // proposal_exports.id
  contractId: string;
  clientName: string;
}): Promise<GeneratedContractAttachment | null> {
  const { proposalId, contractId, clientName } = params;

  // 1. Load the export row (still needed for the template link + snapshot fallback)
  const { data: exportRow, error: exportErr } = await supabase
    .from('proposal_exports')
    .select('proposal_state, template_id, service_proposal_id')
    .eq('id', proposalId)
    .maybeSingle();
  if (exportErr || !exportRow) {
    console.error('[service-contract-generator] export introuvable', exportErr);
    return null;
  }
  const snapshot = (exportRow as any).proposal_state;
  const serviceProposalId = (exportRow as any).service_proposal_id as string | null;

  // 2. Prefer the fresh service_proposals row when we have a link
  let freshProposal: ServiceProposal | null = null;
  if (serviceProposalId) {
    const { data: sp } = await supabase
      .from('service_proposals')
      .select('*')
      .eq('id', serviceProposalId)
      .maybeSingle();
    freshProposal = (sp as unknown as ServiceProposal) ?? null;
  }

  // 3. Resolve the template. Contract generation must prioritize the dedicated
  // "Contrat Cadre Services" template, because the proposal export template can
  // be a devis-only snapshot and would otherwise regenerate the wrong document.
  const templateId =
    (freshProposal ? null : snapshot?.activeTemplateId ?? snapshot?.selectedTemplateId) ||
    (exportRow as any).template_id;
  const contractTemplatePages = await loadLatestServiceContractTemplatePages();
  const fallbackPages = templateId ? await loadTemplatePages(templateId) : null;
  const pages = contractTemplatePages ?? (hasContractScopedPages(fallbackPages) ? fallbackPages : null);
  if (!pages || !hasContractScopedPages(pages)) {
    console.warn('[service-contract-generator] aucune version contrat publiée trouvée');
    return null;
  }

  // 4. Load admin options catalog (for pack description resolution)
  const { data: adminOpts } = await supabase.from('options_services').select('*');
  const adminOptions = (adminOpts ?? []) as any[];

  // 5. Build the generator input
  const docTitle = `Contrat_${clientName}`;
  let data: ServiceProposalHtmlData;
  if (freshProposal) {
    data = buildHtmlDataFromServiceProposal(freshProposal, {
      latestVersion: { pages },
      adminOptions,
      docTitle,
    });
  } else if (snapshot && snapshot.kind === 'service-proposal') {
    // Legacy path — snapshot from proposal_exports
    data = {
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
      latestVersion: { pages },
      selectedCommercial: snapshot.selectedCommercial ?? null,
      entityLabel: snapshot.entityLabel ?? null,
      docTitle,
    };
  } else {
    console.warn('[service-contract-generator] pas de données proposition');
    return null;
  }

  // 6. Generate the full contract HTML (all pages)
  const html = await generateServiceProposalHtml(data, 'contrat');

  // 7. Convert to a real PDF
  const pdfBlob = await htmlToPdfBlob(html);

  // 8. Upload
  const fileName = `Contrat_Cadre_Services_${sanitize(clientName)}_${
    new Date().toISOString().split('T')[0]
  }.pdf`;
  const path = `contracts/${contractId}/${Date.now()}-${fileName}`;
  const { error: upErr } = await supabase.storage
    .from('contract-attachments')
    .upload(path, pdfBlob, { contentType: 'application/pdf', upsert: false });
  if (upErr) {
    console.error('[service-contract-generator] upload échoué', upErr);
    return null;
  }

  return { path, name: fileName };
}

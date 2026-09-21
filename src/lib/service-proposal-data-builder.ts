/**
 * Builds ServiceProposalHtmlData from either the live store or a service_proposals DB row,
 * so ServiceProposalPreview / ServiceProposalExport / service-contract-generator all
 * feed generateServiceProposalHtml() with identical input shapes.
 */
import type { ServiceProposalHtmlData } from './service-proposal-html-generator';
import { ENTITIES } from '@/data/commerciaux';
import { getCommercialByIdRuntime as getCommercialById } from '@/lib/commercials-runtime';
import type { ServiceProposalStoreState } from '@/stores/serviceProposalStore';
import type { ServiceProposal } from '@/hooks/useServiceProposals';
import type { OptionService } from '@/stores/rentalProposalStore';

interface BuildFromStoreOptions {
  latestVersion: { pages: any[] };
  adminOptions: any[];
  docTitle: string;
}

export function buildHtmlDataFromStore(
  store: Pick<
    ServiceProposalStoreState,
    | 'clientData'
    | 'commercialData'
    | 'lignesData'
    | 'invoiceNumber'
    | 'proposalName'
    | 'totalInvest'
    | 'selectedServices'
    | 'paymentFrequency'
    | 'paymentMode'
    | 'contractDuration'
    | 'startDate'
    | 'totalServicesHt'
    | 'nosOptions'
    | 'siteAddresses'
    | 'operationalContact'
    | 'externalProviders'
  >,
  opts: BuildFromStoreOptions,
): ServiceProposalHtmlData {
  const selectedCommercial = store.commercialData?.commercialId
    ? getCommercialById(store.commercialData.commercialId)
    : null;
  const entityLabel = store.commercialData?.entity
    ? ENTITIES.find((e) => e.id === store.commercialData.entity)?.label || store.commercialData.entity
    : null;

  return {
    clientData: store.clientData,
    commercialData: store.commercialData,
    lignesData: store.lignesData ?? [],
    invoiceNumber: store.invoiceNumber ?? '',
    proposalName: store.proposalName ?? '',
    totalInvest: store.totalInvest ?? 0,
    selectedServices: store.selectedServices ?? [],
    paymentFrequency: store.paymentFrequency ?? '',
    paymentMode: store.paymentMode ?? '',
    contractDuration: store.contractDuration ?? null,
    startDate: store.startDate ?? '',
    totalServicesHt: store.totalServicesHt ?? 0,
    nosOptions: store.nosOptions ?? [],
    siteAddresses: store.siteAddresses ?? [],
    operationalContact:
      store.operationalContact ?? { name: '', role: '', email: '', phone: '' },
    externalProviders: store.externalProviders ?? [],
    adminOptions: opts.adminOptions,
    latestVersion: opts.latestVersion,
    selectedCommercial: selectedCommercial
      ? {
          nom: selectedCommercial.nom,
          telephone: selectedCommercial.telephone,
          email: selectedCommercial.email,
          adresse: selectedCommercial.adresse,
        }
      : null,
    entityLabel,
    docTitle: opts.docTitle,
  };
}

/**
 * Builds ServiceProposalHtmlData directly from a service_proposals DB row —
 * used at validation time so the generated contract reflects the latest saved state.
 */
export function buildHtmlDataFromServiceProposal(
  proposal: ServiceProposal,
  opts: BuildFromStoreOptions,
): ServiceProposalHtmlData {
  const clientData = {
    nom: proposal.client_name ?? '',
    raisonSociale: proposal.client_company ?? '',
    email: proposal.client_email ?? '',
    telephone: proposal.client_phone ?? '',
    adresse: proposal.client_address ?? '',
    siret: proposal.client_siret ?? '',
    capitalSocial: (proposal as unknown as { client_capital_social?: string | null }).client_capital_social ?? '',
  };
  const commercialData = { entity: null, commercialId: proposal.commercial_id ?? null };
  const selectedCommercial = proposal.commercial_id
    ? getCommercialById(proposal.commercial_id)
    : null;

  const lignesData = (proposal.invest_lines ?? []).map((l) => ({
    id: l.id,
    designation: l.designation,
    quantite: l.qty,
    prixUnitaire: l.vun,
    totalHT: l.vtn,
  }));

  // Prefer the full options snapshot saved on the proposal (descriptions, hidden prices, packs)
  const storedNos = Array.isArray((proposal as { nos_options?: unknown[] }).nos_options)
    ? ((proposal as { nos_options?: unknown[] }).nos_options as OptionService[])
    : [];

  // Fallback: rebuild nosOptions from the selected_services stored on the proposal
  const rebuiltNos: OptionService[] = (proposal.selected_services ?? []).map((s) => {
    const mode: 'mensuel' | 'total' =
      (s as { show_price_mode?: string }).show_price_mode === 'total' ? 'total' : 'mensuel';
    const amount = Number(s.amount_ht) || 0;
    return {
      id: s.service_id || `opt-${Math.random().toString(36).slice(2, 10)}`,
      name: s.label,
      description: '',
      price: mode === 'mensuel' ? amount : null,
      priceTotal: mode === 'total' ? amount : null,
      showPriceMode: mode,
      pricingScope: 'par_machine' as const,
      showPrice: true,
      selected: true,
    } as OptionService;
  });

  const nosOptions: OptionService[] = storedNos.length > 0 ? storedNos : rebuiltNos;

  const dur = proposal.contract_duration ?? null;
  const totalServicesHt = Math.round(
    (proposal.selected_services ?? []).reduce((s, l) => {
      const mode = (l as { show_price_mode?: string }).show_price_mode ?? 'total';
      const amt = Number(l.amount_ht) || 0;
      return s + (mode === 'mensuel' && dur ? amt * dur : amt);
    }, 0) * 100,
  ) / 100;

  return {
    clientData,
    commercialData,
    lignesData,
    invoiceNumber: proposal.invoice_number ?? '',
    proposalName: proposal.client_company || proposal.client_name || 'Proposition Services',
    totalInvest:
      Math.round((proposal.invest_lines ?? []).reduce((s, l) => s + l.vtn, 0) * 100) / 100,
    selectedServices: proposal.selected_services ?? [],
    paymentFrequency: proposal.payment_frequency ?? '',
    paymentMode: proposal.payment_mode ?? '',
    contractDuration: proposal.contract_duration ?? null,
    startDate: proposal.start_date ?? '',
    totalServicesHt,
    nosOptions,
    siteAddresses: proposal.site_addresses ?? [],
    operationalContact:
      proposal.operational_contact ?? { name: '', role: '', email: '', phone: '' },
    externalProviders: proposal.external_providers ?? [],
    adminOptions: opts.adminOptions,
    latestVersion: opts.latestVersion,
    selectedCommercial: selectedCommercial
      ? {
          nom: selectedCommercial.nom,
          telephone: selectedCommercial.telephone,
          email: selectedCommercial.email,
          adresse: selectedCommercial.adresse,
        }
      : null,
    entityLabel: null,
    docTitle: opts.docTitle,
  };
}

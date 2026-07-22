/**
 * Pure HTML generator for a Service Proposal document.
 *
 * Extracted verbatim from ServiceProposalExport.tsx so it can be reused
 * outside of the React component (e.g. at proposal validation to produce
 * the contract-mode PDF automatically). This module reads NO hook and NO
 * Zustand store — everything must be passed in via `data`.
 */
import {
  renderPageToHTML,
  setPdfSubstitutionContext,
} from '@/lib/pdf-html-generator';
import { PREVIEW_FONT_SCALE } from '@/lib/canvas-constants';
import { resolvePackDescription } from '@/lib/pack-description';
import { getOptionPriceLabel } from '@/lib/options-price-utils';

import type { DynamicZone } from '@/types/pdf-template';
import type {
  ClientData,
  CommercialData,
  LigneData,
  SelectedService,
} from '@/stores/serviceProposalStore';
import type {
  SiteAddress,
  OperationalContact,
  ExternalProvider,
} from '@/hooks/useServiceProposals';
import type { OptionService } from '@/stores/rentalProposalStore';
import type { ServiceOptionDefinition } from '@/types/options-admin';

// 10mm rhythm between sections (10 / 297 * 100 ≈ 3.37%)
const SERVICE_ZONE_GAP_PERCENT = 3.4;

// Unified design tokens for the 3 first pages of the Service Proposal (devis scope)
const SECTION_TITLE_STYLE =
  "font-family:'Outfit',sans-serif;font-size:11px;font-weight:600;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 3mm 0;";
const INFO_CARD_STYLE =
  "background:#fafafa;border:1px solid #e5e7eb;border-radius:3px;padding:4mm 5mm;";
const BODY_TEXT_STYLE =
  "font-family:'Inter',sans-serif;font-size:9px;font-weight:400;color:#374151;line-height:1.45;";
const LABEL_STYLE =
  "font-family:'Inter',sans-serif;font-size:8px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 1.5mm 0;";
const VALUE_STYLE =
  "font-family:'Inter',sans-serif;font-size:10px;font-weight:600;color:#1a1a1a;margin:0;";
const DATA_TABLE_STYLE =
  "width:100%;border-collapse:collapse;font-family:'Inter',sans-serif;font-size:9px;line-height:1.4;color:#374151;table-layout:fixed;";
const TH_STYLE =
  "padding:2mm 3mm;text-align:left;font-weight:600;color:#1a1a1a;background:#f3f4f6;border:1px solid #e5e7eb;font-size:9px;font-family:'Inter',sans-serif;";
const TD_STYLE =
  "padding:2mm 3mm;border:1px solid #e5e7eb;color:#374151;vertical-align:top;font-size:9px;font-family:'Inter',sans-serif;overflow-wrap:anywhere;";
const ROW_ALT_BG = "#f9fafb";
const EMPTY_HINT_STYLE =
  "font-family:'Inter',sans-serif;font-size:9px;color:#9ca3af;font-style:italic;margin:0;";
const SECTION_WRAPPER_STYLE =
  "border:1px solid #e5e7eb;border-radius:3px;overflow:hidden;background:#ffffff;";
const SECTION_BANNER_STYLE =
  "background:#f3f4f6;color:#1a1a1a;font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:2.5mm 4mm;border-bottom:2px solid #d1d5db;";
const SECTION_BODY_STYLE = "padding:4mm;";

type PositionedDynamicZone = DynamicZone & {
  layoutTop?: number;
  layoutMinHeight?: number;
};

export interface CommercialSummary {
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
}

export interface ServiceProposalHtmlData {
  clientData: ClientData;
  commercialData: CommercialData;
  lignesData: LigneData[];
  proposalName: string;
  totalInvest: number;
  selectedServices: SelectedService[];
  paymentFrequency: string;
  paymentMode: string;
  contractDuration: number | null;
  startDate: string;
  totalServicesHt: number;
  nosOptions: OptionService[];
  siteAddresses: SiteAddress[];
  operationalContact: OperationalContact;
  externalProviders: ExternalProvider[];
  adminOptions: ServiceOptionDefinition[];
  latestVersion: { pages: any[] };
  selectedCommercial: CommercialSummary | null;
  entityLabel: string | null;
  docTitle: string;
}

const formatNumber = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export async function generateServiceProposalHtml(
  data: ServiceProposalHtmlData,
  mode: 'devis' | 'contrat' = 'devis',
): Promise<string> {
  const {
    clientData,
    commercialData,
    lignesData,
    selectedServices,
    paymentFrequency,
    paymentMode,
    contractDuration,
    startDate,
    totalServicesHt,
    nosOptions,
    siteAddresses,
    operationalContact,
    externalProviders,
    adminOptions,
    latestVersion,
    selectedCommercial,
    entityLabel,
    docTitle,
  } = data;

  if (!latestVersion || !latestVersion.pages || latestVersion.pages.length === 0) {
    throw new Error('Aucun template disponible pour générer le PDF');
  }

  const visibleTemplatePages = latestVersion.pages.filter((p: any) => {
    const s = p.documentScope ?? 'both';
    return s === 'both' || s === mode;
  });

  const substitutionContext = {
    fraisDossier: 0,
    adresseEntite: selectedCommercial?.adresse ?? null,
  };
  setPdfSubstitutionContext(substitutionContext);

  // --- Dynamic content by page ---
  const dynamicContent: Record<number, string> = {};
  const excludeElementIds: Record<number, string[]> = {};
  const extraPagesAfter: Record<number, string[]> = {};

  const escapeText = (value: unknown) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const getFallbackZoneTop = (zone: DynamicZone): number => {
    switch (zone.type) {
      case 'service_client_info': return 82;
      case 'service_conditions': return 65;
      case 'service_invest_table': return 12;
      case 'service_options': return 55;
      case 'service_site_addresses': return 32;
      case 'service_operational_contact': return 52;
      case 'service_external_providers': return 70;
      case 'service_options_summary': return 10;
      default: return 65;
    }
  };

  const getFallbackZoneHeight = (zone: DynamicZone): number => {
    switch (zone.type) {
      case 'service_client_info': return 10;
      case 'service_conditions': return 21;
      case 'service_invest_table': return 30;
      case 'service_options': return 18;
      case 'service_site_addresses': return 18;
      case 'service_operational_contact': return 14;
      case 'service_external_providers': return 20;
      case 'service_options_summary': return 28;
      default: return 18;
    }
  };

  const getZoneTop = (zone: DynamicZone): number => zone.position?.top ?? getFallbackZoneTop(zone);
  const getZoneMinHeight = (zone: DynamicZone): number => zone.position?.height ?? getFallbackZoneHeight(zone);

  const estimateTextVisualLines = (text: string): number =>
    Math.max(
      1,
      text
        .split('\n')
        .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 72)), 0),
    );

  const estimateServiceZoneHeight = (zone: DynamicZone): number => {
    const minHeight = getZoneMinHeight(zone);
    if (zone.type === 'service_invest_table') {
      const visualRows = lignesData.length > 0
        ? lignesData.reduce((total, ligne) => total + estimateTextVisualLines(ligne.designation || '-'), 0)
        : 1;
      return Math.max(minHeight, Math.min(82, 8 + visualRows * 2.45 + 6));
    }
    if (zone.type === 'service_options') {
      const selected = nosOptions.filter((o) => o.selected);
      const rows = selected.length || 1;
      return Math.max(minHeight, Math.min(82, 6 + rows * 4));
    }
    if (zone.type === 'service_conditions') return Math.max(minHeight, 21);
    if (zone.type === 'service_client_info') return Math.max(minHeight, 10);
    if (zone.type === 'service_signature') return Math.max(minHeight, 14);
    if (zone.type === 'service_options_summary') {
      const selected = nosOptions.filter((o) => o.selected);
      return Math.max(minHeight, Math.min(40, 5 + Math.max(selected.length, 1) * 3));
    }
    return minHeight;
  };

  const layoutServiceZones = (zones: Array<DynamicZone & { pageNumber: number }>): PositionedDynamicZone[] => {
    let currentBottom = 0;
    return [...zones]
      .sort((a, b) => getZoneTop(a) - getZoneTop(b))
      .map((zone) => {
        const minHeight = getZoneMinHeight(zone);
        const estimatedHeight = estimateServiceZoneHeight(zone);
        const naturalTop = getZoneTop(zone);
        const adjustedTop = Math.max(naturalTop, currentBottom > 0 ? currentBottom + SERVICE_ZONE_GAP_PERCENT : naturalTop);
        const safeTop = Math.min(adjustedTop, Math.max(1, 96 - minHeight));
        currentBottom = Math.max(currentBottom, safeTop + estimatedHeight);
        return { ...zone, layoutTop: safeTop, layoutMinHeight: minHeight };
      });
  };

  const getServiceZoneStyle = (zone: PositionedDynamicZone) => {
    return [
      'position: absolute',
      `top: ${zone.layoutTop ?? getZoneTop(zone)}%`,
      'left: 4%',
      'right: 4%',
      `min-height: ${zone.layoutMinHeight ?? getZoneMinHeight(zone)}%`,
      'z-index: 1000',
      'overflow: visible',
    ].join('; ');
  };

  const renderClientZone = (zone: PositionedDynamicZone) => `
    <div class="dynamic-content" style="${getServiceZoneStyle(zone)}; ${SECTION_WRAPPER_STYLE}">
      <div style="${SECTION_BANNER_STYLE}">Coordonnées</div>
      <div style="${SECTION_BODY_STYLE}">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5mm;">
          <div>
            <p style="${LABEL_STYLE}">Bénéficiaire</p>
            ${clientData.raisonSociale ? `<p style="${VALUE_STYLE}">${escapeText(clientData.raisonSociale)}</p>` : ''}
            <div style="${BODY_TEXT_STYLE} margin-top:1mm;">
              ${clientData.nom ? `<p style="margin:0.5mm 0;">${escapeText(clientData.nom)}</p>` : ''}
              ${clientData.adresse ? `<p style="margin:0.5mm 0;">${escapeText(clientData.adresse)}</p>` : ''}
              ${clientData.email ? `<p style="margin:0.5mm 0;">${escapeText(clientData.email)}</p>` : ''}
              ${clientData.telephone ? `<p style="margin:0.5mm 0;">${escapeText(clientData.telephone)}</p>` : ''}
            </div>
          </div>
          <div style="border-left: 1px solid #e5e7eb; padding-left: 5mm;">
            <p style="${LABEL_STYLE}">Votre interlocuteur</p>
            ${
              selectedCommercial
                ? `
              <p style="${VALUE_STYLE}">${escapeText(selectedCommercial.nom)}</p>
              <div style="${BODY_TEXT_STYLE} margin-top:1mm;">
                ${selectedCommercial.telephone ? `<p style="margin:0.5mm 0;">${escapeText(selectedCommercial.telephone)}</p>` : ''}
                ${selectedCommercial.email ? `<p style="margin:0.5mm 0;">${escapeText(selectedCommercial.email)}</p>` : ''}
                ${entityLabel ? `<p style="margin:0.5mm 0;">${escapeText(entityLabel)}</p>` : ''}
              </div>
            `
                : `<p style="${EMPTY_HINT_STYLE}">Non sélectionné</p>`
            }
          </div>
        </div>
      </div>
    </div>
  `;

  const freq: 'mensuel' | 'trimestriel' | null =
    paymentFrequency === 'mensuel' || paymentFrequency === 'trimestriel'
      ? paymentFrequency
      : null;
  const monthsPerPeriod = freq === 'trimestriel' ? 3 : 1;
  const periodicRent =
    freq && contractDuration && contractDuration > 0
      ? Math.round((totalServicesHt / (contractDuration / monthsPerPeriod)) * 100) / 100
      : null;

  const conditionsRows: Array<[string, string, boolean?]> = [
    ['Services', selectedServices.map((s) => s.label).join(', ') || '—'],
    ['Périodicité', paymentFrequency === 'mensuel' ? 'Mensuelle' : paymentFrequency === 'trimestriel' ? 'Trimestrielle' : '—'],
    ['Mode de règlement', paymentMode === 'prelevement' ? 'Prélèvement automatique' : paymentMode === 'virement' ? 'Virement bancaire' : paymentMode === 'allin' ? 'Allin' : '—'],
    ['Durée', contractDuration ? `${contractDuration} mois` : '—'],
    ['Démarrage', startDate ? new Date(startDate).toLocaleDateString('fr-FR') : '—'],
    ...(mode !== 'contrat'
      ? ([['Total HT services', `${formatNumber(totalServicesHt)} €`, true]] as Array<[string, string, boolean?]>)
      : []),
    ...(periodicRent !== null
      ? ([[
          paymentFrequency === 'mensuel' ? 'Loyer mensuel HT' : 'Loyer trimestriel HT',
          `${formatNumber(periodicRent)} €`,
          true,
        ]] as Array<[string, string, boolean?]>)
      : []),
  ];

  const renderConditionsZone = (zone: PositionedDynamicZone) => `
    <div class="dynamic-content" style="${getServiceZoneStyle(zone)}; ${SECTION_WRAPPER_STYLE}">
      <div style="${SECTION_BANNER_STYLE}">Vos modalités de règlement</div>
      <div style="${SECTION_BODY_STYLE}">
        <table style="${DATA_TABLE_STYLE}">
          <tbody>
            ${conditionsRows
              .map(
                ([label, value, bold], idx) => `
              <tr style="background:${idx % 2 === 1 ? ROW_ALT_BG : '#ffffff'};">
                <th scope="row" style="${TH_STYLE} width:38%;">${escapeText(label)}</th>
                <td style="${TD_STYLE} ${bold ? 'font-weight:700;color:#1a1a1a;text-align:right;' : ''}">${escapeText(value)}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const renderInvestZone = (zone: PositionedDynamicZone) => `
    <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
      <p style="${SECTION_TITLE_STYLE}">Matériel</p>
      <table style="${DATA_TABLE_STYLE}">
        <thead>
          <tr>
            <th style="${TH_STYLE}">Désignation</th>
            <th style="${TH_STYLE} width:16mm;text-align:center;">Qté</th>
          </tr>
        </thead>
        <tbody>
          ${
            lignesData.length > 0
              ? lignesData
                  .map(
                    (l, idx) => `
            <tr style="background:${idx % 2 === 1 ? ROW_ALT_BG : '#ffffff'};">
              <td style="${TD_STYLE} white-space:normal;">${escapeText(l.designation || '-')}</td>
              <td style="${TD_STYLE} text-align:center;">${escapeText(l.quantite)}</td>
            </tr>`,
                  )
                  .join('')
              : `<tr><td colspan="2" style="${TD_STYLE} text-align:center;color:#9ca3af;font-style:italic;">Aucune ligne de service</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;

  const renderSignatureZone = (zone: PositionedDynamicZone) => `
    <div class="dynamic-content" style="${getServiceZoneStyle(zone)}; ${BODY_TEXT_STYLE}">
      <div style="display: flex; justify-content: space-between; gap: 8mm;">
        <div style="flex: 1;">
          La Société Groupe Cybertek SAS<br />
          Représentée par ${escapeText(selectedCommercial?.nom || commercialData?.commercialId || '—')}<br />
          Directeur Services et Solutions<br /><br /><br />
          Signature : _______________
        </div>
        <div style="flex: 1;">
          La Société ${escapeText(clientData.raisonSociale || clientData.nom)}<br />
          Représentée par ${escapeText(clientData.nom)}<br /><br /><br />
          Signature : _______________
        </div>
      </div>
    </div>
  `;

  const renderOptionsZone = (zone: PositionedDynamicZone) => {
    const selected = nosOptions.filter((o) => o.selected);
    const showPriceCol = !zone.hidePrice && selected.some((o) => o.showPrice !== false);
    const rows = selected
      .map(
        (opt, idx) => `
            <tr style="background:${idx % 2 === 1 ? ROW_ALT_BG : '#ffffff'};">
              <td style="${TD_STYLE} width:30%;font-weight:600;color:#1a1a1a;">${escapeText(opt.name || '—')}</td>
              <td style="${TD_STYLE} white-space:pre-wrap;">${escapeText(resolvePackDescription(opt, adminOptions))}</td>
              ${
                showPriceCol
                  ? `<td style="${TD_STYLE} width:22%;text-align:right;font-weight:700;color:#1a1a1a;">${opt.showPrice !== false && opt.price != null ? `${formatNumber(opt.price)} € HT` : '—'}</td>`
                  : ''
              }
            </tr>`,
      )
      .join('');
    return `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)}; ${SECTION_WRAPPER_STYLE}">
        <div style="${SECTION_BANNER_STYLE}">Détail des services</div>
        <div style="${SECTION_BODY_STYLE}">
          ${
            selected.length === 0
              ? `<p style="${EMPTY_HINT_STYLE}">Aucune option sélectionnée</p>`
              : `<table style="${DATA_TABLE_STYLE}">
                  <thead><tr>
                    <th style="${TH_STYLE} width:30%;">Service</th>
                    <th style="${TH_STYLE}">Description</th>
                    ${showPriceCol ? `<th style="${TH_STYLE} width:22%;text-align:right;">Prix</th>` : ''}
                  </tr></thead>
                  <tbody>${rows}</tbody>
                </table>`
          }
        </div>
      </div>
    `;
  };

  const renderSiteAddressesZone = (zone: PositionedDynamicZone) => {
    const rows = siteAddresses
      .map((s, idx) => `
          <tr style="background:${idx % 2 === 1 ? ROW_ALT_BG : '#ffffff'};">
            <td style="${TD_STYLE} width:30%;font-weight:600;color:#1a1a1a;">${escapeText(s.label || '—')}</td>
            <td style="${TD_STYLE} white-space:pre-wrap;">${escapeText(s.address || '—')}</td>
          </tr>`)
      .join('');
    return `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
        <p style="${SECTION_TITLE_STYLE}">Sites d'intervention</p>
        ${siteAddresses.length === 0
          ? `<p style="${EMPTY_HINT_STYLE}">Aucun site renseigné</p>`
          : `<table style="${DATA_TABLE_STYLE}">
              <thead><tr>
                <th style="${TH_STYLE} width:30%;">Site</th>
                <th style="${TH_STYLE}">Adresse</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>`}
      </div>`;
  };

  const renderOperationalContactZone = (zone: PositionedDynamicZone) => {
    const op = operationalContact ?? { name: '', role: '', email: '', phone: '' };
    const hasData = op.name || op.role || op.email || op.phone;
    return `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
        <p style="${SECTION_TITLE_STYLE}">Contact opérationnel</p>
        ${!hasData
          ? `<p style="${EMPTY_HINT_STYLE}">Non renseigné</p>`
          : `<div style="${INFO_CARD_STYLE}">
              ${op.name ? `<p style="${VALUE_STYLE}">${escapeText(op.name)}</p>` : ''}
              <div style="${BODY_TEXT_STYLE} margin-top:1mm;">
                ${op.role ? `<p style="margin:0.5mm 0;">${escapeText(op.role)}</p>` : ''}
                ${op.email ? `<p style="margin:0.5mm 0;">${escapeText(op.email)}</p>` : ''}
                ${op.phone ? `<p style="margin:0.5mm 0;">${escapeText(op.phone)}</p>` : ''}
              </div>
            </div>`}
      </div>`;
  };

  const renderExternalProvidersZone = (zone: PositionedDynamicZone) => {
    const cards = externalProviders
      .map((p) => `
          <div style="${INFO_CARD_STYLE} margin-bottom:2mm;">
            <p style="${VALUE_STYLE}">${escapeText(p.name || '—')}</p>
            <div style="${BODY_TEXT_STYLE} margin-top:1mm;">
              ${p.role ? `<p style="margin:0.5mm 0;"><span style="${LABEL_STYLE} display:inline-block;margin:0 2mm 0 0;">Rôle</span>${escapeText(p.role)}</p>` : ''}
              ${p.contact ? `<p style="margin:0.5mm 0;"><span style="${LABEL_STYLE} display:inline-block;margin:0 2mm 0 0;">Contact</span>${escapeText(p.contact)}</p>` : ''}
            </div>
          </div>`)
      .join('');
    return `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
        <p style="${SECTION_TITLE_STYLE}">Prestataires extérieurs</p>
        ${externalProviders.length === 0
          ? `<p style="${EMPTY_HINT_STYLE}">Aucun prestataire renseigné</p>`
          : cards}
      </div>`;
  };

  const renderOptionsSummaryZone = (zone: PositionedDynamicZone) => {
    const selected = nosOptions.filter((o) => o.selected);
    const priceLabel = (o: typeof selected[number]): string => {
      if (o.showPrice === false) return '';
      const label = getOptionPriceLabel({
        price: o.price ?? null,
        priceTotal: (o as any).priceTotal ?? null,
        showPriceMode: (o as any).showPriceMode ?? 'mensuel',
        pricingScope: (o as any).pricingScope ?? 'par_machine',
      });
      return label ?? '';
    };
    return `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
        <p style="${SECTION_TITLE_STYLE}">Services & packs souscrits</p>
        ${selected.length === 0
          ? `<p style="${EMPTY_HINT_STYLE}">Aucun élément sélectionné</p>`
          : `<div style="${INFO_CARD_STYLE}">
              <div style="${BODY_TEXT_STYLE}">
                ${selected.map((o) => {
                  const price = priceLabel(o);
                  return `<div style="display:flex;justify-content:space-between;gap:4mm;margin:0.5mm 0;color:#1a1a1a;">
                    <span style="font-weight:500;">• ${escapeText(o.name || '—')}</span>
                    ${price ? `<span style="font-weight:600;white-space:nowrap;">${escapeText(price)}</span>` : ''}
                  </div>`;
                }).join('')}
                <div style="display:flex;justify-content:space-between;gap:4mm;margin-top:2mm;padding-top:2mm;border-top:1px solid #e5e7eb;color:#1a1a1a;">
                  <span style="font-weight:600;">Total Service HT</span>
                  <span style="font-weight:700;">${formatNumber(totalServicesHt)} €</span>
                </div>
              </div>
            </div>`}
      </div>`;
  };


  const renderServiceZone = (zone: PositionedDynamicZone) => {
    if (zone.type === 'service_client_info') return renderClientZone(zone);
    if (zone.type === 'service_conditions') return renderConditionsZone(zone);
    if (zone.type === 'service_invest_table') return renderInvestZone(zone);
    if (zone.type === 'service_signature') return renderSignatureZone(zone);
    if (zone.type === 'service_options') return renderOptionsZone(zone);
    if (zone.type === 'service_site_addresses') return renderSiteAddressesZone(zone);
    if (zone.type === 'service_operational_contact') return renderOperationalContactZone(zone);
    if (zone.type === 'service_external_providers') return renderExternalProvidersZone(zone);
    if (zone.type === 'service_options_summary') return renderOptionsSummaryZone(zone);
    return '';
  };

  const serviceZones = latestVersion.pages.flatMap((page: any) =>
    (page.dynamicZones || [])
      .filter((zone: any) => (zone.type as string).startsWith('service_'))
      .map((zone: any) => ({ ...zone, pageNumber: page.pageNumber })),
  );

  const hasPage1ClientZone = serviceZones.some(
    (zone) => zone.pageNumber === 1 && zone.type === 'service_client_info',
  );

  const zonesToRender = hasPage1ClientZone
    ? serviceZones
    : [
        ...serviceZones,
        {
          id: 'fallback_service_client_info_page1',
          pageNumber: 1,
          type: 'service_client_info' as const,
          sourceSheet: 'client',
          isRequired: true,
          description: 'Informations client',
          position: { top: 82, height: 10 },
        },
      ];

  const serviceZonesByPage = zonesToRender.reduce<Record<number, Array<DynamicZone & { pageNumber: number }>>>((acc, zone) => {
    acc[zone.pageNumber] = [...(acc[zone.pageNumber] || []), zone];
    return acc;
  }, {});

  Object.entries(serviceZonesByPage).forEach(([pageNumber, zones]) => {
    layoutServiceZones(zones).forEach((zone) => {
      const html = renderServiceZone(zone);
      if (!html) return;
      const page = Number(pageNumber);
      dynamicContent[page] = `${dynamicContent[page] || ''}${html}`;
    });
  });

  if (selectedCommercial?.adresse) {
    dynamicContent[1] = `${dynamicContent[1] || ''}
      <div style="position: absolute; bottom: 14px; left: 0; right: 0; text-align: center; font-size: 8px; color: #6b7280; z-index: 1000;">
        ${escapeText(selectedCommercial.adresse)}
      </div>
    `;
  }

  // --- Assemble full HTML doc ---
  const PDF_BASE_WIDTH = 580;
  const PDF_BASE_HEIGHT = PDF_BASE_WIDTH * (297 / 210);
  const A4_W = (210 / 25.4) * 96;
  const A4_H = (297 / 25.4) * 96;
  const PRINT_SCALE = Math.min(A4_W / PDF_BASE_WIDTH, A4_H / PDF_BASE_HEIGHT);

  const allPagesHtml: string[] = [];

  // ============ DARK CG PAGES (documentScope: 'contrat') ============
  const escCg = (s: string) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const CG_FOOTER_HTML = `
    <div style="position:absolute;left:14mm;right:14mm;bottom:8mm;display:flex;justify-content:space-between;align-items:flex-end;gap:8mm;font-family:'Inter',sans-serif;font-size:6.5px;line-height:1.45;color:#6b7280;border-top:0.5px solid #e5e7eb;padding-top:3mm;">
      <div style="flex:1;">
        Groupe Cybertek — SAS au capital de 4 471 800 € · Siège : Zone d'activités Achard Bat U, 130 rue Achard, 33300 Bordeaux<br/>
        RCS Bordeaux 408 772 960 · TVA intracommunautaire FR 27 408 772 960 · Tél. 05 56 39 39 39 · contact@groupe-cybertek.fr · www.groupe-cybertek.fr
      </div>
      <div style="font-family:'Outfit',sans-serif;font-size:9px;font-weight:700;color:#1a1a1a;letter-spacing:2px;white-space:nowrap;">GROUPE | CYBERTEK</div>
    </div>
  `;

  const renderCgHeader = (title: string) => `
    <div style="background:#f3f4f6;color:#1a1a1a;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5mm 14mm;border-bottom:2px solid #e5e7eb;">
      ${escCg(title)}
    </div>
  `;

  const renderCgShell = (title: string, bodyHtml: string, bodyStyle: string = '') => `
    <div class="page-sheet" style="background:#ffffff;">
      <div style="position:relative;width:100%;height:100%;overflow:hidden;">
        ${renderCgHeader(title)}
        <div style="padding:8mm 14mm 30mm 14mm;height:calc(100% - 22mm);overflow:hidden;box-sizing:border-box;${bodyStyle}">
          ${bodyHtml}
        </div>
        ${CG_FOOTER_HTML}
      </div>
    </div>
  `;

  const CG_BANNER_TEXT_IDS = new Set<string>([
    'p1-title', 'p1-date',
    'p2-title',
    'p2p-banner', 'p2p-title',
    'p3m-banner', 'p3m-title',
    'p1c-title', 'p1c-date',
  ]);

  const renderArticle = (el: any): { html: string; chars: number; isTitle: boolean } => {
    const c = el.content as any;
    const raw = String(c?.text ?? '');
    const isTitle = !!c?.bold && raw.length < 120 && !raw.includes('\n');
    if (isTitle) {
      return {
        html: `<h3 style="font-family:'Outfit',sans-serif;font-size:9px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;margin:4mm 0 1.5mm 0;padding-bottom:1mm;border-bottom:1px solid #e5e7eb;break-after:avoid;break-inside:avoid;-webkit-column-break-after:avoid;-webkit-column-break-inside:avoid;page-break-inside:avoid;">${escCg(raw)}</h3>`,
        chars: raw.length,
        isTitle: true,
      };
    }
    const paragraphs = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const body = paragraphs
      .map(
        (p) =>
          `<p style="font-family:'Inter',sans-serif;font-size:7.5px;line-height:1.55;color:#374151;margin:0 0 2mm 0;text-align:justify;break-inside:avoid;-webkit-column-break-inside:avoid;page-break-inside:avoid;">${escCg(p).replace(/\n/g, '<br/>')}</p>`,
      )
      .join('');
    return { html: body, chars: raw.length, isTitle: false };
  };

  const cgPages = visibleTemplatePages.filter(
    (p: any) => (p.documentScope ?? 'both') === 'contrat',
  );
  const cgPageNumbers = new Set<number>(cgPages.map((p: any) => p.pageNumber));

  const isPartiesPage = (p: any) =>
    p.elements?.some(
      (el: any) =>
        el.type === 'text' && String(el.content?.text ?? '').includes('ENTRE LES SOUSSIGNEES'),
    );
  const isSignaturePage = (p: any) =>
    (p.dynamicZones || []).some((z: any) => z.type === 'service_signature');

  const partiesPages = cgPages.filter(isPartiesPage);
  const signaturePages = cgPages.filter(isSignaturePage);
  const articlePages = cgPages.filter(
    (p: any) => !isPartiesPage(p) && !isSignaturePage(p),
  );

  const renderedPartiesPagesHtml: string[] = [];
  for (const page of partiesPages) {
    const texts = (page.elements || [])
      .filter((el: any) => el.type === 'text' && !CG_BANNER_TEXT_IDS.has(String(el.id)))
      .sort((a: any, b: any) => a.position.y - b.position.y);
    const rendered = texts.map((el: any) => {
      const c = el.content as any;
      const raw = String(c?.text ?? '');
      const fw = c?.bold ? '700' : '400';
      const align = c?.textAlign || 'left';
      const col = c?.bold ? '#1a1a1a' : '#374151';
      return {
        html: `<div style="font-family:'Inter',sans-serif;font-size:8px;font-weight:${fw};color:${col};line-height:1.55;text-align:${align};margin-bottom:2mm;white-space:pre-wrap;">${escCg(raw)}</div>`,
        chars: raw.length,
      };
    });
    const dyn = dynamicContent[page.pageNumber] || '';
    const dynWrapped = dyn
      ? `<div style="margin-top:3mm;color:#374151;font-size:8px;">${dyn}</div>`
      : '';

    // Split across multiple pages if content is too tall (approx 3800 chars/page)
    const MAX_PARTIES_CHARS = 3800;
    const buckets: string[][] = [];
    let current: string[] = [];
    let currentChars = 0;
    for (const r of rendered) {
      if (currentChars + r.chars > MAX_PARTIES_CHARS && current.length > 0) {
        buckets.push(current);
        current = [];
        currentChars = 0;
      }
      current.push(r.html);
      currentChars += r.chars;
    }
    if (current.length > 0) buckets.push(current);
    if (buckets.length === 0) buckets.push([]);

    buckets.forEach((bucket, idx) => {
      const isLast = idx === buckets.length - 1;
      const body = bucket.join('') + (isLast ? dynWrapped : '');
      const title =
        buckets.length === 1
          ? 'Contrat cadre — Parties contractantes'
          : `Contrat cadre — Parties contractantes (${idx + 1}/${buckets.length})`;
      renderedPartiesPagesHtml.push(renderCgShell(title, body));
    });
  }

  const renderedSignaturePagesHtml: string[] = [];
  for (const page of signaturePages) {
    const texts = (page.elements || [])
      .filter((el: any) => el.type === 'text' && !CG_BANNER_TEXT_IDS.has(String(el.id)))
      .sort((a: any, b: any) => a.position.y - b.position.y);
    const body = texts
      .map((el: any) => {
        const c = el.content as any;
        const raw = String(c?.text ?? '');
        return `<div style="font-family:'Inter',sans-serif;font-size:9px;color:#1a1a1a;line-height:1.55;margin-bottom:2mm;">${escCg(raw)}</div>`;
      })
      .join('');
    const dyn = dynamicContent[page.pageNumber] || '';
    const dynWrapped = dyn
      ? `<div style="margin-top:6mm;color:#1a1a1a;font-size:9px;">${dyn}</div>`
      : '';
    renderedSignaturePagesHtml.push(
      renderCgShell('Signatures', `<div style="display:flex;flex-direction:column;gap:4mm;">${body}${dynWrapped}</div>`),
    );
  }

  const renderedArticlesHtml: string[] = [];
  if (articlePages.length > 0) {
    const allArticleElements = articlePages
      .flatMap((p: any) =>
        (p.elements || [])
          .filter((el: any) => el.type === 'text' && !CG_BANNER_TEXT_IDS.has(String(el.id)))
          .map((el: any) => ({ ...el, __page: p.pageNumber })),
      )
      .sort((a: any, b: any) => {
        if (a.__page !== b.__page) return a.__page - b.__page;
        return (a.position?.y ?? 0) - (b.position?.y ?? 0);
      });

    const MAX_CHARS_PER_PAGE = 4200;
    const rendered = allArticleElements.map((el: any) => renderArticle(el));

    const buckets: Array<Array<typeof rendered[number]>> = [];
    let current: Array<typeof rendered[number]> = [];
    let currentChars = 0;
    for (let i = 0; i < rendered.length; i++) {
      const item = rendered[i];
      const overflow = currentChars + item.chars > MAX_CHARS_PER_PAGE && current.length > 0;
      if (overflow) {
        // If we're about to place a body paragraph and the previous item is
        // its title, pop the orphan title back to the next page.
        if (!item.isTitle && current.length > 0 && current[current.length - 1].isTitle) {
          const orphanTitle = current.pop()!;
          currentChars -= orphanTitle.chars;
          buckets.push(current);
          current = [orphanTitle];
          currentChars = orphanTitle.chars;
        } else {
          buckets.push(current);
          current = [];
          currentChars = 0;
        }
      }
      current.push(item);
      currentChars += item.chars;
    }
    if (current.length > 0) buckets.push(current);

    buckets.forEach((bucket, idx) => {
      const bodyInner = bucket.map((b) => b.html).join('');
      const body = `<div style="column-count:2;column-gap:8mm;column-fill:balance;height:100%;">${bodyInner}</div>`;
      const title =
        buckets.length === 1
          ? 'Conditions générales'
          : `Conditions générales (${idx + 1}/${buckets.length})`;
      renderedArticlesHtml.push(renderCgShell(title, body));
    });
  }

  let cgBlockEmitted = false;

  for (const page of visibleTemplatePages) {
    if (cgPageNumbers.has(page.pageNumber)) {
      if (!cgBlockEmitted) {
        cgBlockEmitted = true;
        for (const html of renderedPartiesPagesHtml) allPagesHtml.push(html);
        for (const html of renderedArticlesHtml) allPagesHtml.push(html);
        for (const html of renderedSignaturePagesHtml) allPagesHtml.push(html);
      }
      continue;
    }

    const pageHasServiceZones = (page.dynamicZones || []).some((zone: any) =>
      String(zone.type || '').startsWith('service_'),
    );

    if (pageHasServiceZones && page.elements.some((el: any) => el.type !== 'text')) {
      const dynamicZoneLabelIds = new Set([
        'p1c-lbl-benef',
        'p1c-lbl-sites',
        'p1c-lbl-op',
        'p1c-lbl-prest',
        'p2p-lbl-summary',
        'p2p-lbl-cond',
        'p3m-lbl-invest',
        'p3m-lbl-options',
      ]);
      const duplicatedDynamicLabelIds = page.elements
        .filter((el: any) => el.type === 'text' && dynamicZoneLabelIds.has(String(el.id || '')))
        .map((el: any) => el.id);
      const pageHtml = await renderPageToHTML(
        page,
        dynamicContent[page.pageNumber] || '',
        duplicatedDynamicLabelIds,
        { boundedTextBoxes: false },
      );
      allPagesHtml.push(pageHtml);
      continue;
    }

    const nonTextElements = page.elements.filter((el: any) => el.type !== 'text');
    const textElements = page.elements
      .filter((el: any) => el.type === 'text')
      .sort((a: any, b: any) => a.position.y - b.position.y);

    excludeElementIds[page.pageNumber] = [
      ...(excludeElementIds[page.pageNumber] || []),
      ...textElements.map((el: any) => el.id),
    ];

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const textFlowHtml = textElements
      .map((el: any) => {
        const c = el.content as any;
        const fs = Math.max(c.fontSize || 9, 6);
        const fw = c.bold ? '700' : '400';
        const td = c.underline ? 'underline' : 'none';
        const mt = c.bold ? '8px' : '2px';
        const col = c.color || '#1a1a1a';
        const inner = (c.text || '')
          .split('\n')
          .map((l: string) => `<span>${esc(l) || '&nbsp;'}</span>`)
          .join('<br/>');
        return `<div style="font-size:${fs}px;font-weight:${fw};text-decoration:${td};color:${col};text-align:left;line-height:1.5;margin-top:${mt};white-space:pre-wrap;overflow-wrap:break-word;">${inner}</div>`;
      })
      .join('');

    if (nonTextElements.length === 0) {
      const flowRows = textElements
        .map((el: any) => {
          const c = el.content as any;
          const fs = Math.max((c.fontSize || 9) * PREVIEW_FONT_SCALE, 6).toFixed(1);
          const fw = c.bold ? '700' : '400';
          const td = c.underline ? 'underline' : 'none';
          const mt = c.bold ? '3px' : '1px';
          const col = c.color || '#1a1a1a';

          const inner = (c.text || '')
            .split('\n')
            .map((l: string) => `<span>${esc(l) || '&nbsp;'}</span>`)
            .join('<br/>');
          return `<div style="font-size:${fs}px;font-weight:${fw};text-decoration:${td};color:${col};text-align:left;line-height:1.4;margin-top:${mt};white-space:pre-wrap;overflow-wrap:break-word;">${inner}</div>`;
        })
        .join('');

      allPagesHtml.push(`
        <div class="page-sheet">
          <div style="padding:14mm 21mm 18mm 21mm;font-family:'Inter',Arial,sans-serif;height:100%;overflow:hidden;box-sizing:border-box;position:relative;">
            ${flowRows}
            ${dynamicContent[page.pageNumber] || ''}
            <div style="position:absolute;bottom:6mm;left:21mm;right:21mm;font-size:6px;color:#888;text-align:right;border-top:0.5px solid #ddd;padding-top:2px;">GROUPE | CYBERTEK</div>
          </div>
        </div>
      `);
    } else {
      const pageHtml = await renderPageToHTML(
        page,
        dynamicContent[page.pageNumber] || '',
        undefined,
        { boundedTextBoxes: false },
      );
      allPagesHtml.push(pageHtml);

      const extras = extraPagesAfter[page.pageNumber];
      if (extras && extras.length > 0) {
        for (const extraContent of extras) {
          const extraPageHtml = await renderPageToHTML(
            {
              ...page,
              elements: page.elements.filter((el: any) => el.type === 'image'),
              dynamicZones: [],
            },
            extraContent,
            undefined,
            { boundedTextBoxes: false },
          );
          allPagesHtml.push(extraPageHtml);
        }
      }
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @media print {
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0; padding: 0; }
      .page-sheet { display: block; page-break-after: always; break-after: page; page-break-inside: avoid; break-inside: avoid; }
      .page-sheet:last-child { page-break-after: auto; break-after: auto; }
      .page { transform: scale(${PRINT_SCALE.toFixed(6)}); transform-origin: top left; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Inter', Arial, sans-serif; }
    .page-sheet { width: 210mm; height: 297mm; overflow: hidden; background: white; position: relative; }
    .page { width: ${PDF_BASE_WIDTH}px; height: ${PDF_BASE_HEIGHT.toFixed(3)}px; position: relative; overflow: hidden; background: white; }
    @media screen { .page-sheet { width: ${PDF_BASE_WIDTH}px; height: ${PDF_BASE_HEIGHT.toFixed(3)}px; } }
    img { max-width: 100%; height: auto; }
    .dynamic-content { position: absolute; z-index: 40; }
    .rich-text p, .rich-text div { margin: 0; padding: 0; }
    ul, ol { list-style: none !important; margin: 0 !important; padding: 0 !important; }
  </style>
</head>
<body>
${allPagesHtml.join('\n')}
</body>
</html>`;
}

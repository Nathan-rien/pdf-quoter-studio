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
import cbproWhiteLogo from '@/assets/logos/cbpro-wht-filled-baseline.svg';

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

/**
 * Auto-shrink the last block on every `[data-shell-content]` page container
 * if its content overflows the reserved area (before the footer band).
 *
 * Strategy: for each overflowing shell, apply a CSS `transform: scale(f)`
 * on the last `.shell-block` (transform-origin: top left). This scales
 * text, borders and spacing uniformly — regardless of how each inner
 * element sets its own font-size via inline styles. To keep the block
 * visually full-width after scaling, we pre-inflate its width to
 * `100 / f %` so it lands back at 100% once scaled down.
 *
 * Progressive palier: 0.95, 0.9, 0.85, … down to a 0.75 floor. If the
 * content still overflows at the floor, the shell's `overflow:hidden`
 * clips it cleanly — the footer band underneath is never covered.
 *
 * Called by both the PDF export (before html2canvas capture) and the
 * preview iframe (on load), so both stay in visual sync.
 */
export function fitPageContentBlocks(root: HTMLElement | Document): void {
  const scope: ParentNode = root instanceof Document ? root : root;
  const contents = Array.from(
    scope.querySelectorAll<HTMLElement>('[data-shell-content]'),
  );
  for (const content of contents) {
    const wrapper = content.querySelector<HTMLElement>('[data-shell-scale]');
    if (!wrapper) continue;

    // Reset any previous transform so re-runs stay idempotent.
    wrapper.style.transform = '';
    wrapper.style.transformOrigin = 'top left';
    wrapper.style.width = '';

    const overflows = () => content.scrollHeight > content.clientHeight + 1;
    if (!overflows()) continue;

    const paliers = [0.95, 0.9, 0.85, 0.8, 0.75];
    for (const factor of paliers) {
      wrapper.style.width = `${(100 / factor).toFixed(3)}%`;
      wrapper.style.transform = `scale(${factor})`;
      if (!overflows()) break;
    }
  }
}




// 10mm rhythm between sections (10 / 297 * 100 ≈ 3.37%)
const SERVICE_ZONE_GAP_PERCENT = 3.4;

// Unified design tokens — Service Proposal (devis + contrat)
const SECTION_TITLE_STYLE =
  "font-family:'Outfit',sans-serif;font-size:12.5px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:0.75px;margin:0 0 3mm 0;";
const INFO_CARD_STYLE =
  "background:#ffffff;border:1px solid #d1d5db;border-radius:8px;padding:5mm 6mm;";
// Secondary/detail text
const BODY_TEXT_STYLE =
  "font-family:'Inter',sans-serif;font-size:12.5px;font-weight:400;color:#4b5563;line-height:1.5;";
// Field label (BÉNÉFICIAIRE, VOTRE INTERLOCUTEUR, …)
const LABEL_STYLE =
  "font-family:'Inter',sans-serif;font-size:11.5px;font-weight:700;color:#111111;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 1.5mm 0;";
// Primary value under a label
const VALUE_STYLE =
  "font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:#111111;margin:0;";
// Flat data tables (no header background box, alternating row bands, thin dividers)
const DATA_TABLE_STYLE =
  "width:100%;border-collapse:collapse;font-family:'Inter',sans-serif;font-size:12.5px;line-height:1.5;color:#4b5563;table-layout:fixed;";
const TH_STYLE =
  "padding:3mm 4mm;text-align:left;font-weight:700;color:#111111;background:transparent;border:none;border-bottom:2px solid #4b5563;font-size:11.5px;font-family:'Inter',sans-serif;letter-spacing:0.05em;text-transform:uppercase;";
const TD_STYLE =
  "padding:3mm 4mm;border:none;border-bottom:1px solid #f0f1f3;color:#4b5563;vertical-align:top;font-size:12.5px;font-family:'Inter',sans-serif;overflow-wrap:anywhere;";
const ROW_ALT_BG = "#f9fafb";
const EMPTY_HINT_STYLE =
  "font-family:'Inter',sans-serif;font-size:12.5px;color:#9ca3af;font-style:italic;margin:0;";
// Section card: white background, rounded, thin grey border. Banner sits on the top edge.
const SECTION_WRAPPER_STYLE =
  "border:1px solid #d1d5db;border-radius:8px;overflow:hidden;background:#ffffff;";
const SECTION_BANNER_STYLE =
  "background:#4b5563;color:#ffffff;font-family:'Outfit',sans-serif;font-size:12.5px;font-weight:700;letter-spacing:0.75px;text-transform:uppercase;padding:3mm 5mm;";
const SECTION_BODY_STYLE = "padding:6mm 7mm;";

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

  // Devis pages 1-3 zones are rendered as flow blocks stacked inside the
  // shell (renderShellPage). There is no more absolute positioning based on
  // fixed % coordinates — each block's height follows its real content, so
  // `fitPageContentBlocks` can measure real overflow and shrink the last
  // block when needed instead of letting it be clipped without warning.


  const estimateTextVisualLines = (text: string): number =>
    Math.max(
      1,
      text
        .split('\n')
        .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 72)), 0),
    );

  // Block wrapper (no absolute positioning) — every zone renders as a flow card.
  // Devis pages 1-3 stack these vertically inside a shell that reserves footer space,
  // so section heights follow real content and never overlap the footer.
  const BLOCK_WRAPPER_STYLE = `${SECTION_WRAPPER_STYLE}display:block;`;


  const renderClientZone = (zone: PositionedDynamicZone) => `
    <div style="${BLOCK_WRAPPER_STYLE}">
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
    <div style="${BLOCK_WRAPPER_STYLE}">
      <div style="${SECTION_BANNER_STYLE}">Vos modalités de règlement</div>
      <div style="${SECTION_BODY_STYLE}">
        <table style="${DATA_TABLE_STYLE}">
          <tbody>
            ${conditionsRows
              .map(
                ([label, value, bold], idx) => `
              <tr style="background:${idx % 2 === 1 ? ROW_ALT_BG : '#ffffff'};">
                <td style="padding:3mm 4mm;border:none;border-bottom:1px solid #f0f1f3;font-family:'Inter',sans-serif;font-size:11.5px;font-weight:700;color:#111111;text-transform:uppercase;letter-spacing:0.05em;width:38%;vertical-align:top;">${escapeText(label)}</td>
                <td style="${TD_STYLE} ${bold ? 'font-weight:700;color:#111111;text-align:right;' : ''}">${escapeText(value)}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const renderInvestZone = (zone: PositionedDynamicZone) => `
    <div style="${BLOCK_WRAPPER_STYLE}">
      <div style="${SECTION_BANNER_STYLE}">Matériel concerné</div>
      <div style="${SECTION_BODY_STYLE}">
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
                <td style="${TD_STYLE} white-space:normal;font-weight:700;color:#111111;">${escapeText(l.designation || '-')}</td>
                <td style="${TD_STYLE} text-align:center;">${escapeText(l.quantite)}</td>
              </tr>`,
                    )
                    .join('')
                : `<tr><td colspan="2" style="${TD_STYLE} text-align:center;color:#9ca3af;font-style:italic;">Aucune ligne de service</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  const renderSignatureZone = (zone: PositionedDynamicZone) => `
    <div style="${BODY_TEXT_STYLE}">
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

  const renderOptionsBlock = (
    zone: PositionedDynamicZone,
    chunk: typeof nosOptions,
    isContinuation: boolean,
    startIdx: number,
  ) => {
    const showPriceCol =
      !zone.hidePrice && nosOptions.filter((o) => o.selected).some((o) => o.showPrice !== false);
    const rows = chunk
      .map(
        (opt, i) => `
            <tr style="background:${(startIdx + i) % 2 === 1 ? ROW_ALT_BG : '#ffffff'};">
              <td style="${TD_STYLE} width:30%;font-weight:700;color:#111111;">${escapeText(opt.name || '—')}</td>
              <td style="${TD_STYLE} white-space:pre-wrap;">${escapeText(resolvePackDescription(opt, adminOptions))}</td>
              ${
                showPriceCol
                  ? `<td style="${TD_STYLE} width:22%;text-align:right;font-weight:700;color:#111111;">${opt.showPrice !== false && opt.price != null ? `${formatNumber(opt.price)} € HT` : '—'}</td>`
                  : ''
              }
            </tr>`,
      )
      .join('');
    return `
      <div style="${BLOCK_WRAPPER_STYLE}">
        <div style="${SECTION_BANNER_STYLE}">Détail des services${isContinuation ? ' (suite)' : ''}</div>
        <div style="${SECTION_BODY_STYLE}">
          ${
            chunk.length === 0
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

  // Split options into a first chunk + continuation chunks based on rough
  // per-row "visual lines" so long descriptions push overflow to a new page.
  const renderOptionsZoneSplit = (
    zone: PositionedDynamicZone,
    firstBudget: number,
    contBudget: number,
  ): string[] => {
    const selected = nosOptions.filter((o) => o.selected);
    if (selected.length === 0) return [renderOptionsBlock(zone, [], false, 0)];
    const rowCost = (opt: (typeof selected)[number]) => {
      const desc = resolvePackDescription(opt, adminOptions) || '';
      return 1.5 + estimateTextVisualLines(desc);
    };
    const chunks: Array<typeof selected> = [];
    let current: typeof selected = [];
    let used = 0;
    let budget = firstBudget;
    for (const opt of selected) {
      const cost = rowCost(opt);
      if (current.length > 0 && used + cost > budget) {
        chunks.push(current);
        current = [];
        used = 0;
        budget = contBudget;
      }
      current.push(opt);
      used += cost;
    }
    if (current.length > 0) chunks.push(current);
    let startIdx = 0;
    return chunks.map((chunk, i) => {
      const html = renderOptionsBlock(zone, chunk, i > 0, startIdx);
      startIdx += chunk.length;
      return html;
    });
  };

  // Legacy single-block renderer (used when the split path isn't taken).
  const renderOptionsZone = (zone: PositionedDynamicZone) =>
    renderOptionsBlock(
      zone,
      nosOptions.filter((o) => o.selected),
      false,
      0,
    );


  const renderSiteAddressesZone = (zone: PositionedDynamicZone) => {
    const rows = siteAddresses
      .map((s, idx) => `
          <tr style="background:${idx % 2 === 1 ? ROW_ALT_BG : '#ffffff'};">
            <td style="${TD_STYLE} width:30%;font-weight:700;color:#111111;">${escapeText(s.label || '—')}</td>
            <td style="${TD_STYLE} white-space:pre-wrap;">${escapeText(s.address || '—')}</td>
          </tr>`)
      .join('');
    return `
      <div style="${BLOCK_WRAPPER_STYLE}">
        <div style="${SECTION_BANNER_STYLE}">Sites d'intervention</div>
        <div style="${SECTION_BODY_STYLE}">
          ${siteAddresses.length === 0
            ? `<p style="${EMPTY_HINT_STYLE}">Aucun site renseigné</p>`
            : `<table style="${DATA_TABLE_STYLE}">
                <thead><tr>
                  <th style="${TH_STYLE} width:30%;">Site</th>
                  <th style="${TH_STYLE}">Adresse</th>
                </tr></thead>
                <tbody>${rows}</tbody>
              </table>`}
        </div>
      </div>`;
  };

  const renderOperationalContactZone = (zone: PositionedDynamicZone) => {
    const op = operationalContact ?? { name: '', role: '', email: '', phone: '' };
    const hasData = op.name || op.role || op.email || op.phone;
    return `
      <div style="${BLOCK_WRAPPER_STYLE}">
        <div style="${SECTION_BANNER_STYLE}">Contact opérationnel</div>
        <div style="${SECTION_BODY_STYLE}">
          ${!hasData
            ? `<p style="${EMPTY_HINT_STYLE}">Non renseigné</p>`
            : `<div>
                ${op.name ? `<p style="${VALUE_STYLE}">${escapeText(op.name)}</p>` : ''}
                <div style="${BODY_TEXT_STYLE} margin-top:1mm;">
                  ${op.role ? `<p style="margin:0.5mm 0;">${escapeText(op.role)}</p>` : ''}
                  ${op.email ? `<p style="margin:0.5mm 0;">${escapeText(op.email)}</p>` : ''}
                  ${op.phone ? `<p style="margin:0.5mm 0;">${escapeText(op.phone)}</p>` : ''}
                </div>
              </div>`}
        </div>
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
      <div style="${BLOCK_WRAPPER_STYLE}">
        <div style="${SECTION_BANNER_STYLE}">Prestataires extérieurs</div>
        <div style="${SECTION_BODY_STYLE}">
          ${externalProviders.length === 0
            ? `<p style="${EMPTY_HINT_STYLE}">Aucun prestataire renseigné</p>`
            : cards}
        </div>
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
      <div style="${BLOCK_WRAPPER_STYLE}">
        <div style="${SECTION_BANNER_STYLE}">Services &amp; packs souscrits</div>
        <div style="${SECTION_BODY_STYLE}">
          ${selected.length === 0
            ? `<p style="${EMPTY_HINT_STYLE}">Aucun élément sélectionné</p>`
            : `<div>
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
        </div>
      </div>`;
  };


  const TARIFS_ROWS: Array<[string, string]> = [
    ['Technicien', '500 € HT'],
    ['Administrateur', '600 € HT'],
    ['Ingénieur serveur réseau', '900 € HT'],
  ];

  const renderTarifsZone = () => `
    <div style="${BLOCK_WRAPPER_STYLE}">
      <div style="${SECTION_BANNER_STYLE}">Interventions sur site en supplément</div>
      <div style="${SECTION_BODY_STYLE}">
        <table style="${DATA_TABLE_STYLE}">
          <thead>
            <tr>
              <th style="${TH_STYLE}">Intervention</th>
              <th style="${TH_STYLE} width:40mm;text-align:right;">Tarif</th>
            </tr>
          </thead>
          <tbody>
            ${TARIFS_ROWS.map(
              ([label, value], idx) => `
              <tr style="background:${idx % 2 === 1 ? ROW_ALT_BG : '#ffffff'};">
                <td style="${TD_STYLE} font-weight:700;color:#111111;">${escapeText(label)}</td>
                <td style="${TD_STYLE} text-align:right;font-weight:700;color:#111111;">${escapeText(value)}</td>
              </tr>`,
            ).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

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
    if ((zone.type as string) === 'service_tarifs_interventions') return renderTarifsZone();
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

  // Preserve source order of zones on each page (as declared in the template).
  // Wrap each rendered zone in a `.shell-block` div so the fit helper can target
  // the last block on a page for auto-shrink if it overflows the reserved area.
  Object.entries(serviceZonesByPage).forEach(([pageNumber, zones]) => {
    const page = Number(pageNumber);
    const onlyOptions =
      zones.length === 1 && zones[0].type === 'service_options';
    zones.forEach((zone) => {
      if (zone.type === 'service_options') {
        // Adaptive budgets (visual-line units): looser when the page contains
        // only this zone, tighter when it shares the page with other blocks.
        const blocks = renderOptionsZoneSplit(
          zone as PositionedDynamicZone,
          onlyOptions ? 32 : 14,
          32,
        );
        dynamicContent[page] = `${dynamicContent[page] || ''}<div class="shell-block">${blocks[0]}</div>`;
        if (blocks.length > 1) {
          extraPagesAfter[page] = [
            ...(extraPagesAfter[page] || []),
            ...blocks.slice(1).map((b) => `<div class="shell-block">${b}</div>`),
          ];
        }
        return;
      }
      const html = renderServiceZone(zone as PositionedDynamicZone);
      if (!html) return;
      dynamicContent[page] = `${dynamicContent[page] || ''}<div class="shell-block">${html}</div>`;
    });
  });



  // (Devis pages 1-3 footer is injected below alongside the Cybertek Pro logo)


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

  const CBPRO_LOGO_URL = '/__l5e/assets-v1/0991e1b4-5b95-4112-9fd7-da00ecefcca0/cbpro-logo.svg';

  // Footer is anchored to a strictly reserved bottom band (24mm high for
  // contract pages; devis pages use a slimmer 16mm variant below).
  // Content area above stops before this band so nothing can overlap it.
  const CG_FOOTER_HTML = `
    <div style="position:absolute;left:0;right:0;bottom:0;height:24mm;padding:3mm 10mm 6mm 10mm;box-sizing:border-box;display:flex;align-items:center;font-family:'Inter',sans-serif;font-size:8px;line-height:1.35;color:#9ca3af;border-top:1px solid #e5e7eb;background:#ffffff;">
      <div style="flex:1;">
        Groupe Cybertek — SAS au capital de 4 471 800 € · TVA intracom. FR78408772960 · RCS Bordeaux 408 772 960<br/>
        Zone d'activités Achard Bat U, 130 rue Achard, 33300 Bordeaux · Tél. 05 56 11 88 99 · commercial@cybertek-pro.fr · www.cybertek-pro.fr
      </div>
    </div>
  `;

  // Slimmer footer used on devis pages (pages 1-3) to leave more room for content.
  const DEVIS_FOOTER_HTML = `
    <div style="position:absolute;left:0;right:0;bottom:0;height:16mm;padding:2mm 6mm 2mm 6mm;box-sizing:border-box;display:flex;align-items:center;font-family:'Inter',sans-serif;font-size:7.5px;line-height:1.35;color:#9ca3af;border-top:1px solid #e5e7eb;background:#ffffff;">
        <div style="font-size:6.5px;">Groupe Cybertek SAS au capital de 4 471 800€ · TVA INTRACOM FR78408772960 · RCS BORDEAUX 408 772 960 · Zone d'activités Achard Bat U, 130 rue Achard, 33300 Bordeaux · Tél. 05 56 11 88 99 · commercial@cybertek-pro.fr · www.cybertek-pro.fr</div>
    </div>
  `;

  const renderCgHeader = (title: string, hPad: string = '10mm') => `
    <div style="background:#000000;color:#ffffff;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;padding:6mm ${hPad};display:flex;align-items:center;justify-content:space-between;gap:8mm;">
      <div style="flex:1;min-width:0;">${escCg(title)}</div>
      <img src="${cbproWhiteLogo}" alt="Cybertek Pro" style="width:90px;height:24px;object-fit:contain;flex-shrink:0;" />
    </div>
  `;

  // Shell layout — strict, absolute reservation:
  //   header  : top 0, natural height (~17mm)
  //   content : top 22mm → bottom 24mm  (overflow:hidden, clips before footer)
  //   footer  : bottom 0, height 24mm  (never overlapped by content)
  const renderCgShell = (title: string, bodyHtml: string, bodyStyle: string = '') => `
    <div class="page-sheet" style="background:#ffffff;">
      <div style="position:relative;width:100%;height:100%;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;">${renderCgHeader(title)}</div>
        <div class="shell-content" data-shell-content style="position:absolute;top:22mm;left:0;right:0;bottom:24mm;padding:2mm 10mm 0 10mm;box-sizing:border-box;overflow:hidden;${bodyStyle}">
          <div data-shell-scale>${bodyHtml}</div>
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
    const MAX_PARTIES_CHARS = 3200;
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
          ? 'Parties contractantes'
          : `Parties contractantes (${idx + 1}/${buckets.length})`;
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

  // Devis pages 1-3 render through a shell (same header + footer as CG pages),
  // stacking zone blocks vertically so content flows and never overlaps the footer.
  // Devis pages 1-3 render through a shell that mirrors the CG shell:
  // strict absolute reservation of the bottom 16mm for the slimmer devis
  // footer, content clipped by overflow:hidden above the footer band.
  const renderShellPage = (title: string, blocksHtml: string) => `
    <div class="page-sheet" style="background:#ffffff;">
      <div style="position:relative;width:100%;height:100%;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;">${renderCgHeader(title, '6mm')}</div>
        <div class="shell-content" data-shell-content style="position:absolute;top:22mm;left:0;right:0;bottom:16mm;padding:2mm 6mm 0 6mm;box-sizing:border-box;overflow:hidden;">
          <div data-shell-scale>${blocksHtml}</div>
        </div>
        ${DEVIS_FOOTER_HTML}
      </div>
    </div>
  `;




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

    // Devis pages (documentScope 'both'): unified shell rendering.
    if ((page.documentScope ?? 'both') === 'both') {
      const title = String(page.title || '').trim() || 'Contrat cadre de prestations de services';
      allPagesHtml.push(renderShellPage(title, dynamicContent[page.pageNumber] || ''));
      const extras = extraPagesAfter[page.pageNumber];
      if (extras && extras.length > 0) {
        for (const extra of extras) {
          allPagesHtml.push(renderShellPage(title, extra));
        }
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
    .dynamic-content { position: static; z-index: 40; }
    .shell-content .shell-block { display: block; position: static; margin: 0 0 8mm 0; }
    .shell-content .shell-block:last-child { margin-bottom: 0; }

    .rich-text p, .rich-text div { margin: 0; padding: 0; }
    ul, ol { list-style: none !important; margin: 0 !important; padding: 0 !important; }
  </style>
</head>
<body>
${allPagesHtml.join('\n')}
</body>
</html>`;
}

/**
 * Composant d'export PDF pour une Proposition Services (standalone).
 *
 * Lit ses données métier depuis useServiceProposalStore.
 * Le template sélectionné reste synchronisé avec rentalProposalStore, comme dans l'aperçu.
 *
 * Sections générées :
 *   - Pages du template (toutes)
 *   - Page custom "Services inclus" insérée après la page 3 du template
 *   - Pas de Votre offre, pas de loyer mensuel, pas de reprise, pas d'Avantages/Conditions
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  FileText,
  CheckCircle,
  Loader2,
  User,
  Package,
  Calculator,
} from 'lucide-react';
import { useServiceProposalStore } from '@/stores/serviceProposalStore';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { useOptionsAdminStore } from '@/stores/optionsAdminStore';
import { useTemplateSync } from '@/hooks/useTemplateSync';
import { resolvePackDescription } from '@/lib/pack-description';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  generatePDFDocumentHTML,
  renderPageToHTML,
  clearImageCache,
  setPdfSubstitutionContext,
} from '@/lib/pdf-html-generator';
import { ENTITIES, getCommercialById } from '@/data/commerciaux';
import type { DynamicZone } from '@/types/pdf-template';

const SERVICES_INSERTION_AFTER_PAGE = 3;
const SERVICE_ZONE_GAP_PERCENT = 1.25;

type PositionedDynamicZone = DynamicZone & {
  layoutTop?: number;
  layoutMinHeight?: number;
};

export function ServiceProposalExport({ mode = 'devis' }: { mode?: 'devis' | 'contrat' } = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  useTemplateSync();

  const clientData = useServiceProposalStore((s) => s.clientData);
  const commercialData = useServiceProposalStore((s) => s.commercialData);
  const lignesData = useServiceProposalStore((s) => s.lignesData);
  
  const selectedTemplateId = useServiceProposalStore((s) => s.selectedTemplateId);
  const rentalSelectedTemplateId = useRentalProposalStore((s) => s.selectedTemplateId);
  const proposalName = useServiceProposalStore((s) => s.proposalName);
  const totalInvest = useServiceProposalStore((s) => s.totalInvest);
  const selectedServices = useServiceProposalStore((s) => s.selectedServices);
  const paymentFrequency = useServiceProposalStore((s) => s.paymentFrequency);
  const paymentMode = useServiceProposalStore((s) => s.paymentMode);
  const contractDuration = useServiceProposalStore((s) => s.contractDuration);
  const startDate = useServiceProposalStore((s) => s.startDate);
  const totalServicesHt = useServiceProposalStore((s) => s.totalServicesHt);
  const nosOptions = useServiceProposalStore((s) => s.nosOptions);
  const siteAddresses = useServiceProposalStore((s) => s.siteAddresses);
  const operationalContact = useServiceProposalStore((s) => s.operationalContact);
  const externalProviders = useServiceProposalStore((s) => s.externalProviders);
  const adminOptions = useOptionsAdminStore((s) => s.options);

  const { getActiveTemplate, getTemplatePublishedVersion, allTemplates } =
    useTemplateEditorStore();

  const effectiveTemplateId = rentalSelectedTemplateId || selectedTemplateId;

  const activeTemplate = useMemo(() => {
    if (effectiveTemplateId) {
      const selected = allTemplates.find((t) => t.id === effectiveTemplateId);
      if (selected) return selected;
    }
    const activePublished = allTemplates.find((t) => t.isActive && !!getTemplatePublishedVersion(t.id));
    if (activePublished) return activePublished;
    return allTemplates.find((t) => !!getTemplatePublishedVersion(t.id)) || getActiveTemplate();
  }, [effectiveTemplateId, allTemplates, getActiveTemplate, getTemplatePublishedVersion]);

  const latestVersion = activeTemplate
    ? getTemplatePublishedVersion(activeTemplate.id)
    : null;
  const visibleTemplatePages = (latestVersion?.pages ?? []).filter((p: any) => {
    const s = p.documentScope ?? 'both';
    return s === 'both' || s === mode;
  });
  const totalPages = visibleTemplatePages.length;

  const selectedCommercial = useMemo(() => {
    if (!commercialData.commercialId) return null;
    return getCommercialById(commercialData.commercialId);
  }, [commercialData.commercialId]);

  const entityLabel = useMemo(() => {
    if (!commercialData.entity) return null;
    return (
      ENTITIES.find((e) => e.id === commercialData.entity)?.label ||
      commercialData.entity
    );
  }, [commercialData.entity]);

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const generateFileName = () => {
    const baseName =
      proposalName ||
      clientData.raisonSociale ||
      clientData.nom ||
      'Proposition_Services';
    const safe = baseName
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
      .replace(/\s+/g, '_');
    const date = new Date().toISOString().split('T')[0];
    return `Proposition_Services_${safe}_${date}.pdf`;
  };

  // --- Sauvegarde dans proposal_exports ---
  const saveToHistory = async (
    htmlContent: string,
    status: 'success' | 'error',
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user - cannot save to history');
        return;
      }

      const displayName =
        proposalName ||
        `Proposition Services ${clientData.raisonSociale || clientData.nom}` ||
        'Proposition Services';

      const snapshot =
        status === 'success'
          ? {
              kind: 'service-proposal',
              clientData,
              commercialData,
              lignesData,
              selectedTemplateId: effectiveTemplateId,
              proposalName,
              totalInvest,
              selectedServices,
              paymentFrequency,
              paymentMode,
              contractDuration,
              startDate,
              totalServicesHt,
            }
          : null;

      await supabase.from('proposal_exports').insert({
        proposal_name: displayName,
        file_name: generateFileName(),
        client_name: clientData.raisonSociale || clientData.nom || null,
        template_id: activeTemplate?.id || null,
        template_name: activeTemplate?.name || 'Template par défaut',
        status,
        row_count: lignesData.length,
        options_count: 0,
        pdf_html_content: status === 'success' ? htmlContent : null,
        created_by: user.id,
        commercial_id: commercialData.commercialId || null,
        commercial_name: selectedCommercial?.nom || null,
        montant_investissement: totalInvest || null,
        selected_options_names: [],
        selected_nos_options_names: [],
        proposal_state: snapshot,
        proposal_type: 'service',
      } as any);
    } catch (err) {
      console.error('Failed to save service proposal to history:', err);
    }
  };

  // --- Attente assets ---
  const waitForAssetsReady = async (win: Window): Promise<void> => {
    const TIMEOUT_MS = 5000;
    try {
      const fontsPromise = (win.document as any).fonts?.ready;
      if (fontsPromise) {
        await Promise.race([
          fontsPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fonts timeout')), TIMEOUT_MS),
          ),
        ]);
      }
    } catch (err) {
      console.warn('[Export] fonts timeout', err);
    }
    const images = Array.from(
      win.document.querySelectorAll('img'),
    ) as HTMLImageElement[];
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const t = setTimeout(resolve, TIMEOUT_MS);
          img.onload = () => {
            clearTimeout(t);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(t);
            resolve();
          };
        });
      }),
    );
    await new Promise<void>((resolve) =>
      win.requestAnimationFrame(() =>
        win.requestAnimationFrame(() => resolve()),
      ),
    );
  };

  // --- Génération du contenu dynamique par page ---
  const generateDynamicContentByPage = useCallback(() => {
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
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)}; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr;">
          <div style="padding-right: 12px;">
            <p style="font-size: 7px; color: #6b7280; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 3px 0; font-weight: 600;">Bénéficiaire</p>
            <div style="font-size: 8px; line-height: 1.3; color: #4b5563;">
              ${clientData.raisonSociale ? `<p style="font-weight: 700; font-size: 9px; color: #1f2937; margin: 0;">${escapeText(clientData.raisonSociale)}</p>` : ''}
              ${clientData.nom ? `<p style="margin: 1px 0; font-weight: 600;">${escapeText(clientData.nom)}</p>` : ''}
              ${clientData.adresse ? `<p style="margin: 1px 0;">${escapeText(clientData.adresse)}</p>` : ''}
              ${clientData.email ? `<p style="margin: 1px 0;">${escapeText(clientData.email)}</p>` : ''}
              ${clientData.telephone ? `<p style="margin: 1px 0;">${escapeText(clientData.telephone)}</p>` : ''}
            </div>
          </div>
          <div style="border-left: 1px solid #e5e7eb; padding-left: 12px;">
            <p style="font-size: 7px; color: #6b7280; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 3px 0; font-weight: 600;">Votre interlocuteur</p>
            ${
              selectedCommercial
                ? `
              <div style="font-size: 8px; line-height: 1.3; color: #4b5563;">
                <p style="font-weight: 700; font-size: 9px; color: #1f2937; margin: 0;">${escapeText(selectedCommercial.nom)}</p>
                ${selectedCommercial.telephone ? `<p style="margin: 1px 0;">${escapeText(selectedCommercial.telephone)}</p>` : ''}
                ${selectedCommercial.email ? `<p style="margin: 1px 0;">${escapeText(selectedCommercial.email)}</p>` : ''}
                ${entityLabel ? `<p style="margin: 1px 0;">${escapeText(entityLabel)}</p>` : ''}
              </div>
            `
                : '<p style="font-size: 8px; color: #9ca3af; font-style: italic; margin: 0;">Non sélectionné</p>'
            }
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
      ['Total HT services', `${formatNumber(totalServicesHt)} €`, true],
      ...(periodicRent !== null
        ? ([[
            paymentFrequency === 'mensuel' ? 'Loyer mensuel HT' : 'Loyer trimestriel HT',
            `${formatNumber(periodicRent)} €`,
            true,
          ]] as Array<[string, string, boolean?]>)
        : []),
    ];

    const renderConditionsZone = (zone: PositionedDynamicZone) => `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
        <p style="font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; color: #000000; margin: 0 0 4px 0;">Vos modalités de règlement :</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 8px; line-height: 1.2; background: white; border: 1px solid #e5e7eb; table-layout: fixed;">
          <tbody>
            ${conditionsRows
              .map(
                ([label, value, bold]) => `
              <tr>
                <td style="width: 38%; padding: 3px 6px; background: #f9fafb; font-weight: 600; color: #374151; border: 1px solid #e5e7eb; vertical-align: top;">${escapeText(label)}</td>
                <td style="padding: 3px 6px; color: #1f2937; border: 1px solid #e5e7eb; overflow-wrap: anywhere; vertical-align: top; ${bold ? 'font-weight: 700; text-align: right;' : ''}">${escapeText(value)}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    const renderInvestZone = (zone: PositionedDynamicZone) => `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
        <table style="width: 100%; border-collapse: collapse; font-size: 7.2px; line-height: 1.15; background: white; table-layout: fixed;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 3px 5px; text-align: left; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.03em; border: 1px solid #e5e7eb;">Désignation</th>
              <th style="padding: 3px 5px; text-align: center; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.03em; border: 1px solid #e5e7eb; width: 34px;">Qté</th>
            </tr>
          </thead>
          <tbody>
            ${
              lignesData.length > 0
                ? lignesData
                    .map(
                      (l, idx) => `
              <tr style="background: ${idx % 2 === 1 ? '#fafafa' : 'white'};">
                <td style="padding: 3px 5px; border: 1px solid #e5e7eb; vertical-align: top; overflow-wrap: anywhere; white-space: normal;">${escapeText(l.designation || '-')}</td>
                <td style="padding: 3px 5px; border: 1px solid #e5e7eb; text-align: center; vertical-align: top;">${escapeText(l.quantite)}</td>
              </tr>`,
                    )
                    .join('')
                : '<tr><td colspan="2" style="padding: 8px; text-align: center; color: #9ca3af; font-style: italic; border: 1px solid #e5e7eb;">Aucune ligne de service</td></tr>'
            }
          </tbody>
        </table>
      </div>
    `;


    const renderSignatureZone = (zone: PositionedDynamicZone) => `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)}; font-size: 9px; color: #1f2937;">
        <div style="display: flex; justify-content: space-between; gap: 24px;">
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
      const rows = selected.length
        ? selected
            .map(
              (opt) => `
              <tr>
                <td style="width: 30%; padding: 3px 6px; background: #f9fafb; font-weight: 600; color: #374151; border: 1px solid #e5e7eb; vertical-align: top;">${escapeText(opt.name || '—')}</td>
                <td style="padding: 3px 6px; color: #4b5563; border: 1px solid #e5e7eb; white-space: pre-wrap; overflow-wrap: anywhere; vertical-align: top;">${escapeText(resolvePackDescription(opt, adminOptions))}</td>
                ${
                  !zone.hidePrice && opt.showPrice !== false
                    ? `<td style="width: 22%; padding: 3px 6px; color: #1f2937; border: 1px solid #e5e7eb; text-align: right; font-weight: 700; vertical-align: top;">${opt.price != null ? `${formatNumber(opt.price)} € HT` : '—'}</td>`
                    : ''
                }

              </tr>`,
            )
            .join('')
        : '';
      return `
        <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
          <p style="font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; color: #000000; margin: 0 0 4px 0;">Options disponibles :</p>
          ${
            selected.length === 0
              ? '<p style="font-size: 8px; color: #9ca3af; font-style: italic; margin: 0;">Aucune option sélectionnée</p>'
              : `<table style="width: 100%; border-collapse: collapse; font-size: 8px; line-height: 1.2; background: white; border: 1px solid #e5e7eb; table-layout: fixed;"><tbody>${rows}</tbody></table>`
          }
        </div>
      `;
    };

    const renderSiteAddressesZone = (zone: PositionedDynamicZone) => {
      const rows = siteAddresses.length
        ? siteAddresses.map((s) => `
            <tr>
              <td style="width: 30%; padding: 3px 6px; background: #f9fafb; font-weight: 600; color: #374151; border: 1px solid #e5e7eb; vertical-align: top;">${escapeText(s.label || '—')}</td>
              <td style="padding: 3px 6px; color: #1f2937; border: 1px solid #e5e7eb; vertical-align: top; white-space: pre-wrap; overflow-wrap: anywhere;">${escapeText(s.address || '—')}</td>
            </tr>`).join('')
        : '';
      return `
        <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
          <p style="font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; color: #000000; margin: 0 0 4px 0;">Sites d'intervention :</p>
          ${siteAddresses.length === 0
            ? '<p style="font-size: 8px; color: #9ca3af; font-style: italic; margin: 0;">Aucun site renseigné</p>'
            : `<table style="width: 100%; border-collapse: collapse; font-size: 8px; line-height: 1.2; background: white; border: 1px solid #e5e7eb; table-layout: fixed;"><tbody>${rows}</tbody></table>`}
        </div>`;
    };

    const renderOperationalContactZone = (zone: PositionedDynamicZone) => {
      const op = operationalContact ?? { name: '', role: '', email: '', phone: '' };
      const hasData = op.name || op.role || op.email || op.phone;
      return `
        <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
          <p style="font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; color: #000000; margin: 0 0 4px 0;">Contact opérationnel :</p>
          ${!hasData
            ? '<p style="font-size: 8px; color: #9ca3af; font-style: italic; margin: 0;">Non renseigné</p>'
            : `<div style="font-size: 8px; line-height: 1.3; color: #374151; border: 1px solid #e5e7eb; background: #ffffff; border-radius: 4px; padding: 6px 8px;">
                ${op.name ? `<p style="margin: 0; font-weight: 700; font-size: 9px; color: #1f2937;">${escapeText(op.name)}</p>` : ''}
                ${op.role ? `<p style="margin: 1px 0;">${escapeText(op.role)}</p>` : ''}
                ${op.email ? `<p style="margin: 1px 0;">${escapeText(op.email)}</p>` : ''}
                ${op.phone ? `<p style="margin: 1px 0;">${escapeText(op.phone)}</p>` : ''}
              </div>`}
        </div>`;
    };

    const renderExternalProvidersZone = (zone: PositionedDynamicZone) => {
      const rows = externalProviders.length
        ? externalProviders.map((p) => `
            <tr>
              <td style="padding: 3px 6px; border: 1px solid #e5e7eb; vertical-align: top; font-weight: 600; color: #1f2937;">${escapeText(p.name || '—')}</td>
              <td style="padding: 3px 6px; border: 1px solid #e5e7eb; vertical-align: top; color: #4b5563;">${escapeText(p.role || '—')}</td>
              <td style="padding: 3px 6px; border: 1px solid #e5e7eb; vertical-align: top; color: #4b5563; overflow-wrap: anywhere;">${escapeText(p.contact || '—')}</td>
            </tr>`).join('')
        : '';
      return `
        <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
          <p style="font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; color: #000000; margin: 0 0 4px 0;">Prestataires extérieurs :</p>
          ${externalProviders.length === 0
            ? '<p style="font-size: 8px; color: #9ca3af; font-style: italic; margin: 0;">Aucun prestataire renseigné</p>'
            : `<table style="width: 100%; border-collapse: collapse; font-size: 8px; line-height: 1.2; background: white; border: 1px solid #e5e7eb; table-layout: fixed;">
                <thead><tr style="background: #f3f4f6;">
                  <th style="padding: 3px 6px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Nom</th>
                  <th style="padding: 3px 6px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Rôle</th>
                  <th style="padding: 3px 6px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb;">Contact</th>
                </tr></thead>
                <tbody>${rows}</tbody>
              </table>`}
        </div>`;
    };




    const renderOptionsSummaryZone = (zone: PositionedDynamicZone) => {
      const selected = nosOptions.filter((o) => o.selected);
      return `
        <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
          <p style="font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; color: #000000; margin: 0 0 4px 0;">Services & packs souscrits :</p>
          ${selected.length === 0
            ? '<p style="font-size: 8px; color: #9ca3af; font-style: italic; margin: 0;">Aucun élément sélectionné</p>'
            : `<ul style="margin: 0; padding: 0 0 0 14px; font-size: 9px; line-height: 1.4; color: #1f2937;">
                ${selected.map((o) => `<li style="margin-bottom: 2px;">${escapeText(o.name || '—')}</li>`).join('')}
              </ul>`}
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

    const serviceZones = latestVersion?.pages.flatMap((page) =>
      (page.dynamicZones || [])
        .filter((zone) => (zone.type as string).startsWith('service_'))
        .map((zone) => ({ ...zone, pageNumber: page.pageNumber })),
    ) ?? [];

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




    return {
      content: dynamicContent,
      excludeIds: excludeElementIds,
      extraPagesAfter,
    };
  }, [
    clientData,
    commercialData,
    lignesData,
    
    selectedServices,
    paymentFrequency,
    paymentMode,
    contractDuration,
    startDate,
    totalServicesHt,
    selectedCommercial,
    entityLabel,
    totalInvest,
    nosOptions,
    siteAddresses,
    operationalContact,
    externalProviders,
    latestVersion,
  ]);

  // --- Génération HTML complet ---
  const generatePDFContentFromTemplate = useCallback(async (): Promise<string> => {
    if (!latestVersion || latestVersion.pages.length === 0) {
      throw new Error('Aucun template disponible pour générer le PDF');
    }

    const substitutionContext = {
      fraisDossier: 0,
      adresseEntite: selectedCommercial?.adresse ?? null,
    };
    setPdfSubstitutionContext(substitutionContext);

    const { content, excludeIds, extraPagesAfter } = generateDynamicContentByPage();
    const docTitle = generateFileName().replace(/\.pdf$/i, '');

    const PDF_BASE_WIDTH = 580;
    const PDF_BASE_HEIGHT = PDF_BASE_WIDTH * (297 / 210);
    const A4_W = (210 / 25.4) * 96;
    const A4_H = (297 / 25.4) * 96;
    const PRINT_SCALE = Math.min(A4_W / PDF_BASE_WIDTH, A4_H / PDF_BASE_HEIGHT);

    const allPagesHtml: string[] = [];

    for (const page of visibleTemplatePages) {
      const nonTextElements = page.elements.filter((el) => el.type !== 'text');
      const textElements = page.elements
        .filter((el) => el.type === 'text')
        .sort((a, b) => a.position.y - b.position.y);

      excludeIds[page.pageNumber] = [
        ...(excludeIds[page.pageNumber] || []),
        ...textElements.map((el) => el.id),
      ];

      const esc = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const textFlowHtml = textElements
        .map((el) => {
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
          .map((el) => {
            const c = el.content as any;
            const fs = Math.max((c.fontSize || 9) * 0.73, 5).toFixed(1);
            const fw = c.bold ? '700' : '400';
            const td = c.underline ? 'underline' : 'none';
            const mt = c.bold ? '6px' : '1.5px';
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
            <div style="padding:14mm 16mm 18mm 16mm;font-family:'Inter',Arial,sans-serif;height:100%;overflow:hidden;box-sizing:border-box;position:relative;">
              ${flowRows}
              ${content[page.pageNumber] || ''}
              <div style="position:absolute;bottom:6mm;left:16mm;right:16mm;font-size:6px;color:#888;text-align:right;border-top:0.5px solid #ddd;padding-top:2px;">GROUPE | CYBERTEK</div>
            </div>
          </div>
        `);
      } else {
        const existingDynamic = content[page.pageNumber] || '';
        const textAsAbsolute = textFlowHtml
          ? `<div style="position:absolute;top:7%;left:3%;right:3%;font-family:'Inter',Arial,sans-serif;line-height:1.4;">${textFlowHtml}</div>`
          : '';
        const finalDynamic = existingDynamic + textAsAbsolute;
        const pageWithOnlyNonText = { ...page, elements: nonTextElements };
        const pageHtml = await renderPageToHTML(
          pageWithOnlyNonText,
          finalDynamic,
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
                elements: page.elements.filter((el) => el.type === 'image'),
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
  }, [latestVersion, selectedCommercial, generateDynamicContentByPage]);

  // --- Handler téléchargement ---
  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      clearImageCache();
      const htmlContent = await generatePDFContentFromTemplate();
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast({
          title: 'Erreur',
          description:
            "Impossible d'ouvrir la fenêtre d'impression. Vérifiez les popups.",
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }

      const fileName = generateFileName();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = async () => {
        try {
          await waitForAssetsReady(printWindow);
          printWindow.print();
        } catch (err) {
          console.error('[Export] asset loading error', err);
        }
      };

      printWindow.onafterprint = async () => {
        printWindow.close();
        if (!isGenerated) {
          await saveToHistory(htmlContent, 'success');
        }
        setIsGenerating(false);
        setIsGenerated(true);
        toast({
          title: 'PDF généré',
          description: `Le document "${fileName}" a été préparé pour le téléchargement.`,
        });
      };

      setTimeout(() => {
        if (isGenerating) setIsGenerating(false);
      }, 30000);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      await saveToHistory('', 'error');
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération du PDF.',
        variant: 'destructive',
      });
      setIsGenerating(false);
    }
  };

  function buildStandaloneTextDocument(pagesHtml: string, title: string): string {
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      @media print { @page { size: A4 portrait; margin: 0; } html,body { margin:0; padding:0; } }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; background: white; font-family: 'Inter', Arial, sans-serif; }
      .text-page-sheet { width:210mm; height:297mm; overflow:hidden; background:white; page-break-after:always; break-after:page; page-break-inside:avoid; break-inside:avoid; position:relative; }
      .text-page-sheet:last-child { page-break-after:auto; break-after:auto; }
      .text-page-content { padding:20mm 18mm 25mm 18mm; overflow:hidden; height:100%; }
      .page-footer { position:absolute; bottom:8mm; left:18mm; right:18mm; font-size:8px; color:#888; text-align:right; border-top:0.5px solid #ccc; padding-top:3px; }
    </style>
    </head><body>${pagesHtml}</body></html>`;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Exporter la proposition</CardTitle>
        <CardDescription>
          Générez et téléchargez le document final au format PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <User className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium truncate">
              {clientData.raisonSociale || clientData.nom || '-'}
            </p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Lignes services</p>
            <p className="font-medium">{lignesData.length}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <Calculator className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total HT</p>
            <p className="font-medium">{formatNumber(totalInvest)} €</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Pages template</p>
            <p className="font-medium">{totalPages}</p>
          </div>
        </div>

        <Separator />

        <div className="text-center py-8 space-y-4">
          {isGenerated ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div>
                <p className="font-medium text-success">
                  Document généré avec succès
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous pouvez télécharger à nouveau le PDF si nécessaire
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">Proposition prête à l'export</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliquez sur le bouton ci-dessous pour générer le PDF
                </p>
              </div>
            </>
          )}

          <Button
            size="lg"
            onClick={handleDownloadPDF}
            disabled={isGenerating || !latestVersion}
            className="min-w-[200px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {isGenerated ? 'Télécharger à nouveau' : 'Télécharger le PDF'}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Nom du fichier : {generateFileName()}
          </p>
        </div>

        {activeTemplate && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Template utilisé :</span>
              <span className="font-medium">{activeTemplate.name}</span>
            </div>
            <Badge variant="secondary">Actif</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

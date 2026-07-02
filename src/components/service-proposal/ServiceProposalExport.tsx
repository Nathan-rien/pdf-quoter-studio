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
import { useTemplateSync } from '@/hooks/useTemplateSync';
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

export function ServiceProposalExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  useTemplateSync();

  const clientData = useServiceProposalStore((s) => s.clientData);
  const commercialData = useServiceProposalStore((s) => s.commercialData);
  const lignesData = useServiceProposalStore((s) => s.lignesData);
  const servicesInclus = useServiceProposalStore((s) => s.servicesInclus);
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
  const totalPages = latestVersion?.pages.length || 0;

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
              servicesInclus,
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

    const getFallbackZoneTop = (zone: DynamicZone): number =>
      zone.type === 'service_client_info'
        ? 82
        : zone.type === 'service_conditions'
          ? 10
          : zone.type === 'service_invest_table'
            ? 5
            : 65;

    const getFallbackZoneHeight = (zone: DynamicZone): number =>
      zone.type === 'service_client_info'
        ? 10
        : zone.type === 'service_conditions'
          ? 16
          : zone.type === 'service_invest_table'
            ? 30
            : 18;

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

    const conditionsRows: Array<[string, string, boolean?]> = [
      ['Services', selectedServices.map((s) => s.label).join(', ') || '—'],
      ['Périodicité', paymentFrequency === 'mensuel' ? 'Mensuelle' : paymentFrequency === 'trimestriel' ? 'Trimestrielle' : '—'],
      ['Mode de règlement', paymentMode === 'prelevement' ? 'Prélèvement automatique' : paymentMode === 'virement' ? 'Virement bancaire' : '—'],
      ['Durée', contractDuration ? `${contractDuration} mois` : '—'],
      ['Démarrage', startDate ? new Date(startDate).toLocaleDateString('fr-FR') : '—'],
      ['Total HT services', `${formatNumber(totalServicesHt)} €`, true],
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
              <th style="padding: 3px 5px; text-align: right; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.03em; border: 1px solid #e5e7eb; width: 56px;">P.U. HT</th>
              <th style="padding: 3px 5px; text-align: right; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.03em; border: 1px solid #e5e7eb; width: 64px;">Total HT</th>
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
                <td style="padding: 3px 5px; border: 1px solid #e5e7eb; text-align: right; vertical-align: top;">${formatNumber(l.prixUnitaire)}</td>
                <td style="padding: 3px 5px; border: 1px solid #e5e7eb; text-align: right; vertical-align: top; font-weight: 600;">${formatNumber(l.totalHT)}</td>
              </tr>`,
                    )
                    .join('')
                : '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #9ca3af; font-style: italic; border: 1px solid #e5e7eb;">Aucune ligne de service</td></tr>'
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 4px 5px; border: 1px solid #d1d5db; text-align: right; font-weight: 700; color: #374151; background: white;">Total HT</td>
              <td style="padding: 4px 5px; border: 1px solid #d1d5db; text-align: right; font-weight: 700; color: #1f2937; background: white;">${formatNumber(totalInvest)} €</td>
            </tr>
          </tfoot>
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

    const renderServiceZone = (zone: PositionedDynamicZone) => {
      if (zone.type === 'service_client_info') return renderClientZone(zone);
      if (zone.type === 'service_conditions') return renderConditionsZone(zone);
      if (zone.type === 'service_invest_table') return renderInvestZone(zone);
      if (zone.type === 'service_signature') return renderSignatureZone(zone);
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

    // ---------- Page custom "Services inclus" ----------
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const servicesInclusLinesHTML = (servicesInclus.description || '')
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        const isSubItem = trimmed.startsWith('- ');
        const text = escapeHtml(isSubItem ? trimmed : `• ${trimmed}`);
        return `<div style="line-height: 1.4;${isSubItem ? ' padding-left: 10px;' : ''}">${text}</div>`;
      })
      .join('');

    const servicesInclusPageHTML = `
      <div class="dynamic-content" style="position: absolute; left: 5%; right: 5%; top: 6%; z-index: 40;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>
          <h2 style="font-weight: 700; font-size: 14px; color: #1f2937; margin: 0;">Les services inclus dans votre offre</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
          <div style="background: #f3f4f6; padding: 6px 12px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 8px; height: 16px; background: #374151; border-radius: 2px;"></div>
            <span style="font-weight: 600; font-size: 11px;">Services location</span>
          </div>
          <div style="padding: 6px 12px; background: white; color: #4b5563; font-size: 9px;">
            ${servicesInclusLinesHTML}
          </div>
        </div>
      </div>
    `;

    // Insertion après la page 3 du template
    extraPagesAfter[SERVICES_INSERTION_AFTER_PAGE] = [
      servicesInclusPageHTML,
    ];

    return {
      content: dynamicContent,
      excludeIds: excludeElementIds,
      extraPagesAfter,
    };
  }, [
    clientData,
    commercialData,
    lignesData,
    servicesInclus,
    selectedServices,
    paymentFrequency,
    paymentMode,
    contractDuration,
    startDate,
    totalServicesHt,
    selectedCommercial,
    entityLabel,
    totalInvest,
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

    for (const page of latestVersion.pages) {
      const isTextOnly =
        page.elements.length > 0 &&
        page.elements.every((el) => el.type === 'text');

      if (isTextOnly) {
        const sorted = [...page.elements].sort(
          (a, b) => a.position.y - b.position.y,
        );
        const FSCALE = 1.32;
        const rows = sorted
          .map((el) => {
            const c = el.content as any;
            const fs = Math.max((c.fontSize || 9) * FSCALE, 7).toFixed(1);
            const fw = c.bold ? '700' : '400';
            const td = c.underline ? 'underline' : 'none';
            const mt = c.bold ? '9px' : '2px';
            const col = c.color || '#1a1a1a';
            const ta = c.textAlign || 'justify';
            const esc = (s: string) =>
              s
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            const lines = (c.text || '').split('\n');
            const html = lines
              .map((l: string) => `<div>${esc(l) || '&nbsp;'}</div>`)
              .join('\n');
            return `<p style="font-size:${fs}px;font-weight:${fw};text-decoration:${td};color:${col};text-align:${ta};line-height:1.45;margin:0;margin-top:${mt};margin-bottom:2px;">${html}</p>`;
          })
          .join('');

        allPagesHtml.push(`
          <div class="text-page-sheet">
            <div class="text-page-content">
              ${rows}
            </div>
            <div class="page-footer">GROUPE | CYBERTEK</div>
          </div>
        `);
      } else {
        const dynamicContent = content[page.pageNumber] || '';
        const excludeIds_page = excludeIds[page.pageNumber];
        const pageHtml = await renderPageToHTML(
          page,
          dynamicContent,
          excludeIds_page,
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
      .text-page-sheet { page-break-after: always; break-after: page; page-break-inside: avoid; break-inside: avoid; }
      .text-page-sheet:last-child { page-break-after: auto; break-after: auto; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Inter', Arial, sans-serif; }
    .page-sheet { width: 210mm; height: 297mm; overflow: hidden; background: white; position: relative; }
    .page { width: ${PDF_BASE_WIDTH}px; height: ${PDF_BASE_HEIGHT.toFixed(3)}px; position: relative; overflow: hidden; background: white; }
    .text-page-sheet { width: 210mm; height: 297mm; overflow: hidden; background: white; position: relative; }
    .text-page-content { padding: 20mm 18mm 25mm 18mm; overflow: hidden; height: 100%; }
    .page-footer { position: absolute; bottom: 8mm; left: 18mm; right: 18mm; font-size: 8px; color: #888; text-align: right; border-top: 0.5px solid #ccc; padding-top: 3px; }
    @media screen { .page-sheet, .text-page-sheet { width: ${PDF_BASE_WIDTH}px; height: ${PDF_BASE_HEIGHT.toFixed(3)}px; } }
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

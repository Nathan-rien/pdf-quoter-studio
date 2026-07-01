/**
 * Composant d'export PDF pour une Proposition Services (standalone).
 *
 * Lit ses données métier depuis useServiceProposalStore.
 * Le template sélectionné reste synchronisé avec rentalProposalStore, comme dans l'aperçu.
 *
 * Sections générées :
 *   - Pages du template (toutes)
 *   - Page custom "Vos services" insérée après la page 3 du template
 *   - Page custom "Services inclus" insérée juste après
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
  clearImageCache,
  setPdfSubstitutionContext,
} from '@/lib/pdf-html-generator';
import { ENTITIES, getCommercialById } from '@/data/commerciaux';
import type { DynamicZone } from '@/types/pdf-template';

const SERVICES_INSERTION_AFTER_PAGE = 3;

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
      return (
        allTemplates.find((t) => t.id === effectiveTemplateId) ||
        getActiveTemplate()
      );
    }
    return getActiveTemplate();
  }, [effectiveTemplateId, allTemplates, getActiveTemplate]);

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

    const getServiceZoneStyle = (zone: DynamicZone) => {
      const fallbackTop =
        zone.type === 'service_client_info'
          ? 82
          : zone.type === 'service_conditions'
            ? 10
            : zone.type === 'service_invest_table'
              ? 5
              : 65;
      const fallbackHeight =
        zone.type === 'service_client_info'
          ? 10
          : zone.type === 'service_conditions'
            ? 12
            : zone.type === 'service_invest_table'
              ? 28
              : 18;

      return [
        'position: absolute',
        `top: ${zone.position?.top ?? fallbackTop}%`,
        'left: 4%',
        'right: 4%',
        `height: ${zone.position?.height ?? fallbackHeight}%`,
        'z-index: 1000',
        'overflow: hidden',
      ].join('; ');
    };

    const renderClientZone = (zone: DynamicZone) => `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)}; background: rgba(255,255,255,0.95); border-radius: 8px; padding: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; height: 100%; overflow: hidden;">
          <div style="font-size: 8px; line-height: 1.25; overflow: hidden;">
            ${clientData.raisonSociale ? `<p style="font-weight: 700; margin: 0;">${escapeText(clientData.raisonSociale)}</p>` : ''}
            <p style="font-weight: 600; margin: 0;">${escapeText(clientData.nom || 'Nom du client')}</p>
            <p style="color: #6b7280; margin: 1px 0;">${escapeText(clientData.adresse || 'Adresse')}</p>
            ${clientData.email ? `<p style="color: #6b7280; margin: 1px 0;">${escapeText(clientData.email)}</p>` : ''}
            ${clientData.telephone ? `<p style="color: #6b7280; margin: 1px 0;">${escapeText(clientData.telephone)}</p>` : ''}
          </div>
          <div style="overflow: hidden;">
            <p style="font-weight: 600; font-size: 9px; margin: 0 0 4px 0;">Votre interlocuteur</p>
            ${
              selectedCommercial
                ? `
              <div style="font-size: 8px; line-height: 1.25;">
                <p style="font-weight: 600; margin: 0;">${escapeText(selectedCommercial.nom)}</p>
                ${selectedCommercial.telephone ? `<p style="color: #6b7280; margin: 1px 0;">${escapeText(selectedCommercial.telephone)}</p>` : ''}
                <p style="color: #6b7280; margin: 1px 0;">${escapeText(selectedCommercial.email)}</p>
                ${entityLabel ? `<p style="color: #6b7280; margin: 1px 0;">${escapeText(entityLabel)}</p>` : ''}
              </div>
            `
                : '<p style="font-size: 8px; color: #9ca3af; font-style: italic;">Non sélectionné</p>'
            }
          </div>
        </div>
      </div>
    `;

    const renderConditionsZone = (zone: DynamicZone) => `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)}; font-size: 9px; line-height: 1.6; color: #1f2937;">
        Services : ${escapeText(selectedServices.map((s) => s.label).join(', '))}<br />
        Périodicité : ${paymentFrequency === 'mensuel' ? 'Mensuelle' : paymentFrequency === 'trimestriel' ? 'Trimestrielle' : '—'}<br />
        Mode de règlement : ${paymentMode === 'prelevement' ? 'Prélèvement automatique' : paymentMode === 'virement' ? 'Virement bancaire' : '—'}<br />
        Durée : ${contractDuration ? `${contractDuration} mois` : '—'}<br />
        Démarrage : ${startDate ? new Date(startDate).toLocaleDateString('fr-FR') : '—'}<br />
        Total HT services : ${formatNumber(totalServicesHt)} €
      </div>
    `;

    const renderInvestZone = (zone: DynamicZone) => `
      <div class="dynamic-content" style="${getServiceZoneStyle(zone)};">
        <table style="width: 100%; border-collapse: collapse; font-size: 8px; background: white;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 4px 6px; text-align: left; font-weight: 600;">Désignation</th>
              <th style="padding: 4px 6px; text-align: center; width: 50px;">Qté</th>
              <th style="padding: 4px 6px; text-align: right; width: 75px;">P.U. HT</th>
              <th style="padding: 4px 6px; text-align: right; width: 75px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${
              lignesData.length > 0
                ? lignesData
                    .map(
                      (l) => `
              <tr>
                <td style="padding: 4px 6px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; white-space: pre-wrap;">${escapeText(l.designation || '-')}</td>
                <td style="padding: 4px 6px; border-bottom: 1px solid #e5e7eb; text-align: center;">${escapeText(l.quantite)}</td>
                <td style="padding: 4px 6px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(l.prixUnitaire)}</td>
                <td style="padding: 4px 6px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatNumber(l.totalHT)}</td>
              </tr>`,
                    )
                    .join('')
                : '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #9ca3af; font-style: italic;">Aucune ligne de service</td></tr>'
            }
          </tbody>
        </table>
        <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 6px 10px; min-width: 180px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 10px; color: #1e40af; gap: 12px;">
              <span>Total HT :</span>
              <span>${formatNumber(totalInvest)} €</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const renderSignatureZone = (zone: DynamicZone) => `
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

    const renderServiceZone = (zone: DynamicZone) => {
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

    serviceZones.forEach((zone) => {
      const html = renderServiceZone(zone);
      if (!html) return;
      dynamicContent[zone.pageNumber] = `${dynamicContent[zone.pageNumber] || ''}${html}`;
    });

    const hasPage1ClientZone = serviceZones.some(
      (zone) => zone.pageNumber === 1 && zone.type === 'service_client_info',
    );

    if (!hasPage1ClientZone) {
      dynamicContent[1] = `${dynamicContent[1] || ''}${renderClientZone({
        id: 'fallback_service_client_info_page1',
        pageNumber: 1,
        type: 'service_client_info',
        sourceSheet: 'client',
        isRequired: true,
        description: 'Informations client',
        position: { top: 82, height: 10 },
      })}`;
    }

    if (selectedCommercial?.adresse) {
      dynamicContent[1] = `${dynamicContent[1] || ''}
        <div style="position: absolute; bottom: 14px; left: 0; right: 0; text-align: center; font-size: 8px; color: #6b7280; z-index: 1000;">
          ${escapeText(selectedCommercial.adresse)}
        </div>
      `;
    }

    // ---------- Page custom "Vos services" ----------
    const tableRowsHTML = lignesData
      .map(
        (l) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; word-wrap: break-word; white-space: pre-wrap; max-width: 60%;">${l.designation || '-'}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${l.quantite}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(l.prixUnitaire)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatNumber(l.totalHT)}</td>
      </tr>`,
      )
      .join('');

    const vosServicesPageHTML = `
      <div class="dynamic-content" style="position: absolute; left: 5%; right: 5%; top: 6%; z-index: 40;">
        <h2 style="font-weight: 700; font-size: 14px; color: #1f2937; margin: 0 0 12px 0;">Vos services</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; background: white;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; text-align: left; font-weight: 600;">Désignation</th>
              <th style="padding: 8px; text-align: center; width: 60px;">Qté</th>
              <th style="padding: 8px; text-align: right; width: 90px;">P.U. HT</th>
              <th style="padding: 8px; text-align: right; width: 90px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${
              tableRowsHTML ||
              '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #9ca3af; font-style: italic;">Aucune ligne de service</td></tr>'
            }
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; min-width: 220px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 11px; color: #1e40af;">
              <span>Total HT :</span>
              <span>${formatNumber(totalInvest)} €</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // ---------- Page custom "Services inclus" ----------
    const servicesInclusEscaped = (servicesInclus.description || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const servicesInclusPageHTML = `
      <div class="dynamic-content" style="position: absolute; left: 5%; right: 5%; top: 6%; z-index: 40;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>
          <h2 style="font-weight: 700; font-size: 14px; color: #1f2937; margin: 0;">Les services inclus dans votre offre</h2>
        </div>
        <div style="font-size: 10px; line-height: 1.6; color: #1f2937; white-space: pre-wrap;">${servicesInclusEscaped}</div>
      </div>
    `;

    // Insertion après la page 3 du template
    extraPagesAfter[SERVICES_INSERTION_AFTER_PAGE] = [
      vosServicesPageHTML,
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
  const generatePDFContentFromTemplate =
    useCallback(async (): Promise<string> => {
      if (!latestVersion || latestVersion.pages.length === 0) {
        throw new Error('Aucun template disponible pour générer le PDF');
      }

      const substitutionContext = {
        fraisDossier: 0,
        adresseEntite: selectedCommercial?.adresse ?? null,
      };
      setPdfSubstitutionContext(substitutionContext);

      const { content, excludeIds, extraPagesAfter } =
        generateDynamicContentByPage();

      const docTitle = generateFileName().replace(/\.pdf$/i, '');
      return generatePDFDocumentHTML(
        latestVersion,
        content,
        substitutionContext,
        excludeIds,
        extraPagesAfter,
        docTitle,
      );
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

/**
 * Aperçu PDF pour une Proposition Services (standalone).
 * Réécriture sans race condition : résolution unique de la version + lazy loading once.
 */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, FileCheck, icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useServiceProposalStore } from '@/stores/serviceProposalStore';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { useTemplateSync } from '@/hooks/useTemplateSync';
import {
  CANVAS_DISPLAY_MAX_WIDTH,
  PREVIEW_FONT_SCALE,
  PREVIEW_ICON_SCALE,
  LIST_INDENT_PX,
} from '@/lib/canvas-constants';
import { ALLOWED_FONTS } from '@/lib/template-styles';
import {
  getSharedElementStyle,
  sortElementsByZIndex,
  resolveImageUrl,
  substituteDynamicPlaceholders,
} from '@/lib/template-render-utils';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { getCommercialById } from '@/data/commerciaux';
import type {
  EditableElement,
  TextContent,
  ImageContent,
  ShapeContent,
  IconContent,
  TemplateVersion,
} from '@/types/template-editor';
import type { DynamicZone, PDFPageNumber } from '@/types/pdf-template';

const TEMPLATE_PAGES_BEFORE = 3;
const SERVICE_ZONE_GAP_PERCENT = 1.25;

type PositionedDynamicZone = DynamicZone & {
  layoutTop?: number;
  layoutMinHeight?: number;
};

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function ServiceProposalPreview() {
  const [currentPage, setCurrentPage] = useState(1);

  const clientData = useServiceProposalStore((s) => s.clientData);
  const lignesData = useServiceProposalStore((s) => s.lignesData);
  
  const proposalName = useServiceProposalStore((s) => s.proposalName);
  const totalInvest = useServiceProposalStore((s) => s.totalInvest);
  const selectedServices = useServiceProposalStore((s) => s.selectedServices);
  const nosOptions = useServiceProposalStore((s) => s.nosOptions);
  const paymentFrequency = useServiceProposalStore((s) => s.paymentFrequency);
  const paymentMode = useServiceProposalStore((s) => s.paymentMode);
  const contractDuration = useServiceProposalStore((s) => s.contractDuration);
  const startDate = useServiceProposalStore((s) => s.startDate);
  const totalServicesHt = useServiceProposalStore((s) => s.totalServicesHt);
  const commercialData = useServiceProposalStore((s) => s.commercialData);

  // Lire selectedTemplateId directement depuis rentalProposalStore
  // car c'est là que TemplateSelector écrit (comme dans RentalProposalPreview)
  const selectedTemplateId = useRentalProposalStore((s) => s.selectedTemplateId);

  const [isEditMode, setIsEditMode] = useState(false);
  const [pagesLoaded, setPagesLoaded] = React.useState(false);
  const { isLoading, hasLoaded, loadVersionPages, isLoadingVersion } = useTemplateSync();
  const {
    allTemplates,
    getActiveTemplate,
    getTemplatePublishedVersion,
    currentVersion: editorCurrentVersion,
  } = useTemplateEditorStore();

  const activeTemplate = React.useMemo(() => {
    if (selectedTemplateId) {
      const found = allTemplates.find((t) => t.id === selectedTemplateId);
      if (found) {
        console.log('[ServiceProposalPreview] Using selectedTemplateId:', selectedTemplateId, found.name);
        return found;
      }
    }
    const active = allTemplates.find((t) => t.isActive && !!getTemplatePublishedVersion(t.id));
    if (active) {
      console.log('[ServiceProposalPreview] Fallback to active template:', active.name);
      return active;
    }
    const first = allTemplates.find((t) => !!getTemplatePublishedVersion(t.id)) ?? null;
    console.log('[ServiceProposalPreview] Fallback to first published template:', first?.name);
    return first;
  }, [selectedTemplateId, allTemplates, getTemplatePublishedVersion]);

  const getCurrentVersion = React.useCallback((): TemplateVersion | null => {
    // Dans le parcours Proposition, on doit toujours utiliser la dernière version publiée.
    // La version courante de l'éditeur peut être un ancien brouillon (ex: v10) et ne doit
    // pas masquer la version publiée disponible pour les devis (ex: v11).
    if (isEditMode && editorCurrentVersion && activeTemplate && editorCurrentVersion.templateId === activeTemplate.id && editorCurrentVersion.pages.length > 0) {
      return editorCurrentVersion;
    }

    if (!activeTemplate) return null;
    const version = getTemplatePublishedVersion(activeTemplate.id);
    return version && version.pages.length > 0 ? version : null;
  }, [activeTemplate, getTemplatePublishedVersion, editorCurrentVersion, isEditMode]);

  React.useEffect(() => {
    const loadPages = async () => {
      if (!hasLoaded) return;
      if (!activeTemplate) {
        setPagesLoaded(true);
        return;
      }
      const version = getTemplatePublishedVersion(activeTemplate.id);
      if (!version) {
        setPagesLoaded(true);
        return;
      }
      if (version.pages.length === 0) {
        const loadedPages = await loadVersionPages(version.id);
        if (loadedPages && loadedPages.length > 0) {
          setPagesLoaded(true);
        } else {
          console.warn('[ServiceProposalPreview] No pages loaded for version:', version.id);
        }
        return;
      }
      setPagesLoaded(true);
    };
    setPagesLoaded(false);
    loadPages();
  }, [hasLoaded, activeTemplate, getTemplatePublishedVersion, loadVersionPages]);

  if ((isLoading && !hasLoaded) || isLoadingVersion || !pagesLoaded) {
    return <LoadingState message="Chargement du template..." />;
  }

  const currentVersion = getCurrentVersion();

  const handleRetry = () => {
    setPagesLoaded(false);
    if (!activeTemplate) return;
    const version = getTemplatePublishedVersion(activeTemplate.id);
    if (version) loadVersionPages(version.id);
  };

  const templatePagesTotal = currentVersion?.pages.length ?? 0;
  const totalPages = Math.max(1, templatePagesTotal);

  const getStaticPageElements = (pageNumber: PDFPageNumber): EditableElement[] => {
    if (!currentVersion) return [];
    const pageContent = currentVersion.pages.find((p) => p.pageNumber === pageNumber);
    if (!pageContent) return [];
    return sortElementsByZIndex(pageContent.elements.filter((el) => !el.isDynamic));
  };

  const previewZIndex = (el: EditableElement): number => (el.zIndex ?? 0) + 10;

  const renderTemplateElement = (element: EditableElement) => {
    const style: React.CSSProperties = {
      ...getSharedElementStyle({ element }),
      zIndex: previewZIndex(element),
    };

    if (element.type === 'text') {
      const content = element.content as TextContent;
      const fontDef = ALLOWED_FONTS.find((f) => f.name === content.fontFamily);
      const fontValue = fontDef?.value || 'Outfit, sans-serif';
      const scaledFontSize = Math.max(content.fontSize * PREVIEW_FONT_SCALE, 6);
      const indentPx = (content.indentLevel || 0) * LIST_INDENT_PX;

      const inner = content.htmlContent ? (
        <div
          style={{ paddingLeft: `${indentPx}px` }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(substituteDynamicPlaceholders(content.htmlContent)) }}
        />
      ) : (
        <>
          {substituteDynamicPlaceholders(content.text || '').split('\n').map((line, i) => (
            <div key={i} style={{ paddingLeft: `${indentPx}px` }}>
              {content.listType === 'bullet' && '• '}
              {content.listType === 'numbered' && `${i + 1}. `}
              {line || '\u00A0'}
            </div>
          ))}
        </>
      );

      return (
        <div key={element.id} style={style}>
          <div
            className="px-0.5 py-px"
            style={{
              fontFamily: fontValue,
              fontSize: `${scaledFontSize}px`,
              color: content.color || '#1f2937',
              fontWeight: content.bold ? 'bold' : 'normal',
              fontStyle: content.italic ? 'italic' : 'normal',
              textDecoration: content.underline ? 'underline' : 'none',
              lineHeight: 1.2,
              textAlign: content.textAlign || 'left',
              width: '100%',
            }}
          >
            <div className="rich-text whitespace-pre-wrap break-words">{inner}</div>
          </div>
        </div>
      );
    }

    if (element.type === 'image') {
      const content = element.content as ImageContent;
      const url = resolveImageUrl(content);
      return (
        <div key={element.id} style={{ ...style, opacity: (content.opacity ?? 100) / 100 }}>
          {url && (
            <img
              src={url}
              alt={content.alt || 'Image'}
              className={`w-full h-full ${content.objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
              style={{ transform: `rotate(${content.rotation || 0}deg)` }}
            />
          )}
        </div>
      );
    }

    if (element.type === 'shape') {
      const content = element.content as ShapeContent;
      const s: React.CSSProperties = {
        ...style,
        backgroundColor:
          content.backgroundColor !== 'transparent' ? content.backgroundColor : undefined,
        opacity: (content.backgroundOpacity ?? 100) / 100,
        borderRadius:
          content.shapeType === 'circle' || content.shapeType === 'ellipse'
            ? '50%'
            : `${content.cornerRadius || 0}px`,
        transform: `rotate(${content.rotation || 0}deg)`,
      };
      if (content.border?.enabled) {
        s.border = `${content.border.width}px solid ${content.border.color}`;
      }
      return <div key={element.id} style={s} />;
    }

    if (element.type === 'icon') {
      const content = element.content as IconContent;
      const IconComp = (icons as Record<string, LucideIcon>)[content.iconName];
      if (!IconComp) return null;
      const scaledSize = Math.max(content.size * PREVIEW_ICON_SCALE, 8);
      return (
        <div
          key={element.id}
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(${content.rotation || 0}deg)`,
          }}
        >
          <IconComp size={scaledSize} color={content.color} strokeWidth={content.strokeWidth || 2} />
        </div>
      );
    }

    return null;
  };

  const PageFrame = ({
    pageNum,
    children,
  }: {
    pageNum: number;
    children: React.ReactNode;
  }) => (
    <div
      className="aspect-[210/297] bg-white rounded-lg ring-1 ring-border relative overflow-hidden w-full"
      style={{ maxWidth: CANVAS_DISPLAY_MAX_WIDTH }}
    >
      {children}
      <div className="absolute bottom-0 right-0 px-2 py-1 z-50">
        <span className="text-[9px] text-muted-foreground">
          Page {pageNum}/{totalPages}
        </span>
      </div>
    </div>
  );

  const getFallbackZoneTop = (zone: DynamicZone): number =>
    zone.type === 'service_client_info'
      ? 82
      : zone.type === 'service_conditions'
        ? 10
        : zone.type === 'service_invest_table'
          ? 5
          : zone.type === 'service_options'
            ? 55
            : 65;

  const getFallbackZoneHeight = (zone: DynamicZone): number =>
    zone.type === 'service_client_info'
      ? 10
      : zone.type === 'service_conditions'
        ? 16
        : zone.type === 'service_invest_table'
          ? 30
          : zone.type === 'service_options'
            ? 18
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

  const layoutServiceZones = (zones: DynamicZone[]): PositionedDynamicZone[] => {
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

  const getServiceZoneStyle = (zone: PositionedDynamicZone): React.CSSProperties => {
    return {
      position: 'absolute',
      top: `${zone.layoutTop ?? getZoneTop(zone)}%`,
      left: '4%',
      right: '4%',
      minHeight: `${zone.layoutMinHeight ?? getZoneMinHeight(zone)}%`,
      zIndex: 1000,
      overflow: 'visible',
    };
  };

  const renderServiceDynamicZone = (zone: PositionedDynamicZone, key: string) => {
    const zoneStyle = getServiceZoneStyle(zone);

    if (zone.type === 'service_client_info') {
      const selectedCommercial = commercialData?.commercialId
        ? getCommercialById(commercialData.commercialId)
        : null;
      return (
        <div key={key} style={zoneStyle}>
          <div
            className="bg-white"
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '6px 10px',
            }}
          >
            <div className="grid grid-cols-2">
              <div style={{ paddingRight: '12px' }}>
                <p style={{ fontSize: '7px', color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 3px 0', fontWeight: 600 }}>
                  Bénéficiaire
                </p>
                <div style={{ fontSize: '8px', lineHeight: 1.3, color: '#4b5563' }}>
                  {clientData.raisonSociale && (
                    <p style={{ fontWeight: 700, fontSize: '9px', color: '#1f2937', margin: 0 }}>{clientData.raisonSociale}</p>
                  )}
                  {clientData.nom && <p style={{ margin: '1px 0', fontWeight: 600 }}>{clientData.nom}</p>}
                  {clientData.adresse && <p style={{ margin: '1px 0' }}>{clientData.adresse}</p>}
                  {clientData.email && <p style={{ margin: '1px 0' }}>{clientData.email}</p>}
                  {clientData.telephone && <p style={{ margin: '1px 0' }}>{clientData.telephone}</p>}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '12px' }}>
                <p style={{ fontSize: '7px', color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 3px 0', fontWeight: 600 }}>
                  Votre interlocuteur
                </p>
                {selectedCommercial ? (
                  <div style={{ fontSize: '8px', lineHeight: 1.3, color: '#4b5563' }}>
                    <p style={{ fontWeight: 700, fontSize: '9px', color: '#1f2937', margin: 0 }}>{selectedCommercial.nom}</p>
                    {selectedCommercial.telephone && <p style={{ margin: '1px 0' }}>{selectedCommercial.telephone}</p>}
                    {selectedCommercial.email && <p style={{ margin: '1px 0' }}>{selectedCommercial.email}</p>}
                  </div>
                ) : (
                  <p style={{ fontSize: '8px', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>Non sélectionné</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (zone.type === 'service_conditions') {
      const freq: 'mensuel' | 'trimestriel' | null =
        paymentFrequency === 'mensuel' || paymentFrequency === 'trimestriel'
          ? paymentFrequency
          : null;
      const monthsPerPeriod = freq === 'trimestriel' ? 3 : 1;
      const periodicRent =
        freq && contractDuration && contractDuration > 0
          ? Math.round((totalServicesHt / (contractDuration / monthsPerPeriod)) * 100) / 100
          : null;

      const rows: Array<[string, string, boolean?]> = [
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
      return (
        <div key={key} style={zoneStyle}>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', fontWeight: 700, color: '#000000', margin: '0 0 4px 0' }}>
            Vos modalités de règlement :
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', lineHeight: 1.2, background: 'white', border: '1px solid #e5e7eb', tableLayout: 'fixed' }}>
            <tbody>
              {rows.map(([label, value, bold]) => (
                <tr key={label}>
                  <td style={{ width: '38%', padding: '3px 6px', background: '#f9fafb', fontWeight: 600, color: '#374151', border: '1px solid #e5e7eb', verticalAlign: 'top' }}>{label}</td>
                  <td style={{ padding: '3px 6px', color: '#1f2937', border: '1px solid #e5e7eb', fontWeight: bold ? 700 : 400, textAlign: bold ? 'right' : 'left', overflowWrap: 'anywhere', verticalAlign: 'top' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (zone.type === 'service_invest_table') {
      return (
        <div key={key} style={zoneStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.2px', lineHeight: 1.15, background: 'white', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '3px 5px', textAlign: 'left', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em', border: '1px solid #e5e7eb' }}>Désignation</th>
                <th style={{ padding: '3px 5px', textAlign: 'center', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em', border: '1px solid #e5e7eb', width: '34px' }}>Qté</th>
              </tr>
            </thead>
            <tbody>
              {lignesData.length > 0 ? (
                lignesData.map((ligne, idx) => (
                  <tr key={ligne.id} style={{ background: idx % 2 === 1 ? '#fafafa' : 'white' }}>
                    <td style={{ padding: '3px 5px', border: '1px solid #e5e7eb', verticalAlign: 'top', overflowWrap: 'anywhere', whiteSpace: 'normal' }}>{ligne.designation || '-'}</td>
                    <td style={{ padding: '3px 5px', border: '1px solid #e5e7eb', textAlign: 'center', verticalAlign: 'top' }}>{ligne.quantite}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: '8px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', border: '1px solid #e5e7eb' }}>Aucune ligne de service</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }


    if (zone.type === 'service_signature') {
      return (
        <div
          key={key}
          style={{ ...zoneStyle, fontSize: '9px' }}
        >
          <div className="flex justify-between gap-6">
            <div className="flex-1">
              La Société Groupe Cybertek SAS
              <br />
              Représentée par {commercialData?.commercialId || '—'}
              <br />
              Directeur Services et Solutions
              <br />
              <br />
              <br />
              Signature : _______________
            </div>
            <div className="flex-1">
              La Société {clientData.raisonSociale || clientData.nom}
              <br />
              Représentée par {clientData.nom}
              <br />
              <br />
              <br />
              Signature : _______________
            </div>
          </div>
        </div>
      );
    }
    if (zone.type === 'service_options') {
      const selected = nosOptions.filter((o) => o.selected);
      return (
        <div key={key} style={zoneStyle}>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', fontWeight: 700, color: '#000000', margin: '0 0 4px 0' }}>
            Options disponibles :
          </p>
          {selected.length === 0 ? (
            <p style={{ fontSize: '8px', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>Aucune option sélectionnée</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', lineHeight: 1.2, background: 'white', border: '1px solid #e5e7eb', tableLayout: 'fixed' }}>
              <tbody>
                {selected.map((opt) => (
                  <tr key={opt.id}>
                    <td style={{ width: '30%', padding: '3px 6px', background: '#f9fafb', fontWeight: 600, color: '#374151', border: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                      {opt.name || '—'}
                    </td>
                    <td style={{ padding: '3px 6px', color: '#4b5563', border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', verticalAlign: 'top' }}>
                      {opt.description || ''}
                    </td>
                    {opt.showPrice !== false && (
                      <td style={{ width: '22%', padding: '3px 6px', color: '#1f2937', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>
                        {opt.price != null ? `${formatNumber(opt.price)} € HT` : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    return null;
  };

  const renderPage1ClientBlock = () => {
    const selectedCommercial = commercialData?.commercialId
      ? getCommercialById(commercialData.commercialId)
      : null;

    return (
      <div className="absolute bottom-10 left-4 right-4 bg-background/95 rounded-lg p-3 shadow-sm border z-40">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] space-y-0.5">
              {clientData.raisonSociale && <p className="font-bold">{clientData.raisonSociale}</p>}
              <p className="font-semibold">{clientData.nom || 'Nom du client'}</p>
              <p className="text-muted-foreground">{clientData.adresse || 'Adresse'}</p>
              {clientData.email && (
                <p className="text-muted-foreground">{clientData.email}</p>
              )}
            </div>
          </div>
          <div>
            <p className="font-medium text-[10px] mb-2">Votre interlocuteur</p>
            {selectedCommercial ? (
              <div className="text-[9px] space-y-0.5">
                <p className="font-semibold">{selectedCommercial.nom}</p>
                {selectedCommercial.telephone && (
                  <p className="text-muted-foreground">{selectedCommercial.telephone}</p>
                )}
                <p className="text-muted-foreground">{selectedCommercial.email}</p>
              </div>
            ) : (
              <p className="text-[9px] text-muted-foreground italic">Non sélectionné</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTemplatePage = (templatePageNumber: number, displayPageNum: number) => {
    const elements = getStaticPageElements(templatePageNumber as PDFPageNumber);
    const rawPageDynamicZones =
      currentVersion?.pages
        .find((p) => p.pageNumber === (templatePageNumber as PDFPageNumber))
        ?.dynamicZones?.filter((z) => (z.type as string).startsWith('service_')) ?? [];
    const pageDynamicZones = templatePageNumber === 1 && rawPageDynamicZones.every((z) => z.type !== 'service_client_info')
      ? [
          ...rawPageDynamicZones,
          {
            id: 'fallback_service_client_info_page1',
            pageNumber: 1,
            type: 'service_client_info' as const,
            sourceSheet: 'client',
            isRequired: true,
            description: 'Informations client',
            position: { top: 82, height: 10 },
          },
        ]
      : rawPageDynamicZones;
    const positionedPageDynamicZones = layoutServiceZones(pageDynamicZones);
    return (
      <PageFrame pageNum={displayPageNum}>
        {elements.length > 0 ? (() => {
          const isTextOnlyPage = elements.every((el) => el.type === 'text');
          if (isTextOnlyPage) {
            return (
              <div
                style={{
                  position: 'absolute',
                  top: '3%',
                  left: '5%',
                  right: '5%',
                  bottom: '3%',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0',
                }}
              >
                {[...elements]
                  .sort((a, b) => a.position.y - b.position.y)
                  .map((el) => {
                    const content = el.content as any;
                    const fontDef = ALLOWED_FONTS.find((f) => f.name === content.fontFamily);
                    const fontValue = fontDef?.value || 'Inter, sans-serif';
                    const scaledFontSize = Math.max(content.fontSize * PREVIEW_FONT_SCALE, 5);
                    const isBold = content.bold;
                    return (
                      <div
                        key={el.id}
                        style={{
                          fontFamily: fontValue,
                          fontSize: `${scaledFontSize}px`,
                          fontWeight: isBold ? 'bold' : 'normal',
                          color: content.color || '#1a1a1a',
                          textAlign: content.textAlign || 'justify',
                          lineHeight: 1.35,
                          marginTop: isBold ? '6px' : '2px',
                          marginBottom: '1px',
                          textDecoration: content.underline ? 'underline' : 'none',
                          flexShrink: 0,
                        }}
                      >
                        {substituteDynamicPlaceholders(content.text || '')}
                      </div>
                    );
                  })}
              </div>
            );
          }
          return <>{elements.map((el) => renderTemplateElement(el))}</>;
        })() : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Page {templatePageNumber} — contenu vide</p>
            </div>
          </div>
        )}
        {positionedPageDynamicZones.map((z, i) => renderServiceDynamicZone(z, `dz-${i}`))}

        {templatePageNumber === 1 && (() => {
          const selectedCommercial = commercialData?.commercialId
            ? getCommercialById(commercialData.commercialId)
            : null;
          return selectedCommercial?.adresse ? (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center z-40">
              <span className="text-[9px] text-muted-foreground">
                {selectedCommercial.adresse}
              </span>
            </div>
          ) : null;
        })()}
      </PageFrame>
    );
  };





  const renderPage = () => {
    if (currentPage >= 1 && currentPage <= templatePagesTotal) {
      return renderTemplatePage(currentPage, currentPage);
    }
    return (
      <PageFrame pageNum={currentPage}>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Page introuvable</p>
        </div>
      </PageFrame>
    );
  };

  if (isLoading && !hasLoaded) {
    return <LoadingState message="Chargement du template..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {proposalName || clientData.raisonSociale || 'Proposition Services'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {lignesData.length} ligne{lignesData.length > 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {totalPages} page{totalPages > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          Page {currentPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-auto w-full" style={{ maxWidth: `${CANVAS_DISPLAY_MAX_WIDTH}px` }}>
        {renderPage()}
      </div>
    </div>
  );
}

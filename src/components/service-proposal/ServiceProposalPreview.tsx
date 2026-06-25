/**
 * Aperçu PDF pour une Proposition Services (standalone).
 * Réécriture sans race condition : résolution unique de la version + lazy loading once.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useServiceProposalStore } from '@/stores/serviceProposalStore';
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
} from '@/lib/template-render-utils';
import { sanitizeHtml } from '@/lib/sanitize-html';
import type {
  EditableElement,
  TextContent,
  ImageContent,
  ShapeContent,
  IconContent,
  TemplateVersion,
} from '@/types/template-editor';
import type { PDFPageNumber } from '@/types/pdf-template';

const TEMPLATE_PAGES_BEFORE = 3;

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function ServiceProposalPreview() {
  const [currentPage, setCurrentPage] = useState(1);
  const loadAttemptedRef = useRef<Set<string>>(new Set());

  const { isLoading, hasLoaded, isLoadingVersion, loadVersionPages } = useTemplateSync();
  const {
    clientData,
    lignesData,
    servicesInclus,
    selectedTemplateId,
    proposalName,
    totalInvest,
  } = useServiceProposalStore();

  // S'abonner explicitement à allTemplates et allVersions pour re-render quand les pages
  // sont injectées dans le store par loadVersionPages
  const allTemplates = useTemplateEditorStore((s) => s.allTemplates);
  const allVersions = useTemplateEditorStore((s) => s.allVersions);

  const activeTemplate = useMemo(() => {
    if (selectedTemplateId) {
      const found = allTemplates.find((t) => t.id === selectedTemplateId);
      if (found) return found;
    }
    return allTemplates.find((t) => t.isActive) ?? allTemplates[0] ?? null;
  }, [selectedTemplateId, allTemplates]);

  // Calcul de la version courante (publiée en priorité) depuis le store frais
  const currentVersion = useMemo<TemplateVersion | null>(() => {
    if (!activeTemplate) return null;
    const versions = allVersions.filter((v) => v.templateId === activeTemplate.id);
    if (versions.length === 0) return null;
    const published = versions.filter((v) => v.status === 'publie');
    if (published.length > 0) {
      return published.reduce((a, b) => (a.versionNumber > b.versionNumber ? a : b));
    }
    return versions.reduce((a, b) => (a.versionNumber > b.versionNumber ? a : b));
  }, [activeTemplate, allVersions]);

  // Lazy loading des pages : une seule tentative par version
  useEffect(() => {
    if (!hasLoaded || !currentVersion) return;
    if (currentVersion.pages.length > 0) return;
    if (loadAttemptedRef.current.has(currentVersion.id)) return;

    loadAttemptedRef.current.add(currentVersion.id);
    loadVersionPages(currentVersion.id);
  }, [hasLoaded, currentVersion, loadVersionPages]);

  const pagesReady = !!currentVersion && currentVersion.pages.length > 0;
  const templatePagesTotal = currentVersion?.pages.length ?? 0;
  const templatePagesAfter = Math.max(0, templatePagesTotal - TEMPLATE_PAGES_BEFORE);
  const totalPages = Math.max(1, TEMPLATE_PAGES_BEFORE + 2 + templatePagesAfter);

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
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.htmlContent) }}
        />
      ) : (
        <>
          {(content.text || '').split('\n').map((line, i) => (
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
      className="aspect-[210/297] bg-white rounded-lg ring-1 ring-border relative overflow-hidden"
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

  const renderTemplatePage = (templatePageNumber: number, displayPageNum: number) => {
    const elements = getStaticPageElements(templatePageNumber as PDFPageNumber);
    return (
      <PageFrame pageNum={displayPageNum}>
        {elements.length > 0 ? (
          elements.map((el) => renderTemplateElement(el))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Page {templatePageNumber} — contenu vide</p>
            </div>
          </div>
        )}
      </PageFrame>
    );
  };

  const renderVosServicesPage = (displayPageNum: number) => (
    <PageFrame pageNum={displayPageNum}>
      <div className="absolute bg-white" style={{ left: '3%', top: '5%', width: '94%' }}>
        <div className="font-bold text-[13px] mb-1">Vos services</div>
        {lignesData.length > 0 ? (
          <div className="border rounded overflow-hidden">
            <div className="grid grid-cols-12 gap-1 bg-muted px-2 py-1 text-[8px] font-medium">
              <div className="col-span-6">Désignation</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-2 text-right">P.U. HT</div>
              <div className="col-span-2 text-right">Total HT</div>
            </div>
            <div className="divide-y divide-border">
              {lignesData.map((ligne) => (
                <div
                  key={ligne.id}
                  className="grid grid-cols-12 gap-1 px-2 py-1 text-[8px] items-start bg-white even:bg-muted/20"
                >
                  <div className="col-span-6 break-words whitespace-pre-wrap leading-tight py-0.5">
                    {ligne.designation || '-'}
                  </div>
                  <div className="col-span-2 text-center">{ligne.quantite}</div>
                  <div className="col-span-2 text-right">{formatNumber(ligne.prixUnitaire)}</div>
                  <div className="col-span-2 text-right font-medium">
                    {formatNumber(ligne.totalHT)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-[9px] text-muted-foreground italic mt-4">
            Aucune ligne de service.
          </div>
        )}

        <div className="mt-2 flex justify-end">
          <div className="bg-primary/5 rounded-lg p-2 min-w-[180px]">
            <div className="flex justify-between font-semibold text-[10px] gap-3">
              <span>Total HT&nbsp;:&nbsp;</span>
              <span>{formatNumber(totalInvest)} €</span>
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  );

  const renderServicesInclusPage = (displayPageNum: number) => (
    <PageFrame pageNum={displayPageNum}>
      <div className="absolute bg-white" style={{ left: '3%', top: '5%', width: '94%' }}>
        <div className="font-bold text-[13px] mb-2">Les services inclus dans votre offre</div>
        <div
          className="text-[10px] leading-relaxed whitespace-pre-wrap"
          style={{ color: '#1f2937' }}
        >
          {servicesInclus.description || ''}
        </div>
      </div>
    </PageFrame>
  );

  const renderPage = () => {
    if (currentPage >= 1 && currentPage <= TEMPLATE_PAGES_BEFORE) {
      return renderTemplatePage(currentPage, currentPage);
    }
    if (currentPage === TEMPLATE_PAGES_BEFORE + 1) return renderVosServicesPage(currentPage);
    if (currentPage === TEMPLATE_PAGES_BEFORE + 2) return renderServicesInclusPage(currentPage);
    const offset = currentPage - (TEMPLATE_PAGES_BEFORE + 2);
    const templatePageNumber = TEMPLATE_PAGES_BEFORE + offset;
    if (templatePageNumber <= templatePagesTotal) {
      return renderTemplatePage(templatePageNumber, currentPage);
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

      <div className="flex justify-center">
        {!activeTemplate ? (
          <LoadingState message="Aucun template disponible" />
        ) : !pagesReady && (isLoadingVersion || !hasLoaded) ? (
          <LoadingState message="Chargement des pages..." />
        ) : (
          renderPage()
        )}
      </div>
    </div>
  );
}

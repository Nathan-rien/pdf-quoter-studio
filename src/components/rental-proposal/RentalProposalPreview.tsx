/**
 * Composant d'aperçu PDF pour la proposition de location
 * Affiche le template sélectionné avec les données injectées
 * Structure fixe de 8 pages avec mode édition optionnel
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  User, 
  Package, 
  Calculator, 
  Settings, 
  CheckCircle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Briefcase,
  Pencil,
  Check,
  X,
  icons
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { useTemplateSync } from '@/hooks/useTemplateSync';
import { cn } from '@/lib/utils';
import { ALLOWED_FONTS } from '@/lib/template-styles';
import { CANVAS_SCALE, PREVIEW_FONT_SCALE, PREVIEW_ICON_SCALE, LIST_INDENT_PX, DEFAULT_CONTRACT_PAGES, OPTIONS_PER_PAGE, LINES_PER_PAGE, CANVAS_DISPLAY_MAX_WIDTH, INVEST_LINES_PAGE1, INVEST_LINES_CONTINUATION, INVEST_FOOTER_RESERVED_LINES } from '@/lib/canvas-constants';
import { getSharedElementStyle, sortElementsByZIndex, resolveImageUrl, substituteDynamicPlaceholders } from '@/lib/template-render-utils';
import { findZoneByTypeInVersion } from '@/lib/pdf-export-validation';
import { sanitizeHtml } from '@/lib/sanitize-html';
import type { EditableElement, TextContent, ImageContent, ShapeContent, IconContent, TemplateVersion } from '@/types/template-editor';
import type { PDFPageNumber, DynamicZoneType } from '@/types/pdf-template';
import { PreviewEditableCanvas } from './PreviewEditableCanvas';

export function RentalProposalPreview() {
  const [currentPreviewPage, setCurrentPreviewPage] = React.useState(1);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [pagesLoaded, setPagesLoaded] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState('');
  
  // Synchronisation avec le cloud pour charger les templates
  const { isLoading, hasLoaded, loadVersionPages, isLoadingVersion } = useTemplateSync();
  
  const {
    clientData,
    matriceData,
    lignesData,
    servicesInclus,
    optionsServices,
    nosOptions,
    proposalName,
    selectedTemplateId,
    updateProposalName,
    getCalculatedValues,
    getSelectedCommercial,
    getAllProposalsCalculations,
  } = useRentalProposalStore();

  const { 
    getActiveTemplate,
    allTemplates,
    getTemplateLatestVersion, 
    preparePreviewEditing, 
    getCurrentVersionForPreview,
    allVersions 
  } = useTemplateEditorStore();
  
  // Utiliser le template sélectionné dans le workflow, ou fallback sur le template actif
  const activeTemplate = React.useMemo(() => {
    if (selectedTemplateId) {
      return allTemplates.find(t => t.id === selectedTemplateId) || getActiveTemplate();
    }
    return getActiveTemplate();
  }, [selectedTemplateId, allTemplates, getActiveTemplate]);
  
  // Helper pour obtenir la version courante du template
  const getCurrentVersion = React.useCallback((): TemplateVersion | null => {
    if (!activeTemplate) return null;
    if (isEditMode) {
      return getCurrentVersionForPreview() || null;
    }
    // Relecture depuis le store après loadVersionPages
    const version = getTemplateLatestVersion(activeTemplate.id);
    return version && version.pages.length > 0 ? version : null;
  }, [activeTemplate, isEditMode, getCurrentVersionForPreview, getTemplateLatestVersion]);
  
  // Helper pour trouver la page d'injection d'un type de zone
  const getInjectionPageForZoneType = React.useCallback((zoneType: DynamicZoneType): number | null => {
    const version = getCurrentVersion();
    const result = findZoneByTypeInVersion(version, zoneType);
    return result?.pageNumber ?? null;
  }, [getCurrentVersion]);
  
  // Initialiser la version de travail lors de l'activation du mode édition
  // IMPORTANT: Ce hook DOIT être appelé avant tout return conditionnel
  const handleToggleEditMode = React.useCallback(() => {
    const newEditMode = !isEditMode;
    
    // Si on active le mode édition, initialiser la version de travail
    if (newEditMode && activeTemplate) {
      preparePreviewEditing(activeTemplate.id);
    }
    
    setIsEditMode(newEditMode);
  }, [isEditMode, activeTemplate, preparePreviewEditing]);
  
  // Lazy loading des pages du template après le chargement initial des métadonnées
  // IMPORTANT: Utiliser activeTemplate (basé sur selectedTemplateId) et non getActiveTemplate()
  React.useEffect(() => {
    const loadPages = async () => {
      if (!hasLoaded) return;
      
      // Utiliser activeTemplate (basé sur selectedTemplateId) et non getActiveTemplate()
      if (!activeTemplate) {
        setPagesLoaded(true);
        return;
      }
      
      const version = getTemplateLatestVersion(activeTemplate.id);
      if (!version) {
        setPagesLoaded(true);
        return;
      }
      
      // Si les pages ne sont pas chargées (lazy loading), les charger depuis le cloud
      if (version.pages.length === 0) {
        console.log('[RentalProposalPreview] Lazy loading pages for version:', version.id, 'template:', activeTemplate.name);
        const loadedPages = await loadVersionPages(version.id);
        
        // Ne marquer comme chargé que si on a effectivement reçu des pages
        if (loadedPages && loadedPages.length > 0) {
          console.log('[RentalProposalPreview] Pages loaded successfully:', loadedPages.length, 'pages');
          setPagesLoaded(true);
        } else {
          // Retry en cas d'échec - permettre un nouveau cycle
          console.warn('[RentalProposalPreview] No pages loaded, will retry');
        }
        return;
      }
      
      // Pages déjà présentes dans le store
      console.log('[RentalProposalPreview] Pages already in store:', version.pages.length, 'pages');
      setPagesLoaded(true);
    };
    
    // Reset pagesLoaded si le template sélectionné change
    setPagesLoaded(false);
    loadPages();
  }, [hasLoaded, activeTemplate, getTemplateLatestVersion, loadVersionPages]);
  
  // Afficher un état de chargement si les templates ou les pages ne sont pas encore chargés
  // Ce return conditionnel est maintenant APRÈS tous les hooks
  if ((isLoading && !hasLoaded) || isLoadingVersion || !pagesLoaded) {
    return <LoadingState message="Chargement du template..." />;
  }
  
  const calculatedValues = getCalculatedValues();
  const selectedOptions = optionsServices.filter(opt => opt.selected);
  const selectedNosOptions = nosOptions.filter(opt => opt.selected);
  
  // Total pages: dynamique selon la version publiée du template
  const currentVersion = getCurrentVersion();
  const templatePages = currentVersion?.pages.length || DEFAULT_CONTRACT_PAGES;
  
  // Calcul des pages supplémentaires pour le tableau investissements
  // Découper les lignes en chunks, puis vérifier si le dernier chunk nécessite une page footer dédiée
  const investChunks = (() => {
    const totalLines = lignesData.length;
    if (totalLines <= INVEST_LINES_PAGE1) return [totalLines]; // un seul chunk
    const chunks = [INVEST_LINES_PAGE1];
    let remaining = totalLines - INVEST_LINES_PAGE1;
    while (remaining > 0) {
      chunks.push(Math.min(remaining, INVEST_LINES_CONTINUATION));
      remaining -= INVEST_LINES_CONTINUATION;
    }
    // Multi-page : toujours reporter le footer sur une page dédiée
    chunks.push(0);
    return chunks;
  })();
  const investChunkCount = investChunks.length;
  const extraInvestPages = Math.max(0, investChunkCount - 1);
  const totalPages = templatePages + extraInvestPages;

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  // Helper pour obtenir les éléments statiques d'une page du template
  // En mode édition, utilise currentVersion (version de travail), sinon la dernière version publiée
  // IMPORTANT: Relire DIRECTEMENT depuis le store pour garantir la fraîcheur des données après lazy loading
  const getStaticPageElements = (pageNumber: PDFPageNumber): EditableElement[] => {
    const template = activeTemplate;
    if (!template) {
      console.warn(`[RentalProposalPreview] getStaticPageElements(${pageNumber}): No active template`);
      return [];
    }
    
    // En mode édition, utiliser currentVersion (initialisée par preparePreviewEditing)
    if (isEditMode) {
      const editVersion = getCurrentVersionForPreview();
      if (editVersion) {
        const pageContent = editVersion.pages.find(p => p.pageNumber === pageNumber);
        const elements = sortElementsByZIndex(pageContent?.elements.filter(el => !el.isDynamic) || []);
        console.log(`[Preview EDIT] Page ${pageNumber}: ${elements.length} elements`);
        return elements;
      }
    }
    
    // IMPORTANT: Relire DIRECTEMENT depuis le store Zustand pour obtenir les données fraîches
    // après le lazy loading (évite le problème de closure stale)
    const freshState = useTemplateEditorStore.getState();
    const templateVersions = freshState.allVersions.filter(v => v.templateId === template.id);
    const publishedVersions = templateVersions.filter(v => v.status === 'publie');
    
    let version: TemplateVersion | undefined;
    if (publishedVersions.length > 0) {
      version = publishedVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b);
    } else if (templateVersions.length > 0) {
      version = templateVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b);
    }
    
    if (!version || version.pages.length === 0) {
      console.warn(`[Preview] Page ${pageNumber}: No version or empty pages (versions: ${templateVersions.length})`);
      return [];
    }
    
    const pageContent = version.pages.find(p => p.pageNumber === pageNumber);
    if (!pageContent) {
      console.warn(`[Preview] Page ${pageNumber}: Not found in version v${version.versionNumber} (${version.pages.length} pages)`);
      return [];
    }
    
    const elements = sortElementsByZIndex(pageContent.elements.filter(el => !el.isDynamic));
    console.log(`[Preview] Page ${pageNumber}: ${elements.length} static elements from v${version.versionNumber}`);
    return elements;
  };

  // Helper pour normaliser le z-index (identique à EditorCanvas: +10 pour éviter les valeurs négatives)
  const previewZIndex = (el: EditableElement): number => (el.zIndex ?? 0) + 10;

  // Rendu d'un élément du template (utilise le style partagé pour garantir la fidélité WYSIWYG)
  const renderTemplateElement = (element: EditableElement) => {
    // Utilisation du style partagé + z-index normalisé pour garantir un rendu identique à EditorCanvas
    const getElementStyle = (): React.CSSProperties => {
      return {
        ...getSharedElementStyle({ element }),
        zIndex: previewZIndex(element),
      };
    };

    // Fonction renderTextContent identique à EditorCanvas (utilise LIST_INDENT_PX)
    const renderTextContent = (textContent: TextContent) => {
      const listType = textContent.listType || 'none';
      const indentLevel = textContent.indentLevel || 0;
      // Utilise la constante partagée (sans multiplication par PREVIEW_FONT_SCALE)
      const indentPx = indentLevel * LIST_INDENT_PX;
      
      // Si contenu HTML enrichi, appliquer la substitution dynamique et sanitization
      if (textContent.htmlContent) {
        const processedHtml = sanitizeHtml(substituteDynamicPlaceholders(textContent.htmlContent, { fraisDossier: calculatedValues.fraisDossier }));
        return (
          <div 
            style={{ paddingLeft: `${indentPx}px` }}
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        );
      }
      
      // Fallback sur le texte brut avec support des listes et substitution dynamique
      const text = substituteDynamicPlaceholders(textContent.text || '', { fraisDossier: calculatedValues.fraisDossier });
      const lines = text.split('\n');
      return (
        <>
          {lines.map((line, i) => (
            <div key={`line-${element.id}-${i}`} style={{ paddingLeft: `${indentPx}px` }}>
              {listType === 'bullet' && '• '}
              {listType === 'numbered' && `${i + 1}. `}
              {line || '\u00A0'}
            </div>
          ))}
        </>
      );
    };

    // Rendu texte - structure identique à EditorCanvas
    if (element.type === 'text') {
      const content = element.content as TextContent;
      const fontDef = ALLOWED_FONTS.find(f => f.name === content.fontFamily);
      const fontValue = fontDef?.value || 'Outfit, sans-serif';
      const scaledFontSize = Math.max(content.fontSize * PREVIEW_FONT_SCALE, 6);

      return (
        <div
          key={element.id}
          style={getElementStyle()}
        >
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
            <div className="whitespace-pre-wrap break-words">
              {renderTextContent(content)}
            </div>
          </div>
        </div>
      );
    }

    // Rendu image
    if (element.type === 'image') {
      const content = element.content as ImageContent;
      const resolvedUrl = resolveImageUrl(content);
      
      return (
        <div
          key={element.id}
          style={{
            ...getElementStyle(),
            opacity: (content.opacity ?? 100) / 100,
          }}
        >
        {resolvedUrl && (
            <img
              src={resolvedUrl}
              alt={content.alt || 'Image'}
              className={`w-full h-full ${content.objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
              style={{ transform: `rotate(${content.rotation || 0}deg)` }}
            />
          )}
        </div>
      );
    }

    // Rendu forme
    if (element.type === 'shape') {
      const content = element.content as ShapeContent;
      const baseStyle: React.CSSProperties = {
        ...getElementStyle(),
        backgroundColor: content.backgroundColor !== 'transparent' 
          ? content.backgroundColor 
          : undefined,
        opacity: (content.backgroundOpacity ?? 100) / 100,
        borderRadius: content.shapeType === 'circle' || content.shapeType === 'ellipse'
          ? '50%'
          : `${content.cornerRadius || 0}px`,
        transform: `rotate(${content.rotation || 0}deg)`,
      };

      if (content.border?.enabled) {
        baseStyle.border = `${content.border.width}px solid ${content.border.color}`;
      }

      // Ligne spéciale (horizontale et verticale)
      if (content.shapeType === 'line' || content.shapeType === 'line-vertical') {
        const isVertical = content.shapeType === 'line-vertical';
        const lineStyle = content.lineStyle || 'solid';
        const lineWidth = content.border?.width || 2;
        const lineColor = content.border?.color || '#1f2937';
        
        // Style de positionnement absolu sans transform (la rotation est appliquée sur le wrapper interne)
        const positionStyle = getElementStyle();
        
        return (
          <div
            key={element.id}
            style={positionStyle}
          >
            {/* Wrapper interne centré avec rotation - identique à EditorCanvas */}
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ 
                transform: content.rotation ? `rotate(${content.rotation}deg)` : undefined 
              }}
            >
              <div 
                style={{ 
                  width: isVertical ? lineWidth : '100%',
                  height: isVertical ? '100%' : lineWidth,
                  backgroundColor: lineStyle === 'solid' ? lineColor : 'transparent',
                  borderTop: !isVertical && lineStyle !== 'solid' 
                    ? `${lineWidth}px ${lineStyle} ${lineColor}` 
                    : undefined,
                  borderLeft: isVertical && lineStyle !== 'solid' 
                    ? `${lineWidth}px ${lineStyle} ${lineColor}` 
                    : undefined,
                }} 
              />
            </div>
          </div>
        );
      }

      return (
        <div key={element.id} style={baseStyle}>
          {content.innerContent && (
            <div
              className="w-full h-full flex"
              style={{
                justifyContent: content.innerContent.alignment.horizontal === 'left' ? 'flex-start'
                  : content.innerContent.alignment.horizontal === 'right' ? 'flex-end' : 'center',
                alignItems: content.innerContent.alignment.vertical === 'top' ? 'flex-start'
                  : content.innerContent.alignment.vertical === 'bottom' ? 'flex-end' : 'center',
                padding: `${content.innerContent.padding || 0}px`,
              }}
            >
              {content.innerContent.text && (
                <span
                  style={{
                    fontSize: `${Math.max(content.innerContent.text.fontSize * PREVIEW_FONT_SCALE, 6)}px`,
                    color: content.innerContent.text.color,
                    fontWeight: content.innerContent.text.bold ? 'bold' : 'normal',
                    fontStyle: content.innerContent.text.italic ? 'italic' : 'normal',
                  }}
                >
                  {content.innerContent.text.content}
                </span>
              )}
              {content.innerContent.icon && (() => {
                const IconComp = (icons as Record<string, LucideIcon>)[content.innerContent.icon.name];
                if (!IconComp) return null;
                return (
                  <IconComp
                    size={Math.max(content.innerContent.icon.size * PREVIEW_ICON_SCALE, 8)}
                    color={content.innerContent.icon.color}
                  />
                );
              })()}
            </div>
          )}
        </div>
      );
    }

    if (element.type === 'icon') {
      const content = element.content as IconContent;
      const IconComponent = (icons as Record<string, LucideIcon>)[content.iconName];
      if (!IconComponent) return null;
      
      // Utilise PREVIEW_ICON_SCALE (0.6) au lieu de 0.4 pour correspondre à EditorCanvas
      const scaledSize = Math.max(content.size * PREVIEW_ICON_SCALE, 8);
      
      return (
        <div
          key={element.id}
          style={{
            ...getElementStyle(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(${content.rotation || 0}deg)`,
          }}
        >
          <IconComponent
            size={scaledSize}
            color={content.color}
            strokeWidth={content.strokeWidth || 2}
          />
        </div>
      );
    }

    return null;
  };

  // Composant de pagination (visible en bas à droite de chaque page)
  const PageFooter = ({ pageNum }: { pageNum: number }) => (
    <div className="absolute bottom-0 right-0 px-2 py-1 z-50">
      <span className="text-[9px] text-muted-foreground">
        Page {pageNum}/{totalPages}
      </span>
    </div>
  );

  // Helper pour gérer le mode édition avec PreviewEditableCanvas
  const renderPageWithEditMode = (
    pageNum: PDFPageNumber,
    staticElements: EditableElement[],
    renderDynamicContent?: () => React.ReactNode,
    fallbackContent?: React.ReactNode
  ) => {
    // Mode édition : utiliser PreviewEditableCanvas
    if (isEditMode) {
      return (
        <PreviewEditableCanvas
          pageNumber={pageNum}
          elements={staticElements}
          renderDynamicContent={renderDynamicContent}
          pageFooter={<PageFooter pageNum={pageNum} />}
          isEditMode={isEditMode}
        />
      );
    }
    
    // Mode lecture : rendu classique
    return (
      <div 
        className="aspect-[210/297] bg-white rounded-lg ring-1 ring-border relative overflow-hidden"
        style={{ maxWidth: CANVAS_DISPLAY_MAX_WIDTH }}
      >
        {/* Toujours afficher les éléments statiques s'ils existent */}
        {staticElements.map(el => renderTemplateElement(el))}

        {/* Toujours appeler le contenu dynamique s'il existe */}
        {renderDynamicContent?.()}

        {/* Fallback seulement si AUCUN contenu (ni statique ni dynamique) */}
        {staticElements.length === 0 && !renderDynamicContent && (
          fallbackContent || (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Page {pageNum}</p>
                <p className="text-sm mt-2">Aucun contenu dans le template</p>
              </div>
            </div>
          )
        )}
        <PageFooter pageNum={pageNum} />
      </div>
    );
  };

  const renderPageIndicator = () => (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentPreviewPage(prev => Math.max(1, prev - 1))}
        disabled={currentPreviewPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium">
        Page {currentPreviewPage} / {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentPreviewPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPreviewPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  // Page 1 - Couverture (utilise les éléments du template)
  const renderPage1 = () => {
    const page1Elements = getStaticPageElements(1 as PDFPageNumber);
    const selectedCommercial = getSelectedCommercial();
    
    const renderClientData = () => (
      <div className="absolute bottom-16 left-4 right-4 bg-background/95 rounded-lg p-3 shadow-sm border z-40">
        <div className="grid grid-cols-2 gap-4">
          {/* Colonne gauche : Client */}
          <div>
            <div className="text-[9px] space-y-0.5">
              <p className="font-semibold">{clientData.nom || 'Nom du client'}</p>
              <p className="text-muted-foreground">{clientData.adresse || 'Adresse'}</p>
              <p className="text-muted-foreground">{clientData.codePostal} {clientData.ville}</p>
              {clientData.email && (
                <p className="text-muted-foreground">{clientData.email}</p>
              )}
            </div>
          </div>
          
          {/* Colonne droite : Commercial */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-3 w-3 text-primary" />
              <span className="font-medium text-[10px]">Votre interlocuteur</span>
            </div>
            {selectedCommercial ? (
              <div className="text-[9px] space-y-0.5">
                <p className="font-semibold">{selectedCommercial.nom}</p>
                {selectedCommercial.telephone && (
                  <p className="text-muted-foreground">{selectedCommercial.telephone}</p>
                )}
                <p className="text-muted-foreground">{selectedCommercial.email}</p>
                <p className="text-muted-foreground text-[8px] mt-1">{selectedCommercial.adresse}</p>
              </div>
            ) : (
              <p className="text-[9px] text-muted-foreground italic">
                Non sélectionné
              </p>
            )}
          </div>
        </div>
      </div>
    );
    
    const fallbackContent = (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">
            Proposition de Location
          </h1>
          <p className="text-muted-foreground mb-6">Financière Professionnelle</p>
          
          <div className="bg-background rounded-lg p-4 shadow-sm max-w-xs mx-auto">
            <div className="text-left space-y-1 text-xs">
              <p className="font-semibold">{clientData.nom || 'Nom du client'}</p>
              <p className="text-muted-foreground">{clientData.adresse || 'Adresse'}</p>
              <p className="text-muted-foreground">{clientData.codePostal} {clientData.ville}</p>
            </div>
          </div>
        </div>
      </div>
    );
    
    return renderPageWithEditMode(
      1 as PDFPageNumber, 
      page1Elements, 
      page1Elements.length > 0 ? renderClientData : undefined,
      fallbackContent
    );
  };

  // Page 2-3 - Engagements et conditions (statiques)
  const renderStaticPage = (pageNum: number, title: string) => {
    const staticElements = getStaticPageElements(pageNum as PDFPageNumber);
    
    const fallbackContent = (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">{title}</p>
          <p className="text-sm mt-2">Aucun contenu dans le template</p>
        </div>
      </div>
    );

    return renderPageWithEditMode(pageNum as PDFPageNumber, staticElements, undefined, fallbackContent);
  };

  // Pages produits (dynamiques) - Page 4 fixe avec éléments statiques du template
  // Les éléments situés sous la zone dynamique suivent le tableau en flux relatif
  // chunkIndex: 0 = première page (titre + en-têtes), 1+ = pages de continuation
  const renderProductPage = (chunkIndex: number = 0) => {
    // Utiliser le découpage pré-calculé (investChunks)
    // Calculer les offsets pour extraire les bonnes lignes
    let offset = 0;
    for (let i = 0; i < chunkIndex; i++) {
      offset += investChunks[i];
    }
    const chunkLineCount = investChunks[chunkIndex] || 0;
    const pageLines = lignesData.slice(offset, offset + chunkLineCount);
    
    const isLastChunk = chunkIndex >= investChunkCount - 1;
    const isLastDataChunk = pageLines.length > 0 && 
      (chunkIndex === investChunkCount - 1 || investChunks[chunkIndex + 1] === 0);

    const staticElements = getStaticPageElements(4 as PDFPageNumber);
    
    // Calculer le seuil Y pour séparer éléments au-dessus / en-dessous de la zone dynamique
    const version = getCurrentVersion();
    const page4 = version?.pages.find(p => p.pageNumber === 4);
    const investZone = page4?.dynamicZones.find(z => z.type === 'invest_table');
    
    // Position de la zone dynamique (valeurs par défaut si non personnalisée)
    const zoneTopPercent = investZone?.position?.top ?? 28;
    const zoneHeightPercent = investZone?.position?.height ?? 48;
    const dynamicZoneBottomY = ((zoneTopPercent + zoneHeightPercent) / 100) * CANVAS_SCALE.height;
    
    // Partitionner les éléments statiques
    // Les images (logos) restent toujours en position absolue, pas de flux relatif
    const elementsAbove = chunkIndex === 0 
      ? staticElements.filter(el => 
          el.position.y < dynamicZoneBottomY || 
          el.type === 'image' // Les logos restent toujours en position absolue
        )
      : staticElements.filter(el => el.type === 'image'); // Pages continuation : seulement les logos
    
    const elementsBelow = staticElements
      .filter(el => 
        el.position.y >= dynamicZoneBottomY && 
        el.type === 'text' // Seuls les textes suivent le flux relatif
      )
      .sort((a, b) => a.position.y - b.position.y); // Tri par Y croissant pour respecter l'ordre visuel
    
    // Fonction pour rendre un élément en flux relatif (sans position absolue)
    const renderFlowElement = (element: EditableElement, idx: number = 0) => {
      if (element.type !== 'text') {
        // Pour les non-textes, on garde le rendu normal (rare pour les éléments "below")
        return renderTemplateElement(element);
      }
      
      const content = element.content as TextContent;
      const fontDef = ALLOWED_FONTS.find(f => f.name === content.fontFamily);
      const fontValue = fontDef?.value || 'Outfit, sans-serif';
      const scaledFontSize = Math.max(content.fontSize * PREVIEW_FONT_SCALE, 6);
      
      // Calcul de la largeur max en pourcentage (identique à getSharedElementStyle)
      const maxWidthPercent = Math.max(Math.min((element.size.width / CANVAS_SCALE.width) * 100, 100), 5);
      
      return (
        <div
          key={element.id}
          className={cn("mb-0.5", (element.type === 'text' && (element.content as any)?.bold && idx > 0) && "mt-3")}
          style={{
            width: 'fit-content',
            maxWidth: `${maxWidthPercent}%`,
            zIndex: previewZIndex(element),
          }}
        >
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
            <div className="whitespace-pre-wrap break-words">
              {content.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(
                  substituteDynamicPlaceholders(content.htmlContent, { fraisDossier: calculatedValues.fraisDossier })
                ) }} />
              ) : (
                substituteDynamicPlaceholders(content.text || '', { fraisDossier: calculatedValues.fraisDossier })
              )}
            </div>
          </div>
        </div>
      );
    };
    
    const renderProductTableWithFlowElements = () => (
      <div 
        className="absolute bg-white"
        style={{
          left: '3%',
          top: chunkIndex === 0 ? '5%' : '3%',
          width: '94%',
        }}
      >
        {/* Titre Vos investissements - seulement sur la première page */}
        {chunkIndex === 0 && (
          <div className="font-bold text-[13px] mb-1">Vos investissements</div>
        )}
        {/* Tableau des produits (guard: pas de header vide si page footer-only) */}
        {pageLines.length > 0 && (
          <div className="border rounded overflow-hidden">
            <div className="grid grid-cols-12 gap-1 bg-muted px-2 py-1 text-[8px] font-medium">
              <div className="col-span-6">Désignation</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-2 text-right">P.U. HT</div>
              <div className="col-span-2 text-right">Total HT</div>
            </div>
            
            <div className="divide-y divide-border">
              {pageLines.map((ligne, idx) => (
                <div 
                  key={idx} 
                  className="grid grid-cols-12 gap-1 px-2 py-1 text-[8px] items-start bg-white even:bg-muted/20"
                >
                  <div className="col-span-6 break-words whitespace-normal leading-tight py-0.5 line-clamp-2">{ligne.designation || '-'}</div>
                  <div className="col-span-2 text-center">{ligne.quantite}</div>
                  <div className="col-span-2 text-right">{formatNumber(ligne.prixUnitaire)}</div>
                  <div className="col-span-2 text-right font-medium">{formatNumber(ligne.totalHT)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Total investissement : sur le dernier chunk contenant des données */}
        {isLastDataChunk && (
          <div className="mt-1 flex justify-end">
            <div className="bg-primary/5 rounded-lg p-2 min-w-[180px]">
              <div className="flex justify-between font-semibold text-[10px] gap-3">
                <span>Total investissement&nbsp;:&nbsp;</span>
                <span>{formatNumber(matriceData.montantInvestissement)} € HT</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Votre offre + propositions + flow elements : sur le dernier chunk absolu */}
        {isLastChunk && (
          <>
            <div className="font-bold text-[13px] mb-1 mt-2">Votre offre</div>
            {(() => {
              const allProposals = getAllProposalsCalculations();
              if (allProposals.length === 0) return null;
              
              return (
                <div className="mt-2 space-y-2">
                  {allProposals.map(({ proposal, calculations }) => (
                    <div key={proposal.id} className="border rounded overflow-hidden">
                      <div className="bg-muted px-3 py-1.5">
                        <span className="font-semibold text-[11px]">
                          Location {proposal.duree} mois
                        </span>
                      </div>
                      <div className="divide-y divide-border">
                        <div className="flex justify-between px-3 py-1 text-[10px]">
                          <span>Montant investissement</span>
                          <span className="font-medium">{formatNumber(proposal.montantInvestissement)} € HT</span>
                        </div>
                        <div className="flex justify-between px-3 py-1 text-[10px]">
                          <span>Loyer mensuel HT</span>
                          <span className="font-semibold">{formatNumber(calculations.loyerMensuel)} € HT</span>
                        </div>
                        {matriceData.showCoutLocatifAnnuel && calculations.coutLocatifAnnuel !== null && (
                          <div className="flex justify-between px-3 py-1 text-[10px]">
                            <span>Coût locatif annuel</span>
                            <span className="font-medium">{calculations.coutLocatifAnnuel.toFixed(2).replace('.', ',')} %</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            
            {elementsBelow.length > 0 && (
              <div className="mt-4">
                {elementsBelow.map((el, idx) => renderFlowElement(el, idx))}
              </div>
            )}
          </>
        )}
      </div>
    );
    
    // Utiliser uniquement les éléments "au-dessus" pour le rendu absolu standard
    // Pour les pages de continuation, on utilise le même pageNumber (4) pour le template
    const displayPageNum = chunkIndex === 0 
      ? getInjectionPageForZoneType('invest_table') || 4
      : getInjectionPageForZoneType('invest_table') || 4;
    return renderPageWithEditMode(displayPageNum as PDFPageNumber, elementsAbove, renderProductTableWithFlowElements);
  };

  // Page 5 - Services inclus (bloc permanent + options additionnelles + Nos Options fusionnées)
  const renderServicesInclusPage = () => {
    const staticElements = getStaticPageElements(5 as PDFPageNumber);
    const pageOptions = selectedOptions.slice(0, OPTIONS_PER_PAGE);
    
    const renderServicesContent = () => (
      <div 
        className="absolute z-40"
        style={{
          left: '3%',
          top: '8%',
          width: '94%',
          maxHeight: '82%',
          overflow: 'hidden',
        }}
      >
        {/* Titre de page avec icône FileCheck */}
        <div className="mb-3 flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-[14px] text-foreground">Les services inclus dans votre offre</h2>
        </div>

        {/* Bloc permanent "Services location" - style header gris + puces */}
        <div className="mb-2 border rounded overflow-hidden">
          <div className="bg-muted px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-4 bg-foreground/80 rounded-sm" />
            <span className="font-semibold text-[11px]">Services location</span>
          </div>
          <div className="px-3 py-1.5 bg-background">
            <div className="text-[9px] text-muted-foreground space-y-0.5">
              {servicesInclus.description.split('\n').map((item, i) => {
                const trimmed = item.trim();
                if (!trimmed) return null;
                const isSubItem = trimmed.startsWith('- ');
                return (
                  <div key={i} className={`leading-tight ${isSubItem ? 'pl-3' : ''}`}>
                    {isSubItem ? trimmed : `• ${trimmed}`}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Options additionnelles sélectionnées (depuis optionsServices) */}
        {pageOptions.length > 0 && (
          <div className="space-y-1.5">
            {pageOptions.map((option) => (
              <div key={option.id} className="border rounded overflow-hidden">
                <div className="bg-muted px-3 py-1.5 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-foreground/70" />
                  <span className="font-semibold text-[11px]">{option.name}</span>
                  {option.price !== null && (
                    <span className="ml-auto text-[10px] text-primary font-medium">
                      {formatNumber(option.price)} €/mois
                    </span>
                  )}
                </div>
                {option.description && (
                  <div className="px-3 py-1.5 bg-background">
                    <div className="text-[9px] text-muted-foreground space-y-0.5">
                      {option.description.split('\n').map((item, i) => {
                        const trimmed = item.trim();
                        if (!trimmed) return null;
                        const isSubItem = trimmed.startsWith('- ');
                        return (
                          <div key={i} className={`leading-tight ${isSubItem ? 'pl-3' : ''}`}>
                            {isSubItem ? trimmed : `• ${trimmed}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Nos Options - fusionnées depuis l'onglet "Nos Options" (anciennement Page 6) */}
        {selectedNosOptions.length > 0 && (
          <>
            <div className="mt-6 mb-1.5 flex items-center gap-2">
              <Settings className="h-3 w-3 text-foreground/70" />
              <span className="font-semibold text-[12px]">Nos options</span>
            </div>
            <div className="space-y-1.5">
              {selectedNosOptions.map((option) => (
                <div key={option.id} className="border border-primary/20 rounded overflow-hidden bg-primary/5">
                  <div className="bg-primary/15 px-3 py-1.5 flex items-center gap-2">
                    {/* Case vide pour signature client */}
                    <div className="h-3 w-3 border border-foreground/70 rounded-sm flex-shrink-0" />
                    <span className="font-semibold text-[11px]">{option.name}</span>
                    {option.price !== null && (
                      <span className="ml-auto text-[10px] text-primary font-medium">
                        {formatNumber(option.price)} €/mois
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <div className="px-3 py-1.5 bg-background">
                      <div className="text-[9px] text-muted-foreground space-y-0.5">
                        {option.description.split('\n').map((item, i) => {
                          const trimmed = item.trim();
                          if (!trimmed) return null;
                          const isSubItem = trimmed.startsWith('- ');
                          return (
                            <div key={i} className={`leading-tight ${isSubItem ? 'pl-3' : ''}`}>
                              {isSubItem ? trimmed : `• ${trimmed}`}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
    
    return renderPageWithEditMode(5 as PDFPageNumber, staticElements, renderServicesContent);
  };

  // Page 6 - Nos Options (options sélectionnables)
  const renderNosOptionsPage = () => {
    const staticElements = getStaticPageElements(6 as PDFPageNumber);
    
    const renderNosOptionsContent = () => (
      <div 
        className="absolute z-40"
        style={{
          left: '3%',
          top: '12%',
          width: '94%',
          maxHeight: '75%',
          overflow: 'hidden',
        }}
      >
        {selectedNosOptions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune option sélectionnée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedNosOptions.map((option) => (
              <div key={option.id} className="border rounded overflow-hidden">
                <div className="bg-muted px-4 py-2 flex items-center gap-2">
                  <div className="h-4 w-4 border border-foreground/70 rounded-sm flex-shrink-0" />
                  <span className="font-semibold text-[14px]">{option.name}</span>
                  {option.price !== null && (
                    <span className="ml-auto text-[11px] text-primary font-medium">
                      {formatNumber(option.price)} €/mois
                    </span>
                  )}
                </div>
                {option.description && (
                  <div className="px-4 py-3 bg-background">
                    <div className="text-[10px] text-muted-foreground space-y-1">
                      {option.description.split('\n').map((item, i) => {
                        const trimmed = item.trim();
                        if (!trimmed) return null;
                        const isSubItem = trimmed.startsWith('- ');
                        return (
                          <div key={i} className={`leading-tight ${isSubItem ? 'pl-3' : ''}`}>
                            {isSubItem ? trimmed : `• ${trimmed}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
    
    return renderPageWithEditMode(6 as PDFPageNumber, staticElements, renderNosOptionsContent);
  };

  // Page Options Services - ancien rendu (conservé pour rétrocompatibilité)
  const renderOptionsPage = (pageNumber: PDFPageNumber) => {
    const pageOptions = selectedOptions.slice(0, OPTIONS_PER_PAGE);
    const staticElements = getStaticPageElements(pageNumber);
    
    const renderOptionsContent = () => (
      <div 
        className="absolute z-40"
        style={{
          left: '3%',
          top: '12%',
          width: '94%',
          maxHeight: '75%',
          overflow: 'hidden',
        }}
      >
        {/* Bloc permanent "Services inclus" - style header gris + puces */}
        <div className="mb-3 border rounded overflow-hidden">
          <div className="bg-muted px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-4 bg-foreground/80 rounded-sm" />
            <span className="font-semibold text-[11px]">Services Inclus</span>
          </div>
          <div className="px-3 py-2 bg-background">
            <div className="text-[8px] text-muted-foreground space-y-0.5">
              {servicesInclus.description.split('\n').map((item, i) => {
                const trimmed = item.trim();
                if (!trimmed) return null;
                const isSubItem = trimmed.startsWith('- ');
                return (
                  <div key={i} className={`leading-tight ${isSubItem ? 'pl-3' : ''}`}>
                    {isSubItem ? trimmed : `• ${trimmed}`}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Options additionnelles sélectionnées - même style */}
        {pageOptions.length > 0 && (
          <div className="space-y-2">
            {pageOptions.map((option) => (
              <div key={option.id} className="border rounded overflow-hidden">
                <div className="bg-muted px-3 py-1.5 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-foreground/70" />
                  <span className="font-semibold text-[11px]">{option.name}</span>
                  {option.price !== null && (
                    <span className="ml-auto text-[9px] text-primary font-medium">
                      {formatNumber(option.price)} €/mois
                    </span>
                  )}
                </div>
                {option.description && (
                  <div className="px-3 py-2 bg-background">
                    <div className="text-[8px] text-muted-foreground space-y-0.5">
                      {option.description.split('\n').map((item, i) => {
                        const trimmed = item.trim();
                        if (!trimmed) return null;
                        const isSubItem = trimmed.startsWith('- ');
                        return (
                          <div key={i} className={`leading-tight ${isSubItem ? 'pl-3' : ''}`}>
                            {isSubItem ? trimmed : `• ${trimmed}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
    
    return renderPageWithEditMode(pageNumber, staticElements, renderOptionsContent);
  };

  // Rendu page statique générique pour les pages > 4 sans zone dynamique
  const renderGenericStaticPage = (pageNum: number) => {
    const staticElements = getStaticPageElements(pageNum as PDFPageNumber);
    return renderPageWithEditMode(pageNum as PDFPageNumber, staticElements);
  };

  // Rendu de la page courante - Structure dynamique avec réaffectation automatique
  // Gère les pages supplémentaires insérées pour le tableau investissements
  const renderCurrentPage = () => {
    // Trouver les pages d'injection pour chaque type de zone
    const investPage = getInjectionPageForZoneType('invest_table') || 4;
    const optionsPage = getInjectionPageForZoneType('options_block');
    
    // Plage des pages invest : investPage, investPage+1, ..., investPage+extraInvestPages
    const investPageEnd = investPage + extraInvestPages; // dernière page invest (incluse)
    
    // Si la page courante est dans la plage invest
    if (currentPreviewPage >= investPage && currentPreviewPage <= investPageEnd) {
      const chunkIndex = currentPreviewPage - investPage;
      return renderProductPage(chunkIndex);
    }
    
    // Pages avant la zone invest : affichage normal avec le numéro de page réel
    if (currentPreviewPage < investPage) {
      if (currentPreviewPage === 1) return renderPage1();
      if (currentPreviewPage === 2) return renderStaticPage(2, 'Nos engagements');
      if (currentPreviewPage === 3) return renderStaticPage(3, 'Conditions de location');
      return renderGenericStaticPage(currentPreviewPage);
    }
    
    // Pages après la zone invest : décaler pour retrouver le numéro de page du template
    const realPageNum = currentPreviewPage - extraInvestPages;
    
    // Vérifier si la page réelle existe dans la version
    const version = getCurrentVersion();
    const pageExists = version?.pages.some(p => p.pageNumber === realPageNum);
    
    if (!pageExists) {
      return (
        <div 
          className="aspect-[210/297] bg-white rounded-lg ring-1 ring-border relative overflow-hidden flex items-center justify-center"
          style={{ maxWidth: CANVAS_DISPLAY_MAX_WIDTH }}
        >
          <p className="text-muted-foreground text-sm">Page {currentPreviewPage} n'existe pas dans ce template</p>
        </div>
      );
    }
    
    // Page 5 du template : Services inclus
    if (realPageNum === 5) {
      return renderServicesInclusPage();
    }
    
    // Page 6 du template : statique (Nos Options fusionnées sur Page 5)
    if (realPageNum === 6) {
      return renderGenericStaticPage(6);
    }
    
    // Pages génériques (7, 8 ou autres) - rendu statique basé sur les éléments du template
    return renderGenericStaticPage(realPageNum);
  };

  const handleStartEditName = () => {
    setTempName(proposalName || activeTemplate?.name || 'Proposition Commerciale');
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    updateProposalName(tempName.trim() || 'Proposition Commerciale');
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setTempName('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEditName();
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Nom de la proposition éditable */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    className="h-8 text-sm font-medium"
                    autoFocus
                    placeholder="Nom de la proposition"
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleSaveName}>
                    <Check className="h-4 w-4 text-success" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleCancelEditName}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <div className="group flex items-center gap-2">
                  <p 
                    className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
                    onClick={handleStartEditName}
                    title="Cliquez pour modifier le nom"
                  >
                    {proposalName || activeTemplate?.name || 'Proposition Commerciale'}
                  </p>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={handleStartEditName}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {lignesData.length} ligne(s) • {selectedNosOptions.length} option(s) sélectionnée(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={handleToggleEditMode}
              className="gap-1"
            >
              {isEditMode ? (
                <>
                  <Eye className="h-4 w-4" />
                  Lecture
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4" />
                  Modifier
                </>
              )}
            </Button>
            <Badge variant="secondary">
              {totalPages} pages
            </Badge>
          </div>
        </div>
        
        <Separator />
        
        {/* Navigation pages */}
        {renderPageIndicator()}
        
        {/* Aperçu page courante - largeur identique à EditorCanvas */}
        <div 
          className="mx-auto w-full"
          style={{ maxWidth: `${CANVAS_DISPLAY_MAX_WIDTH}px` }}
        >
          {renderCurrentPage()}
        </div>
        
        {/* Miniatures - basées sur le nombre réel de pages */}
        <div className="flex justify-center gap-2 flex-wrap pt-4 border-t">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setCurrentPreviewPage(pageNum)}
              className={cn(
                "w-8 h-8 rounded text-xs font-medium transition-colors",
                currentPreviewPage === pageNum
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {pageNum}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

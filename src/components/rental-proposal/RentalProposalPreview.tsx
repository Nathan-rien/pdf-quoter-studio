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
import { CANVAS_SCALE, PREVIEW_FONT_SCALE, PREVIEW_ICON_SCALE, LIST_INDENT_PX, DEFAULT_CONTRACT_PAGES, OPTIONS_PER_PAGE, LINES_PER_PAGE, CANVAS_DISPLAY_MAX_WIDTH } from '@/lib/canvas-constants';
import { getSharedElementStyle, sortElementsByZIndex, resolveImageUrl } from '@/lib/template-render-utils';
import { findZoneByTypeInVersion } from '@/lib/pdf-export-validation';
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
    updateProposalName,
    getCalculatedValues,
    getSelectedCommercial,
  } = useRentalProposalStore();

  const { 
    getActiveTemplate, 
    getTemplateLatestVersion, 
    preparePreviewEditing, 
    getCurrentVersionForPreview,
    allVersions 
  } = useTemplateEditorStore();
  
  // Calculer activeTemplate AVANT le useCallback (dépendance)
  const activeTemplate = getActiveTemplate();
  
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
  // IMPORTANT: Ne marquer comme chargé que si les pages sont vraiment disponibles dans le store
  React.useEffect(() => {
    const loadPages = async () => {
      if (!hasLoaded) return;
      if (pagesLoaded) return;
      
      const template = getActiveTemplate();
      if (!template) {
        setPagesLoaded(true);
        return;
      }
      
      const version = getTemplateLatestVersion(template.id);
      if (!version) {
        setPagesLoaded(true);
        return;
      }
      
      // Si les pages ne sont pas chargées (lazy loading), les charger depuis le cloud
      if (version.pages.length === 0) {
        console.log('[RentalProposalPreview] Lazy loading pages for version:', version.id);
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
    
    loadPages();
  }, [hasLoaded, pagesLoaded, getActiveTemplate, getTemplateLatestVersion, loadVersionPages]);
  
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
  const totalPages = currentVersion?.pages.length || DEFAULT_CONTRACT_PAGES;

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
      
      // Si contenu HTML enrichi, l'utiliser directement
      if (textContent.htmlContent) {
        return (
          <div 
            style={{ paddingLeft: `${indentPx}px` }}
            dangerouslySetInnerHTML={{ __html: textContent.htmlContent }}
          />
        );
      }
      
      // Fallback sur le texte brut avec support des listes
      const text = textContent.text || '';
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
            <div className="flex items-center gap-2 mb-2">
              <User className="h-3 w-3 text-primary" />
              <span className="font-medium text-[10px]">Client</span>
            </div>
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
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Client</span>
            </div>
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
  const renderProductPage = () => {
    const pageLines = lignesData.slice(0, LINES_PER_PAGE);
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
    const elementsAbove = staticElements.filter(el => el.position.y < dynamicZoneBottomY);
    const elementsBelow = staticElements
      .filter(el => el.position.y >= dynamicZoneBottomY)
      .sort((a, b) => a.position.y - b.position.y); // Tri par Y croissant pour respecter l'ordre visuel
    
    // Fonction pour rendre un élément en flux relatif (sans position absolue)
    const renderFlowElement = (element: EditableElement) => {
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
          className="mb-2"
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
                <div dangerouslySetInnerHTML={{ __html: content.htmlContent }} />
              ) : (
                content.text || ''
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
          top: '15%',
          width: '94%',
        }}
      >
        {/* Tableau des produits */}
        <div className="border rounded overflow-hidden">
          <div className="grid grid-cols-12 gap-1 bg-muted px-2 py-1.5 text-[10px] font-medium">
            <div className="col-span-6">Désignation</div>
            <div className="col-span-2 text-center">Qté</div>
            <div className="col-span-2 text-right">P.U. HT</div>
            <div className="col-span-2 text-right">Total HT</div>
          </div>
          
          <div className="divide-y divide-muted/50">
            {pageLines.map((ligne, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-1 px-2 py-1 text-[9px] items-start">
                <div className="col-span-6 break-words whitespace-normal leading-snug">{ligne.designation || '-'}</div>
                <div className="col-span-2 text-center">{ligne.quantite}</div>
                <div className="col-span-2 text-right">{formatNumber(ligne.prixUnitaire)}</div>
                <div className="col-span-2 text-right font-medium">{formatNumber(ligne.totalHT)}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Totaux immédiatement après le tableau */}
        <div className="mt-2 flex justify-end">
          <div className="bg-primary/5 rounded-lg p-3 min-w-[180px]">
            <div className="flex justify-between text-[10px] mb-1 gap-3">
              <span className="text-muted-foreground">Sous-total HT&nbsp;:</span>
              <span className="font-medium">{formatNumber(matriceData.montantInvestissement)} €</span>
            </div>
            <Separator className="my-1.5" />
            <div className="flex justify-between font-semibold text-[10px] gap-3">
              <span>Total investissement&nbsp;:</span>
              <span className="text-primary">{formatNumber(matriceData.montantInvestissement)} € HT</span>
            </div>
          </div>
        </div>
        
        {/* Éléments statiques "en-dessous" rendus en flux relatif */}
        {elementsBelow.length > 0 && (
          <div className="mt-4">
            {elementsBelow.map(el => renderFlowElement(el))}
          </div>
        )}
      </div>
    );
    
    // Utiliser uniquement les éléments "au-dessus" pour le rendu absolu standard
    return renderPageWithEditMode(4 as PDFPageNumber, elementsAbove, renderProductTableWithFlowElements);
  };

  // Page 5 - Services inclus (bloc permanent + options additionnelles sélectionnées)
  const renderServicesInclusPage = () => {
    const staticElements = getStaticPageElements(5 as PDFPageNumber);
    const pageOptions = selectedOptions.slice(0, OPTIONS_PER_PAGE);
    
    const renderServicesContent = () => (
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
        <div className="mb-4 border rounded overflow-hidden">
          <div className="bg-muted px-4 py-2 flex items-center gap-2">
            <div className="w-2.5 h-5 bg-foreground/80 rounded-sm" />
            <span className="font-semibold text-[14px]">Services Inclus</span>
          </div>
          <div className="px-4 py-3 bg-background">
            <ul className="text-[10px] text-muted-foreground space-y-1 list-disc list-inside">
              {servicesInclus.description.split(',').map((item, i) => (
                <li key={i} className="leading-tight">{item.trim()}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Options additionnelles sélectionnées (depuis optionsServices) */}
        {pageOptions.length > 0 && (
          <div className="space-y-3">
            {pageOptions.map((option) => (
              <div key={option.id} className="border rounded overflow-hidden">
                <div className="bg-muted px-4 py-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground/70" />
                  <span className="font-semibold text-[14px]">{option.name}</span>
                  {option.price !== null && (
                    <span className="ml-auto text-[11px] text-primary font-medium">
                      {formatNumber(option.price)} €/mois
                    </span>
                  )}
                </div>
                {option.description && (
                  <div className="px-4 py-3 bg-background">
                    <ul className="text-[10px] text-muted-foreground space-y-1 list-disc list-inside">
                      {option.description.split(',').map((item, i) => (
                        <li key={i} className="leading-tight">{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
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
                    <ul className="text-[10px] text-muted-foreground space-y-1 list-disc list-inside">
                      {option.description.split(',').map((item, i) => (
                        <li key={i} className="leading-tight">{item.trim()}</li>
                      ))}
                    </ul>
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
            <ul className="text-[8px] text-muted-foreground space-y-0.5 list-disc list-inside">
              {servicesInclus.description.split(',').map((item, i) => (
                <li key={i} className="leading-tight">{item.trim()}</li>
              ))}
            </ul>
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
                    <ul className="text-[8px] text-muted-foreground space-y-0.5 list-disc list-inside">
                      {option.description.split(',').map((item, i) => (
                        <li key={i} className="leading-tight">{item.trim()}</li>
                      ))}
                    </ul>
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
  const renderCurrentPage = () => {
    // Trouver les pages d'injection pour chaque type de zone
    const investPage = getInjectionPageForZoneType('invest_table');
    const optionsPage = getInjectionPageForZoneType('options_block');
    
    // Vérifier si la page demandée existe dans la version
    const version = getCurrentVersion();
    const pageExists = version?.pages.some(p => p.pageNumber === currentPreviewPage);
    
    // Si la page n'existe pas, afficher un message
    if (!pageExists && currentPreviewPage > 1) {
      return (
        <div 
          className="aspect-[210/297] bg-white rounded-lg ring-1 ring-border relative overflow-hidden flex items-center justify-center"
          style={{ maxWidth: CANVAS_DISPLAY_MAX_WIDTH }}
        >
          <p className="text-muted-foreground text-sm">Page {currentPreviewPage} n'existe pas dans ce template</p>
        </div>
      );
    }
    
    // Mapping dynamique : afficher le contenu approprié selon le type de zone présent
    if (currentPreviewPage === 1) return renderPage1();
    
    // Si la page courante contient la zone invest_table, afficher les produits
    if (investPage && currentPreviewPage === investPage) {
      return renderProductPage();
    }
    
    // Page 5 : Services inclus (toujours)
    if (currentPreviewPage === 5) {
      return renderServicesInclusPage();
    }
    
    // Page 6 : Nos Options
    if (currentPreviewPage === 6) {
      return renderNosOptionsPage();
    }
    
    // Pages statiques connues (si elles existent dans la version)
    if (currentPreviewPage === 2) return renderStaticPage(2, 'Nos engagements');
    if (currentPreviewPage === 3) return renderStaticPage(3, 'Conditions de location');
    
    // Pages génériques (7, 8 ou autres) - rendu statique basé sur les éléments du template
    return renderGenericStaticPage(currentPreviewPage);
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

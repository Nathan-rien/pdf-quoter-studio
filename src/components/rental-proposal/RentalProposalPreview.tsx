/**
 * Composant d'aperçu PDF pour la proposition de location
 * Affiche le template sélectionné avec les données injectées
 * Structure fixe de 8 pages avec mode édition optionnel
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { CANVAS_SCALE, PREVIEW_FONT_SCALE, PREVIEW_ICON_SCALE, LIST_INDENT_PX, CONTRACT_PAGES, OPTIONS_PER_PAGE, LINES_PER_PAGE, CANVAS_DISPLAY_MAX_WIDTH } from '@/lib/canvas-constants';
import { getSharedElementStyle, sortElementsByZIndex } from '@/lib/template-render-utils';
import type { EditableElement, TextContent, ImageContent, ShapeContent, IconContent } from '@/types/template-editor';
import type { PDFPageNumber } from '@/types/pdf-template';
import { PreviewEditableCanvas } from './PreviewEditableCanvas';

export function RentalProposalPreview() {
  const [currentPreviewPage, setCurrentPreviewPage] = React.useState(1);
  const [isEditMode, setIsEditMode] = React.useState(false);
  
  // Synchronisation avec le cloud pour charger les templates
  const { isLoading, hasLoaded } = useTemplateSync();
  
  const {
    clientData,
    matriceData,
    lignesData,
    optionsServices,
    getCalculatedValues,
  } = useRentalProposalStore();

  const { 
    getActiveTemplate, 
    getTemplateLatestVersion, 
    preparePreviewEditing, 
    getCurrentVersionForPreview 
  } = useTemplateEditorStore();
  
  // Afficher un état de chargement si les templates ne sont pas encore chargés
  if (isLoading && !hasLoaded) {
    return <LoadingState message="Chargement du template..." />;
  }
  
  const activeTemplate = getActiveTemplate();
  const calculatedValues = getCalculatedValues();
  const selectedOptions = optionsServices.filter(opt => opt.selected);
  
  // Total pages: contrat fixe de 8 pages
  const totalPages = CONTRACT_PAGES;

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  // Helper pour obtenir les éléments statiques d'une page du template
  // En mode édition, utilise currentVersion (version de travail), sinon la dernière version publiée
  const getStaticPageElements = (pageNumber: PDFPageNumber): EditableElement[] => {
    const template = getActiveTemplate();
    if (!template) return [];
    
    // En mode édition, utiliser currentVersion (initialisée par preparePreviewEditing)
    let version;
    if (isEditMode) {
      version = getCurrentVersionForPreview();
    }
    // Fallback sur la dernière version si pas en mode édition ou pas de currentVersion
    if (!version) {
      version = getTemplateLatestVersion(template.id);
    }
    if (!version) return [];
    
    const pageContent = version.pages.find(p => p.pageNumber === pageNumber);
    if (!pageContent) return [];
    
    // Retourner uniquement les éléments non-dynamiques (texte/image statiques), triés par zIndex
    return sortElementsByZIndex(pageContent.elements.filter(el => !el.isDynamic));
  };
  
  // Initialiser la version de travail lors de l'activation du mode édition
  const handleToggleEditMode = React.useCallback(() => {
    const newEditMode = !isEditMode;
    
    // Si on active le mode édition, initialiser la version de travail
    if (newEditMode && activeTemplate) {
      preparePreviewEditing(activeTemplate.id);
    }
    
    setIsEditMode(newEditMode);
  }, [isEditMode, activeTemplate, preparePreviewEditing]);

  // Rendu d'un élément du template (utilise le style partagé pour garantir la fidélité WYSIWYG)
  const renderTemplateElement = (element: EditableElement) => {
    // Utilisation du style partagé pour garantir un rendu identique à EditorCanvas
    const getElementStyle = (): React.CSSProperties => {
      return getSharedElementStyle({ element });
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
      return (
        <div
          key={element.id}
          style={{
            ...getElementStyle(),
            opacity: (content.opacity ?? 100) / 100,
          }}
        >
        {content.imageUrl && (
            <img
              src={content.imageUrl}
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
        {staticElements.length > 0 ? (
          <>
            {staticElements.map(el => renderTemplateElement(el))}
            {renderDynamicContent?.()}
          </>
        ) : fallbackContent || (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Page {pageNum}</p>
              <p className="text-sm mt-2">Aucun contenu dans le template</p>
            </div>
          </div>
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
    
    const renderClientData = () => (
      <div className="absolute bottom-16 left-4 right-4 bg-background/95 rounded-lg p-3 shadow-sm border z-40">
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
  const renderProductPage = () => {
    const pageLines = lignesData.slice(0, LINES_PER_PAGE);
    const staticElements = getStaticPageElements(4 as PDFPageNumber);
    
    const renderProductTable = () => (
      <div 
        className="absolute bg-white"
        style={{
          left: '3%',
          top: '15%',
          width: '94%',
          maxHeight: '40%',
        }}
      >
        {/* Tableau des produits - compact */}
        <div className="border rounded overflow-hidden">
          <div className="grid grid-cols-12 gap-0.5 bg-muted px-1 py-0.5 text-[8px] font-medium">
            <div className="col-span-6">Désignation</div>
            <div className="col-span-2 text-center">Qté</div>
            <div className="col-span-2 text-right">P.U. HT</div>
            <div className="col-span-2 text-right">Total HT</div>
          </div>
          
          <div className="divide-y divide-muted/50">
            {pageLines.map((ligne, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-0.5 px-1 py-0.5 text-[8px] items-start">
                <div className="col-span-6 break-words whitespace-normal leading-tight">{ligne.designation || '-'}</div>
                <div className="col-span-2 text-center">{ligne.quantite}</div>
                <div className="col-span-2 text-right">{formatNumber(ligne.prixUnitaire)}</div>
                <div className="col-span-2 text-right font-medium">{formatNumber(ligne.totalHT)}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Totaux immédiatement après le tableau */}
        <div className="mt-1 flex justify-end">
          <div className="bg-primary/5 rounded-lg p-2 min-w-[160px]">
            <div className="flex justify-between text-[8px] mb-1 gap-2">
              <span className="text-muted-foreground">Sous-total HT&nbsp;:</span>
              <span className="font-medium">{formatNumber(matriceData.montantInvestissement)} €</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold text-[8px] gap-2">
              <span>Total investissement&nbsp;:</span>
              <span className="text-primary">{formatNumber(matriceData.montantInvestissement)} € HT</span>
            </div>
          </div>
        </div>
      </div>
    );
    
    return renderPageWithEditMode(4 as PDFPageNumber, staticElements, renderProductTable);
  };

  // Page Options Services - Page 6 fixe
  const renderOptionsPage = () => {
    const pageOptions = selectedOptions.slice(0, OPTIONS_PER_PAGE);
    const staticElements = getStaticPageElements(6 as PDFPageNumber);
    
    const renderOptionsContent = () => (
      <div 
        className="absolute"
        style={{
          left: '3%',
          top: '15%',
          width: '94%',
          maxHeight: '70%',
        }}
      >
        {pageOptions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Settings className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p className="text-[9px]">Aucune option sélectionnée</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {pageOptions.map((option) => (
              <div 
                key={option.id} 
                className="border rounded-lg p-2 bg-muted/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-0.5">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span className="font-medium text-[9px]">{option.name}</span>
                    </div>
                    {option.description && (
                      <p className="text-[8px] text-muted-foreground ml-4 whitespace-pre-wrap">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {option.price !== null && (
                    <div className="text-right">
                      <span className="font-semibold text-primary text-[9px]">
                        {formatNumber(option.price)} €
                      </span>
                      <span className="text-[7px] text-muted-foreground block">/mois</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
    
    return renderPageWithEditMode(6 as PDFPageNumber, staticElements, renderOptionsContent);
  };

  // Page finale - Récapitulatif
  const renderSummaryPage = () => {
    const staticElements = getStaticPageElements(7 as PDFPageNumber);
    
    const renderSummaryContent = () => (
      <div 
        className="absolute"
        style={{
          left: '4%',
          top: '10%',
          width: '92%',
        }}
      >
        <div className="space-y-3">
          {/* Investissement */}
          <div className="bg-muted/20 rounded-lg p-2">
            <h4 className="font-medium mb-2 flex items-center gap-1 text-[10px]">
              <Package className="h-3 w-3" />
              Investissement
            </h4>
            <div className="space-y-1 text-[9px]">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Montant total HT :</span>
                <span className="font-medium">{formatNumber(matriceData.montantInvestissement)} €</span>
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div className="bg-primary/5 rounded-lg p-2">
            <h4 className="font-medium mb-2 flex items-center gap-1 text-[10px]">
              <Calculator className="h-3 w-3" />
              Conditions de location
            </h4>
            <div className="space-y-1 text-[9px]">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Durée :</span>
                <span className="font-medium">{matriceData.duree} mois</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold gap-4">
                <span>Loyer mensuel HT :</span>
                <span className="text-primary">{formatNumber(calculatedValues.loyerMensuel)} €</span>
              </div>
              <div className="flex justify-between font-semibold gap-4">
                <span>Loyer avec services :</span>
                <span className="text-primary">{formatNumber(calculatedValues.loyerServicesInclus)} €</span>
              </div>
            </div>
          </div>
          
          {/* Options sélectionnées */}
          {selectedOptions.length > 0 && (
            <div className="bg-muted/20 rounded-lg p-2">
              <h4 className="font-medium mb-2 flex items-center gap-1 text-[10px]">
                <Settings className="h-3 w-3" />
                Options incluses ({selectedOptions.length})
              </h4>
              <div className="space-y-0.5 text-[9px]">
                {selectedOptions.slice(0, 4).map(opt => (
                  <div key={opt.id} className="flex justify-between gap-4">
                    <span className="text-muted-foreground truncate">{opt.name}</span>
                    {opt.price !== null && (
                      <span>{formatNumber(opt.price)} €/mois</span>
                    )}
                  </div>
                ))}
                {selectedOptions.length > 4 && (
                  <p className="text-muted-foreground text-[8px]">
                    + {selectedOptions.length - 4} autres options
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
    
    return renderPageWithEditMode(7 as PDFPageNumber, staticElements, renderSummaryContent);
  };

  // Page signature
  const renderSignaturePage = () => {
    const staticElements = getStaticPageElements(8 as PDFPageNumber);
    
    const renderSignatureContent = () => (
      <div 
        className="absolute"
        style={{
          left: '4%',
          top: '15%',
          width: '92%',
        }}
      >
        <div className="space-y-3 text-[9px] text-muted-foreground">
          <p>
            Le présent document constitue une proposition de location financière.
            Les conditions définitives seront précisées dans le contrat de location.
          </p>
          <p>
            Durée de validité de l'offre : 30 jours à compter de la date d'émission.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-6 pt-6 border-t mt-4">
          <div>
            <p className="text-[10px] font-medium mb-1">Le client</p>
            <p className="text-[8px] text-muted-foreground mb-3">
              {clientData.nom || 'Nom du client'}
            </p>
            <div className="border-2 border-dashed border-muted rounded-lg h-16 flex items-center justify-center text-[8px] text-muted-foreground">
              Signature
            </div>
            <p className="text-[8px] text-muted-foreground mt-1">
              Date : ___/___/______
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium mb-1">Pour la société</p>
            <p className="text-[8px] text-muted-foreground mb-3">
              CybertekPro
            </p>
            <div className="border-2 border-dashed border-muted rounded-lg h-16 flex items-center justify-center text-[8px] text-muted-foreground">
              Signature
            </div>
            <p className="text-[8px] text-muted-foreground mt-1">
              Date : ___/___/______
            </p>
          </div>
        </div>
      </div>
    );
    
    return renderPageWithEditMode(8 as PDFPageNumber, staticElements, renderSignatureContent);
  };

  // Rendu de la page courante - Structure FIXE 8 pages
  const renderCurrentPage = () => {
    switch (currentPreviewPage) {
      case 1: return renderPage1();
      case 2: return renderStaticPage(2, 'Nos engagements');
      case 3: return renderStaticPage(3, 'Conditions de location');
      case 4: return renderProductPage();
      case 5: return renderStaticPage(5, 'Offre matériel');
      case 6: return renderOptionsPage();
      case 7: return renderSummaryPage();
      case 8: return renderSignaturePage();
      default: return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Info template + bouton édition */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {activeTemplate?.name || 'Aucun template actif'}
              </p>
              <p className="text-sm text-muted-foreground">
                {lignesData.length} ligne(s) • {selectedOptions.length} option(s) sélectionnée(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        
        {/* Miniatures */}
        <div className="flex justify-center gap-2 flex-wrap pt-4 border-t">
          {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(pageNum => (
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
          {totalPages > 8 && (
            <>
              <span className="text-muted-foreground">...</span>
              <button
                onClick={() => setCurrentPreviewPage(totalPages)}
                className={cn(
                  "w-8 h-8 rounded text-xs font-medium transition-colors",
                  currentPreviewPage === totalPages
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

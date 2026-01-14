/**
 * Composant d'aperçu PDF pour la proposition de location
 * Affiche le template sélectionné avec les données injectées
 * Gère la pagination dynamique pour les options services
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  User, 
  Package, 
  Calculator, 
  Settings, 
  CheckCircle, 
  Clock,
  ChevronLeft,
  ChevronRight,
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
import type { EditableElement, TextContent, ImageContent, ShapeContent, IconContent } from '@/types/template-editor';
import type { PDFPageNumber } from '@/types/pdf-template';

// Constantes pour la pagination des options
const OPTIONS_PER_PAGE = 6;
const LINES_PER_PAGE = 12;

// Constantes du canvas (identique à EditorCanvas)
const CANVAS_SCALE = {
  width: 500,
  height: 707, // Ratio A4
};

export function RentalProposalPreview() {
  const [currentPreviewPage, setCurrentPreviewPage] = React.useState(1);
  
  // Synchronisation avec le cloud pour charger les templates
  const { isLoading, hasLoaded } = useTemplateSync();
  
  const {
    clientData,
    matriceData,
    lignesData,
    optionsServices,
    pdfImportStatus,
    getCalculatedValues,
  } = useRentalProposalStore();

  const { getActiveTemplate, getTemplateLatestVersion } = useTemplateEditorStore();
  
  // Afficher un état de chargement si les templates ne sont pas encore chargés
  if (isLoading && !hasLoaded) {
    return <LoadingState message="Chargement du template..." />;
  }
  
  const activeTemplate = getActiveTemplate();
  const calculatedValues = getCalculatedValues();
  const selectedOptions = optionsServices.filter(opt => opt.selected);
  
  // Calcul du nombre de pages dynamiques pour les options
  const optionsPagesCount = Math.max(1, Math.ceil(selectedOptions.length / OPTIONS_PER_PAGE));
  
  // Calcul du nombre de pages pour les lignes produits
  const linesPagesCount = Math.max(1, Math.ceil(lignesData.length / LINES_PER_PAGE));
  
  // Total pages: 3 statiques + pages produits + pages options + 2 finales
  const totalPages = 3 + linesPagesCount + optionsPagesCount + 2;

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  // Helper pour obtenir les éléments statiques d'une page du template
  const getStaticPageElements = (pageNumber: PDFPageNumber): EditableElement[] => {
    const template = getActiveTemplate();
    if (!template) return [];
    
    const version = getTemplateLatestVersion(template.id);
    if (!version) return [];
    
    const pageContent = version.pages.find(p => p.pageNumber === pageNumber);
    if (!pageContent) return [];
    
    // Retourner uniquement les éléments non-dynamiques (texte/image statiques)
    return pageContent.elements.filter(el => !el.isDynamic);
  };

  // Rendu d'un élément du template (identique à EditorCanvas)
  const renderTemplateElement = (element: EditableElement) => {
    // Calcul du style de position (comme EditorCanvas)
    const getElementStyle = (): React.CSSProperties => {
      const left = (element.position.x / CANVAS_SCALE.width) * 100;
      const top = (element.position.y / CANVAS_SCALE.height) * 100;
      const width = (element.size.width / CANVAS_SCALE.width) * 100;
      const height = (element.size.height / CANVAS_SCALE.height) * 100;
      
      // Pour les textes: utiliser maxWidth et fit-content comme EditorCanvas
      if (element.type === 'text') {
        return {
          position: 'absolute',
          left: `${left}%`,
          top: `${top}%`,
          maxWidth: `${Math.min(Math.max(width, 5), 100)}%`,
          width: 'fit-content',
          height: 'auto',
          zIndex: element.zIndex || 0,
        };
      }
      
      return {
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        zIndex: element.zIndex || 0,
      };
    };

    // Rendu texte
    if (element.type === 'text') {
      const content = element.content as TextContent;
      const fontDef = ALLOWED_FONTS.find(f => f.name === content.fontFamily);
      const fontValue = fontDef?.value || 'Outfit, sans-serif';
      // Échelle de taille adaptée à la preview (plus petite)
      const scaledFontSize = Math.max(content.fontSize * 0.4, 6);
      const indentPx = (content.indentLevel || 0) * 12;

      return (
        <div
          key={element.id}
          style={{
            ...getElementStyle(),
            fontFamily: fontValue,
            fontSize: `${scaledFontSize}px`,
            color: content.color || '#1f2937',
            fontWeight: content.bold ? 'bold' : 'normal',
            fontStyle: content.italic ? 'italic' : 'normal',
            textDecoration: content.underline ? 'underline' : 'none',
            textAlign: content.textAlign || 'left',
            paddingLeft: `${indentPx}px`,
            lineHeight: 1.3,
          }}
          dangerouslySetInnerHTML={{
            __html: content.htmlContent || content.text.replace(/\n/g, '<br/>')
          }}
        />
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
              className="w-full h-full object-contain"
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

      // Ligne spéciale
      if (content.shapeType === 'line') {
        return (
          <div
            key={element.id}
            style={{
              ...getElementStyle(),
              height: '2px',
              backgroundColor: content.border?.color || '#1f2937',
            }}
          />
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
                    fontSize: `${Math.max(content.innerContent.text.fontSize * 0.4, 6)}px`,
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
                    size={Math.max(content.innerContent.icon.size * 0.4, 8)}
                    color={content.innerContent.icon.color}
                  />
                );
              })()}
            </div>
          )}
        </div>
      );
    }

    // Rendu icône
    if (element.type === 'icon') {
      const content = element.content as IconContent;
      const IconComponent = (icons as Record<string, LucideIcon>)[content.iconName];
      if (!IconComponent) return null;
      
      const scaledSize = Math.max(content.size * 0.4, 8);
      
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

  // Composant de pagination en bas à droite de chaque page
  const PageFooter = ({ pageNum }: { pageNum: number }) => (
    <div className="flex justify-end mt-auto pt-2">
      <span className="text-[9px] text-muted-foreground">
        Page {pageNum}/{totalPages}
      </span>
    </div>
  );

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
    
    return (
      <div className="aspect-[210/297] bg-white rounded-lg border flex flex-col relative overflow-hidden">
        {/* Conteneur canvas avec les mêmes proportions que l'éditeur */}
        <div className="flex-1 relative">
          {page1Elements.length > 0 ? (
            <>
              {/* Rendu des éléments du template */}
              {page1Elements.map(el => renderTemplateElement(el))}
              
              {/* Zone d'injection des données client (positionnée en superposition) */}
              <div className="absolute bottom-16 left-4 right-4 bg-background/95 rounded-lg p-3 shadow-sm border">
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
            </>
          ) : (
            // Fallback si aucun élément template
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/5 to-primary/10">
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
          )}
        </div>
        
        <div className="p-2 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="text-[8px] text-muted-foreground">
              <p>Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
              {activeTemplate && <p>Template : {activeTemplate.name}</p>}
            </div>
            <PageFooter pageNum={1} />
          </div>
        </div>
      </div>
    );
  };

  // Page 2-3 - Engagements et conditions (statiques)
  const renderStaticPage = (pageNum: number, title: string) => {
    const staticElements = getStaticPageElements(pageNum as PDFPageNumber);

    return (
      <div className="aspect-[210/297] bg-white rounded-lg border flex flex-col relative overflow-hidden">
        {/* Conteneur avec positionnement relatif pour les éléments absolus */}
        <div className="flex-1 relative">
          {staticElements.length > 0 ? (
            staticElements.map(el => renderTemplateElement(el))
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">{title}</p>
                <p className="text-sm mt-2">Aucun contenu dans le template</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-2">
          <PageFooter pageNum={pageNum} />
        </div>
      </div>
    );
  };

  // Pages produits (dynamiques)
  const renderProductPage = (pageIndex: number) => {
    const startIndex = pageIndex * LINES_PER_PAGE;
    const pageLines = lignesData.slice(startIndex, startIndex + LINES_PER_PAGE);
    const pageNum = 4 + pageIndex;
    const isLastProductPage = pageIndex === linesPagesCount - 1;
    
    return (
      <div className="aspect-[210/297] bg-background rounded-lg border p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="gap-1">
            <Package className="h-3 w-3" />
            Dynamique
          </Badge>
        </div>
        
        <h3 className="text-lg font-bold mb-4">
          {pageIndex === 0 ? 'Détail du matériel' : `Détail du matériel (suite ${pageIndex + 1})`}
        </h3>
        
        {/* Tableau des produits - compact et lisible */}
        <div className="overflow-hidden">
          <div className="border rounded overflow-hidden">
            <div className="grid grid-cols-12 gap-0.5 bg-muted px-1 py-0.5 text-[8px] font-medium">
              <div className="col-span-6">Désignation</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-2 text-right">P.U. HT</div>
              <div className="col-span-2 text-right">Total HT</div>
            </div>
            
            <div className="divide-y divide-muted/50">
              {pageLines.map((ligne, idx) => (
                <div key={startIndex + idx} className="grid grid-cols-12 gap-0.5 px-1 py-0.5 text-[8px] items-start">
                  <div className="col-span-6 break-words whitespace-normal leading-tight">{ligne.designation || '-'}</div>
                  <div className="col-span-2 text-center">{ligne.quantite}</div>
                  <div className="col-span-2 text-right">{formatNumber(ligne.prixUnitaire)}</div>
                  <div className="col-span-2 text-right font-medium">{formatNumber(ligne.totalHT)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Totaux sur la dernière page produits */}
        {isLastProductPage && (
          <div className="mt-1 pt-1 border-t">
            <div className="flex justify-end mb-3">
              <div className="bg-primary/5 rounded-lg p-3 min-w-[180px]">
                <div className="flex justify-between text-[9px] mb-1 gap-3">
                  <span className="text-muted-foreground">Sous-total HT :</span>
                  <span className="font-medium">{formatNumber(matriceData.montantInvestissement)} €</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold text-[9px] gap-3">
                  <span>Total investissement :</span>
                  <span className="text-primary">{formatNumber(matriceData.montantInvestissement)} € HT</span>
                </div>
              </div>
            </div>
            
            {/* Éléments statiques du template (Avantages, Conditions) - rendu en flux normal */}
            <div className="mt-2 space-y-1">
              {getStaticPageElements(4 as PDFPageNumber)
                .filter(el => {
                  const elId = el.id.toLowerCase();
                  return elId.includes('avantage') || elId.includes('condition');
                })
                .sort((a, b) => a.position.y - b.position.y)
                .map(el => {
                  if (el.type !== 'text') return null;
                  const content = el.content as TextContent;
                  const fontDef = ALLOWED_FONTS.find(f => f.name === content.fontFamily);
                  
                  return (
                    <div
                      key={el.id}
                      style={{
                        fontFamily: fontDef?.value || 'Outfit, sans-serif',
                        fontSize: `${Math.max(content.fontSize * 0.35, 6)}px`,
                        color: content.color || '#1f2937',
                        fontWeight: content.bold ? 'bold' : 'normal',
                        fontStyle: content.italic ? 'italic' : 'normal',
                        textDecoration: content.underline ? 'underline' : 'none',
                        lineHeight: 1.3,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: content.htmlContent || content.text.replace(/\n/g, '<br/>')
                      }}
                    />
                  );
                })
              }
            </div>
          </div>
        )}
        
        <PageFooter pageNum={pageNum} />
      </div>
    );
  };

  // Pages Options Services (dynamiques avec pagination)
  const renderOptionsPage = (pageIndex: number) => {
    const startIndex = pageIndex * OPTIONS_PER_PAGE;
    const pageOptions = selectedOptions.slice(startIndex, startIndex + OPTIONS_PER_PAGE);
    const pageNum = 4 + linesPagesCount + pageIndex;
    const isFirstOptionsPage = pageIndex === 0;
    
    return (
      <div className="aspect-[210/297] bg-background rounded-lg border p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="default" className="gap-1 bg-primary">
            <Settings className="h-3 w-3" />
            Options
          </Badge>
        </div>
        
        <h3 className="text-lg font-bold mb-2">
          {isFirstOptionsPage ? 'Vos options de services' : `Vos options de services (suite ${pageIndex + 1})`}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Services inclus dans votre contrat de location
        </p>
        
        {/* Liste des options */}
        <div className="flex-1 space-y-3">
          {pageOptions.length === 0 && isFirstOptionsPage ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune option sélectionnée</p>
              </div>
            </div>
          ) : (
            pageOptions.map((option, idx) => (
              <div 
                key={option.id} 
                className="border rounded-lg p-4 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="font-medium">{option.name}</span>
                    </div>
                    {option.description && (
                      <p className="text-sm text-muted-foreground ml-6 whitespace-pre-wrap">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {option.price !== null && (
                    <div className="text-right">
                      <span className="font-semibold text-primary">
                        {formatNumber(option.price)} €
                      </span>
                      <span className="text-xs text-muted-foreground block">/mois</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <PageFooter pageNum={pageNum} />
      </div>
    );
  };

  // Page finale - Récapitulatif
  const renderSummaryPage = () => {
    const pageNum = totalPages - 1;
    
    return (
      <div className="aspect-[210/297] bg-background rounded-lg border p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="gap-1">
            <Calculator className="h-3 w-3" />
            Récapitulatif
          </Badge>
        </div>
        
        <h3 className="text-lg font-bold mb-4">Récapitulatif de votre offre</h3>
        
        <div className="flex-1 space-y-4">
          {/* Investissement */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Investissement
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant total HT :</span>
                <span className="font-medium">{formatNumber(matriceData.montantInvestissement)} €</span>
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div className="bg-primary/5 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Conditions de location
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durée :</span>
                <span className="font-medium">{matriceData.duree} mois</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Loyer mensuel HT :</span>
                <span className="text-primary">{formatNumber(calculatedValues.loyerMensuel)} €</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Loyer avec services :</span>
                <span className="text-primary">{formatNumber(calculatedValues.loyerServicesInclus)} €</span>
              </div>
            </div>
          </div>
          
          {/* Options sélectionnées */}
          {selectedOptions.length > 0 && (
            <div className="bg-muted/20 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Options incluses ({selectedOptions.length})
              </h4>
              <div className="space-y-1 text-sm">
                {selectedOptions.slice(0, 4).map(opt => (
                  <div key={opt.id} className="flex justify-between">
                    <span className="text-muted-foreground truncate">{opt.name}</span>
                    {opt.price !== null && (
                      <span>{formatNumber(opt.price)} €/mois</span>
                    )}
                  </div>
                ))}
                {selectedOptions.length > 4 && (
                  <p className="text-muted-foreground text-xs">
                    + {selectedOptions.length - 4} autres options
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <PageFooter pageNum={pageNum} />
      </div>
    );
  };

  // Page signature
  const renderSignaturePage = () => (
    <div className="aspect-[210/297] bg-background rounded-lg border p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          Signature
        </Badge>
      </div>
      
      <h3 className="text-lg font-bold mb-4">Conditions et signature</h3>
      
      <div className="flex-1 flex flex-col">
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Le présent document constitue une proposition de location financière.
            Les conditions définitives seront précisées dans le contrat de location.
          </p>
          <p>
            Durée de validité de l'offre : 30 jours à compter de la date d'émission.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 pt-8 border-t mt-4">
          <div>
            <p className="text-sm font-medium mb-2">Le client</p>
            <p className="text-xs text-muted-foreground mb-4">
              {clientData.nom || 'Nom du client'}
            </p>
            <div className="border-2 border-dashed border-muted rounded-lg h-24 flex items-center justify-center text-xs text-muted-foreground">
              Signature
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Date : ___/___/______
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Pour la société</p>
            <p className="text-xs text-muted-foreground mb-4">
              CybertekPro
            </p>
            <div className="border-2 border-dashed border-muted rounded-lg h-24 flex items-center justify-center text-xs text-muted-foreground">
              Signature
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Date : ___/___/______
            </p>
          </div>
        </div>
      </div>
      
      <PageFooter pageNum={totalPages} />
    </div>
  );

  // Rendu de la page courante
  const renderCurrentPage = () => {
    if (currentPreviewPage === 1) return renderPage1();
    if (currentPreviewPage === 2) return renderStaticPage(2, 'Nos engagements');
    if (currentPreviewPage === 3) return renderStaticPage(3, 'Conditions de location');
    
    // Pages produits
    const productStartPage = 4;
    const productEndPage = productStartPage + linesPagesCount - 1;
    if (currentPreviewPage >= productStartPage && currentPreviewPage <= productEndPage) {
      return renderProductPage(currentPreviewPage - productStartPage);
    }
    
    // Pages options
    const optionsStartPage = productEndPage + 1;
    const optionsEndPage = optionsStartPage + optionsPagesCount - 1;
    if (currentPreviewPage >= optionsStartPage && currentPreviewPage <= optionsEndPage) {
      return renderOptionsPage(currentPreviewPage - optionsStartPage);
    }
    
    // Pages finales
    if (currentPreviewPage === totalPages - 1) return renderSummaryPage();
    if (currentPreviewPage === totalPages) return renderSignaturePage();
    
    return null;
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Info template */}
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
          <Badge variant="secondary">
            {totalPages} pages
          </Badge>
        </div>
        
        <Separator />
        
        {/* Navigation pages */}
        {renderPageIndicator()}
        
        {/* Aperçu page courante */}
        <div className="max-w-lg mx-auto">
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

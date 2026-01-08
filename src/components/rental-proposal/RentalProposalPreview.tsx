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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { cn } from '@/lib/utils';

// Constantes pour la pagination des options
const OPTIONS_PER_PAGE = 6;
const LINES_PER_PAGE = 12;

export function RentalProposalPreview() {
  const [currentPreviewPage, setCurrentPreviewPage] = React.useState(1);
  
  const {
    clientData,
    matriceData,
    lignesData,
    optionsServices,
    pdfImportStatus,
    getCalculatedValues,
  } = useRentalProposalStore();

  const { getActiveTemplate, getTemplateLatestVersion } = useTemplateEditorStore();
  
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

  // Page 1 - Couverture
  const renderPage1 = () => (
    <div className="aspect-[210/297] bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border p-6 flex flex-col">
      <div className="text-center flex-1 flex flex-col justify-center">
        <h1 className="text-2xl font-bold text-primary mb-2">
          Proposition de Location
        </h1>
        <p className="text-muted-foreground mb-8">Financière Professionnelle</p>
        
        <div className="bg-background rounded-lg p-6 shadow-sm max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <span className="font-medium">Client</span>
          </div>
          <div className="text-left space-y-1 text-sm">
            <p className="font-semibold">{clientData.nom || 'Nom du client'}</p>
            <p className="text-muted-foreground">{clientData.adresse || 'Adresse'}</p>
            <p className="text-muted-foreground">
              {clientData.codePostal} {clientData.ville}
            </p>
            {clientData.email && (
              <p className="text-muted-foreground">{clientData.email}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <p>Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
        {activeTemplate && <p className="mt-1">Template : {activeTemplate.name}</p>}
      </div>
    </div>
  );

  // Page 2-3 - Engagements et conditions (statiques)
  const renderStaticPage = (pageNum: number, title: string) => (
    <div className="aspect-[210/297] bg-muted/20 rounded-lg border p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          Statique
        </Badge>
        <span className="text-xs text-muted-foreground">Page {pageNum}/{totalPages}</span>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">{title}</p>
          <p className="text-sm mt-2">Contenu statique du template</p>
        </div>
      </div>
    </div>
  );

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
          <span className="text-xs text-muted-foreground">Page {pageNum}/{totalPages}</span>
        </div>
        
        <h3 className="text-lg font-bold mb-4">
          {pageIndex === 0 ? 'Détail du matériel' : `Détail du matériel (suite ${pageIndex + 1})`}
        </h3>
        
        {/* Tableau des produits */}
        <div className="flex-1 overflow-hidden">
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-2 bg-muted p-2 text-xs font-medium">
              <div className="col-span-6">Désignation</div>
              <div className="col-span-2 text-right">Qté</div>
              <div className="col-span-2 text-right">P.U. HT</div>
              <div className="col-span-2 text-right">Total HT</div>
            </div>
            
            <div className="divide-y">
              {pageLines.map((ligne, idx) => (
                <div key={startIndex + idx} className="grid grid-cols-12 gap-2 p-2 text-xs">
                  <div className="col-span-6 truncate">{ligne.designation || '-'}</div>
                  <div className="col-span-2 text-right">{ligne.quantite}</div>
                  <div className="col-span-2 text-right">{formatNumber(ligne.prixUnitaire)}</div>
                  <div className="col-span-2 text-right font-medium">{formatNumber(ligne.totalHT)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Totaux sur la dernière page produits */}
        {isLastProductPage && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-end">
              <div className="bg-primary/5 rounded-lg p-4 min-w-[200px]">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Sous-total HT :</span>
                  <span className="font-medium">{formatNumber(matriceData.montantInvestissement)} €</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total investissement :</span>
                  <span className="text-primary">{formatNumber(matriceData.montantInvestissement)} € HT</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
          <span className="text-xs text-muted-foreground">Page {pageNum}/{totalPages}</span>
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
        
        {/* Résumé financier sur la première page d'options */}
        {isFirstOptionsPage && selectedOptions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Durée du contrat
                </div>
                <span className="font-semibold">{matriceData.duree} mois</span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calculator className="h-4 w-4" />
                  Loyer mensuel
                </div>
                <span className="font-semibold text-primary">
                  {formatNumber(calculatedValues.loyerServicesInclus)} € HT
                </span>
              </div>
            </div>
          </div>
        )}
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
          <span className="text-xs text-muted-foreground">Page {pageNum}/{totalPages}</span>
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre de lignes :</span>
                <span>{lignesData.length}</span>
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refinanceur :</span>
                <span>{matriceData.refinanceur}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coefficient :</span>
                <span>{calculatedValues.coefficient ?? '-'}</span>
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
        
        <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/30 text-center">
          <p className="text-sm font-medium text-success">
            Coût total du contrat : {formatNumber(calculatedValues.coutContrat)} €
          </p>
        </div>
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
        <span className="text-xs text-muted-foreground">Page {totalPages}/{totalPages}</span>
      </div>
      
      <h3 className="text-lg font-bold mb-4">Conditions et signature</h3>
      
      <div className="flex-1 flex flex-col">
        <div className="space-y-4 text-sm text-muted-foreground flex-1">
          <p>
            Le présent document constitue une proposition de location financière.
            Les conditions définitives seront précisées dans le contrat de location.
          </p>
          <p>
            Durée de validité de l'offre : 30 jours à compter de la date d'émission.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 pt-8 border-t mt-auto">
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

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuoteTemplate, InvestData, CSVImportResult, ServiceOption, OptionsServicesData } from "@/types/quote";
import { validatePDFExport, getExportValidationSummary } from "@/lib/pdf-export-validation";
import { PDF_TEMPLATE_CONTRACT } from "@/lib/pdf-template-contract";
import { 
  FileText, 
  ChevronRight,
  CheckCircle,
  Circle,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { StepHeader } from "@/components/ui/step-header";
import { BlockingMessage } from "@/components/ui/blocking-message";
import {
  Page1Cover,
  Page2Engagements,
  Page3Location,
  Page4OffreRachat,
  Page5OffreMateriel,
  Page6Services,
  Page7ServicesPro,
  Page8Signature
} from "@/components/pdf/pages";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface QuotePreviewProps {
  template: QuoteTemplate | null;
  investData: InvestData | null;
  csvImport: CSVImportResult | null;
  selectedOptions: ServiceOption[];
  optionsData?: OptionsServicesData | null;
  onExport: () => void;
}

export function QuotePreview({ 
  template, 
  investData, 
  csvImport, 
  selectedOptions,
  optionsData,
  onExport 
}: QuotePreviewProps) {
  const [expandedView, setExpandedView] = useState(false);
  
  // Construire optionsData à partir de selectedOptions si non fourni
  const effectiveOptionsData: OptionsServicesData | null = optionsData || (selectedOptions.length > 0 ? {
    isEmpty: false,
    rows: selectedOptions.map(o => ({
      id: o.id,
      name: o.name,
      description: o.description,
      selected: o.selected,
      category: o.category,
      price: o.price
    })),
    structureError: null
  } : null);

  // Validation du template
  const validation = validatePDFExport(investData, effectiveOptionsData);
  const validationSummary = getExportValidationSummary(investData, effectiveOptionsData);
  
  const isInvestReady = investData?.validationStatus === 'valide_pret_injection';
  const isReady = template && validation.canExport;
  const selectedOpts = selectedOptions.filter(o => o.selected);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <StepHeader
          stepNumber={6}
          totalSteps={7}
          title="Aperçu du Devis"
          description="Vérifiez la structure du devis 8 pages avant l'export final."
          status={isReady ? 'complete' : 'active'}
          statusLabel={isReady ? 'Prêt pour export' : 'Données incomplètes'}
        />
      </div>

      {/* Template info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{PDF_TEMPLATE_CONTRACT.name}</p>
              <p className="text-sm text-muted-foreground">
                {PDF_TEMPLATE_CONTRACT.totalPages} pages • Version {PDF_TEMPLATE_CONTRACT.version}
              </p>
            </div>
            <Badge variant="success">Actif</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Checklist pré-export */}
      <Card variant="ghost" className="border border-dashed">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Vérification pré-export :</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              {template ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={template ? '' : 'text-muted-foreground'}>Template sélectionné</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {investData ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={investData ? '' : 'text-muted-foreground'}>Excel importé</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isInvestReady ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={isInvestReady ? '' : 'text-muted-foreground'}>Invest validé</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {selectedOpts.length > 0 ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className="text-muted-foreground">Options (optionnel)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé des pages */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Structure du document</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpandedView(!expandedView)}
              className="gap-1"
            >
              {expandedView ? (
                <>Réduire <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Voir les 8 pages <ChevronDown className="h-4 w-4" /></>
              )}
            </Button>
          </div>

          {/* Vue compacte */}
          {!expandedView && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PDF_TEMPLATE_CONTRACT.pages.map((page) => {
                const pageResult = validation.pageResults.find(r => r.pageNumber === page.pageNumber);
                const hasError = pageResult && !pageResult.isValid;
                const isDynamic = page.type !== 'static';
                const isPageReady = !hasError && (!isDynamic || isInvestReady);

                return (
                  <div
                    key={page.pageNumber}
                    className={cn(
                      "aspect-[210/297] rounded border-2 flex flex-col items-center justify-center text-xs",
                      hasError && "border-destructive bg-destructive/5",
                      !hasError && page.type === 'static' && "border-muted bg-muted/30",
                      !hasError && isDynamic && isPageReady && "border-success bg-success/5",
                      !hasError && isDynamic && !isPageReady && "border-warning bg-warning/5"
                    )}
                    title={page.title}
                  >
                    <span className="font-bold">{page.pageNumber}</span>
                    {hasError && <AlertTriangle className="h-3 w-3 text-destructive mt-1" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Légende */}
          {!expandedView && (
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border border-muted bg-muted/30" />
                <span>Statique</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-success bg-success/5" />
                <span>Dynamique prêt</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-warning bg-warning/5" />
                <span>En attente</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vue étendue - 8 pages */}
      {expandedView && (
        <div className="grid md:grid-cols-2 gap-4">
          <Page1Cover />
          <Page2Engagements />
          <Page3Location />
          <Page4OffreRachat investData={investData} />
          <Page5OffreMateriel investData={investData} />
          <Page6Services optionsData={effectiveOptionsData} />
          <Page7ServicesPro />
          <Page8Signature />
        </div>
      )}

      {/* Erreurs bloquantes */}
      {validation.blockers.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-2">
                  Export bloqué ({validation.blockers.length} erreur{validation.blockers.length > 1 ? 's' : ''})
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {validation.blockers.map((blocker, i) => (
                    <li key={i}>• {blocker}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avertissements */}
      {validation.warnings.length > 0 && (
        <Card className="border-warning/50">
          <CardContent className="p-4">
            <p className="text-sm text-warning mb-2">Avertissements :</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {validation.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Export action */}
      <Card variant="ghost" className="border-2 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">
                {isReady 
                  ? "Le devis est prêt à être exporté"
                  : "Complétez les étapes requises"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {validationSummary.summary}
              </p>
            </div>
            
            <Button
              variant="hero"
              onClick={onExport}
              disabled={!isReady}
              className="gap-2"
            >
              Exporter en PDF
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {!isReady && (
        <BlockingMessage 
          message="Le tableau Invest doit être au statut 'validé_prêt_injection' avant l'export."
          variant="warning"
        />
      )}
    </div>
  );
}

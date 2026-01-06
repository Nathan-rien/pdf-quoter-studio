import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuoteTemplate, InvestData, CSVImportResult, ServiceOption } from "@/types/quote";
import { getSourceTotal } from "@/lib/calculation-rules";
import { checkInvestInjectionRules, prepareOptionsInjection } from "@/lib/pdf-injection";
import { 
  FileText, 
  Eye, 
  Check, 
  Table, 
  Settings,
  DollarSign,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/ui/step-header";
import { BlockingMessage } from "@/components/ui/blocking-message";

interface QuotePreviewProps {
  template: QuoteTemplate | null;
  investData: InvestData | null;
  csvImport: CSVImportResult | null;
  selectedOptions: ServiceOption[];
  onExport: () => void;
}

export function QuotePreview({ 
  template, 
  investData, 
  csvImport, 
  selectedOptions,
  onExport 
}: QuotePreviewProps) {
  // Vérifier les règles d'injection
  const investInjectionCheck = checkInvestInjectionRules(investData);
  const isInvestReady = investData?.validationStatus === 'valide_pret_injection';
  const isReady = template && isInvestReady && investInjectionCheck.canInject;
  const selectedOpts = selectedOptions.filter(o => o.selected);

  // Calculer le total depuis les sources (pas de calcul automatique)
  const sourceLabels = investData?.rows.map(r => r.designation) || [];
  const vtnValues = investData?.rows.map(r => r.vtn) || [];
  const totalInfo = getSourceTotal(vtnValues, sourceLabels);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <StepHeader
          stepNumber={6}
          totalSteps={7}
          title="Aperçu du Devis"
          description="Vérifiez la structure du devis avant l'export final."
          status={isReady ? 'complete' : 'active'}
          statusLabel={isReady ? 'Prêt pour export' : 'Données incomplètes'}
        />
      </div>

      {/* Checklist pré-export */}
      <Card variant="ghost" className="border border-dashed">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Vérification pré-export :</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {template ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={template ? '' : 'text-muted-foreground'}>Template sélectionné</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {investData ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={investData ? '' : 'text-muted-foreground'}>Excel importé sans erreur</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isInvestReady ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={isInvestReady ? '' : 'text-muted-foreground'}>Invest validé</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {selectedOpts.length > 0 ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className="text-muted-foreground">Options sélectionnées (optionnel)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Template</CardTitle>
              <CardDescription>
                {template?.name || "Non sélectionné"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document structure preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Structure du document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pages 1-3: Template header */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div className="w-12 h-16 rounded border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              1-3
            </div>
            <div className="flex-1">
              <p className="font-medium">Pages d'en-tête</p>
              <p className="text-sm text-muted-foreground">
                Contenu fixe du template
              </p>
            </div>
            <Badge variant="success">Template</Badge>
          </div>

          {/* Pages 4-5: Invest table */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div className={cn(
              "w-12 h-16 rounded border-2 flex items-center justify-center text-xs font-medium",
              isInvestReady 
                ? "border-primary bg-primary/5 text-primary" 
                : "border-warning bg-warning/5 text-warning"
            )}>
              4-5
            </div>
            <div className="flex-1">
              <p className="font-medium">Tableau Invest</p>
              <p className="text-sm text-muted-foreground">
                {investData?.validationStatus === 'valide_pret_injection'
                  ? `${investData.rows.length} lignes validées`
                  : investData?.validationStatus === 'importe_non_valide'
                  ? "En attente de validation"
                  : investData?.validationStatus === 'rejete_a_corriger'
                  ? "Rejeté - À corriger"
                  : "Non importé"
                }
              </p>
            </div>
            <Badge variant={isInvestReady ? "success" : "pending"}>
              {isInvestReady ? (
                <><Check className="h-3 w-3 mr-1" /> Inject</>
              ) : "À valider"}
            </Badge>
          </div>

          {/* Page 6: Options */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div className="w-12 h-16 rounded border-2 border-primary bg-primary/5 flex items-center justify-center text-xs text-primary font-medium">
              6
            </div>
            <div className="flex-1">
              <p className="font-medium">Options Services</p>
              <p className="text-sm text-muted-foreground">
                {selectedOpts.length > 0 
                  ? `${selectedOpts.length} option${selectedOpts.length > 1 ? 's' : ''} sélectionnée${selectedOpts.length > 1 ? 's' : ''}`
                  : "Aucune option sélectionnée"
                }
              </p>
            </div>
            <Badge variant={selectedOpts.length > 0 ? "success" : "pending"}>
              {selectedOpts.length > 0 ? (
                <><Settings className="h-3 w-3 mr-1" /> Inject</>
              ) : "Optionnel"}
            </Badge>
          </div>

          {/* Pages 7+: Template footer */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div className="w-12 h-16 rounded border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              7+
            </div>
            <div className="flex-1">
              <p className="font-medium">Pages de fin</p>
              <p className="text-sm text-muted-foreground">
                CGV, mentions légales
              </p>
            </div>
            <Badge variant="success">Template</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Data summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-muted">
                <Table className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium">Données Invest</span>
            </div>
            {investData ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lignes</span>
                  <span className="font-medium">{investData.rows.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total VTN (source)</span>
                  <span className="font-medium">
                    {totalInfo.isFromSource && totalInfo.total !== null
                      ? `${totalInfo.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
                      : <span className="text-muted-foreground italic">—</span>
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge 
                    variant={investData.validationStatus === 'valide_pret_injection' ? "success" : "pending"} 
                    className="text-xs"
                  >
                    {investData.validationStatus === 'valide_pret_injection' ? "Validé" : "Non validé"}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Non importé</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-muted">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium">Tarifs CSV</span>
            </div>
            {csvImport ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fichier</span>
                  <span className="font-medium truncate max-w-[150px]">{csvImport.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarifs</span>
                  <span className="font-medium">{csvImport.rowCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge variant={csvImport.isValid ? "success" : "error"} className="text-xs">
                    {csvImport.isValid ? "Valide" : "Erreur"}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Non importé (optionnel)</p>
            )}
          </CardContent>
        </Card>
      </div>

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
                {isReady
                  ? "Générez le PDF final conforme au template"
                  : "Le tableau Invest doit être au statut 'validé_prêt_injection' avant l'export"
                }
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
    </div>
  );
}

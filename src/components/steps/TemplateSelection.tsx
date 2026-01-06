import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuoteTemplate } from "@/types/quote";
import { FileText, Check, Table, Settings, Lock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/ui/step-header";
import { BlockingMessage } from "@/components/ui/blocking-message";
import { PDF_TEMPLATE_CONTRACT, getDynamicPages } from "@/lib/pdf-template-contract";

interface TemplateSelectionProps {
  onSelect: (template: QuoteTemplate) => void;
  selectedTemplate: QuoteTemplate | null;
  templates?: QuoteTemplate[];
}

// Convertir le contrat PDF en QuoteTemplate pour compatibilité
const contractAsTemplate: QuoteTemplate = {
  id: PDF_TEMPLATE_CONTRACT.id,
  name: PDF_TEMPLATE_CONTRACT.name,
  description: `Template PDF figé - ${PDF_TEMPLATE_CONTRACT.totalPages} pages avec zones d'injection contractuelles`,
  isActive: PDF_TEMPLATE_CONTRACT.isActive,
  lastModified: PDF_TEMPLATE_CONTRACT.createdAt
};

export function TemplateSelection({ onSelect, selectedTemplate }: TemplateSelectionProps) {
  const dynamicPages = getDynamicPages();
  const isSelected = selectedTemplate?.id === contractAsTemplate.id;

  return (
    <div className="space-y-6 animate-slide-up">
      <StepHeader
        stepNumber={1}
        totalSteps={7}
        title="Sélection du Template"
        description="Template PDF contractuel unique pour la génération de devis."
      />

      {/* Template unique - Contrat figé */}
      <Card
        variant={isSelected ? "selected" : "interactive"}
        onClick={() => onSelect(contractAsTemplate)}
        className="relative cursor-pointer"
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-colors",
              isSelected 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              <FileText className="h-6 w-6" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">{PDF_TEMPLATE_CONTRACT.name}</h3>
                <Badge variant="success">Actif</Badge>
                <Badge variant="outline">v{PDF_TEMPLATE_CONTRACT.version}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Structure contractuelle figée - {PDF_TEMPLATE_CONTRACT.totalPages} pages
              </p>

              {/* Résumé des pages */}
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>Pages 1-3, 7-8 : Contenu statique</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded">
                  <Table className="h-4 w-4 text-primary" />
                  <span>Pages 4-5 : Tableau Invest</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded sm:col-span-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Page 6 : Options services (conditionnel)</span>
                </div>
              </div>
            </div>

            {isSelected && (
              <div className="p-1 rounded-full bg-success text-success-foreground">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zones d'injection détaillées */}
      {isSelected && (
        <Card variant="ghost" className="border-dashed border-2 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Zones d'injection définies :</p>
            </div>
            
            <div className="space-y-3">
              {dynamicPages.map(page => (
                <div key={page.pageNumber} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Page {page.pageNumber}</Badge>
                    <span className="font-medium text-sm">{page.title}</span>
                    <Badge 
                      variant={page.type === 'dynamic_conditional' ? 'pending' : 'success'}
                      className="text-xs"
                    >
                      {page.type === 'dynamic_conditional' ? 'Conditionnel' : 'Requis'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {page.dynamicZones.map(zone => (
                      <div key={zone.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          zone.isRequired ? "bg-primary" : "bg-muted-foreground"
                        )} />
                        <span>{zone.description}</span>
                        <span className="text-xs">({zone.sourceSheet})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message de blocage si pas de sélection */}
      {!isSelected && (
        <BlockingMessage 
          message="Sélectionnez le template pour continuer." 
          variant="info"
        />
      )}
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuoteTemplate } from "@/types/quote";
import { FileText, Check, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/ui/step-header";
import { EmptyState } from "@/components/ui/empty-state";
import { BlockingMessage } from "@/components/ui/blocking-message";

interface TemplateSelectionProps {
  onSelect: (template: QuoteTemplate) => void;
  selectedTemplate: QuoteTemplate | null;
  templates?: QuoteTemplate[];
}

export function TemplateSelection({ onSelect, selectedTemplate, templates = [] }: TemplateSelectionProps) {
  const activeTemplates = templates.filter(t => t.isActive);
  const hasNoTemplates = templates.length === 0;
  const hasNoActiveTemplates = templates.length > 0 && activeTemplates.length === 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <StepHeader
        stepNumber={1}
        totalSteps={7}
        title="Sélection du Template"
        description="Choisissez le template PDF de devis à utiliser pour la génération."
      />

      {/* État vide : aucun template disponible */}
      {hasNoTemplates && (
        <EmptyState
          icon={FileText}
          title="Aucun template disponible"
          description="Aucun template PDF n'est configuré dans le système. Contactez l'administrateur pour en ajouter."
          variant="warning"
        />
      )}

      {/* État bloquant : templates existent mais aucun actif */}
      {hasNoActiveTemplates && (
        <>
          <EmptyState
            icon={AlertTriangle}
            title="Aucun template actif"
            description="Des templates existent mais aucun n'est activé. Contactez l'administrateur pour activer un template."
            variant="warning"
          />
          <BlockingMessage message="Un template actif est requis pour continuer." />
        </>
      )}

      {/* Liste des templates */}
      {activeTemplates.length > 0 && (
        <div className="grid gap-4">
          {activeTemplates.map((template) => (
            <Card
              key={template.id}
              variant={selectedTemplate?.id === template.id ? "selected" : "interactive"}
              onClick={() => onSelect(template)}
              className="relative cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    selectedTemplate?.id === template.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <FileText className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      {template.isActive && (
                        <Badge variant="success">Actif</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Modifié le {template.lastModified.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {selectedTemplate?.id === template.id && (
                    <div className="p-1 rounded-full bg-success text-success-foreground">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Zones d'injection */}
      {selectedTemplate && (
        <Card variant="ghost" className="border-dashed border-2 border-border">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Zones d'injection définies dans le template sélectionné :
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">Pages 4-5 : Tableau Invest</Badge>
              <Badge variant="outline">Page 6 : Options Services</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message de blocage si pas de sélection */}
      {activeTemplates.length > 0 && !selectedTemplate && (
        <BlockingMessage 
          message="Sélectionnez un template pour continuer." 
          variant="info"
        />
      )}
    </div>
  );
}

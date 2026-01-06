import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ServiceOption, OptionsServicesData } from "@/types/quote";
import { getOptionsStatusMessage } from "@/lib/options-parser";
import { Settings, Check, Package, AlertTriangle, Ban, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/ui/step-header";
import { EmptyState } from "@/components/ui/empty-state";
import { BlockingMessage } from "@/components/ui/blocking-message";

interface OptionsSelectionProps {
  options: ServiceOption[];
  onToggle: (optionId: string) => void;
  selectedCount: number;
  optionsData?: OptionsServicesData | null;
}

export function OptionsSelection({ 
  options, 
  onToggle, 
  selectedCount,
  optionsData 
}: OptionsSelectionProps) {
  // Vérifier l'état de l'onglet "Options services "
  const statusMessage = optionsData ? getOptionsStatusMessage(optionsData) : null;

  // Si onglet vide
  if (optionsData?.isEmpty) {
    return (
      <div className="space-y-6 animate-slide-up">
        <StepHeader
          stepNumber={5}
          totalSteps={7}
          title="Sélection des Options"
          description="Choisissez les options services à inclure dans le devis (page 6)."
        />

        <EmptyState
          icon={Info}
          title="Aucune option disponible"
          description="L'onglet « Options services  » du fichier Excel est vide. Aucune option ne sera injectée dans la page 6 du devis."
          variant="info"
        />

        <Card variant="ghost" className="border border-dashed">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Cette étape est optionnelle. Vous pouvez continuer sans sélectionner d'options.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si structure non définie (onglet avec données mais colonnes inconnues)
  if (optionsData?.structureError) {
    return (
      <div className="space-y-6 animate-slide-up">
        <StepHeader
          stepNumber={5}
          totalSteps={7}
          title="Sélection des Options"
          description="Choisissez les options services à inclure dans le devis (page 6)."
        />

        <Card variant="error">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-2">Structure non définie</p>
                <p className="text-sm text-muted-foreground">
                  {optionsData.structureError}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <BlockingMessage message="La sélection d'options est bloquée tant que la structure de l'onglet n'est pas définie contractuellement." />
      </div>
    );
  }

  // Si pas de données du tout (legacy mode avec options passées en props)
  if (options.length === 0) {
    return (
      <div className="space-y-6 animate-slide-up">
        <StepHeader
          stepNumber={5}
          totalSteps={7}
          title="Sélection des Options"
          description="Choisissez les options services à inclure dans le devis (page 6)."
        />

        <EmptyState
          icon={Ban}
          title="Aucune option chargée"
          description="Importez un fichier Excel avec un onglet « Options services  » valide."
          variant="warning"
        />
      </div>
    );
  }
  
  const categories = [...new Set(options.map(o => o.category))];
  const selectedOptions = options.filter(o => o.selected);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <StepHeader
          stepNumber={5}
          totalSteps={7}
          title="Sélection des Options"
          description="Choisissez les options services à inclure dans le devis (page 6)."
        />
        
        <Badge variant={selectedCount > 0 ? "active" : "pending"} className="gap-1">
          <Package className="h-3 w-3" />
          {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Résumé des options sélectionnées - SANS calcul de total (interdit) */}
      {selectedCount > 0 && (
        <Card variant="selected">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Options sélectionnées</p>
                <p className="text-lg font-semibold text-primary">
                  {selectedCount} option{selectedCount > 1 ? 's' : ''} incluse{selectedCount > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 max-w-md">
                {selectedOptions.map(opt => (
                  <Badge key={opt.id} variant="success" className="gap-1">
                    <Check className="h-3 w-3" />
                    {opt.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options by category */}
      <div className="space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {category}
            </h3>
            <div className="grid gap-3">
              {options
                .filter(o => o.category === category)
                .map(option => (
                  <Card 
                    key={option.id}
                    variant={option.selected ? "selected" : "interactive"}
                    onClick={() => onToggle(option.id)}
                    className="cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox 
                          checked={option.selected}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => onToggle(option.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{option.name}</h4>
                            {option.price !== undefined && (
                              <span className="font-semibold text-primary">
                                {option.price.toLocaleString('fr-FR')} €
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <Card variant="ghost" className="border border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Les options sélectionnées seront injectées dans la page 6 du devis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Page 6 - Votre offre de services
 * DYNAMIQUE CONDITIONNELLE - Blocs Options
 * 
 * RÈGLES STRICTES :
 * - Blocs affichés UNIQUEMENT si options sélectionnées
 * - Aucune reformulation des textes
 * - Aucune fusion de blocs
 * - Si vide = page masquée ou sections vides
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Package, Repeat, CheckCircle, AlertCircle } from "lucide-react";
import { OptionsServicesData } from "@/types/quote";
import { cn } from "@/lib/utils";

interface Page6ServicesProps {
  optionsData: OptionsServicesData | null;
}

export function Page6Services({ optionsData }: Page6ServicesProps) {
  const hasOptions = optionsData && !optionsData.isEmpty;
  const selectedOptions = optionsData?.rows.filter(r => r.selected) || [];
  const hasSelectedOptions = selectedOptions.length > 0;
  const hasError = optionsData?.structureError !== null && optionsData?.structureError !== undefined;

  return (
    <Card className={cn(
      "border-2",
      hasError && "border-destructive",
      hasSelectedOptions && "border-success",
      !hasError && !hasSelectedOptions && "border-muted"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant={hasSelectedOptions ? "success" : "pending"} className="gap-1">
            <Settings className="h-3 w-3" />
            Conditionnel
          </Badge>
          <span className="text-xs text-muted-foreground">Page 6/8</span>
        </div>

        <div className="aspect-[210/297] bg-muted/30 rounded-lg border-2 border-dashed border-muted p-6 overflow-hidden">
          <h3 className="text-lg font-bold mb-4">Votre offre de services</h3>

          {/* Erreur de structure */}
          {hasError && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive mb-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Erreur de structure</span>
              </div>
              <p className="text-sm text-destructive mt-1">{optionsData?.structureError}</p>
            </div>
          )}

          {/* Aucune option disponible */}
          {!hasError && !hasOptions && (
            <div className="p-4 rounded-lg bg-muted/50 border border-dashed text-center">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucune option disponible (source Excel vide)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cette page sera masquée dans le PDF final
              </p>
            </div>
          )}

          {/* Options disponibles mais aucune sélectionnée */}
          {!hasError && hasOptions && !hasSelectedOptions && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 text-center">
              <Settings className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-sm text-warning">
                Aucune option sélectionnée
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sélectionnez des options à l'étape 5 pour les afficher ici
              </p>
            </div>
          )}

          {/* Options sélectionnées */}
          {!hasError && hasSelectedOptions && (
            <div className="space-y-4">
              {/* Bloc Services Inclus */}
              <div className="border-2 border-dashed border-primary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Services Inclus</span>
                </div>
                <div className="space-y-1">
                  {selectedOptions.filter(o => o.category === 'inclus').map(opt => (
                    <div key={opt.id} className="text-xs p-1 bg-background rounded">
                      {opt.name}
                    </div>
                  ))}
                  {selectedOptions.filter(o => o.category === 'inclus').length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Aucun service inclus</p>
                  )}
                </div>
              </div>

              {/* Bloc Lease Back */}
              <div className="border-2 border-dashed border-primary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Lease Back</span>
                </div>
                <div className="space-y-1">
                  {selectedOptions.filter(o => o.category === 'leaseback').map(opt => (
                    <div key={opt.id} className="text-xs p-1 bg-background rounded">
                      {opt.name}
                    </div>
                  ))}
                  {selectedOptions.filter(o => o.category === 'leaseback').length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Aucun lease back</p>
                  )}
                </div>
              </div>

              {/* Bloc Nos Options */}
              <div className="border-2 border-dashed border-primary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Nos Options</span>
                </div>
                <div className="space-y-1">
                  {selectedOptions.filter(o => !['inclus', 'leaseback'].includes(o.category || '')).map(opt => (
                    <div key={opt.id} className="text-xs p-1 bg-background rounded">
                      {opt.name}
                    </div>
                  ))}
                  {selectedOptions.filter(o => !['inclus', 'leaseback'].includes(o.category || '')).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Aucune option</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-success text-center">
                {selectedOptions.length} option(s) sélectionnée(s)
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Footer CybertekPro</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

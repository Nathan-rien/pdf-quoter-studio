import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ServiceOption, OptionsServicesData } from "@/types/quote";
import { getOptionsStatusMessage } from "@/lib/options-parser";
import { Settings, Check, Package, AlertTriangle, Ban, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div>
          <h2 className="text-xl font-semibold mb-2">Sélection des Options</h2>
          <p className="text-muted-foreground">
            Choisissez les options services à inclure dans le devis (page 6).
          </p>
        </div>

        <Card variant="ghost" className="border-2 border-dashed">
          <CardContent className="p-8 text-center">
            <Info className="h-12 w-12 text-info mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Aucune option disponible</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              L'onglet "Options services " du fichier Excel est vide. 
              Aucune option ne sera injectée dans la page 6 du devis.
            </p>
          </CardContent>
        </Card>

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
        <div>
          <h2 className="text-xl font-semibold mb-2">Sélection des Options</h2>
          <p className="text-muted-foreground">
            Choisissez les options services à inclure dans le devis (page 6).
          </p>
        </div>

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

        <Card variant="ghost" className="border border-dashed">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              La sélection d'options est bloquée tant que la structure de l'onglet n'est pas définie contractuellement.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si pas de données du tout (legacy mode avec options passées en props)
  if (options.length === 0) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <h2 className="text-xl font-semibold mb-2">Sélection des Options</h2>
          <p className="text-muted-foreground">
            Choisissez les options services à inclure dans le devis (page 6).
          </p>
        </div>

        <Card variant="ghost" className="border-2 border-dashed">
          <CardContent className="p-8 text-center">
            <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Aucune option chargée</p>
            <p className="text-sm text-muted-foreground">
              Importez un fichier Excel avec un onglet "Options services " valide.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const categories = [...new Set(options.map(o => o.category))];
  const selectedOptions = options.filter(o => o.selected);
  const totalPrice = selectedOptions.reduce((sum, o) => sum + (o.price || 0), 0);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Sélection des Options</h2>
          <p className="text-muted-foreground">
            Choisissez les options services à inclure dans le devis (page 6).
          </p>
        </div>
        
        <Badge variant={selectedCount > 0 ? "active" : "pending"} className="gap-1">
          <Package className="h-3 w-3" />
          {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Summary */}
      {selectedCount > 0 && (
        <Card variant="selected">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total options sélectionnées</p>
                <p className="text-2xl font-bold text-primary">
                  {totalPrice.toLocaleString('fr-FR')} €
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

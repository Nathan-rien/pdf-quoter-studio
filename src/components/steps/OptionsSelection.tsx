import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ServiceOption } from "@/types/quote";
import { Settings, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionsSelectionProps {
  options: ServiceOption[];
  onToggle: (optionId: string) => void;
  selectedCount: number;
}

// Mock options for demonstration
const mockOptions: ServiceOption[] = [
  { id: "opt-1", name: "Support Premium 24/7", description: "Assistance technique disponible 24h/24, 7j/7", price: 299, selected: false, category: "Support" },
  { id: "opt-2", name: "Formation avancée", description: "Formation approfondie de 2 jours pour les administrateurs", price: 1500, selected: false, category: "Formation" },
  { id: "opt-3", name: "Garantie étendue", description: "Extension de garantie de 2 ans supplémentaires", price: 450, selected: false, category: "Garantie" },
  { id: "opt-4", name: "Migration données", description: "Service de migration complète des données existantes", price: 800, selected: false, category: "Services" },
  { id: "opt-5", name: "Audit sécurité", description: "Audit de sécurité complet avec rapport détaillé", price: 1200, selected: false, category: "Sécurité" },
  { id: "opt-6", name: "Sauvegarde cloud", description: "Solution de sauvegarde automatique dans le cloud", price: 99, selected: false, category: "Infrastructure" },
];

export function OptionsSelection({ options: propOptions, onToggle, selectedCount }: OptionsSelectionProps) {
  const options = propOptions.length > 0 ? propOptions : mockOptions;
  
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

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuoteTemplate } from "@/types/quote";
import { FileText, Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateSelectionProps {
  onSelect: (template: QuoteTemplate) => void;
  selectedTemplate: QuoteTemplate | null;
}

// Mock templates for demonstration
const mockTemplates: QuoteTemplate[] = [
  {
    id: "template-1",
    name: "Devis Standard",
    description: "Template principal avec injection pages 4/5 (tableau Invest) et page 6 (options)",
    isActive: true,
    lastModified: new Date("2024-01-15"),
  },
  {
    id: "template-2", 
    name: "Devis Compact",
    description: "Version condensée du template standard",
    isActive: false,
    lastModified: new Date("2024-01-10"),
  },
];

export function TemplateSelection({ onSelect, selectedTemplate }: TemplateSelectionProps) {
  const [templates] = useState<QuoteTemplate[]>(mockTemplates);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-xl font-semibold mb-2">Sélection du Template</h2>
        <p className="text-muted-foreground">
          Choisissez le template PDF de devis à utiliser pour la génération.
        </p>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            variant={selectedTemplate?.id === template.id ? "selected" : "interactive"}
            onClick={() => onSelect(template)}
            className="relative"
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

      <Card variant="ghost" className="border-dashed border-2 border-border">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Zones d'injection définies dans le template actif :
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline">Pages 4-5 : Tableau Invest</Badge>
            <Badge variant="outline">Page 6 : Options Services</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Page 3 - La location évolutive
 * 100% STATIQUE - Aucune donnée dynamique
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Zap, PiggyBank, Leaf } from "lucide-react";

export function Page3Location() {
  const sections = [
    { icon: Zap, title: "Flexibilité", description: "Adaptation aux besoins" },
    { icon: PiggyBank, title: "Économique", description: "Optimisation des coûts" },
    { icon: Leaf, title: "Écologique", description: "Démarche responsable" }
  ];

  return (
    <Card className="border-muted">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Statique
          </Badge>
          <span className="text-xs text-muted-foreground">Page 3/8</span>
        </div>

        <div className="aspect-[210/297] bg-muted/30 rounded-lg border-2 border-dashed border-muted p-6">
          <h3 className="text-lg font-bold mb-6">La location évolutive</h3>
          
          <div className="grid gap-4">
            {sections.map((section, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-background rounded-lg border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{section.title}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-dashed flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Footer CybertekPro</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Contenu fixe : sections Flexibilité, Économique, Écologique
        </p>
      </CardContent>
    </Card>
  );
}

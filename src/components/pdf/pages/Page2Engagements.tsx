/**
 * Page 2 - Nos engagements
 * 100% STATIQUE - Aucune donnée dynamique
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle } from "lucide-react";

export function Page2Engagements() {
  const engagements = [
    "Allonger la durée de vie du matériel informatique",
    "Gestion de parc évolutive",
    "Accompagnement dans votre démarche environnementale"
  ];

  return (
    <Card className="border-muted">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Statique
          </Badge>
          <span className="text-xs text-muted-foreground">Page 2/8</span>
        </div>

        <div className="aspect-[210/297] bg-muted/30 rounded-lg border-2 border-dashed border-muted p-6">
          <h3 className="text-lg font-bold mb-6">Nos engagements :</h3>
          
          <div className="space-y-4">
            {engagements.map((engagement, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm">{engagement}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-dashed flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Footer CybertekPro</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Contenu fixe : 3 engagements numérotés
        </p>
      </CardContent>
    </Card>
  );
}

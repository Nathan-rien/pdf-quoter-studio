/**
 * Page 1 - Couverture
 * 100% STATIQUE - Aucune donnée dynamique
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

export function Page1Cover() {
  return (
    <Card className="border-muted">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Statique
          </Badge>
          <span className="text-xs text-muted-foreground">Page 1/8</span>
        </div>

        <div className="aspect-[210/297] bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-dashed border-primary/20 flex flex-col items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Septembre 2025
            </div>
            <h2 className="text-2xl font-bold text-primary">
              PROPOSITION COMMERCIALE
            </h2>
            <div className="w-24 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              Logo CybertekPro
            </div>
            <div className="text-sm text-muted-foreground mt-8">
              Informations client
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Contenu fixe : titre, date, logo, informations client, image de fond
        </p>
      </CardContent>
    </Card>
  );
}

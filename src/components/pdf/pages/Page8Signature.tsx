/**
 * Page 8 - Bon pour accord
 * 100% STATIQUE - Aucune donnée dynamique
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, PenLine } from "lucide-react";

export function Page8Signature() {
  return (
    <Card className="border-muted">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Statique
          </Badge>
          <span className="text-xs text-muted-foreground">Page 8/8</span>
        </div>

        <div className="aspect-[210/297] bg-muted/30 rounded-lg border-2 border-dashed border-muted p-6">
          <h3 className="text-lg font-bold mb-6">Bon pour accord</h3>

          {/* Zone signature */}
          <div className="space-y-4 mb-6">
            <div className="p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Le / /</p>
              <div className="h-16 border-b border-muted-foreground/30" />
            </div>

            <div className="p-4 border-2 border-dashed rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <PenLine className="h-4 w-4" />
                <span>Signature et cachet</span>
              </div>
              <div className="h-20 border-b border-muted-foreground/30" />
            </div>
          </div>

          {/* Mentions légales */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="p-2 bg-muted/50 rounded">Mentions légales</div>
            <div className="p-2 bg-muted/50 rounded">Clause de validité</div>
          </div>

          <div className="mt-6 pt-4 border-t border-dashed flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Footer CybertekPro</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Contenu fixe : zones signature, mentions légales
        </p>
      </CardContent>
    </Card>
  );
}

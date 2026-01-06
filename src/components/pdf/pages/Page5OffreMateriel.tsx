/**
 * Page 5 - Votre offre matériel neuf
 * DYNAMIQUE PARTIELLE - Zone Invest + Bloc Location requis
 * 
 * RÈGLES STRICTES :
 * - Tableau issu de InvestData validé uniquement
 * - Bloc Location avec valeurs source (pas de calcul)
 * - Aucun recalcul des valeurs
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, AlertTriangle, CheckCircle, Calculator } from "lucide-react";
import { InvestData } from "@/types/quote";
import { cn } from "@/lib/utils";

interface Page5OffreMaterielProps {
  investData: InvestData | null;
}

export function Page5OffreMateriel({ investData }: Page5OffreMaterielProps) {
  const isReady = investData?.validationStatus === 'valide_pret_injection';
  const hasError = !investData || investData.validationStatus === 'rejete_a_corriger';

  return (
    <Card className={cn(
      "border-2",
      hasError && "border-destructive",
      !hasError && isReady && "border-success",
      !hasError && !isReady && "border-warning"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant={isReady ? "success" : hasError ? "error" : "pending"} className="gap-1">
            <Table className="h-3 w-3" />
            Dynamique
          </Badge>
          <span className="text-xs text-muted-foreground">Page 5/8</span>
        </div>

        <div className="aspect-[210/297] bg-muted/30 rounded-lg border-2 border-dashed border-muted p-6 overflow-hidden">
          <h3 className="text-lg font-bold mb-4">Votre offre matériel neuf</h3>

          {/* Zone dynamique - Tableau Invest */}
          <div className={cn(
            "border-2 border-dashed rounded-lg p-4 mb-4",
            hasError && "border-destructive bg-destructive/5",
            !hasError && isReady && "border-primary bg-primary/5",
            !hasError && !isReady && "border-warning bg-warning/5"
          )}>
            <div className="flex items-center gap-2 mb-3">
              {isReady ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
              <span className="text-sm font-medium">
                Zone dynamique : Tableau Invest
              </span>
              <Badge variant="outline" className="text-xs">Requis</Badge>
            </div>

            {!investData && (
              <p className="text-sm text-muted-foreground">
                Données Invest non importées
              </p>
            )}

            {investData && !isReady && (
              <p className="text-sm text-warning">
                Statut : {investData.validationStatus} — Validation requise
              </p>
            )}

            {investData && isReady && (
              <p className="text-sm text-success">
                {investData.rows.length} lignes validées
              </p>
            )}
          </div>

          {/* Zone dynamique - Bloc Location */}
          <div className={cn(
            "border-2 border-dashed rounded-lg p-4 mb-4",
            hasError && "border-destructive bg-destructive/5",
            !hasError && isReady && "border-primary bg-primary/5",
            !hasError && !isReady && "border-warning bg-warning/5"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Zone dynamique : Bloc Location
              </span>
              <Badge variant="outline" className="text-xs">Requis</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-background rounded border">
                <span className="text-muted-foreground">Durée :</span>
                <span className="ml-2 font-medium">— Mois</span>
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-muted-foreground">Montant :</span>
                <span className="ml-2 font-medium">— € HT</span>
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-muted-foreground">Loyer :</span>
                <span className="ml-2 font-medium">— € HT</span>
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-muted-foreground">Coût :</span>
                <span className="ml-2 font-medium">— %</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Valeurs issues de la source — Aucun calcul automatique
            </p>
          </div>

          {/* Section statique */}
          <div className="text-xs text-muted-foreground">
            <div className="p-2 bg-muted/50 rounded">Section "Condition de l'offre"</div>
          </div>

          <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Footer CybertekPro</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

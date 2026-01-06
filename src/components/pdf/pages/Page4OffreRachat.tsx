/**
 * Page 4 - Votre offre neuf + rachat
 * DYNAMIQUE PARTIELLE - Zone Invest requise
 * 
 * RÈGLES STRICTES :
 * - Tableau issu de InvestData validé uniquement
 * - Aucun recalcul des valeurs
 * - Ordre des lignes conservé
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, AlertTriangle, CheckCircle } from "lucide-react";
import { InvestData } from "@/types/quote";
import { cn } from "@/lib/utils";

interface Page4OffreRachatProps {
  investData: InvestData | null;
}

export function Page4OffreRachat({ investData }: Page4OffreRachatProps) {
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
          <span className="text-xs text-muted-foreground">Page 4/8</span>
        </div>

        <div className="aspect-[210/297] bg-muted/30 rounded-lg border-2 border-dashed border-muted p-6 overflow-hidden">
          <h3 className="text-lg font-bold mb-2">Votre offre neuf + rachat</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Paragraphe explicatif lease back
          </p>

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
              <div className="space-y-2">
                <p className="text-sm text-success">
                  {investData.rows.length} lignes validées prêtes à injecter
                </p>
                <div className="text-xs text-muted-foreground">
                  Source : onglet "{investData.sourceSheet}"
                </div>
                
                {/* Aperçu tableau */}
                <div className="mt-2 p-2 bg-background rounded border text-xs">
                  <div className="grid grid-cols-4 gap-2 font-medium text-muted-foreground mb-1">
                    <span>Désignation</span>
                    <span className="text-right">Nb</span>
                    <span className="text-right">VUN</span>
                    <span className="text-right">VTN</span>
                  </div>
                  {investData.rows.slice(0, 3).map((row, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 truncate">
                      <span className="truncate">{row.designation || '—'}</span>
                      <span className="text-right">{row.nb ?? '—'}</span>
                      <span className="text-right">{row.vun ?? '—'}</span>
                      <span className="text-right">{row.vtn ?? '—'}</span>
                    </div>
                  ))}
                  {investData.rows.length > 3 && (
                    <div className="text-muted-foreground mt-1">
                      ... et {investData.rows.length - 3} autres lignes
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sections statiques */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="p-2 bg-muted/50 rounded">Section "Avantages"</div>
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

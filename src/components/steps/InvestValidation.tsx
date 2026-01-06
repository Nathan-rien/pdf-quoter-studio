import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvestData, InvestValidationStatus } from "@/types/quote";
import { INVEST_COLUMNS } from "@/lib/invest-parser";
import { canValidateInvestData, canRejectInvestData } from "@/lib/invest-validation";
import { getSourceTotal } from "@/lib/calculation-rules";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Check, AlertTriangle, Eye, CheckCircle, XCircle, Clock, Ban, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvestValidationProps {
  investData: InvestData | null;
  onValidate: () => void;
  onReject: () => void;
  isValidated: boolean;
}

// Colonnes contractuelles à afficher
const DISPLAY_COLUMNS = [
  { key: 'rawRowIndex', label: 'Ligne', width: 'w-16' },
  { key: 'designation', label: INVEST_COLUMNS.B.header, width: 'flex-1' },
  { key: 'nb', label: INVEST_COLUMNS.C.header, width: 'w-20', align: 'right' as const },
  { key: 'vun', label: INVEST_COLUMNS.D.header, width: 'w-24', align: 'right' as const },
  { key: 'vtn', label: INVEST_COLUMNS.E.header, width: 'w-24', align: 'right' as const },
];

function getStatusBadge(status: InvestValidationStatus) {
  switch (status) {
    case 'non_importe':
      return { variant: 'pending' as const, icon: Clock, label: 'Non importé' };
    case 'importe_non_valide':
      return { variant: 'warning' as const, icon: AlertTriangle, label: 'En attente de validation' };
    case 'valide_pret_injection':
      return { variant: 'success' as const, icon: CheckCircle, label: 'Validé - Prêt à injecter' };
    case 'rejete_a_corriger':
      return { variant: 'error' as const, icon: XCircle, label: 'Rejeté - À corriger' };
  }
}

export function InvestValidation({ investData, onValidate, onReject, isValidated }: InvestValidationProps) {
  const [showPreview, setShowPreview] = useState(true);
  
  // Si pas de données, afficher message explicite
  if (!investData) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <h2 className="text-xl font-semibold mb-2">Validation Invest</h2>
          <p className="text-muted-foreground">
            Vérifiez les données à injecter dans le devis (pages 4-5).
          </p>
        </div>
        
        <Card variant="ghost" className="border-2 border-dashed">
          <CardContent className="p-8 text-center">
            <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Aucune donnée Invest</p>
            <p className="text-sm text-muted-foreground">
              Importez d'abord un fichier Excel contenant l'onglet "invest " (avec espace final).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusBadge(investData.validationStatus);
  const StatusIcon = statusInfo.icon;
  
  // Utiliser getSourceTotal au lieu de calculateInvestTotal (pas de calcul automatique)
  const sourceLabels = investData.rows.map(r => r.designation);
  const vtnValues = investData.rows.map(r => r.vtn);
  const totalInfo = getSourceTotal(vtnValues, sourceLabels);
  
  // Compter les lignes avec au moins une valeur
  const validRowCount = investData.rows.filter(r => 
    r.designation !== null || r.nb !== null || r.vun !== null || r.vtn !== null
  ).length;
  
  const hasBlockingErrors = investData.validationErrors.some(e => e.severity === 'error');
  const validationCheck = canValidateInvestData(investData);
  const canReject = canRejectInvestData(investData);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Validation Invest</h2>
          <p className="text-muted-foreground">
            Vérifiez les données à injecter dans le devis (pages 4-5).
          </p>
        </div>
        
        <Badge variant={statusInfo.variant} className="gap-1">
          <StatusIcon className="h-3 w-3" />
          {statusInfo.label}
        </Badge>
      </div>

      {/* Source info */}
      <Card variant="ghost" className="border border-dashed">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">
            Source : onglet <span className="font-mono font-medium">"{investData.sourceSheet}"</span>
            {investData.headerRowIndex >= 0 && (
              <> • En-tête détectée ligne {investData.headerRowIndex + 1}</>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Lignes</p>
                <p className="text-2xl font-bold">{investData.rows.length}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Valides</p>
                <p className="text-2xl font-bold">{validRowCount}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Total VTN (source)</p>
                <p className="text-2xl font-bold text-primary">
                  {totalInfo.isFromSource && totalInfo.total !== null
                    ? `${totalInfo.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
                    : <span className="text-muted-foreground text-base">Non défini dans les sources</span>
                  }
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "Masquer" : "Afficher"} aperçu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Table - Structure contractuelle */}
      {showPreview && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aperçu des données</CardTitle>
            <CardDescription>
              Structure contractuelle : Colonnes B (Désignation), C (Nb), D (VUN), E (VTN)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {DISPLAY_COLUMNS.map((col) => (
                      <TableHead 
                        key={col.key} 
                        className={cn("font-semibold", col.width, col.align === 'right' && "text-right")}
                      >
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investData.rows.slice(0, 20).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.rawRowIndex}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.designation ?? <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-right">
                        {row.nb ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-right">
                        {row.vun !== null 
                          ? row.vun.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell className="font-mono text-sm text-right">
                        {row.vtn !== null 
                          ? row.vtn.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {investData.rows.length > 20 && (
                <div className="p-3 text-center text-sm text-muted-foreground border-t">
                  ... et {investData.rows.length - 20} lignes supplémentaires
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {investData.validationErrors.length > 0 && (
        <Card variant="error">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-2">
                  Erreurs détectées ({investData.validationErrors.length})
                </p>
                <ul className="text-sm space-y-1">
                  {investData.validationErrors.map((error, i) => (
                    <li key={i} className={cn(
                      error.severity === 'error' ? 'text-destructive' : 'text-warning'
                    )}>
                      Ligne {error.rowIndex}, colonne {error.column} : {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Actions */}
      <Card variant="ghost" className="border border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">
                {investData.validationStatus === 'valide_pret_injection'
                  ? "Données validées et prêtes à injecter"
                  : investData.validationStatus === 'rejete_a_corriger'
                  ? "Données rejetées - correction requise"
                  : "Confirmez ou rejetez les données"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {investData.validationStatus === 'valide_pret_injection'
                  ? "Vous pouvez passer à l'étape suivante"
                  : investData.validationStatus === 'rejete_a_corriger'
                  ? "Corrigez les erreurs dans le fichier Excel et réimportez"
                  : "Cette action est bloquante pour la suite du processus"
                }
              </p>
              {!validationCheck.canValidate && validationCheck.blockers.length > 0 && (
                <ul className="mt-2 text-xs text-warning space-y-1">
                  {validationCheck.blockers.map((blocker, i) => (
                    <li key={i}>• {blocker}</li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="flex gap-2">
              {/* Bouton Rejeter - explicite */}
              <Button
                variant="outline"
                onClick={onReject}
                disabled={!canReject}
                className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
                Rejeter
              </Button>

              {/* Bouton Valider */}
              <Button
                variant={investData.validationStatus === 'valide_pret_injection' ? "success" : "default"}
                onClick={onValidate}
                disabled={!validationCheck.canValidate}
                className="gap-2"
              >
                {investData.validationStatus === 'valide_pret_injection' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Validé
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Valider les données
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

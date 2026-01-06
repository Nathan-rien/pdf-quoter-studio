import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvestData } from "@/types/quote";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Check, AlertTriangle, Eye, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvestValidationProps {
  investData: InvestData | null;
  onValidate: () => void;
  isValidated: boolean;
}

// Mock invest data for demonstration
const mockInvestData: InvestData = {
  columns: ["Référence", "Désignation", "Quantité", "Prix unitaire", "Total"],
  rows: [
    { Référence: "INV-001", Désignation: "Installation serveur principal", Quantité: 1, "Prix unitaire": 2500, Total: 2500 },
    { Référence: "INV-002", Désignation: "Configuration réseau", Quantité: 1, "Prix unitaire": 1200, Total: 1200 },
    { Référence: "INV-003", Désignation: "Licences logicielles", Quantité: 10, "Prix unitaire": 150, Total: 1500 },
    { Référence: "INV-004", Désignation: "Formation utilisateurs", Quantité: 2, "Prix unitaire": 800, Total: 1600 },
    { Référence: "INV-005", Désignation: "Support technique", Quantité: 12, "Prix unitaire": 200, Total: 2400 },
  ],
  isValidated: false,
  validationErrors: [],
};

export function InvestValidation({ investData, onValidate, isValidated }: InvestValidationProps) {
  const [showPreview, setShowPreview] = useState(true);
  
  // Use mock data if no real data is provided
  const data = investData || mockInvestData;

  const totalAmount = data.rows.reduce((sum, row) => {
    const total = typeof row.Total === 'number' ? row.Total : 0;
    return sum + total;
  }, 0);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Validation Invest</h2>
          <p className="text-muted-foreground">
            Vérifiez les données à injecter dans le devis (pages 4-5).
          </p>
        </div>
        
        {isValidated ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Validé
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            En attente de validation
          </Badge>
        )}
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Lignes</p>
                <p className="text-2xl font-bold">{data.rows.length}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Colonnes</p>
                <p className="text-2xl font-bold">{data.columns.length}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Total estimé</p>
                <p className="text-2xl font-bold text-primary">
                  {totalAmount.toLocaleString('fr-FR')} €
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

      {/* Data Preview Table */}
      {showPreview && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aperçu des données</CardTitle>
            <CardDescription>
              Contenu de l'onglet "invest" à injecter
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {data.columns.map((col) => (
                      <TableHead key={col} className="font-semibold">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row, index) => (
                    <TableRow key={index}>
                      {data.columns.map((col) => (
                        <TableCell key={col} className="font-mono text-sm">
                          {typeof row[col] === 'number' 
                            ? row[col].toLocaleString('fr-FR')
                            : row[col]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {data.validationErrors.length > 0 && (
        <Card variant="error">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-2">
                  Erreurs détectées
                </p>
                <ul className="text-sm space-y-1">
                  {data.validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
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
                {isValidated 
                  ? "Données validées et prêtes à injecter"
                  : "Confirmez la validité des données"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {isValidated
                  ? "Vous pouvez passer à l'étape suivante"
                  : "Cette action est bloquante pour la suite du processus"
                }
              </p>
            </div>
            
            <Button
              variant={isValidated ? "success" : "default"}
              onClick={onValidate}
              disabled={isValidated || data.validationErrors.length > 0}
              className="gap-2"
            >
              {isValidated ? (
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
        </CardContent>
      </Card>
    </div>
  );
}

import { useDataEditorStore } from "@/stores/dataEditorStore";
import { EditableTable, ColumnDef } from "../EditableTable";
import { DevisRow } from "@/types/quote";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator } from "lucide-react";

// Structure exacte de l'onglet "Devis" du fichier Excel (Page 5)
// Colonnes selon le fichier source
const devisColumns: ColumnDef<DevisRow>[] = [
  { 
    key: 'ref', 
    header: 'REF', 
    type: 'text', 
    width: '10%', 
    placeholder: 'Réf. constr.' 
  },
  { 
    key: 'designation', 
    header: 'DESIGNATION', 
    type: 'text', 
    width: '25%', 
    placeholder: 'Description du produit/service',
    required: true,
  },
  { 
    key: 'prixUnitaireVenteHT', 
    header: 'Prix Unitaire de vente HT', 
    type: 'number', 
    width: '12%', 
    placeholder: '0.00 €' 
  },
  { 
    key: 'qte', 
    header: 'QTE', 
    type: 'number', 
    width: '8%', 
    placeholder: '1' 
  },
  { 
    key: 'prixTotalVenteHT', 
    header: 'Prix Total de vente HT', 
    type: 'number', 
    width: '12%', 
    placeholder: '0.00 €' 
  },
  { 
    key: 'pxAchat', 
    header: 'PX ACHAT', 
    type: 'number', 
    width: '10%', 
    placeholder: '0.00 €' 
  },
  { 
    key: 'grossiste', 
    header: 'GROSSISTE', 
    type: 'text', 
    width: '10%', 
    placeholder: 'Fournisseur' 
  },
  { 
    key: 'marge', 
    header: 'MARGE', 
    type: 'number', 
    width: '8%', 
    placeholder: '%' 
  },
  { 
    key: 'refFournisseur', 
    header: 'NUMERO COTATION', 
    type: 'text', 
    width: '12%', 
    placeholder: 'Devis numéro' 
  },
];

export function DevisEditor() {
  const { 
    devisData, 
    updateDevisCell, 
    addDevisRow, 
    deleteDevisRow,
    getSheetErrors,
  } = useDataEditorStore();

  const errors = getSheetErrors('devis');

  // Calculate totals
  const totalHT = devisData.reduce((sum, row) => sum + (row.prixTotalVenteHT || 0), 0);
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Onglet "Devis"</CardTitle>
              <CardDescription className="text-xs">
                Structure des colonnes : REF, DESIGNATION, Prix Unitaire de vente HT, QTE, Prix Total de vente HT, PX ACHAT, GROSSISTE, MARGE, NUMERO COTATION
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="overflow-x-auto">
        <EditableTable
          data={devisData}
          columns={devisColumns}
          onCellChange={(rowIndex, column, value) => 
            updateDevisCell(rowIndex, column as keyof DevisRow, value)
          }
          onAddRow={addDevisRow}
          onDeleteRow={deleteDevisRow}
          errors={errors}
          emptyMessage="Aucune ligne de devis. Ajoutez des articles."
        />
      </div>

      {devisData.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">TOTAL HT</span>
                <span className="font-mono font-medium">
                  {totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">TVA 20 %</span>
                <span className="font-mono">
                  {tva.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="font-medium">TOTAL TTC</span>
                </div>
                <Badge variant="default" className="text-base px-4 py-1.5 font-mono">
                  {totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Offre Locative (from Excel) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Offre Locative</CardTitle>
          <CardDescription>Ces valeurs sont calculées à partir de la Matrice</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Durée</span>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono">
              — Mois
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Loyer mensuel</span>
            <div className="px-3 py-2 bg-muted/50 rounded-md font-mono">
              — € HT
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <span className="text-sm text-muted-foreground">Valorisation de votre ancien matériel</span>
            <div className="px-3 py-2 bg-muted/50 rounded-md text-sm">
              sur étude
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

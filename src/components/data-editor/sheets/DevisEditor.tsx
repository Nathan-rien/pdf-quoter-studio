import { useDataEditorStore } from "@/stores/dataEditorStore";
import { EditableTable, ColumnDef } from "../EditableTable";
import { DevisRow } from "@/types/quote";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const devisColumns: ColumnDef<DevisRow>[] = [
  { key: 'ref', header: 'Réf', type: 'text', width: '10%', placeholder: 'REF-001' },
  { key: 'designation', header: 'Désignation', type: 'text', width: '20%', placeholder: 'Description...' },
  { key: 'prixUnitaireVenteHT', header: 'PU Vente HT', type: 'number', width: '10%', placeholder: '0.00' },
  { key: 'qte', header: 'Qté', type: 'number', width: '8%', placeholder: '0' },
  { key: 'prixTotalVenteHT', header: 'PT Vente HT', type: 'number', width: '10%', placeholder: '0.00' },
  { key: 'pxAchat', header: 'PX ACHAT', type: 'number', width: '10%', placeholder: '0.00' },
  { key: 'grossiste', header: 'GROSSISTE', type: 'text', width: '12%', placeholder: 'Fournisseur' },
  { key: 'prixVente', header: 'Prix Vente', type: 'number', width: '10%', placeholder: '0.00' },
  { key: 'marge', header: 'Marge', type: 'number', width: '8%', placeholder: '0%' },
  { key: 'refFournisseur', header: 'Réf Fourn.', type: 'text', width: '10%', placeholder: 'REF-F' },
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

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Structure de l'onglet "Devis"</CardTitle>
              <CardDescription className="text-xs">
                Colonnes B-O : Réf, Désignation, Prix Unitaire Vente HT, Qté, Prix Total Vente HT, PX ACHAT, GROSSISTE, Prix Vente, Marge, Réf Fournisseur
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
    </div>
  );
}

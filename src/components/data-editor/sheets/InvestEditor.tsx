import { useDataEditorStore } from "@/stores/dataEditorStore";
import { EditableTable, ColumnDef } from "../EditableTable";
import { InvestRow } from "@/types/quote";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator } from "lucide-react";

// Structure exacte de l'onglet "invest " du fichier Excel (Page 4)
// Colonnes : Matériel 2025 | Nb | VUN | VTN
const investColumns: ColumnDef<InvestRow>[] = [
  { 
    key: 'designation', 
    header: 'Matériel 2025', 
    type: 'text', 
    width: '50%',
    placeholder: 'Description du matériel...',
    required: true,
  },
  { 
    key: 'nb', 
    header: 'Nb', 
    type: 'number', 
    width: '15%',
    placeholder: '0',
    required: true,
  },
  { 
    key: 'vun', 
    header: 'VUN', 
    type: 'number', 
    width: '18%',
    placeholder: '0.00 €',
    required: true,
  },
  { 
    key: 'vtn', 
    header: 'VTN', 
    type: 'readonly', 
    width: '20%',
  },
];

export function InvestEditor() {
  const { 
    investData, 
    updateInvestCell, 
    addInvestRow, 
    deleteInvestRow,
    getSheetErrors,
  } = useDataEditorStore();

  const errors = getSheetErrors('invest');

  // Calculate total VTN
  const totalVTN = investData.reduce((sum, row) => sum + (row.vtn || 0), 0);

  // Format data for display with formatted VTN
  const displayData = investData.map(row => ({
    ...row,
    vtn: row.vtn !== null ? row.vtn : null,
  }));

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Onglet "invest " - Matériel 2025</CardTitle>
              <CardDescription className="text-xs">
                Colonnes B-E : Matériel 2025 (désignation), Nb (quantité, entier), VUN (valeur unitaire), VTN (= Nb × VUN, calculé automatiquement)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <EditableTable
        data={displayData}
        columns={investColumns}
        onCellChange={(rowIndex, column, value) => 
          updateInvestCell(rowIndex, column as keyof InvestRow, value)
        }
        onAddRow={addInvestRow}
        onDeleteRow={deleteInvestRow}
        errors={errors}
        emptyMessage="Aucune ligne de matériel. Ajoutez des équipements à la liste."
      />

      {investData.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="font-medium">Total</span>
              </div>
              <Badge variant="default" className="text-base px-4 py-1.5 font-mono">
                {totalVTN.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <CardDescription className="text-xs">
            <strong>Exemples de lignes du fichier source :</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Boitier PC MSI mag force 112 R — 36 × 60.82 € = 2,189.52 €</li>
              <li>Carte mère MSO B760 gaming plus wifi — 36 × 144.16 € = 5,189.76 €</li>
              <li>Remise Exceptionnelle — 1 × -1,800.00 € = -1,800.00 €</li>
              <li>Contrat de maintenance Hardware Site 1 an — VTN direct : 10,166.50 €</li>
            </ul>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

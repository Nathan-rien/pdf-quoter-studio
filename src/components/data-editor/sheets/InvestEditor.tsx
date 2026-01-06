import { useDataEditorStore } from "@/stores/dataEditorStore";
import { EditableTable, ColumnDef } from "../EditableTable";
import { InvestRow } from "@/types/quote";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

const investColumns: ColumnDef<InvestRow>[] = [
  { 
    key: 'designation', 
    header: 'Désignation', 
    type: 'text', 
    width: '40%',
    placeholder: 'Matériel 2025...',
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
    width: '20%',
    placeholder: '0.00',
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

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Structure de l'onglet "invest "</CardTitle>
              <CardDescription className="text-xs">
                Colonnes B-E : Désignation, Nb (entier), VUN (valeur unitaire), VTN (= Nb × VUN, calculé automatiquement)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <EditableTable
        data={investData}
        columns={investColumns}
        onCellChange={(rowIndex, column, value) => 
          updateInvestCell(rowIndex, column as keyof InvestRow, value)
        }
        onAddRow={addInvestRow}
        onDeleteRow={deleteInvestRow}
        errors={errors}
        emptyMessage="Aucune ligne invest. Ajoutez du matériel à la liste."
      />

      {investData.length > 0 && (
        <div className="flex justify-end">
          <Badge variant="outline" className="text-base px-4 py-2">
            Total VTN : <span className="font-mono ml-2">{totalVTN.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
          </Badge>
        </div>
      )}
    </div>
  );
}

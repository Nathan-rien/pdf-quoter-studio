import { useDataEditorStore } from "@/stores/dataEditorStore";
import { EditableTable, ColumnDef } from "../EditableTable";
import { BaseTauxRow } from "@/types/quote";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const baseTauxColumns: ColumnDef<BaseTauxRow>[] = [
  { 
    key: 'partenaire', 
    header: 'Partenaire', 
    type: 'text', 
    width: '25%',
    placeholder: 'Nom du partenaire',
    required: true,
  },
  { 
    key: 'montantMin', 
    header: 'Montant Min', 
    type: 'number', 
    width: '18%',
    placeholder: '0',
    required: true,
  },
  { 
    key: 'montantMax', 
    header: 'Montant Max', 
    type: 'number', 
    width: '18%',
    placeholder: 'Optionnel',
  },
  { 
    key: 'dureeLocation', 
    header: 'Durée Location', 
    type: 'number', 
    width: '18%',
    placeholder: '36',
    required: true,
  },
  { 
    key: 'taux', 
    header: 'Taux (%)', 
    type: 'number', 
    width: '18%',
    placeholder: '0.00',
    required: true,
  },
];

export function BaseTauxEditor() {
  const { 
    baseTauxData, 
    updateBaseTauxCell, 
    addBaseTauxRow, 
    deleteBaseTauxRow,
    getSheetErrors,
  } = useDataEditorStore();

  const errors = getSheetErrors('baseTaux');

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Structure de l'onglet "Base Taux"</CardTitle>
              <CardDescription className="text-xs">
                Table des taux de location par partenaire, montant et durée. Le montant max est optionnel.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <EditableTable
        data={baseTauxData}
        columns={baseTauxColumns}
        onCellChange={(rowIndex, column, value) => 
          updateBaseTauxCell(rowIndex, column as keyof BaseTauxRow, value)
        }
        onAddRow={addBaseTauxRow}
        onDeleteRow={deleteBaseTauxRow}
        errors={errors}
        emptyMessage="Aucun taux défini. Ajoutez des lignes de tarification."
      />
    </div>
  );
}

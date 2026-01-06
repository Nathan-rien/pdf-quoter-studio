import { useDataEditorStore } from "@/stores/dataEditorStore";
import { EditableTable, ColumnDef } from "../EditableTable";
import { OptionsServiceRow } from "@/types/quote";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const optionsColumns: ColumnDef<OptionsServiceRow>[] = [
  { 
    key: 'name', 
    header: 'Nom', 
    type: 'text', 
    width: '25%',
    placeholder: 'Nom du service',
    required: true,
  },
  { 
    key: 'description', 
    header: 'Description', 
    type: 'text', 
    width: '35%',
    placeholder: 'Description du service...',
  },
  { 
    key: 'category', 
    header: 'Catégorie', 
    type: 'text', 
    width: '20%',
    placeholder: 'Catégorie',
  },
  { 
    key: 'price', 
    header: 'Prix', 
    type: 'number', 
    width: '15%',
    placeholder: '0.00',
  },
];

export function OptionsServicesEditor() {
  const { 
    optionsServicesData, 
    updateOptionsServiceCell, 
    addOptionsServiceRow, 
    deleteOptionsServiceRow,
    getSheetErrors,
  } = useDataEditorStore();

  const errors = getSheetErrors('optionsServices');

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Structure de l'onglet "Options services "</CardTitle>
              <CardDescription className="text-xs">
                Liste des options de service disponibles. L'espace final dans le nom est intentionnel (compatibilité Excel).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <EditableTable
        data={optionsServicesData}
        columns={optionsColumns}
        onCellChange={(rowIndex, column, value) => 
          updateOptionsServiceCell(rowIndex, column as keyof OptionsServiceRow, value)
        }
        onAddRow={addOptionsServiceRow}
        onDeleteRow={deleteOptionsServiceRow}
        errors={errors}
        emptyMessage="Aucune option service définie."
      />
    </div>
  );
}

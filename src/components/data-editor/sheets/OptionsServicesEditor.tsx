import { useState } from "react";
import { useDataEditorStore } from "@/stores/dataEditorStore";
import { useOptionsAdminStore } from "@/stores/optionsAdminStore";
import { EditableTable, ColumnDef } from "../EditableTable";
import { OptionsServiceRow } from "@/types/quote";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Plus, Download } from "lucide-react";

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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedAdminOptions, setSelectedAdminOptions] = useState<string[]>([]);
  
  const { 
    optionsServicesData, 
    updateOptionsServiceCell, 
    addOptionsServiceRow, 
    deleteOptionsServiceRow,
    addOptionsServiceFromAdmin,
    getSheetErrors,
  } = useDataEditorStore();

  const { options: adminOptions } = useOptionsAdminStore();
  const activeAdminOptions = adminOptions.filter(opt => opt.isActive);

  const errors = getSheetErrors('optionsServices');

  const toggleAdminOption = (optionId: string) => {
    setSelectedAdminOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleImportSelected = () => {
    selectedAdminOptions.forEach(optionId => {
      const option = activeAdminOptions.find(opt => opt.id === optionId);
      if (option) {
        // Convertir ServiceItem[] en string[] pour l'import
        const servicesAsStrings = option.services.map(s => 
          typeof s === 'string' ? s : s.text
        );
        addOptionsServiceFromAdmin(option.title, servicesAsStrings, option.price?.amount);
      }
    });
    setSelectedAdminOptions([]);
    setIsPopoverOpen(false);
  };

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

      <div className="flex gap-2">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" disabled={activeAdminOptions.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Importer depuis Admin
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <div className="font-medium text-sm">Options disponibles</div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {activeAdminOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedAdminOptions.includes(option.id)}
                      onCheckedChange={() => toggleAdminOption(option.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{option.title}</div>
                      {option.price && (
                        <div className="text-xs text-muted-foreground">
                          {option.price.amount} {option.price.unit}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <Button 
                size="sm" 
                className="w-full"
                disabled={selectedAdminOptions.length === 0}
                onClick={handleImportSelected}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter {selectedAdminOptions.length > 0 && `(${selectedAdminOptions.length})`}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {activeAdminOptions.length === 0 && (
          <span className="text-xs text-muted-foreground self-center">
            Aucune option active dans Administration
          </span>
        )}
      </div>

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

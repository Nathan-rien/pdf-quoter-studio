import { useDataEditorStore } from "@/stores/dataEditorStore";
import { EditableTable, ColumnDef } from "../EditableTable";
import { BaseTauxRow } from "@/types/quote";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

// Structure exacte de l'onglet "Base Taux" du fichier Excel (Page 10)
// Colonnes : Partenaire | Montant min | Montant max | Durée Location | Taux
const baseTauxColumns: ColumnDef<BaseTauxRow>[] = [
  { 
    key: 'partenaire', 
    header: 'Partenaire', 
    type: 'text', 
    width: '25%',
    placeholder: 'Lixxbail 1',
    required: true,
  },
  { 
    key: 'montantMin', 
    header: 'Montant min', 
    type: 'number', 
    width: '18%',
    placeholder: '1000',
    required: true,
  },
  { 
    key: 'montantMax', 
    header: 'Montant max', 
    type: 'number', 
    width: '18%',
    placeholder: '500000',
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
    header: 'Taux', 
    type: 'number', 
    width: '18%',
    placeholder: '3.0051',
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

  // Get unique partners for stats
  const uniquePartners = [...new Set(baseTauxData.map(r => r.partenaire))].filter(Boolean);

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Onglet "Base Taux"</CardTitle>
              <CardDescription className="text-xs">
                Table des coefficients par partenaire, tranche de montant et durée. Le taux est le coefficient multiplicateur pour calculer le loyer mensuel.
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
        emptyMessage="Aucun taux défini. Ajoutez des lignes de tarification par partenaire."
      />

      {baseTauxData.length > 0 && (
        <Card className="bg-muted/30 border-dashed">
          <CardHeader className="py-3">
            <CardDescription className="text-xs">
              <strong>Partenaires disponibles :</strong> {uniquePartners.join(', ') || 'Aucun'}
              <br />
              <strong>Total lignes :</strong> {baseTauxData.length}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <CardDescription className="text-xs">
            <strong>Exemples du fichier source :</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Lixxbail 1 — 1000-5000 € — 12 mois — Taux 3.054</li>
              <li>Lixxbail 1 — 20001-500000 € — 36 mois — Taux 3.0051</li>
              <li>Grenke 1 — 500-2500 € — 12 mois — Taux 3.17</li>
              <li>Olinn 2 PC Leno/HP/Dell — 25001-50000 € — 36 mois — Taux 2.787</li>
            </ul>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

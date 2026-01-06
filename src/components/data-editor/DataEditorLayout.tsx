import { useDataEditorStore, SheetName } from "@/stores/dataEditorStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StepHeader } from "@/components/ui/step-header";
import { InvestEditor } from "./sheets/InvestEditor";
import { DevisEditor } from "./sheets/DevisEditor";
import { BaseTauxEditor } from "./sheets/BaseTauxEditor";
import { OptionsServicesEditor } from "./sheets/OptionsServicesEditor";
import { FicheContratEditor } from "./sheets/FicheContratEditor";
import { MatriceEditor } from "./sheets/MatriceEditor";
import { 
  Save, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Table2,
  FileText,
  Calculator,
  Settings,
  Percent,
  LayoutGrid
} from "lucide-react";
import { toast } from "sonner";

const sheetConfig: { id: SheetName; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'ficheContrat', label: 'Fiche Contrat', icon: FileText },
  { id: 'invest', label: 'invest ', icon: Calculator },
  { id: 'devis', label: 'Devis', icon: Table2 },
  { id: 'optionsServices', label: 'Options services ', icon: Settings },
  { id: 'baseTaux', label: 'Base Taux', icon: Percent },
  { id: 'matrice', label: 'Matrice', icon: LayoutGrid },
];

export function DataEditorLayout() {
  const { 
    activeSheet, 
    setActiveSheet, 
    hasUnsavedChanges,
    validateAllSheets,
    markAsSaved,
    hasData,
    isSheetValid,
    getSheetErrors,
    resetAllData,
  } = useDataEditorStore();

  const handleSave = () => {
    const isValid = validateAllSheets();
    if (isValid) {
      markAsSaved();
      toast.success("Données sauvegardées avec succès");
    } else {
      toast.error("Erreurs de validation détectées");
    }
  };

  const handleReset = () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ?")) {
      resetAllData();
      toast.info("Données réinitialisées");
    }
  };

  const getSheetStatus = (sheet: SheetName) => {
    const hasSheetData = hasData(sheet);
    const isValid = isSheetValid(sheet);
    const errors = getSheetErrors(sheet);

    if (!hasSheetData) return 'empty';
    if (errors.length > 0) return 'error';
    if (isValid) return 'valid';
    return 'pending';
  };

  const renderSheetBadge = (sheet: SheetName) => {
    const status = getSheetStatus(sheet);
    
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-3 w-3 text-success" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      case 'empty':
        return null;
      default:
        return null;
    }
  };

  const renderEditor = () => {
    switch (activeSheet) {
      case 'invest':
        return <InvestEditor />;
      case 'devis':
        return <DevisEditor />;
      case 'baseTaux':
        return <BaseTauxEditor />;
      case 'optionsServices':
        return <OptionsServicesEditor />;
      case 'ficheContrat':
        return <FicheContratEditor />;
      case 'matrice':
        return <MatriceEditor />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <StepHeader
        stepNumber={2}
        totalSteps={7}
        title="Éditeur de Données"
        description="Saisissez les données directement dans les tableaux ci-dessous"
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Structure Excel</CardTitle>
              <CardDescription>
                6 onglets correspondant à la structure du fichier Excel source
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-warning border-warning">
                  Modifications non sauvegardées
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeSheet} 
            onValueChange={(v) => setActiveSheet(v as SheetName)}
            className="w-full"
          >
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
              {sheetConfig.map(({ id, label, icon: Icon }) => (
                <TabsTrigger 
                  key={id} 
                  value={id}
                  className="flex items-center gap-2 data-[state=active]:bg-background"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                  {renderSheetBadge(id)}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4 min-h-[400px]">
              {sheetConfig.map(({ id }) => (
                <TabsContent key={id} value={id} className="mt-0">
                  {renderEditor()}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

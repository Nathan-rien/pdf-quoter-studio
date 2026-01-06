import { useDataEditorStore, SheetName } from "@/stores/dataEditorStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StepHeader } from "@/components/ui/step-header";
import { ExcelImportZone } from "./ExcelImportZone";
import { InvestEditor } from "./sheets/InvestEditor";
import { DevisEditor } from "./sheets/DevisEditor";
import { BaseTauxEditor } from "./sheets/BaseTauxEditor";
import { OptionsServicesEditor } from "./sheets/OptionsServicesEditor";
import { FicheContratEditor } from "./sheets/FicheContratEditor";
import { MatriceEditor } from "./sheets/MatriceEditor";
import { ExcelParseResult } from "@/lib/excel-import-parser";
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

// Configuration des onglets selon la structure Excel réelle
const sheetConfig: { id: SheetName; label: string; icon: React.ComponentType<{ className?: string }>; excelName: string }[] = [
  { id: 'matrice', label: 'Matrice', icon: LayoutGrid, excelName: 'Matrice' },
  { id: 'ficheContrat', label: 'Fiche Contrat', icon: FileText, excelName: 'Fiche Contrat' },
  { id: 'invest', label: 'invest ', icon: Calculator, excelName: 'invest ' },
  { id: 'devis', label: 'Devis', icon: Table2, excelName: 'Devis' },
  { id: 'optionsServices', label: 'Options services ', icon: Settings, excelName: 'Options services ' },
  { id: 'baseTaux', label: 'Base Taux', icon: Percent, excelName: 'Base Taux' },
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
    importFromExcel,
  } = useDataEditorStore();

  const handleExcelImport = (result: ExcelParseResult) => {
    if (result.data) {
      importFromExcel(result.data, result.fileName);
      toast.success(`Fichier "${result.fileName}" importé avec succès`, {
        description: `${result.parsedSheets.length} onglets parsés`,
      });
    }
  };

  const handleExcelImportError = (errors: string[]) => {
    toast.error("Erreurs lors de l'import", {
      description: errors[0],
    });
  };

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
      case 'matrice':
        return <MatriceEditor />;
      case 'ficheContrat':
        return <FicheContratEditor />;
      case 'invest':
        return <InvestEditor />;
      case 'devis':
        return <DevisEditor />;
      case 'baseTaux':
        return <BaseTauxEditor />;
      case 'optionsServices':
        return <OptionsServicesEditor />;
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
        description="Importez un fichier Excel ou saisissez les données directement dans les tableaux"
      />

      <ExcelImportZone
        onImportSuccess={handleExcelImport}
        onImportError={handleExcelImportError}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg">Structure Excel — Matrice_Location</CardTitle>
              <CardDescription>
                6 onglets correspondant au fichier source avec espaces finaux préservés
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
              {sheetConfig.map(({ id, label, icon: Icon, excelName }) => (
                <TabsTrigger 
                  key={id} 
                  value={id}
                  className="flex items-center gap-2 data-[state=active]:bg-background"
                  title={`Onglet Excel : "${excelName}"`}
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

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExcelImportResult, REQUIRED_EXCEL_SHEETS } from "@/types/quote";
import { validateSheetNames, createSheetList, displaySheetName } from "@/lib/excel-validation";
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, Loader2, Info, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/ui/step-header";
import { BlockingMessage } from "@/components/ui/blocking-message";

interface ExcelImportProps {
  onImport: (result: ExcelImportResult) => void;
  currentImport: ExcelImportResult | null;
}

export function ExcelImport({ onImport, currentImport }: ExcelImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    // Simulate file processing - in production, this would call an edge function
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // NOTE: En production, ceci sera remplacé par un vrai parsing via Edge Function
    // Pour l'instant, on simule la détection des onglets EXACTS
    // IMPORTANT: Les noms incluent les espaces finaux obligatoires
    const detectedSheets = [
      'Matrice',
      'Fiche Contrat',
      'invest ',          // Espace final présent
      'Devis',
      'Options services ', // Espace final présent
      'Base Taux'
    ];

    const validation = validateSheetNames(detectedSheets);
    const sheets = createSheetList(detectedSheets);

    const result: ExcelImportResult = {
      fileName: file.name,
      importDate: new Date(),
      sheets,
      isValid: validation.isValid,
      errors: validation.errors,
      sheetValidation: validation,
    };

    setIsProcessing(false);
    onImport(result);
  }, [onImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  return (
    <div className="space-y-6 animate-slide-up">
      <StepHeader
        stepNumber={2}
        totalSteps={7}
        title="Import Excel (Matrice)"
        description="Chargez votre fichier Excel contenant les onglets requis."
      />

      {/* Required sheets info - Noms EXACTS contractuels */}
      <Card variant="ghost" className="border border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Info className="h-4 w-4 text-info mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-2">Onglets requis (noms exacts) :</p>
              <p className="text-xs text-muted-foreground mb-3">
                Attention : certains noms incluent un espace final obligatoire (symbolisé par ␣)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {REQUIRED_EXCEL_SHEETS.map(sheet => (
              <Badge 
                key={sheet} 
                variant="outline" 
                className={cn(
                  "font-mono",
                  sheet.endsWith(' ') && "border-warning text-warning"
                )}
              >
                {displaySheetName(sheet)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          isProcessing && "pointer-events-none opacity-50"
        )}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg font-medium">Analyse du fichier...</p>
            </>
          ) : (
            <>
              <div className={cn(
                "p-4 rounded-2xl transition-colors",
                isDragging ? "bg-primary/20" : "bg-muted"
              )}>
                <Upload className={cn(
                  "h-8 w-8 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-lg font-medium mb-1">
                  Glissez-déposez votre fichier Excel
                </p>
                <p className="text-sm text-muted-foreground">
                  ou cliquez pour sélectionner (.xlsx, .xls)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Import result */}
      {currentImport && (
        <Card variant={currentImport.isValid ? "success" : "error"}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                currentImport.isValid ? "bg-success/20" : "bg-destructive/20"
              )}>
                <FileSpreadsheet className={cn(
                  "h-5 w-5",
                  currentImport.isValid ? "text-success" : "text-destructive"
                )} />
              </div>
              <div>
                <CardTitle className="text-base">{currentImport.fileName}</CardTitle>
                <CardDescription>
                  Importé le {currentImport.importDate.toLocaleString('fr-FR')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <p className="text-sm font-medium">Onglets détectés :</p>
              <div className="grid gap-2">
                {currentImport.sheets.map(sheet => (
                  <div 
                    key={sheet.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                  >
                    <div className="flex items-center gap-2">
                      {sheet.found ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm font-mono">{displaySheetName(sheet.name)}</span>
                      {sheet.required && (
                        <Badge variant="outline" className="text-xs">Requis</Badge>
                      )}
                      {sheet.hasTrailingSpace && (
                        <Badge variant="warning" className="text-xs">espace final</Badge>
                      )}
                    </div>
                    {sheet.rowCount !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {sheet.rowCount} lignes
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Almost matches warning */}
              {currentImport.sheetValidation?.almostMatches && 
               currentImport.sheetValidation.almostMatches.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 text-warning">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Noms d'onglets proches détectés</p>
                    {currentImport.sheetValidation.almostMatches.map((match, i) => (
                      <p key={i}>
                        "{match.detected}" trouvé, mais "{displaySheetName(match.expected)}" attendu
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {currentImport.errors.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    {currentImport.errors.map((error, i) => (
                      <p key={i}>{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

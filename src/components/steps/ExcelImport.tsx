import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExcelImportResult, ExcelSheet } from "@/types/quote";
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExcelImportProps {
  onImport: (result: ExcelImportResult) => void;
  currentImport: ExcelImportResult | null;
}

// Required sheets that must be present in the Excel file
const REQUIRED_SHEETS = ["invest", "Options services"];

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
    
    // Simulate file processing - in production, this would parse the Excel file
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock result - simulating detection of sheets
    const detectedSheets: ExcelSheet[] = [
      { name: "invest", required: true, found: true, rowCount: 42 },
      { name: "Options services", required: true, found: true, rowCount: 15 },
      { name: "Paramètres", required: false, found: true, rowCount: 8 },
    ];

    const missingRequired = REQUIRED_SHEETS.filter(
      req => !detectedSheets.find(s => s.name === req && s.found)
    );

    const result: ExcelImportResult = {
      fileName: file.name,
      importDate: new Date(),
      sheets: detectedSheets,
      isValid: missingRequired.length === 0,
      errors: missingRequired.length > 0 
        ? [`Onglets manquants : ${missingRequired.join(", ")}`]
        : [],
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
      <div>
        <h2 className="text-xl font-semibold mb-2">Import Excel (Matrice)</h2>
        <p className="text-muted-foreground">
          Chargez votre fichier Excel contenant les onglets requis.
        </p>
      </div>

      {/* Required sheets info */}
      <Card variant="ghost" className="border border-dashed">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Onglets requis :</p>
          <div className="flex flex-wrap gap-2">
            {REQUIRED_SHEETS.map(sheet => (
              <Badge key={sheet} variant="outline" className="font-mono">
                {sheet}
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
                      <span className="text-sm font-mono">{sheet.name}</span>
                      {sheet.required && (
                        <Badge variant="outline" className="text-xs">Requis</Badge>
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

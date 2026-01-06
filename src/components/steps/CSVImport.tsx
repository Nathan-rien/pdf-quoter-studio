import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CSVImportResult } from "@/types/quote";
import { Upload, FileText, Check, AlertTriangle, Loader2, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CSVImportProps {
  onImport: (result: CSVImportResult) => void;
  currentImport: CSVImportResult | null;
}

export function CSVImport({ onImport, currentImport }: CSVImportProps) {
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
    
    // Simulate file processing
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const result: CSVImportResult = {
      fileName: file.name,
      importDate: new Date(),
      rowCount: 156,
      isValid: true,
      errors: [],
    };

    setIsProcessing(false);
    onImport(result);
  }, [onImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-xl font-semibold mb-2">Import CSV Tarifs</h2>
        <p className="text-muted-foreground">
          Chargez le fichier CSV contenant les tarifs à jour.
        </p>
      </div>

      {/* Current status */}
      {currentImport && (
        <Card variant={currentImport.isValid ? "success" : "error"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  currentImport.isValid ? "bg-success/20" : "bg-destructive/20"
                )}>
                  <FileText className={cn(
                    "h-5 w-5",
                    currentImport.isValid ? "text-success" : "text-destructive"
                  )} />
                </div>
                <div>
                  <p className="font-medium">{currentImport.fileName}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(currentImport.importDate)}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{currentImport.rowCount} tarifs</span>
                  </div>
                </div>
              </div>
              
              <Badge variant={currentImport.isValid ? "success" : "error"}>
                {currentImport.isValid ? "Valide" : "Erreur"}
              </Badge>
            </div>

            {currentImport.errors.length > 0 && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  {currentImport.errors.map((error, i) => (
                    <p key={i}>{error}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
          accept=".csv"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg font-medium">Traitement du fichier...</p>
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
                  {currentImport 
                    ? "Mettre à jour les tarifs" 
                    : "Importer le fichier CSV des tarifs"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Glissez-déposez ou cliquez pour sélectionner (.csv)
                </p>
              </div>
              
              {currentImport && (
                <Button variant="ghost" size="sm" className="gap-2 mt-2">
                  <RefreshCw className="h-4 w-4" />
                  Remplacer le fichier actuel
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info card */}
      <Card variant="ghost" className="border border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <AlertTriangle className="h-4 w-4 text-info" />
            </div>
            <div className="text-sm">
              <p className="font-medium mb-1">Import quotidien recommandé</p>
              <p className="text-muted-foreground">
                Les tarifs doivent être actualisés régulièrement pour garantir la cohérence des devis générés. 
                L'import est traçable et bloquant si requis par le devis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

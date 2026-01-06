import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { parseExcelFile, ExcelParseResult } from '@/lib/excel-import-parser';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExcelImportZoneProps {
  onImportSuccess: (result: ExcelParseResult) => void;
  onImportError?: (errors: string[]) => void;
  hasUnsavedChanges?: boolean;
}

export function ExcelImportZone({ 
  onImportSuccess, 
  onImportError,
  hasUnsavedChanges = false 
}: ExcelImportZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ExcelParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    // Vérifier le type de fichier
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ];
    
    const isValidType = validTypes.some(type => 
      file.type === type || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (!isValidType) {
      onImportError?.(['Format de fichier invalide. Utilisez un fichier Excel (.xlsx ou .xls)']);
      return;
    }

    // Confirmer si modifications non sauvegardées
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Vous avez des modifications non sauvegardées. L\'import va remplacer toutes les données. Continuer ?'
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    
    try {
      const result = await parseExcelFile(file);
      setImportResult(result);
      
      if (result.success || (result.data && result.errors.length === 0)) {
        onImportSuccess(result);
      } else if (result.data) {
        // Import partiel réussi malgré des warnings
        onImportSuccess(result);
      }
      
      if (result.errors.length > 0) {
        onImportError?.(result.errors.map(e => `${e.sheet}: ${e.message}`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      onImportError?.([message]);
    } finally {
      setIsProcessing(false);
    }
  }, [onImportSuccess, onImportError, hasUnsavedChanges]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReset = useCallback(() => {
    setImportResult(null);
  }, []);

  // Si un fichier a été importé, afficher le statut
  if (importResult) {
    const hasErrors = importResult.errors.length > 0;
    const hasWarnings = importResult.warnings.length > 0;
    
    return (
      <Card className={cn(
        "border-2 transition-colors",
        hasErrors ? "border-destructive/50 bg-destructive/5" : "border-success/50 bg-success/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-full",
                hasErrors ? "bg-destructive/10" : "bg-success/10"
              )}>
                {hasErrors ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{importResult.fileName}</span>
                  <Badge variant="outline" className="text-xs">
                    {importResult.parsedSheets.length}/6 onglets
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Importé le {format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </p>
                
                {hasWarnings && (
                  <div className="mt-2 space-y-1">
                    {importResult.warnings.slice(0, 2).map((w, i) => (
                      <p key={i} className="text-xs text-warning">
                        ⚠️ {w.sheet}: {w.message}
                      </p>
                    ))}
                  </div>
                )}
                
                {hasErrors && (
                  <div className="mt-2 space-y-1">
                    {importResult.errors.slice(0, 3).map((e, i) => (
                      <p key={i} className="text-xs text-destructive">
                        {e.sheet}: {e.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClick}
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Réimporter
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
        />
      </Card>
    );
  }

  // Zone de drop
  return (
    <Card 
      className={cn(
        "border-2 border-dashed transition-all cursor-pointer",
        isDragging && "border-primary bg-primary/5 scale-[1.01]",
        isProcessing && "opacity-50 pointer-events-none"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className={cn(
            "p-3 rounded-full transition-colors",
            isDragging ? "bg-primary/20" : "bg-muted"
          )}>
            {isProcessing ? (
              <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <Upload className={cn(
                "h-6 w-6 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            )}
          </div>
          
          <div>
            <p className="font-medium text-sm">
              {isProcessing 
                ? "Analyse du fichier en cours..." 
                : "Importer un fichier Excel"
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Glissez votre fichier ici ou cliquez pour sélectionner
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
            <Badge variant="secondary" className="text-xs">Matrice</Badge>
            <Badge variant="secondary" className="text-xs">Fiche Contrat</Badge>
            <Badge variant="secondary" className="text-xs">invest</Badge>
            <Badge variant="secondary" className="text-xs">Devis</Badge>
            <Badge variant="secondary" className="text-xs">Options</Badge>
            <Badge variant="secondary" className="text-xs">Base Taux</Badge>
          </div>
        </div>
      </CardContent>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleInputChange}
        className="hidden"
      />
    </Card>
  );
}

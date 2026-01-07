import React, { useState, useRef } from 'react';
import { FileUp, FileCheck, AlertCircle, Loader2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parsePDF, PDFParseResult } from '@/lib/pdf-import-parser';
import { cn } from '@/lib/utils';

interface PDFImportZoneProps {
  onImportSuccess: (result: PDFParseResult, fileName: string) => void;
  onImportError?: (error: string) => void;
  isLoading?: boolean;
  currentFile?: string | null;
}

interface ImportResult {
  success: boolean;
  fileName: string;
  source?: 'cybertek' | 'grosbill' | 'unknown';
  lignesCount?: number;
  error?: string;
}

export function PDFImportZone({ 
  onImportSuccess, 
  onImportError,
  isLoading = false,
  currentFile 
}: PDFImportZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      const error = 'Le fichier doit être au format PDF';
      setImportResult({ success: false, fileName: file.name, error });
      onImportError?.(error);
      return;
    }

    setIsProcessing(true);
    setImportResult(null);

    try {
      const result = await parsePDF(file);
      
      if (result.source === 'unknown') {
        const error = 'Format PDF non reconnu. Seuls les devis Cybertek Pro et GrosBill Pro sont supportés.';
        setImportResult({ success: false, fileName: file.name, error });
        onImportError?.(error);
        return;
      }

      setImportResult({
        success: true,
        fileName: file.name,
        source: result.source,
        lignesCount: result.lignes.length,
      });
      
      onImportSuccess(result, file.name);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la lecture du PDF';
      setImportResult({ success: false, fileName: file.name, error: errorMessage });
      onImportError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleReset = () => {
    setImportResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const getSourceLabel = (source: 'cybertek' | 'grosbill' | 'unknown') => {
    switch (source) {
      case 'cybertek': return 'Cybertek Pro';
      case 'grosbill': return 'GrosBill Pro';
      default: return 'Inconnu';
    }
  };

  if (importResult) {
    return (
      <Card variant={importResult.success ? 'success' : 'error'}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {importResult.success ? (
                <FileCheck className="h-8 w-8 text-success shrink-0" />
              ) : (
                <AlertCircle className="h-8 w-8 text-destructive shrink-0" />
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{importResult.fileName}</span>
                  {importResult.success && importResult.source && (
                    <Badge variant="secondary">{getSourceLabel(importResult.source)}</Badge>
                  )}
                </div>
                {importResult.success ? (
                  <p className="text-sm text-muted-foreground">
                    {importResult.lignesCount} ligne(s) de produit détectée(s)
                  </p>
                ) : (
                  <p className="text-sm text-destructive">{importResult.error}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClick}>
                Réimporter
              </Button>
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
        />
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        isDragging && 'border-primary bg-primary/5 ring-2 ring-primary/20',
        isProcessing && 'opacity-50 pointer-events-none'
      )}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {isProcessing || isLoading ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Analyse du PDF en cours...</p>
            </>
          ) : (
            <>
              <div className={cn(
                'p-4 rounded-full bg-primary/10 transition-colors',
                isDragging && 'bg-primary/20'
              )}>
                <FileUp className={cn(
                  'h-8 w-8 text-primary transition-transform',
                  isDragging && 'scale-110'
                )} />
              </div>
              <div>
                <p className="font-medium">
                  {isDragging ? 'Déposez le fichier PDF' : 'Importer un devis PDF'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Glissez-déposez ou cliquez pour sélectionner
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">Cybertek Pro</Badge>
                <Badge variant="outline">GrosBill Pro</Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
      />
    </Card>
  );
}

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
  totals?: {
    totalHT: number | null;
    tva: number | null;
    totalTTC: number | null;
  };
  debug?: {
    snippet: string;
    candidates: string[];
    // Enhanced debug info
    installationContext?: string;
    rksContext?: string;
    extractedLines?: Array<{ ref: string | null; qty: number; total: number }>;
  };
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
      
      // Accept all PDFs - user can fill in data manually if extraction fails
      const hasExtractedData = result.lignes.length > 0 || 
        result.client.nom || 
        result.devis.reference ||
        result.totaux.totalHT;

      // Lightweight debug (helps diagnose totals extraction without opening devtools)
      const raw = result.rawText ?? '';
      const money = '(\\d+(?:[\\s\\.]\\d{3})*(?:[,.]\\d{2})?)';
      const headerMatches = [...raw.matchAll(
        new RegExp(`TOTAL\\s*HT[\\s\\S]{0,160}?TVA\\s*20\\s*%?[\\s\\S]{0,160}?TOTAL\\s*TTC`, 'gi')
      )];
      const start = headerMatches.length ? (headerMatches.at(-1)!.index ?? 0) : Math.max(0, raw.lastIndexOf('TOTAL HT'));
      const snippet = raw.slice(start, Math.min(raw.length, start + 800));
      const candidates = [...snippet.matchAll(new RegExp(`${money}\\s*€`, 'g'))].map((m) => m[1]).slice(0, 12);

      // Enhanced debug: Extract context around "Installation" and "SY-RKS02"
      const installationIdx = raw.indexOf('Installation');
      const installationContext = installationIdx !== -1 
        ? raw.slice(Math.max(0, installationIdx - 50), Math.min(raw.length, installationIdx + 600))
        : 'NOT FOUND in rawText';
      
      const rksIdx = raw.search(/SY-RKS02/i);
      const rksContext = rksIdx !== -1
        ? raw.slice(Math.max(0, rksIdx - 50), Math.min(raw.length, rksIdx + 400))
        : 'NOT FOUND in rawText';
      
      // Extracted lines summary
      const extractedLines = result.lignes.map(l => ({
        ref: l.reference,
        qty: l.quantite,
        total: l.totalHT,
      }));

      setImportResult({
        success: true,
        fileName: file.name,
        source: result.source,
        lignesCount: result.lignes.length,
        totals: {
          totalHT: result.totaux.totalHT,
          tva: result.totaux.tva,
          totalTTC: result.totaux.totalTTC,
        },
        debug: { snippet, candidates, installationContext, rksContext, extractedLines },
      });
      
      onImportSuccess(result, file.name);
      
      // Log extraction info for debugging
      console.log('PDF Import Result:', {
        source: result.source,
        hasExtractedData,
        lignesCount: result.lignes.length,
        rawTextLength: result.rawText?.length || 0,
      });
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
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {importResult.lignesCount} ligne(s) de produit détectée(s)
                    </p>
                    {importResult.totals && (
                      <p className="text-xs text-muted-foreground">
                        Totaux extraits — HT: {importResult.totals.totalHT ?? '—'} | TVA: {importResult.totals.tva ?? '—'} | TTC: {importResult.totals.totalTTC ?? '—'}
                      </p>
                    )}
                    {importResult.debug && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground font-medium">🔍 Voir debug parsing</summary>
                        
                        {/* Extracted lines summary */}
                        {importResult.debug.extractedLines && importResult.debug.extractedLines.length > 0 && (
                          <div className="mt-3 p-2 rounded-md border bg-primary/5">
                            <div className="font-medium text-foreground mb-1">Lignes extraites ({importResult.debug.extractedLines.length}):</div>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {importResult.debug.extractedLines.map((l, idx) => (
                                <li key={idx}>
                                  <span className="font-mono">{l.ref || '(null)'}</span> — Qté: {l.qty}, Total: {l.total} €
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Installation context */}
                        <div className="mt-3">
                          <div className="font-medium text-foreground">Contexte "Installation":</div>
                          <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-muted p-2 text-[11px] leading-snug text-foreground whitespace-pre-wrap">
{importResult.debug.installationContext || 'N/A'}
                          </pre>
                        </div>
                        
                        {/* RKS-02 context */}
                        <div className="mt-3">
                          <div className="font-medium text-foreground">Contexte "SY-RKS02":</div>
                          <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-muted p-2 text-[11px] leading-snug text-foreground whitespace-pre-wrap">
{importResult.debug.rksContext || 'N/A'}
                          </pre>
                        </div>
                        
                        {/* Totals candidates */}
                        {importResult.debug.candidates && importResult.debug.candidates.length > 0 && (
                          <div className="mt-3 text-muted-foreground">
                            <span className="font-medium text-foreground">Candidats totaux:</span> {importResult.debug.candidates.join(' | ')}
                          </div>
                        )}
                        
                        {/* Raw snippet */}
                        {importResult.debug.snippet && (
                          <div className="mt-3">
                            <div className="font-medium text-foreground">Extrait brut (zone totaux):</div>
                            <pre className="mt-1 max-h-48 overflow-auto rounded-md border bg-muted p-2 text-[11px] leading-snug text-foreground whitespace-pre-wrap">
{importResult.debug.snippet}
                            </pre>
                          </div>
                        )}
                      </details>
                    )}
                  </div>
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

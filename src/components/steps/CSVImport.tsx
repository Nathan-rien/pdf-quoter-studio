import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CSVImportResult, CSVImportConfig, CSVEncoding, CSVSeparator } from "@/types/quote";
import { validateCSVImport, isValidCSVConfig, getCSVImportStatusMessage } from "@/lib/csv-parser";
import { 
  Upload, 
  FileText, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Clock, 
  RefreshCw,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CSVImportProps {
  onImport: (result: CSVImportResult) => void;
  currentImport: CSVImportResult | null;
  config?: CSVImportConfig | null;
  onConfigChange?: (config: CSVImportConfig) => void;
}

export function CSVImport({ 
  onImport, 
  currentImport, 
  config,
  onConfigChange 
}: CSVImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfig, setShowConfig] = useState(!config);
  
  // Local config state
  const [localConfig, setLocalConfig] = useState<Partial<CSVImportConfig>>({
    encoding: 'utf-8',
    separator: ';',
    requiredColumns: [],
    keyColumn: '',
    columnTypes: {}
  });
  const [columnsInput, setColumnsInput] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    const effectiveConfig = config || (isValidCSVConfig(localConfig) ? localConfig as CSVImportConfig : null);
    
    setIsProcessing(true);
    
    // Lire le contenu du fichier
    const content = await file.text();
    
    // Valider avec le parser strict
    const result = validateCSVImport(content, file.name, effectiveConfig);

    setIsProcessing(false);
    onImport(result);
  }, [config, localConfig, onImport]);

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

  const handleColumnsChange = (value: string) => {
    setColumnsInput(value);
    const columns = value.split(',').map(c => c.trim()).filter(Boolean);
    setLocalConfig(prev => ({ ...prev, requiredColumns: columns }));
  };

  const isConfigValid = isValidCSVConfig(config) || isValidCSVConfig(localConfig);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-xl font-semibold mb-2">Import CSV Tarifs</h2>
        <p className="text-muted-foreground">
          Chargez le fichier CSV contenant les tarifs à jour.
        </p>
      </div>

      {/* Configuration section - OBLIGATOIRE */}
      <Card variant={isConfigValid ? "success" : "warning"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">Configuration CSV</CardTitle>
                <CardDescription>
                  {isConfigValid 
                    ? "Configuration définie" 
                    : "Configuration requise avant import"
                  }
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? "Masquer" : "Configurer"}
            </Button>
          </div>
        </CardHeader>
        
        {showConfig && (
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Encodage</Label>
                <Select
                  value={localConfig.encoding || 'utf-8'}
                  onValueChange={(v) => setLocalConfig(prev => ({ 
                    ...prev, 
                    encoding: v as CSVEncoding 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utf-8">UTF-8</SelectItem>
                    <SelectItem value="iso-8859-1">ISO-8859-1 (Latin-1)</SelectItem>
                    <SelectItem value="windows-1252">Windows-1252</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Séparateur</Label>
                <Select
                  value={localConfig.separator || ';'}
                  onValueChange={(v) => setLocalConfig(prev => ({ 
                    ...prev, 
                    separator: v as CSVSeparator 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=";">Point-virgule (;)</SelectItem>
                    <SelectItem value=",">Virgule (,)</SelectItem>
                    <SelectItem value="\t">Tabulation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Colonnes requises (noms exacts, séparés par virgules)</Label>
              <Input
                placeholder="REF, DESIGNATION, PRIX_UNITAIRE, ..."
                value={columnsInput}
                onChange={(e) => handleColumnsChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Les noms doivent correspondre exactement aux en-têtes du CSV (sensible à la casse et aux espaces)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Colonne clé de correspondance</Label>
              <Input
                placeholder="REF"
                value={localConfig.keyColumn || ''}
                onChange={(e) => setLocalConfig(prev => ({ 
                  ...prev, 
                  keyColumn: e.target.value 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Colonne utilisée pour faire correspondre les lignes avec les données existantes
              </p>
            </div>

            {!isConfigValid && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 text-warning">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-sm">
                  Définissez au moins une colonne requise et une colonne clé pour activer l'import.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

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
                    <span>{currentImport.rowCount} lignes</span>
                  </div>
                </div>
              </div>
              
              <Badge variant={currentImport.isValid ? "success" : "error"}>
                {currentImport.isValid ? "Valide" : "Erreur"}
              </Badge>
            </div>

            {currentImport.errors.length > 0 && (
              <div className="mt-4 space-y-2">
                {currentImport.errors.map((error, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive"
                  >
                    <X className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">{error.type}</p>
                      <p>{error.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Traçabilité */}
            {currentImport.isValid && currentImport.config && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-2">Traçabilité import</p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Encodage :</span>
                  <span className="font-mono">{currentImport.config.encoding}</span>
                  <span>Séparateur :</span>
                  <span className="font-mono">{currentImport.config.separator === '\t' ? 'TAB' : currentImport.config.separator}</span>
                  <span>Colonnes vérifiées :</span>
                  <span className="font-mono">{currentImport.config.requiredColumns.join(', ')}</span>
                  <span>Clé correspondance :</span>
                  <span className="font-mono">{currentImport.config.keyColumn}</span>
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
          isProcessing && "pointer-events-none opacity-50",
          !isConfigValid && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing || !isConfigValid}
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
                  {!isConfigValid 
                    ? "Configurez d'abord les paramètres CSV"
                    : currentImport 
                    ? "Mettre à jour les tarifs" 
                    : "Importer le fichier CSV des tarifs"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {isConfigValid 
                    ? "Glissez-déposez ou cliquez pour sélectionner (.csv)"
                    : "La configuration est obligatoire avant import"
                  }
                </p>
              </div>
              
              {currentImport && isConfigValid && (
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
                Les tarifs doivent être actualisés régulièrement. 
                Chaque import est tracé avec horodatage, statut et détail des erreurs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/types/quote";
import { 
  Download, 
  FileText, 
  Check, 
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/ui/step-header";
import { BlockingMessage } from "@/components/ui/blocking-message";

interface ExportViewProps {
  isReady: boolean;
  auditLogs: AuditLog[];
  onExport: () => Promise<void>;
}

export function ExportView({ isReady, auditLogs, onExport }: ExportViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await onExport();
    setIsExporting(false);
    setExportComplete(true);
  };

  const getLogIcon = (log: AuditLog) => {
    switch (log.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLogTypeLabel = (type: AuditLog['type']) => {
    switch (type) {
      case 'excel-import': return 'Import Excel';
      case 'csv-import': return 'Import CSV';
      case 'validation': return 'Validation';
      case 'export': return 'Export';
      case 'error': return 'Erreur';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <StepHeader
        stepNumber={7}
        totalSteps={7}
        title="Export PDF"
        description="Générez et téléchargez le devis final au format PDF."
        status={exportComplete ? 'complete' : isReady ? 'active' : 'blocked'}
        statusLabel={exportComplete ? 'Exporté' : isReady ? 'Prêt' : 'Bloqué'}
      />

      {/* Message de blocage si pas prêt */}
      {!isReady && !exportComplete && (
        <BlockingMessage message="Complétez les étapes précédentes pour débloquer l'export." />
      )}

      {/* Export card */}
      <Card variant={exportComplete ? "success" : "default"}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              "p-4 rounded-2xl mb-4 transition-colors",
              exportComplete 
                ? "bg-success/20" 
                : isExporting 
                  ? "bg-primary/20" 
                  : "bg-muted"
            )}>
              {isExporting ? (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              ) : exportComplete ? (
                <Check className="h-12 w-12 text-success" />
              ) : (
                <FileText className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-2">
              {exportComplete 
                ? "Export réussi !"
                : isExporting 
                  ? "Génération en cours..."
                  : "Prêt pour l'export"
              }
            </h3>
            
            <p className="text-muted-foreground mb-6 max-w-md">
              {exportComplete
                ? "Le devis a été généré avec succès. Vous pouvez le télécharger."
                : isExporting
                  ? "Assemblage des données et génération du PDF..."
                  : "Cliquez sur le bouton ci-dessous pour générer le PDF final."
              }
            </p>

            {exportComplete ? (
              <Button variant="success" size="lg" className="gap-2">
                <Download className="h-5 w-5" />
                Télécharger le PDF
              </Button>
            ) : (
              <Button
                variant="hero"
                size="lg"
                onClick={handleExport}
                disabled={!isReady || isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Générer le PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Journal d'audit
          </CardTitle>
          <CardDescription>
            Traçabilité des imports, validations et exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  {getLogIcon(log)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getLogTypeLabel(log.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm">{log.message}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune entrée dans le journal
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

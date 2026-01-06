/**
 * Composant d'aperçu d'une page PDF
 * Affiche la structure avec indication des zones statiques/dynamiques
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PDFPageConfig } from "@/types/pdf-template";
import { FileText, Table, Settings, Lock, CheckCircle, AlertTriangle } from "lucide-react";

interface PDFPagePreviewProps {
  pageConfig: PDFPageConfig;
  isReady: boolean;
  hasError: boolean;
  errorMessage?: string;
  dataPreview?: React.ReactNode;
  compact?: boolean;
}

export function PDFPagePreview({
  pageConfig,
  isReady,
  hasError,
  errorMessage,
  dataPreview,
  compact = false
}: PDFPagePreviewProps) {
  const { pageNumber, title, type, dynamicZones, staticElements } = pageConfig;

  const getTypeLabel = () => {
    switch (type) {
      case 'static':
        return 'Statique';
      case 'dynamic_partial':
        return 'Dynamique';
      case 'dynamic_conditional':
        return 'Conditionnel';
    }
  };

  const getTypeVariant = (): "outline" | "success" | "warning" | "pending" => {
    if (hasError) return 'warning';
    if (type === 'static') return 'outline';
    if (isReady) return 'success';
    return 'pending';
  };

  const getIcon = () => {
    if (hasError) return <AlertTriangle className="h-4 w-4" />;
    if (type === 'static') return <Lock className="h-3 w-3" />;
    if (dynamicZones.some(z => z.type === 'invest_table')) return <Table className="h-4 w-4" />;
    if (dynamicZones.some(z => z.type === 'options_block')) return <Settings className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
          hasError && "border-destructive bg-destructive/5",
          !hasError && type === 'static' && "border-border bg-muted/30",
          !hasError && type !== 'static' && isReady && "border-success bg-success/5",
          !hasError && type !== 'static' && !isReady && "border-warning bg-warning/5"
        )}
      >
        <div className={cn(
          "w-10 h-14 rounded border-2 flex items-center justify-center text-xs font-medium shrink-0",
          hasError && "border-destructive text-destructive",
          !hasError && type === 'static' && "border-muted-foreground/30 text-muted-foreground",
          !hasError && type !== 'static' && isReady && "border-success text-success",
          !hasError && type !== 'static' && !isReady && "border-warning text-warning"
        )}>
          {pageNumber}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm truncate">{title}</span>
            <Badge variant={getTypeVariant()} className="text-xs shrink-0">
              {getTypeLabel()}
            </Badge>
          </div>
          {hasError && errorMessage && (
            <p className="text-xs text-destructive truncate">{errorMessage}</p>
          )}
          {!hasError && dynamicZones.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">
              {dynamicZones.map(z => z.description).join(', ')}
            </p>
          )}
        </div>

        <div className="shrink-0">
          {hasError ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : isReady || type === 'static' ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-warning" />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-colors",
      hasError && "border-destructive",
      !hasError && type !== 'static' && isReady && "border-success",
      !hasError && type !== 'static' && !isReady && "border-warning"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Page thumbnail */}
          <div className={cn(
            "w-16 h-20 rounded-lg border-2 flex flex-col items-center justify-center shrink-0",
            hasError && "border-destructive bg-destructive/5",
            !hasError && type === 'static' && "border-muted-foreground/30 bg-muted/50",
            !hasError && type !== 'static' && isReady && "border-success bg-success/5",
            !hasError && type !== 'static' && !isReady && "border-warning bg-warning/5"
          )}>
            <span className="text-lg font-bold">{pageNumber}</span>
            <div className="mt-1">{getIcon()}</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{title}</h4>
              <Badge variant={getTypeVariant()}>{getTypeLabel()}</Badge>
            </div>

            {hasError && errorMessage && (
              <div className="flex items-start gap-2 p-2 rounded bg-destructive/10 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}

            {dynamicZones.length > 0 && (
              <div className="space-y-1 mb-2">
                <p className="text-xs text-muted-foreground font-medium">Zones dynamiques :</p>
                {dynamicZones.map(zone => (
                  <div key={zone.id} className="flex items-center gap-2 text-sm">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      zone.isRequired ? "bg-primary" : "bg-muted-foreground"
                    )} />
                    <span>{zone.description}</span>
                    {zone.isRequired && <Badge variant="outline" className="text-xs">Requis</Badge>}
                  </div>
                ))}
              </div>
            )}

            {type === 'static' && (
              <p className="text-xs text-muted-foreground">
                Contenu fixe du template ({staticElements.length} éléments)
              </p>
            )}

            {dataPreview && (
              <div className="mt-2 pt-2 border-t">
                {dataPreview}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

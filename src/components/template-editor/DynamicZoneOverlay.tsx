/**
 * Overlay visuel pour les zones dynamiques protégées
 * Ces zones ne peuvent pas être modifiées dans l'éditeur
 */

import { useState } from "react";
import type { DynamicZone } from "@/types/pdf-template";
import { getDynamicZoneExplanation, blockDynamicZoneEdit } from "@/lib/template-protection";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, Table, Settings, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicZoneOverlayProps {
  zone: DynamicZone;
  style?: React.CSSProperties;
  className?: string;
}

const ZONE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'invest_table': Table,
  'location_block': Settings,
  'options_block': Settings,
};

export function DynamicZoneOverlay({ zone, style, className }: DynamicZoneOverlayProps) {
  const [showDialog, setShowDialog] = useState(false);
  
  const Icon = ZONE_ICONS[zone.type] || Table;
  const error = blockDynamicZoneEdit(zone.id);

  const handleClick = () => {
    setShowDialog(true);
  };

  return (
    <>
      <div
        className={cn(
          "bg-warning/10 border-2 border-warning border-dashed rounded-lg",
          "cursor-not-allowed transition-colors hover:bg-warning/20",
          "flex flex-col",
          className
        )}
        style={style}
        onClick={handleClick}
        title="Zone dynamique protégée - Cliquez pour plus d'informations"
      >
        {/* Header de la zone */}
        <div className="flex items-center gap-2 p-2 bg-warning/90 text-warning-foreground rounded-t-md">
          <Lock className="h-3 w-3" />
          <span className="text-xs font-medium truncate flex-1">
            Zone dynamique
          </span>
          <Badge variant="outline" className="text-[10px] h-4 bg-background/20 border-warning-foreground/30">
            Lecture seule
          </Badge>
        </div>
        
        {/* Contenu de la zone */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 text-center">
          <Icon className="h-8 w-8 text-warning/60 mb-2" />
          <p className="text-xs font-medium text-warning-foreground/80 mb-1">
            {zone.description}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Source : <span className="font-mono">{zone.sourceSheet}</span>
          </p>
          {zone.isRequired && (
            <Badge variant="destructive" className="mt-2 text-[10px]">
              Requis pour l'export
            </Badge>
          )}
        </div>
      </div>

      {/* Dialog explicatif */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Zone protégée : {zone.id}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>{getDynamicZoneExplanation(zone)}</p>
              
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type :</span>
                  <span className="font-medium">{zone.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source :</span>
                  <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                    {zone.sourceSheet}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page :</span>
                  <span className="font-medium">{zone.pageNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Obligatoire :</span>
                  <Badge variant={zone.isRequired ? 'destructive' : 'secondary'}>
                    {zone.isRequired ? 'Oui' : 'Non'}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm">
                <p className="font-medium text-destructive mb-1">
                  {error.cause}
                </p>
                <p className="text-muted-foreground text-xs">
                  {error.action}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
